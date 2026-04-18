from __future__ import annotations

import ctypes
import json
import logging
import random
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import customtkinter as ctk
import cv2
import keyboard
import numpy as np
import pyautogui
from flask import Flask, jsonify, make_response, request
from flask_cors import CORS
from win10toast import ToastNotifier

# =====================================================
# Konfiguracja
# =====================================================

SETTINGS_PATH = Path(__file__).with_name("margoclicker_v2_settings.json")
TEMPLATES_DIR = Path(__file__).with_name("templates")
DEFAULT_CONFIG: Dict[str, Any] = {
    "api_enabled": True,
    "use_virtual_mouse": True,
    "restore_window_before_click": False,
    "target_hwnd": 0,
    "target_title_hint": "margonem",
    "click_hold_ms_min": 60,
    "click_hold_ms_max": 130,
    "cv_threshold": 0.84,
    "hotkey": "f9",
    "file_logging": False,
}

config_lock = threading.Lock()
config: Dict[str, Any] = dict(DEFAULT_CONFIG)
runtime_state: Dict[str, Any] = {
    "paused": False,
    "log_hook": None,
    "last_click": None,
    "last_cv": None,
}

# =====================================================
# Flask
# =====================================================

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


# =====================================================
# WinAPI – struktury i helpery
# =====================================================

user32 = ctypes.windll.user32
gdi32 = ctypes.windll.gdi32


class RECT(ctypes.Structure):
    _fields_ = [("left", ctypes.c_long), ("top", ctypes.c_long), ("right", ctypes.c_long), ("bottom", ctypes.c_long)]


class POINT(ctypes.Structure):
    _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]


class BITMAPINFOHEADER(ctypes.Structure):
    _fields_ = [
        ("biSize", ctypes.c_uint32),
        ("biWidth", ctypes.c_long),
        ("biHeight", ctypes.c_long),
        ("biPlanes", ctypes.c_ushort),
        ("biBitCount", ctypes.c_ushort),
        ("biCompression", ctypes.c_uint32),
        ("biSizeImage", ctypes.c_uint32),
        ("biXPelsPerMeter", ctypes.c_long),
        ("biYPelsPerMeter", ctypes.c_long),
        ("biClrUsed", ctypes.c_uint32),
        ("biClrImportant", ctypes.c_uint32),
    ]


class BITMAPINFO(ctypes.Structure):
    _fields_ = [("bmiHeader", BITMAPINFOHEADER), ("bmiColors", ctypes.c_uint32 * 3)]


def log_event(message: str, level: str = "info") -> None:
    ts = time.strftime("%H:%M:%S")
    line = f"[{ts}] {message}"
    print(line)
    hook = runtime_state.get("log_hook")
    if callable(hook):
        try:
            hook(line, level)
        except Exception:
            pass


def _is_valid_hwnd(hwnd: int) -> bool:
    return bool(hwnd and user32.IsWindow(hwnd))


def get_window_text(hwnd: int) -> str:
    length = user32.GetWindowTextLengthW(hwnd)
    if length <= 0:
        return ""
    buff = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buff, length + 1)
    return buff.value.strip()


def resolve_target_window() -> Optional[int]:
    with config_lock:
        saved_hwnd = int(config.get("target_hwnd", 0))
        title_hint = str(config.get("target_title_hint", "margonem")).lower().strip()

    if saved_hwnd and _is_valid_hwnd(saved_hwnd):
        return saved_hwnd

    windows: List[Tuple[int, str]] = []
    CALLBACK = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)

    def enum_handler(hwnd, _lparam):
        hwnd = int(hwnd)
        if not user32.IsWindowVisible(hwnd):
            return True
        title = get_window_text(hwnd)
        if title:
            windows.append((hwnd, title))
        return True

    user32.EnumWindows(CALLBACK(enum_handler), 0)

    for hwnd, title in windows:
        if title_hint in title.lower():
            with config_lock:
                config["target_hwnd"] = hwnd
            return hwnd
    return None


def ensure_window_ready(hwnd: int) -> None:
    with config_lock:
        should_restore = bool(config.get("restore_window_before_click", False))
    if should_restore and user32.IsIconic(hwnd):
        user32.ShowWindow(hwnd, 9)  # SW_RESTORE
        time.sleep(0.05)


def get_client_size(hwnd: int) -> Tuple[int, int]:
    rc = RECT()
    if user32.GetClientRect(hwnd, ctypes.byref(rc)) == 0:
        return 0, 0
    return int(rc.right - rc.left), int(rc.bottom - rc.top)


def screen_to_client(hwnd: int, screen_x: int, screen_y: int) -> Optional[Tuple[int, int]]:
    """Kluczowa poprawka: konwersja absolutnych współrzędnych ekranu do client-area HWND."""
    if not _is_valid_hwnd(hwnd):
        return None
    pt = POINT(int(screen_x), int(screen_y))
    ok = user32.ScreenToClient(hwnd, ctypes.byref(pt))
    if ok == 0:
        return None
    return int(pt.x), int(pt.y)


def client_to_screen(hwnd: int, client_x: int, client_y: int) -> Optional[Tuple[int, int]]:
    if not _is_valid_hwnd(hwnd):
        return None
    pt = POINT(int(client_x), int(client_y))
    ok = user32.ClientToScreen(hwnd, ctypes.byref(pt))
    if ok == 0:
        return None
    return int(pt.x), int(pt.y)


def make_lparam(x: int, y: int) -> int:
    return ((y & 0xFFFF) << 16) | (x & 0xFFFF)


def virtual_click(hwnd: int, client_x: int, client_y: int) -> bool:
    """Klik w tle przez komunikaty okna; z czasem przytrzymania LBUTTONDOWN->UP."""
    if not _is_valid_hwnd(hwnd):
        return False

    with config_lock:
        hold_min = int(config.get("click_hold_ms_min", 60))
        hold_max = int(config.get("click_hold_ms_max", 130))
    if hold_max < hold_min:
        hold_min, hold_max = hold_max, hold_min
    hold_ms = random.randint(max(1, hold_min), max(1, hold_max))

    WM_MOUSEMOVE = 0x0200
    WM_LBUTTONDOWN = 0x0201
    WM_LBUTTONUP = 0x0202
    MK_LBUTTON = 0x0001
    lparam = make_lparam(client_x, client_y)

    user32.SendMessageW(hwnd, WM_MOUSEMOVE, 0, lparam)
    user32.SendMessageW(hwnd, WM_LBUTTONDOWN, MK_LBUTTON, lparam)
    time.sleep(hold_ms / 1000.0)
    user32.SendMessageW(hwnd, WM_LBUTTONUP, 0, lparam)
    return True


def physical_click(screen_x: int, screen_y: int) -> bool:
    pyautogui.moveTo(screen_x, screen_y, duration=random.uniform(0.05, 0.18))
    pyautogui.click()
    return True


def do_click_absolute(screen_x: int, screen_y: int, label: str = "api") -> Tuple[bool, str, Dict[str, Any]]:
    """Główna ścieżka kliknięcia: przyjmuje absolutny punkt ekranu (x,y) z JS/API."""
    hwnd = resolve_target_window()
    if not hwnd:
        return False, "NO_TARGET_WINDOW", {}

    ensure_window_ready(hwnd)

    with config_lock:
        use_virtual = bool(config.get("use_virtual_mouse", True))

    if use_virtual:
        client = screen_to_client(hwnd, int(screen_x), int(screen_y))
        if not client:
            return False, "SCREEN_TO_CLIENT_FAILED", {"screen_x": screen_x, "screen_y": screen_y}

        cw, ch = get_client_size(hwnd)
        cx = max(0, min(client[0], max(0, cw - 1)))
        cy = max(0, min(client[1], max(0, ch - 1)))
        ok = virtual_click(hwnd, cx, cy)
        payload = {
            "mode": "virtual",
            "hwnd": hwnd,
            "screen_x": int(screen_x),
            "screen_y": int(screen_y),
            "client_x": cx,
            "client_y": cy,
            "label": label,
        }
    else:
        ok = physical_click(int(screen_x), int(screen_y))
        payload = {
            "mode": "pyautogui",
            "hwnd": hwnd,
            "screen_x": int(screen_x),
            "screen_y": int(screen_y),
            "label": label,
        }

    runtime_state["last_click"] = payload
    return ok, ("OK" if ok else "CLICK_FAILED"), payload


def capture_window_client_bgr(hwnd: int) -> Optional[np.ndarray]:
    """Próba przechwycenia client area okna (także gdy w tle) przez PrintWindow + PW_CLIENTONLY."""
    if not _is_valid_hwnd(hwnd):
        return None

    width, height = get_client_size(hwnd)
    if width <= 0 or height <= 0:
        return None

    hdc_window = user32.GetDC(hwnd)
    hdc_mem = gdi32.CreateCompatibleDC(hdc_window)
    hbitmap = gdi32.CreateCompatibleBitmap(hdc_window, width, height)
    gdi32.SelectObject(hdc_mem, hbitmap)

    PW_CLIENTONLY = 0x00000001
    ok = user32.PrintWindow(hwnd, hdc_mem, PW_CLIENTONLY)

    if ok != 1:
        gdi32.DeleteObject(hbitmap)
        gdi32.DeleteDC(hdc_mem)
        user32.ReleaseDC(hwnd, hdc_window)
        return None

    bmi = BITMAPINFO()
    bmi.bmiHeader.biSize = ctypes.sizeof(BITMAPINFOHEADER)
    bmi.bmiHeader.biWidth = width
    bmi.bmiHeader.biHeight = -height
    bmi.bmiHeader.biPlanes = 1
    bmi.bmiHeader.biBitCount = 32
    bmi.bmiHeader.biCompression = 0

    buf_len = width * height * 4
    buffer = (ctypes.c_ubyte * buf_len)()
    gdi32.GetDIBits(hdc_mem, hbitmap, 0, height, ctypes.byref(buffer), ctypes.byref(bmi), 0)

    gdi32.DeleteObject(hbitmap)
    gdi32.DeleteDC(hdc_mem)
    user32.ReleaseDC(hwnd, hdc_window)

    arr = np.frombuffer(buffer, dtype=np.uint8).reshape((height, width, 4))
    return cv2.cvtColor(arr, cv2.COLOR_BGRA2BGR)


def find_template_and_click(template_name: str) -> Tuple[bool, str, Dict[str, Any]]:
    hwnd = resolve_target_window()
    if not hwnd:
        return False, "NO_TARGET_WINDOW", {}

    frame = capture_window_client_bgr(hwnd)
    if frame is None:
        return False, "CAPTURE_FAILED", {}

    template_path = TEMPLATES_DIR / template_name
    if not template_path.exists():
        return False, "TEMPLATE_NOT_FOUND", {"path": str(template_path)}

    template = cv2.imread(str(template_path), cv2.IMREAD_COLOR)
    if template is None:
        return False, "TEMPLATE_LOAD_FAILED", {"path": str(template_path)}

    with config_lock:
        threshold = float(config.get("cv_threshold", 0.84))

    result = cv2.matchTemplate(frame, template, cv2.TM_CCOEFF_NORMED)
    _, max_val, _, max_loc = cv2.minMaxLoc(result)

    if max_val < threshold:
        payload = {"score": float(max_val), "threshold": threshold, "template": template_name}
        runtime_state["last_cv"] = payload
        return False, "NOT_FOUND", payload

    h, w = template.shape[:2]
    center_x = int(max_loc[0] + (w / 2) + random.randint(-5, 5))
    center_y = int(max_loc[1] + (h / 2) + random.randint(-5, 5))

    ok = virtual_click(hwnd, center_x, center_y)
    screen_pt = client_to_screen(hwnd, center_x, center_y)
    payload = {
        "ok": ok,
        "score": float(max_val),
        "threshold": threshold,
        "template": template_name,
        "client_x": center_x,
        "client_y": center_y,
        "screen_x": screen_pt[0] if screen_pt else None,
        "screen_y": screen_pt[1] if screen_pt else None,
    }
    runtime_state["last_cv"] = payload
    return ok, ("OK" if ok else "CLICK_FAILED"), payload


# =====================================================
# API
# =====================================================


def _api_blocked_response() -> Tuple[Any, int]:
    return jsonify({"ok": False, "status": "PAUSED", "message": "Bot zatrzymany (F9)"}), 423


@app.route("/health", methods=["GET"])
def health() -> Tuple[str, int]:
    return "OK", 200


@app.route("/click", methods=["GET", "OPTIONS"])
def click_route():
    if request.method == "OPTIONS":
        return make_response("", 200)

    with config_lock:
        api_enabled = bool(config.get("api_enabled", True))
    if runtime_state.get("paused") or not api_enabled:
        return _api_blocked_response()

    try:
        x = float(request.args.get("x"))
        y = float(request.args.get("y"))
    except Exception:
        return jsonify({"ok": False, "status": "BAD_ARGS", "example": "/click?x=1200&y=800"}), 400

    ok, status, payload = do_click_absolute(int(x), int(y), label="api_click")
    code = 200 if ok else 404
    if ok:
        log_event(f"Klik API: screen=({int(x)},{int(y)}) -> payload={payload}", "click")
    else:
        log_event(f"Klik API NIEUDANY: {status} | payload={payload}", "error")
    return jsonify({"ok": ok, "status": status, "payload": payload}), code


@app.route("/find_and_click", methods=["GET", "OPTIONS"])
def find_and_click_route():
    if request.method == "OPTIONS":
        return make_response("", 200)

    with config_lock:
        api_enabled = bool(config.get("api_enabled", True))
    if runtime_state.get("paused") or not api_enabled:
        return _api_blocked_response()

    template_name = str(request.args.get("image", "")).strip()
    if not template_name:
        return jsonify({"ok": False, "status": "MISSING_IMAGE", "example": "/find_and_click?image=zapadka.png"}), 400

    ok, status, payload = find_template_and_click(template_name)
    code = 200 if ok else 404
    if ok:
        log_event(f"CV trafienie: {template_name} | payload={payload}", "click")
    else:
        log_event(f"CV brak: {template_name} | {status} | payload={payload}", "warn")
    return jsonify({"ok": ok, "status": status, "payload": payload}), code


notifier = ToastNotifier()


@app.route("/alert", methods=["GET", "OPTIONS"])
def alert_route():
    if request.method == "OPTIONS":
        return make_response("", 200)

    msg = str(request.args.get("msg", "Alert z MargoClicker")).replace("_", " ")
    notifier.show_toast("MargoClicker", msg, duration=4, threaded=True)
    log_event(f"Toast: {msg}", "warn")
    return jsonify({"ok": True, "status": "OK", "message": msg}), 200


# =====================================================
# Hotkey / stan awaryjny
# =====================================================


def toggle_pause_from_hotkey() -> None:
    runtime_state["paused"] = not bool(runtime_state.get("paused"))
    state = "ZATRZYMANY (F9)" if runtime_state["paused"] else "AKTYWNY"
    log_event(f"Hotkey -> STATUS: {state}", "warn" if runtime_state["paused"] else "info")


def start_hotkeys() -> None:
    with config_lock:
        hotkey = str(config.get("hotkey", "f9"))
    keyboard.add_hotkey(hotkey, toggle_pause_from_hotkey)
    log_event(f"Globalny hotkey aktywny: {hotkey.upper()}")


# =====================================================
# GUI (CustomTkinter)
# =====================================================


@dataclass
class AppWidgets:
    status_label: ctk.CTkLabel
    api_switch: ctk.BooleanVar
    virtual_switch: ctk.BooleanVar
    hold_min_var: ctk.StringVar
    hold_max_var: ctk.StringVar
    hotkey_var: ctk.StringVar
    title_hint_var: ctk.StringVar
    threshold_var: ctk.StringVar
    file_log_switch: ctk.BooleanVar
    log_box: ctk.CTkTextbox


def load_settings() -> None:
    if not SETTINGS_PATH.exists():
        return
    raw = json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
    with config_lock:
        config.update(DEFAULT_CONFIG)
        config.update(raw)


def save_settings() -> None:
    with config_lock:
        payload = dict(config)
    SETTINGS_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def append_log_to_file(message: str) -> None:
    with config_lock:
        enabled = bool(config.get("file_logging", False))
    if not enabled:
        return
    log_path = SETTINGS_PATH.with_name("margoclicker_v2.log")
    log_path.write_text((log_path.read_text(encoding="utf-8") if log_path.exists() else "") + message + "\n", encoding="utf-8")


def launch_gui() -> None:
    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("dark-blue")

    root = ctk.CTk()
    root.title("MargoClicker v2")
    root.geometry("1200x840")

    with config_lock:
        cfg = dict(config)

    api_var = ctk.BooleanVar(value=bool(cfg.get("api_enabled", True)))
    virtual_var = ctk.BooleanVar(value=bool(cfg.get("use_virtual_mouse", True)))
    hold_min_var = ctk.StringVar(value=str(cfg.get("click_hold_ms_min", 60)))
    hold_max_var = ctk.StringVar(value=str(cfg.get("click_hold_ms_max", 130)))
    hotkey_var = ctk.StringVar(value=str(cfg.get("hotkey", "f9")))
    title_hint_var = ctk.StringVar(value=str(cfg.get("target_title_hint", "margonem")))
    threshold_var = ctk.StringVar(value=str(cfg.get("cv_threshold", 0.84)))
    file_log_var = ctk.BooleanVar(value=bool(cfg.get("file_logging", False)))

    tabview = ctk.CTkTabview(root, width=1160, height=780)
    tabview.pack(padx=16, pady=16, fill="both", expand=True)
    tab_dashboard = tabview.add("Dashboard")
    tab_tools = tabview.add("Testowanie & Narzędzia")
    tab_settings = tabview.add("Ustawienia")

    ctk.CTkLabel(tab_dashboard, text="Tryb API", font=("Segoe UI", 16, "bold")).pack(anchor="w", padx=12, pady=(10, 4))
    ctk.CTkSwitch(tab_dashboard, text="Nasłuchiwanie API włączone", variable=api_var).pack(anchor="w", padx=12)
    ctk.CTkSwitch(tab_dashboard, text="Wirtualna myszka (SendMessage)", variable=virtual_var).pack(anchor="w", padx=12, pady=(6, 0))

    ctk.CTkLabel(tab_dashboard, text="Podpowiedź tytułu okna").pack(anchor="w", padx=12, pady=(10, 0))
    ctk.CTkEntry(tab_dashboard, textvariable=title_hint_var, width=350).pack(anchor="w", padx=12)

    log_box = ctk.CTkTextbox(tab_dashboard, width=1120, height=480)
    log_box.pack(padx=12, pady=12, fill="both", expand=True)
    log_box.tag_config("error", foreground="#ef4444")
    log_box.tag_config("click", foreground="#22c55e")
    log_box.tag_config("warn", foreground="#f59e0b")
    log_box.tag_config("info", foreground="#d1d5db")

    status_label = ctk.CTkLabel(tab_dashboard, text="STATUS: AKTYWNY", font=("Segoe UI", 18, "bold"))
    status_label.pack(anchor="w", padx=12, pady=(0, 10))

    def gui_log(message: str, level: str = "info") -> None:
        log_box.insert("end", message + "\n", level)
        log_box.see("end")
        append_log_to_file(message)

    runtime_state["log_hook"] = gui_log

    def sync_status() -> None:
        paused = bool(runtime_state.get("paused"))
        status_label.configure(text=("STATUS: ZATRZYMANY (F9)" if paused else "STATUS: AKTYWNY"))
        root.after(200, sync_status)

    sync_status()

    # Tab 2
    ctk.CTkLabel(tab_tools, text="Test kliknięcia absolutnego", font=("Segoe UI", 16, "bold")).pack(anchor="w", padx=12, pady=(10, 6))

    test_x = ctk.StringVar(value="1200")
    test_y = ctk.StringVar(value="800")
    row = ctk.CTkFrame(tab_tools)
    row.pack(fill="x", padx=12, pady=4)
    ctk.CTkEntry(row, textvariable=test_x, width=120).pack(side="left", padx=4)
    ctk.CTkEntry(row, textvariable=test_y, width=120).pack(side="left", padx=4)

    def test_abs_click() -> None:
        ok, status, payload = do_click_absolute(int(float(test_x.get())), int(float(test_y.get())), label="gui_test")
        log_event(f"GUI TEST CLICK -> {status} | {payload}", "click" if ok else "error")

    ctk.CTkButton(row, text="Test kliknięcia", command=test_abs_click).pack(side="left", padx=8)

    ctk.CTkLabel(tab_tools, text="Computer Vision Test", font=("Segoe UI", 16, "bold")).pack(anchor="w", padx=12, pady=(16, 6))
    cv_image_var = ctk.StringVar(value="zapadka.png")
    row_cv = ctk.CTkFrame(tab_tools)
    row_cv.pack(fill="x", padx=12, pady=4)
    ctk.CTkEntry(row_cv, textvariable=cv_image_var, width=220).pack(side="left", padx=4)

    def test_cv_click() -> None:
        ok, status, payload = find_template_and_click(cv_image_var.get().strip())
        log_event(f"GUI CV TEST -> {status} | {payload}", "click" if ok else "warn")

    ctk.CTkButton(row_cv, text="Find & Click", command=test_cv_click).pack(side="left", padx=8)

    # Tab 3
    grid = ctk.CTkFrame(tab_settings)
    grid.pack(fill="x", padx=12, pady=12)

    ctk.CTkLabel(grid, text="Hold min [ms]").grid(row=0, column=0, sticky="w", padx=6, pady=6)
    ctk.CTkEntry(grid, textvariable=hold_min_var, width=100).grid(row=0, column=1, padx=6, pady=6)
    ctk.CTkLabel(grid, text="Hold max [ms]").grid(row=0, column=2, sticky="w", padx=6, pady=6)
    ctk.CTkEntry(grid, textvariable=hold_max_var, width=100).grid(row=0, column=3, padx=6, pady=6)

    ctk.CTkLabel(grid, text="Hotkey").grid(row=1, column=0, sticky="w", padx=6, pady=6)
    ctk.CTkEntry(grid, textvariable=hotkey_var, width=100).grid(row=1, column=1, padx=6, pady=6)

    ctk.CTkLabel(grid, text="CV threshold").grid(row=1, column=2, sticky="w", padx=6, pady=6)
    ctk.CTkEntry(grid, textvariable=threshold_var, width=100).grid(row=1, column=3, padx=6, pady=6)

    ctk.CTkSwitch(grid, text="Logi do pliku", variable=file_log_var).grid(row=2, column=0, columnspan=2, sticky="w", padx=6, pady=8)

    def save_from_gui() -> None:
        with config_lock:
            config["api_enabled"] = bool(api_var.get())
            config["use_virtual_mouse"] = bool(virtual_var.get())
            config["click_hold_ms_min"] = int(float(hold_min_var.get()))
            config["click_hold_ms_max"] = int(float(hold_max_var.get()))
            config["hotkey"] = hotkey_var.get().strip().lower() or "f9"
            config["target_title_hint"] = title_hint_var.get().strip() or "margonem"
            config["cv_threshold"] = float(threshold_var.get())
            config["file_logging"] = bool(file_log_var.get())
        save_settings()
        log_event("Ustawienia zapisane", "info")

    ctk.CTkButton(tab_settings, text="Zapisz ustawienia", command=save_from_gui).pack(anchor="w", padx=12, pady=12)

    root.mainloop()


# =====================================================
# Start
# =====================================================


def configure_logging() -> None:
    logging.getLogger("werkzeug").setLevel(logging.ERROR)
    app.logger.setLevel(logging.ERROR)


def start_server() -> None:
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)


if __name__ == "__main__":
    pyautogui.FAILSAFE = False
    load_settings()
    configure_logging()
    start_hotkeys()

    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    log_event("MargoClicker v2 start")
    launch_gui()
