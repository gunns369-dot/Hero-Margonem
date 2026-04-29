from __future__ import annotations

import ctypes
import json
import logging
import random
import subprocess
import sys
import threading
import time
from collections import deque
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import tkinter as tk
from tkinter import scrolledtext, ttk

try:
    import keyboard
except ModuleNotFoundError:
    keyboard = None

try:
    import pyautogui
except ModuleNotFoundError:
    pyautogui = None

try:
    from flask import Flask, jsonify, make_response, request, send_file
    from flask_cors import CORS

    FLASK_AVAILABLE = True
except ModuleNotFoundError:
    FLASK_AVAILABLE = False

    class _DummyFlask:
        def route(self, *_args, **_kwargs):
            def _decorator(func):
                return func

            return _decorator

        def run(self, *_args, **_kwargs):
            raise RuntimeError("Flask nie jest zainstalowany.")

    def Flask(_name):  # type: ignore[misc]
        return _DummyFlask()

    def CORS(*_args, **_kwargs):  # type: ignore[misc]
        return None

# =========================
# MODELE / CONFIG
# =========================

BROWSER_PROCESS_NAMES = {"brave.exe", "chrome.exe", "firefox.exe", "msedge.exe"}
TEST_POINT_PRESETS = {
    "center": (0.50, 0.50),
    "pre_zapadki": (0.50, 0.50),
    "top_center": (0.50, 0.12),
    "left_top_margin": (0.10, 0.10),
    "right_top_margin": (0.90, 0.10),
    "bottom_center": (0.50, 0.88),
}

app = Flask(__name__)
if FLASK_AVAILABLE:
    CORS(app, resources={r"/*": {"origins": "*"}})
config_lock = threading.Lock()
SETTINGS_PATH = Path(__file__).with_name("margoclicker_settings.json")


@dataclass
class WindowCandidate:
    hwnd: int
    title: str
    class_name: str
    pid: int
    process_name: str
    rect: Dict[str, int]
    client_rect: Dict[str, int]
    client_origin: Dict[str, int]
    monitor_index: int
    monitor_name: str
    monitor_rect: Dict[str, int]
    work_rect: Dict[str, int]
    score: float = 0.0
    reasons: List[str] = field(default_factory=list)


@dataclass
class WindowGeometry:
    hwnd: int
    window_rect: Dict[str, int]
    client_rect: Dict[str, int]
    client_origin: Dict[str, int]
    monitor_index: int
    monitor_name: str
    monitor_rect: Dict[str, int]
    work_rect: Dict[str, int]


DEFAULT_CONFIG: Dict[str, Any] = {
    "api_enabled": True,
    "use_client_area": True,
    "manual_offset_enabled": True,
    "manual_offset_y": 0.0,
    "answer_offset_enabled": False,
    "answer_offset_y": 0.0,
    "window_keyword": "margonem",
    "restore_window_before_click": True,
    "hide_console_on_start": True,
    "launch_command": "",
    "browser_url_hint": "",
    "window_selection_mode": "auto",  # auto/title/process/picked
    "target_hwnd_last": 0,
    "target_pid": 0,
    "target_process_name": "",
    "target_window_title": "",
    "target_class_name": "",
    "target_monitor_name": "",
    "target_monitor_index": -1,
    "use_virtual_mouse": False,
    "click_hold_ms_min": 60,
    "click_hold_ms_max": 130,
    "click_jitter_px": 3,
    "hotkey": "f9",
    "disable_randomness": False,
    "calibration": {},
    "manual_click_points": {},
}
config: Dict[str, Any] = dict(DEFAULT_CONFIG)

def get_manual_click_point(name: str) -> Optional[Dict[str, int]]:
    with config_lock:
        points = config.get("manual_click_points", {})
        point = points.get(name) if isinstance(points, dict) else None
    if not isinstance(point, dict):
        return None
    try:
        return {"x": int(point.get("x", 0)), "y": int(point.get("y", 0))}
    except Exception:
        return None


def resolve_click_point(name: str, fallback_ratio: Tuple[float, float], client_w: int, client_h: int) -> Tuple[float, float]:
    point = get_manual_click_point(name)
    if point:
        return float(point["x"]), float(point["y"])
    return client_w * fallback_ratio[0], client_h * fallback_ratio[1]


def wait_for_left_click(timeout_sec: float = 10.0) -> Optional[Tuple[int, int]]:
    if sys.platform != "win32":
        return None
    user32 = ctypes.windll.user32
    pt = POINT()
    start = time.time()
    while time.time() - start < timeout_sec:
        if user32.GetAsyncKeyState(0x01) & 0x8000:
            while user32.GetAsyncKeyState(0x01) & 0x8000:
                time.sleep(0.01)
            if user32.GetCursorPos(ctypes.byref(pt)):
                return int(pt.x), int(pt.y)
        time.sleep(0.01)
    return None


# =========================
# DIAGNOSTYKA (stan runtime)
# =========================

runtime_state = {
    "paused": False,
    "last_candidates": [],
    "last_selected_candidate": None,
    "last_click": None,
    "click_history": deque(maxlen=20),
    "log_hook": None,
    "hotkey_registered": False,
    "hotkey_registered_key": "",
}


class RECT(ctypes.Structure):
    _fields_ = [("left", ctypes.c_long), ("top", ctypes.c_long), ("right", ctypes.c_long), ("bottom", ctypes.c_long)]


class POINT(ctypes.Structure):
    _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]


class MONITORINFOEXW(ctypes.Structure):
    _fields_ = [
        ("cbSize", ctypes.c_ulong),
        ("rcMonitor", RECT),
        ("rcWork", RECT),
        ("dwFlags", ctypes.c_ulong),
        ("szDevice", ctypes.c_wchar * 32),
    ]


def log_event(message: str) -> None:
    timestamp = time.strftime("%H:%M:%S")
    line = f"[{timestamp}] {message}"
    print(line)
    hook = runtime_state.get("log_hook")
    if callable(hook):
        try:
            hook(line)
        except Exception:
            pass


# =========================
# WINAPI HELPERS
# =========================

def setup_dpi_awareness() -> None:
    if sys.platform != "win32":
        return
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(2)
        log_event("DPI awareness ustawione: Per Monitor v1 (shcore)")
    except Exception:
        try:
            ctypes.windll.user32.SetProcessDPIAware()
            log_event("DPI awareness ustawione: System")
        except Exception as e:
            log_event(f"Nie udało się ustawić DPI awareness: {e}")


def hide_console_window() -> None:
    if sys.platform != "win32":
        return
    try:
        hwnd = ctypes.windll.kernel32.GetConsoleWindow()
        if hwnd:
            ctypes.windll.user32.ShowWindow(hwnd, 0)
    except Exception:
        pass


def show_console_window() -> None:
    if sys.platform != "win32":
        return
    try:
        hwnd = ctypes.windll.kernel32.GetConsoleWindow()
        if hwnd:
            ctypes.windll.user32.ShowWindow(hwnd, 5)
    except Exception:
        pass


def _rect_to_dict(rc: RECT) -> Dict[str, int]:
    return {"left": int(rc.left), "top": int(rc.top), "right": int(rc.right), "bottom": int(rc.bottom)}


def _is_valid_hwnd(hwnd: int) -> bool:
    if sys.platform != "win32" or not hwnd:
        return False
    return bool(ctypes.windll.user32.IsWindow(hwnd))


def get_window_text(hwnd: int) -> str:
    if sys.platform != "win32" or not hwnd:
        return ""
    user32 = ctypes.windll.user32
    length = user32.GetWindowTextLengthW(hwnd)
    if length <= 0:
        return ""
    buff = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buff, length + 1)
    return buff.value.strip()


def get_class_name(hwnd: int) -> str:
    if sys.platform != "win32" or not hwnd:
        return ""
    buff = ctypes.create_unicode_buffer(256)
    ctypes.windll.user32.GetClassNameW(hwnd, buff, 255)
    return buff.value.strip()


def get_window_pid(hwnd: int) -> int:
    if sys.platform != "win32" or not hwnd:
        return 0
    pid = ctypes.c_ulong(0)
    ctypes.windll.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    return int(pid.value)


def get_process_name(pid: int) -> str:
    if sys.platform != "win32" or not pid:
        return ""
    PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
    hproc = ctypes.windll.kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
    if not hproc:
        return ""
    try:
        size = ctypes.c_ulong(32768)
        buff = ctypes.create_unicode_buffer(size.value)
        ok = ctypes.windll.kernel32.QueryFullProcessImageNameW(hproc, 0, buff, ctypes.byref(size))
        if not ok:
            return ""
        return Path(buff.value).name.lower()
    finally:
        ctypes.windll.kernel32.CloseHandle(hproc)


def get_window_rect(hwnd: int) -> Optional[Dict[str, int]]:
    if not _is_valid_hwnd(hwnd):
        return None
    rc = RECT()
    if ctypes.windll.user32.GetWindowRect(hwnd, ctypes.byref(rc)) == 0:
        return None
    return _rect_to_dict(rc)


def get_client_rect(hwnd: int) -> Optional[Dict[str, int]]:
    if not _is_valid_hwnd(hwnd):
        return None
    rc = RECT()
    if ctypes.windll.user32.GetClientRect(hwnd, ctypes.byref(rc)) == 0:
        return None
    return _rect_to_dict(rc)


def get_client_origin(hwnd: int) -> Optional[Dict[str, int]]:
    if not _is_valid_hwnd(hwnd):
        return None
    pt = POINT(0, 0)
    if ctypes.windll.user32.ClientToScreen(hwnd, ctypes.byref(pt)) == 0:
        return None
    return {"x": int(pt.x), "y": int(pt.y)}


def monitor_info_from_window(hwnd: int) -> Tuple[int, str, Dict[str, int], Dict[str, int]]:
    if sys.platform != "win32" or not hwnd:
        return -1, "", {}, {}
    user32 = ctypes.windll.user32
    MONITOR_DEFAULTTONEAREST = 2
    hmon = user32.MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST)
    if not hmon:
        return -1, "", {}, {}

    info = MONITORINFOEXW()
    info.cbSize = ctypes.sizeof(MONITORINFOEXW)
    if user32.GetMonitorInfoW(hmon, ctypes.byref(info)) == 0:
        return -1, "", {}, {}

    monitors: List[str] = []
    CALLBACK = ctypes.WINFUNCTYPE(ctypes.c_int, ctypes.c_void_p, ctypes.c_void_p, ctypes.POINTER(RECT), ctypes.c_double)

    def enum_monitors(hm, _hdc, _lprc, _data):
        mi = MONITORINFOEXW()
        mi.cbSize = ctypes.sizeof(MONITORINFOEXW)
        if user32.GetMonitorInfoW(hm, ctypes.byref(mi)):
            monitors.append(mi.szDevice)
        return 1

    user32.EnumDisplayMonitors(0, 0, CALLBACK(enum_monitors), 0)
    monitor_name = info.szDevice
    monitor_index = monitors.index(monitor_name) if monitor_name in monitors else -1

    return monitor_index, monitor_name, _rect_to_dict(info.rcMonitor), _rect_to_dict(info.rcWork)


def client_to_screen_point(hwnd: int, x: float, y: float) -> Optional[Tuple[int, int]]:
    if not _is_valid_hwnd(hwnd):
        return None
    pt = POINT(int(round(x)), int(round(y)))
    if ctypes.windll.user32.ClientToScreen(hwnd, ctypes.byref(pt)) == 0:
        return None
    return int(pt.x), int(pt.y)


def get_window_geometry(hwnd: int) -> Optional[WindowGeometry]:
    if not _is_valid_hwnd(hwnd):
        return None
    wr = get_window_rect(hwnd)
    cr = get_client_rect(hwnd)
    co = get_client_origin(hwnd)
    if not wr or not cr or not co:
        return None
    midx, mname, mrect, wrect = monitor_info_from_window(hwnd)
    return WindowGeometry(
        hwnd=hwnd,
        window_rect=wr,
        client_rect=cr,
        client_origin=co,
        monitor_index=midx,
        monitor_name=mname,
        monitor_rect=mrect,
        work_rect=wrect,
    )


def ensure_window_ready(hwnd: int) -> bool:
    if not _is_valid_hwnd(hwnd):
        return False
    user32 = ctypes.windll.user32
    try:
        SW_RESTORE = 9
        if user32.IsIconic(hwnd):
            user32.ShowWindow(hwnd, SW_RESTORE)
            log_event("Okno było zminimalizowane - wykonano SW_RESTORE")
        user32.SetForegroundWindow(hwnd)
        time.sleep(0.08)
        return True
    except Exception:
        return False


# =========================
# WINDOW DISCOVERY
# =========================

def score_window_candidate(candidate: WindowCandidate, cfg: Dict[str, Any]) -> Tuple[float, List[str]]:
    score = 0.0
    reasons: List[str] = []
    title_low = candidate.title.lower()
    kw = (cfg.get("window_keyword") or "").lower().strip()

    if kw and kw in title_low:
        score += 100
        reasons.append("title matches keyword")
    if candidate.process_name in BROWSER_PROCESS_NAMES:
        score += 70
        reasons.append("browser process")
    if "margonem" in title_low:
        score += 60
        reasons.append("title has margonem")

    client_w = candidate.client_rect["right"] - candidate.client_rect["left"]
    client_h = candidate.client_rect["bottom"] - candidate.client_rect["top"]
    if client_w > 600 and client_h > 400:
        score += 30
        reasons.append("client area sensible")

    mode = cfg.get("window_selection_mode", "auto")
    if mode == "picked":
        if cfg.get("target_pid") and candidate.pid == cfg.get("target_pid"):
            score += 80
            reasons.append("picked pid")
        if cfg.get("target_class_name") and candidate.class_name == cfg.get("target_class_name"):
            score += 20
            reasons.append("picked class")
    if mode == "process":
        p = (cfg.get("target_process_name") or "").lower().strip()
        if p and p == candidate.process_name:
            score += 120
            reasons.append("process mode match")
    if mode == "title":
        t = (cfg.get("target_window_title") or "").lower().strip()
        if t and t in title_low:
            score += 120
            reasons.append("title mode match")

    pref_midx = cfg.get("target_monitor_index", -1)
    if isinstance(pref_midx, int) and pref_midx >= 0 and candidate.monitor_index == pref_midx:
        score += 25
        reasons.append("preferred monitor")

    return score, reasons


def list_window_candidates() -> List[WindowCandidate]:
    if sys.platform != "win32":
        return []

    user32 = ctypes.windll.user32
    candidates: List[WindowCandidate] = []

    CALLBACK = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)

    def handler(hwnd, _lparam):
        hwnd = int(hwnd)
        if not user32.IsWindowVisible(hwnd):
            return True
        if user32.IsIconic(hwnd):
            return True

        title = get_window_text(hwnd)
        if not title:
            return True

        wr = get_window_rect(hwnd)
        cr = get_client_rect(hwnd)
        co = get_client_origin(hwnd)
        if not wr or not cr or not co:
            return True

        client_w = cr["right"] - cr["left"]
        client_h = cr["bottom"] - cr["top"]
        if client_w <= 0 or client_h <= 0:
            return True

        pid = get_window_pid(hwnd)
        process_name = get_process_name(pid)
        class_name = get_class_name(hwnd)
        midx, mname, mrect, wrect = monitor_info_from_window(hwnd)

        candidates.append(
            WindowCandidate(
                hwnd=hwnd,
                title=title,
                class_name=class_name,
                pid=pid,
                process_name=process_name,
                rect=wr,
                client_rect=cr,
                client_origin=co,
                monitor_index=midx,
                monitor_name=mname,
                monitor_rect=mrect,
                work_rect=wrect,
            )
        )
        return True

    user32.EnumWindows(CALLBACK(handler), 0)

    with config_lock:
        cfg = dict(config)
    for c in candidates:
        c.score, c.reasons = score_window_candidate(c, cfg)

    candidates.sort(key=lambda c: c.score, reverse=True)
    runtime_state["last_candidates"] = [asdict(c) for c in candidates]
    return candidates


def find_best_target_window() -> Optional[WindowCandidate]:
    candidates = list_window_candidates()
    if not candidates:
        return None
    best = candidates[0]
    runtime_state["last_selected_candidate"] = asdict(best)
    return best


def resolve_target_window() -> Optional[int]:
    with config_lock:
        cfg = dict(config)

    hwnd_saved = int(cfg.get("target_hwnd_last") or 0)
    pid_saved = int(cfg.get("target_pid") or 0)

    if hwnd_saved and _is_valid_hwnd(hwnd_saved):
        if not pid_saved or get_window_pid(hwnd_saved) == pid_saved:
            return hwnd_saved

    if pid_saved:
        for candidate in list_window_candidates():
            if candidate.pid == pid_saved and _is_valid_hwnd(candidate.hwnd):
                with config_lock:
                    config["target_hwnd_last"] = candidate.hwnd
                return candidate.hwnd

    best = find_best_target_window()
    if not best:
        return None

    with config_lock:
        config["target_hwnd_last"] = best.hwnd
        config["target_pid"] = best.pid
        config["target_process_name"] = best.process_name
        config["target_window_title"] = best.title
        config["target_class_name"] = best.class_name
        config["target_monitor_name"] = best.monitor_name
        config["target_monitor_index"] = best.monitor_index
    return best.hwnd


def pick_window_under_cursor() -> Optional[WindowCandidate]:
    if sys.platform != "win32":
        return None

    time.sleep(3.0)
    user32 = ctypes.windll.user32
    pt = POINT()
    if user32.GetCursorPos(ctypes.byref(pt)) == 0:
        return None
    hwnd = user32.WindowFromPoint(pt)
    if not hwnd:
        return None

    hwnd = user32.GetAncestor(hwnd, 2) or hwnd  # GA_ROOT

    all_candidates = list_window_candidates()
    for c in all_candidates:
        if c.hwnd == hwnd:
            with config_lock:
                config["window_selection_mode"] = "picked"
                config["target_hwnd_last"] = c.hwnd
                config["target_pid"] = c.pid
                config["target_process_name"] = c.process_name
                config["target_window_title"] = c.title
                config["target_class_name"] = c.class_name
                config["target_monitor_name"] = c.monitor_name
                config["target_monitor_index"] = c.monitor_index
            save_settings_to_disk()
            return c
    return None


# =========================
# CLICK EXECUTION
# =========================

def _make_lparam(client_x: int, client_y: int) -> int:
    return ((client_y & 0xFFFF) << 16) | (client_x & 0xFFFF)


def send_background_click(hwnd: int, client_x: int, client_y: int, hold_ms: Optional[int] = None) -> bool:
    if not _is_valid_hwnd(hwnd):
        return False
    try:
        user32 = ctypes.windll.user32
        with config_lock:
            hold_min = int(config.get("click_hold_ms_min", 60))
            hold_max = int(config.get("click_hold_ms_max", 130))
            disable_randomness = bool(config.get("disable_randomness", False))

        if hold_max < hold_min:
            hold_min, hold_max = hold_max, hold_min
        if hold_ms is not None:
            real_hold = max(1, int(hold_ms))
        elif disable_randomness:
            real_hold = max(1, hold_min)
        else:
            real_hold = random.randint(max(1, hold_min), max(1, hold_max))

        WM_MOUSEMOVE = 0x0200
        WM_LBUTTONDOWN = 0x0201
        WM_LBUTTONUP = 0x0202
        MK_LBUTTON = 0x0001
        lparam = _make_lparam(client_x, client_y)
        user32.SendMessageW(hwnd, WM_MOUSEMOVE, 0, lparam)
        user32.SendMessageW(hwnd, WM_LBUTTONDOWN, MK_LBUTTON, lparam)
        time.sleep(real_hold / 1000.0)
        user32.SendMessageW(hwnd, WM_LBUTTONUP, 0, lparam)
        return True
    except Exception as e:
        log_event(f"Błąd wirtualnej myszki (SendMessage): {e}")
        return False


def perform_click(screen_x: int, screen_y: int, debug_label: str = "") -> bool:
    with config_lock:
        disable_randomness = bool(config.get("disable_randomness", False))

    fx = float(screen_x)
    fy = float(screen_y)
    if not disable_randomness:
        fx += random.uniform(-3, 3)
        fy += random.uniform(-2, 2)

    duration = 0.0 if disable_randomness else random.uniform(0.12, 0.26)
    pyautogui.moveTo(fx, fy, duration)
    pyautogui.click()
    return True


def click_in_game(client_x: float, client_y: float, label: str = "api", use_manual_offset: bool = True, is_answer_click: bool = False) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    with config_lock:
        cfg = dict(config)

    hwnd = resolve_target_window() if cfg.get("use_client_area", True) else None
    if not hwnd:
        return False, "NO_TARGET_WINDOW", None

    if ctypes.windll.user32.IsIconic(hwnd):
        ensure_window_ready(hwnd)
    elif cfg.get("restore_window_before_click", True):
        ensure_window_ready(hwnd)

    geom = get_window_geometry(hwnd)
    if not geom:
        return False, "NO_GEOMETRY", None

    cw = geom.client_rect["right"] - geom.client_rect["left"]
    ch = geom.client_rect["bottom"] - geom.client_rect["top"]

    # Konwersja ułamków na piksele okna
    if 0.0 <= client_x <= 1.0 and 0.0 <= client_y <= 1.0:
        client_x = cw * client_x
        client_y = ch * client_y

    # Aplikowanie offsetów po konwersji
    if use_manual_offset and cfg.get("manual_offset_enabled", True):
        client_y += float(cfg.get("manual_offset_y", 0.0))
    if is_answer_click and cfg.get("answer_offset_enabled", False):
        client_y += float(cfg.get("answer_offset_y", 0.0))

    cx = max(0, min(int(round(client_x)), max(0, cw - 1)))
    cy = max(0, min(int(round(client_y)), max(0, ch - 1)))

    scr = client_to_screen_point(hwnd, cx, cy)
    if not scr:
        sx = geom.client_origin["x"] + cx
        sy = geom.client_origin["y"] + cy
    else:
        sx, sy = scr

    use_virtual_mouse = bool(cfg.get("use_virtual_mouse", False))
    disable_randomness = bool(cfg.get("disable_randomness", False))
    jitter_px = max(0, int(cfg.get("click_jitter_px", 3)))

    if use_virtual_mouse and jitter_px > 0 and not disable_randomness:
        cx = max(0, min(cx + random.randint(-jitter_px, jitter_px), max(0, cw - 1)))
        cy = max(0, min(cy + random.randint(-jitter_px, jitter_px), max(0, ch - 1)))

    if use_virtual_mouse:
        click_ok = send_background_click(hwnd, cx, cy)
        if not click_ok:
            log_event("Fallback: wirtualna myszka nieudana, używam pyautogui")
            click_ok = perform_click(sx, sy, debug_label=label)
    else:
        click_ok = perform_click(sx, sy, debug_label=label)

    payload = {
        "timestamp": time.time(),
        "label": label,
        "hwnd": hwnd,
        "client_x": cx,
        "client_y": cy,
        "screen_x": int(sx),
        "screen_y": int(sy),
        "monitor": geom.monitor_name,
        "monitor_index": geom.monitor_index,
        "client_size": {"width": cw, "height": ch},
    }
    runtime_state["last_click"] = payload
    runtime_state["click_history"].append(payload)
    return click_ok, "OK", payload


# =========================
# SCREENSHOT / OVERLAYS / DIAGNOSTYKA
# =========================

def capture_client_area(hwnd: int) -> Optional[Path]:
    geom = get_window_geometry(hwnd)
    if not geom:
        return None
    cw = geom.client_rect["right"] - geom.client_rect["left"]
    ch = geom.client_rect["bottom"] - geom.client_rect["top"]
    if cw <= 0 or ch <= 0:
        return None
    image = pyautogui.screenshot(region=(geom.client_origin["x"], geom.client_origin["y"], cw, ch))
    out_path = SETTINGS_PATH.with_name(f"client_area_{int(time.time())}.png")
    image.save(out_path)
    return out_path


def draw_overlay_rect(root: tk.Tk, x: int, y: int, w: int, h: int, color: str = "#ff3333", duration_ms: int = 1300) -> None:
    overlay = tk.Toplevel(root)
    overlay.overrideredirect(True)
    overlay.attributes("-topmost", True)
    try:
        overlay.attributes("-alpha", 0.35)
    except Exception:
        pass
    overlay.geometry(f"{max(1, w)}x{max(1, h)}+{x}+{y}")
    canvas = tk.Canvas(overlay, bg="black", highlightthickness=0)
    canvas.pack(fill=tk.BOTH, expand=True)
    canvas.create_rectangle(2, 2, max(3, w - 2), max(3, h - 2), outline=color, width=4)
    overlay.after(duration_ms, overlay.destroy)


def draw_overlay_point(root: tk.Tk, x: int, y: int, duration_ms: int = 1100) -> None:
    draw_overlay_rect(root, x - 10, y - 10, 20, 20, color="#ff0000", duration_ms=duration_ms)


def export_diagnostics_json() -> Path:
    with config_lock:
        cfg = dict(config)
    out = {
        "config": cfg,
        "last_selected_candidate": runtime_state.get("last_selected_candidate"),
        "last_candidates": runtime_state.get("last_candidates"),
        "last_click": runtime_state.get("last_click"),
        "click_history": list(runtime_state.get("click_history", [])),
    }
    path = SETTINGS_PATH.with_name(f"diagnostics_{int(time.time())}.json")
    path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


# =========================
# FLASK ROUTES
# =========================

def toggle_pause_from_hotkey() -> None:
    runtime_state["paused"] = not bool(runtime_state.get("paused"))
    log_event(f"Pause: {'ON' if runtime_state['paused'] else 'OFF'}")


def register_hotkey() -> None:
    if keyboard is None:
        log_event("Brak modułu 'keyboard' -> globalny hotkey wyłączony.")
        return

    with config_lock:
        hotkey = str(config.get("hotkey", "f9")).strip().lower() or "f9"

    old_key = str(runtime_state.get("hotkey_registered_key", "")).strip().lower()
    if runtime_state.get("hotkey_registered") and old_key == hotkey:
        return

    try:
        if runtime_state.get("hotkey_registered"):
            keyboard.clear_all_hotkeys()
        keyboard.add_hotkey(hotkey, toggle_pause_from_hotkey)
        runtime_state["hotkey_registered"] = True
        runtime_state["hotkey_registered_key"] = hotkey
        log_event(f"Globalny hotkey aktywny: {hotkey.upper()}")
    except Exception as exc:
        log_event(f"Nie udało się aktywować hotkey '{hotkey}': {exc}")


def _api_blocked_response():
    return jsonify({"ok": False, "status": "PAUSED_OR_DISABLED", "paused": bool(runtime_state.get("paused"))}), 423

def configure_flask_logging() -> None:
    logging.getLogger("werkzeug").setLevel(logging.ERROR)
    app.logger.setLevel(logging.ERROR)


@app.route("/health", methods=["GET"])
def health():
    with config_lock:
        api_enabled = bool(config.get("api_enabled", True))
        hotkey = str(config.get("hotkey", "f9")).strip().lower() or "f9"
    return jsonify({"status": "OK", "paused": bool(runtime_state.get("paused")), "api_enabled": api_enabled, "hotkey": hotkey}), 200


@app.route("/fullscreen", methods=["GET", "POST", "OPTIONS"])
def fullscreen():
    if request.method == "OPTIONS":
        return make_response("", 200)
    with config_lock:
        api_enabled = bool(config.get("api_enabled", True))
    if runtime_state.get("paused") or not api_enabled:
        return _api_blocked_response()
    hwnd = resolve_target_window()
    if not hwnd:
        return "NO_WINDOW", 404
    try:
        ensure_window_ready(hwnd)
        ctypes.windll.user32.keybd_event(0x7A, 0, 0, 0)
        time.sleep(0.02)
        ctypes.windll.user32.keybd_event(0x7A, 0, 0x0002, 0)
        return "OK", 200
    except Exception:
        return "ERROR", 500


@app.route("/launch", methods=["POST", "OPTIONS"])
def launch_target_app():
    if request.method == "OPTIONS":
        return make_response("", 200)
    with config_lock:
        api_enabled = bool(config.get("api_enabled", True))
    if runtime_state.get("paused") or not api_enabled:
        return _api_blocked_response()
    with config_lock:
        cmd = str(config.get("launch_command", "")).strip()
    if not cmd:
        return "NO_LAUNCH_COMMAND", 400
    try:
        subprocess.Popen(cmd, shell=True)
        return "OK", 200
    except Exception:
        return "ERROR", 500


@app.route("/click", methods=["GET", "OPTIONS"])
def click_route():
    if request.method == "OPTIONS":
        return make_response("", 200)
    with config_lock:
        api_enabled = bool(config.get("api_enabled", True))
    if runtime_state.get("paused") or not api_enabled:
        return _api_blocked_response()
    try:
        vx = request.args.get("vx")
        vy = request.args.get("vy")
        no_offset = request.args.get("no_offset") in {"1", "true", "yes"}
        answer_click = request.args.get("answer_click") in {"1", "true", "yes"}
        ax = request.args.get("ax")
        ay = request.args.get("ay")
        x_abs = request.args.get("x")
        y_abs = request.args.get("y")

        if vx is not None and vy is not None:
            ok, msg, payload = click_in_game(float(vx), float(vy), label="api_v", use_manual_offset=not no_offset, is_answer_click=answer_click)
            return jsonify({"status": msg, "ok": ok, "payload": payload}), (200 if ok else 404)

        hwnd = resolve_target_window()
        geom = get_window_geometry(hwnd) if hwnd else None

        if not geom:
            return jsonify({"status": "NO_WINDOW_GEOMETRY", "ok": False}), 404

        if ax is not None and ay is not None:
            rel_x = float(ax) - geom.client_origin["x"]
            rel_y = float(ay) - geom.client_origin["y"]
            ok, msg, payload = click_in_game(rel_x, rel_y, label="api_ax", use_manual_offset=not no_offset, is_answer_click=answer_click)
            return jsonify({"status": msg, "ok": ok, "payload": payload}), (200 if ok else 404)

        if x_abs is not None and y_abs is not None:
            rel_x = float(x_abs) - geom.client_origin["x"]
            rel_y = float(y_abs) - geom.client_origin["y"]
            ok, msg, payload = click_in_game(rel_x, rel_y, label="api_x", use_manual_offset=not no_offset, is_answer_click=answer_click)
            return jsonify({"status": msg, "ok": ok, "payload": payload}), (200 if ok else 404)

        return jsonify({"status": "MISSING_COORDINATES", "ok": False}), 400

    except Exception as e:
        return jsonify({"status": "ERROR", "error": str(e)}), 500


@app.route("/debug/window", methods=["GET"])
def debug_window():
    hwnd = resolve_target_window()
    if not hwnd:
        return jsonify({"status": "NO_WINDOW"}), 404
    geom = get_window_geometry(hwnd)
    return jsonify({"status": "OK", "hwnd": hwnd, "geometry": asdict(geom) if geom else None, "candidate": runtime_state.get("last_selected_candidate")})


@app.route("/debug/candidates", methods=["GET"])
def debug_candidates():
    candidates = [asdict(c) for c in list_window_candidates()]
    return jsonify({"status": "OK", "count": len(candidates), "candidates": candidates})


@app.route("/debug/screenshot", methods=["GET"])
def debug_screenshot():
    hwnd = resolve_target_window()
    if not hwnd:
        return jsonify({"status": "NO_WINDOW"}), 404
    path = capture_client_area(hwnd)
    if not path:
        return jsonify({"status": "CAPTURE_FAILED"}), 500
    return send_file(path, mimetype="image/png")


@app.route("/test_points", methods=["POST"])
def test_points():
    with config_lock:
        api_enabled = bool(config.get("api_enabled", True))
    if runtime_state.get("paused") or not api_enabled:
        return _api_blocked_response()
    hwnd = resolve_target_window()
    geom = get_window_geometry(hwnd) if hwnd else None
    if not geom:
        return jsonify({"status": "NO_WINDOW"}), 404
    cw = geom.client_rect["right"] - geom.client_rect["left"]
    ch = geom.client_rect["bottom"] - geom.client_rect["top"]

    results = []
    for name, (rx, ry) in TEST_POINT_PRESETS.items():
        ok, msg, payload = click_in_game(cw * rx, ch * ry, label=f"test_{name}")
        results.append({"name": name, "ok": ok, "msg": msg, "payload": payload})
        time.sleep(0.12)
    return jsonify({"status": "OK", "results": results})


@app.route("/pause", methods=["POST", "OPTIONS"])
def pause_route():
    if request.method == "OPTIONS":
        return make_response("", 200)
    runtime_state["paused"] = not bool(runtime_state.get("paused"))
    return jsonify({"ok": True, "paused": bool(runtime_state.get("paused"))}), 200


# =========================
# GUI
# =========================

def _normalize_config(raw: Dict[str, Any]) -> Dict[str, Any]:
    normalized = dict(DEFAULT_CONFIG)
    normalized.update(raw or {})

    # migracja kompatybilności
    if not normalized.get("launch_command") and normalized.get("app_path"):
        normalized["launch_command"] = str(normalized.get("app_path", ""))
    if "click_without_mouse_move" in (raw or {}) and "use_virtual_mouse" not in (raw or {}):
        normalized["use_virtual_mouse"] = bool((raw or {}).get("click_without_mouse_move"))

    normalized["window_selection_mode"] = str(normalized.get("window_selection_mode", "auto")).lower().strip()
    if normalized["window_selection_mode"] not in {"auto", "title", "process", "picked"}:
        normalized["window_selection_mode"] = "auto"

    normalized["window_keyword"] = str(normalized.get("window_keyword", "margonem")).strip() or "margonem"
    normalized["launch_command"] = str(normalized.get("launch_command", "")).strip()
    normalized["browser_url_hint"] = str(normalized.get("browser_url_hint", "")).strip()
    normalized["target_process_name"] = str(normalized.get("target_process_name", "")).strip().lower()
    normalized["target_window_title"] = str(normalized.get("target_window_title", "")).strip()
    normalized["target_class_name"] = str(normalized.get("target_class_name", "")).strip()
    normalized["target_monitor_name"] = str(normalized.get("target_monitor_name", "")).strip()
    normalized["hotkey"] = str(normalized.get("hotkey", "f9")).strip().lower() or "f9"

    for key in ["manual_offset_y", "answer_offset_y"]:
        normalized[key] = float(normalized.get(key, 0.0))
    for key in ["target_hwnd_last", "target_pid", "target_monitor_index", "click_hold_ms_min", "click_hold_ms_max", "click_jitter_px"]:
        normalized[key] = int(normalized.get(key, 0))

    return normalized


def load_settings_from_disk() -> None:
    if not SETTINGS_PATH.exists():
        return
    try:
        saved = json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
        if isinstance(saved, dict):
            with config_lock:
                config.update(_normalize_config(saved))
    except Exception as e:
        log_event(f"Nie udało się wczytać ustawień: {e}")


def save_settings_to_disk() -> None:
    with config_lock:
        payload = dict(config)
    try:
        SETTINGS_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as e:
        log_event(f"Nie udało się zapisać ustawień: {e}")


def launch_gui() -> None:
    root = tk.Tk()
    root.title("MargoClicker - Windows target diagnostics")
    root.geometry("1180x860")
    root.configure(bg="#111827")

    style = ttk.Style(root)
    style.theme_use("clam")
    style.configure("Dark.TFrame", background="#111827")
    style.configure("Dark.TLabel", background="#111827", foreground="#e5e7eb")
    style.configure("Dark.TButton", background="#2563eb", foreground="white", padding=(8, 5))
    style.configure("Dark.TEntry", fieldbackground="#1f2937", foreground="#f9fafb", insertcolor="#f9fafb")

    frame = ttk.Frame(root, style="Dark.TFrame", padding=10)
    frame.pack(fill=tk.BOTH, expand=True)

    with config_lock:
        cfg = dict(config)

    status_var = tk.StringVar(value="Serwer: http://127.0.0.1:5000")
    keyword_var = tk.StringVar(value=cfg["window_keyword"])
    launch_cmd_var = tk.StringVar(value=cfg.get("launch_command", ""))
    url_hint_var = tk.StringVar(value=cfg.get("browser_url_hint", ""))
    offset_var = tk.StringVar(value=str(cfg.get("manual_offset_y", 0.0)))
    answer_offset_var = tk.StringVar(value=str(cfg.get("answer_offset_y", 0.0)))
    mode_var = tk.StringVar(value=cfg.get("window_selection_mode", "auto"))
    process_var = tk.StringVar(value=cfg.get("target_process_name", ""))
    hotkey_var = tk.StringVar(value=cfg.get("hotkey", "f9"))
    hold_min_var = tk.StringVar(value=str(cfg.get("click_hold_ms_min", 60)))
    hold_max_var = tk.StringVar(value=str(cfg.get("click_hold_ms_max", 130)))
    jitter_var = tk.StringVar(value=str(cfg.get("click_jitter_px", 3)))

    use_client_var = tk.BooleanVar(value=bool(cfg.get("use_client_area", True)))
    api_enabled_var = tk.BooleanVar(value=bool(cfg.get("api_enabled", True)))
    restore_var = tk.BooleanVar(value=bool(cfg.get("restore_window_before_click", True)))
    hide_console_var = tk.BooleanVar(value=bool(cfg.get("hide_console_on_start", True)))
    manual_off_var = tk.BooleanVar(value=bool(cfg.get("manual_offset_enabled", True)))
    answer_off_var = tk.BooleanVar(value=bool(cfg.get("answer_offset_enabled", False)))
    no_random_var = tk.BooleanVar(value=bool(cfg.get("disable_randomness", False)))
    click_msg_var = tk.BooleanVar(value=bool(cfg.get("use_virtual_mouse", False)))

    ttk.Label(frame, text="MargoClicker – Diagnostyka i stabilne targetowanie okna", style="Dark.TLabel").pack(anchor="w", pady=(0, 6))

    controls = ttk.Frame(frame, style="Dark.TFrame")
    controls.pack(fill=tk.X, pady=6)

    ttk.Label(controls, text="Fraza tytułu:", style="Dark.TLabel").grid(row=0, column=0, sticky="w")
    ttk.Entry(controls, textvariable=keyword_var, width=34, style="Dark.TEntry").grid(row=0, column=1, sticky="w", padx=6)
    ttk.Label(controls, text="Tryb wyboru:", style="Dark.TLabel").grid(row=0, column=2, sticky="w")
    ttk.Combobox(controls, textvariable=mode_var, values=["auto", "title", "process", "picked"], width=12).grid(row=0, column=3, sticky="w", padx=6)
    ttk.Label(controls, text="Process hint:", style="Dark.TLabel").grid(row=0, column=4, sticky="w")
    ttk.Entry(controls, textvariable=process_var, width=16, style="Dark.TEntry").grid(row=0, column=5, sticky="w", padx=6)

    ttk.Label(controls, text="launch_command:", style="Dark.TLabel").grid(row=1, column=0, sticky="w", pady=(6, 0))
    ttk.Entry(controls, textvariable=launch_cmd_var, width=62, style="Dark.TEntry").grid(row=1, column=1, columnspan=3, sticky="w", padx=6, pady=(6, 0))
    ttk.Label(controls, text="browser_url_hint:", style="Dark.TLabel").grid(row=1, column=4, sticky="w", pady=(6, 0))
    ttk.Entry(controls, textvariable=url_hint_var, width=26, style="Dark.TEntry").grid(row=1, column=5, sticky="w", padx=6, pady=(6, 0))
    ttk.Label(controls, text="Hotkey pause:", style="Dark.TLabel").grid(row=2, column=0, sticky="w", pady=(6, 0))
    ttk.Entry(controls, textvariable=hotkey_var, width=12, style="Dark.TEntry").grid(row=2, column=1, sticky="w", padx=6, pady=(6, 0))
    ttk.Label(controls, text="Hold min/max ms:", style="Dark.TLabel").grid(row=2, column=2, sticky="w", pady=(6, 0))
    ttk.Entry(controls, textvariable=hold_min_var, width=8, style="Dark.TEntry").grid(row=2, column=3, sticky="w", padx=(6, 2), pady=(6, 0))
    ttk.Entry(controls, textvariable=hold_max_var, width=8, style="Dark.TEntry").grid(row=2, column=3, sticky="w", padx=(74, 6), pady=(6, 0))
    ttk.Label(controls, text="Jitter px:", style="Dark.TLabel").grid(row=2, column=4, sticky="w", pady=(6, 0))
    ttk.Entry(controls, textvariable=jitter_var, width=8, style="Dark.TEntry").grid(row=2, column=5, sticky="w", padx=6, pady=(6, 0))

    flags = ttk.Frame(frame, style="Dark.TFrame")
    flags.pack(fill=tk.X, pady=(4, 6))
    ttk.Checkbutton(flags, text="mapowanie do client-area", variable=use_client_var).pack(side=tk.LEFT)
    ttk.Checkbutton(flags, text="API włączone", variable=api_enabled_var).pack(side=tk.LEFT, padx=8)
    ttk.Checkbutton(flags, text="restore/activate window", variable=restore_var).pack(side=tk.LEFT, padx=8)
    ttk.Checkbutton(flags, text="manual offset", variable=manual_off_var).pack(side=tk.LEFT)
    ttk.Label(flags, text="Y:", style="Dark.TLabel").pack(side=tk.LEFT, padx=(4, 0))
    ttk.Entry(flags, textvariable=offset_var, width=8, style="Dark.TEntry").pack(side=tk.LEFT, padx=(2, 8))
    ttk.Checkbutton(flags, text="offset odpowiedzi", variable=answer_off_var).pack(side=tk.LEFT)
    ttk.Label(flags, text="Y:", style="Dark.TLabel").pack(side=tk.LEFT, padx=(4, 0))
    ttk.Entry(flags, textvariable=answer_offset_var, width=8, style="Dark.TEntry").pack(side=tk.LEFT, padx=(2, 8))
    ttk.Checkbutton(flags, text="tryb bez losowości", variable=no_random_var).pack(side=tk.LEFT)
    ttk.Checkbutton(flags, text="Użyj wirtualnej myszki (w tle)", variable=click_msg_var).pack(side=tk.LEFT, padx=8)

    # Diagnostyka - lista kandydatów
    diag_frame = ttk.LabelFrame(frame, text="Diagnostyka")
    diag_frame.pack(fill=tk.BOTH, expand=True, pady=(6, 4))

    columns = ("hwnd", "title", "proc", "class", "monitor", "score", "client")
    tree = ttk.Treeview(diag_frame, columns=columns, show="headings", height=12)
    for col, w in [("hwnd", 90), ("title", 300), ("proc", 120), ("class", 150), ("monitor", 150), ("score", 70), ("client", 110)]:
        tree.heading(col, text=col)
        tree.column(col, width=w, anchor="w")
    tree.pack(fill=tk.BOTH, expand=True, padx=6, pady=6)

    log_box = scrolledtext.ScrolledText(frame, height=12, bg="#0b1220", fg="#e5e7eb")
    log_box.pack(fill=tk.BOTH, expand=False, pady=(6, 2))

    def gui_log(msg: str) -> None:
        log_box.insert(tk.END, msg + "\n")
        log_box.see(tk.END)

    runtime_state["log_hook"] = gui_log

    def save_from_gui() -> None:
        try:
            parsed_off = float(offset_var.get().strip())
            parsed_answer_off = float(answer_offset_var.get().strip())
            hold_min = int(float(hold_min_var.get().strip()))
            hold_max = int(float(hold_max_var.get().strip()))
            jitter_px = int(float(jitter_var.get().strip()))
        except ValueError:
            status_var.set("Offset/Hold/Jitter muszą być liczbami")
            return

        with config_lock:
            config["window_keyword"] = keyword_var.get().strip() or "margonem"
            config["launch_command"] = launch_cmd_var.get().strip()
            config["browser_url_hint"] = url_hint_var.get().strip()
            config["hotkey"] = hotkey_var.get().strip().lower() or "f9"
            config["window_selection_mode"] = mode_var.get().strip() or "auto"
            config["target_process_name"] = process_var.get().strip().lower()
            config["api_enabled"] = bool(api_enabled_var.get())
            config["use_client_area"] = bool(use_client_var.get())
            config["restore_window_before_click"] = bool(restore_var.get())
            config["manual_offset_enabled"] = bool(manual_off_var.get())
            config["manual_offset_y"] = parsed_off
            config["answer_offset_enabled"] = bool(answer_off_var.get())
            config["answer_offset_y"] = parsed_answer_off
            config["click_hold_ms_min"] = max(1, hold_min)
            config["click_hold_ms_max"] = max(1, hold_max)
            config["click_jitter_px"] = max(0, jitter_px)
            config["disable_randomness"] = bool(no_random_var.get())
            config["use_virtual_mouse"] = bool(click_msg_var.get())
            config["hide_console_on_start"] = bool(hide_console_var.get())
        save_settings_to_disk()
        register_hotkey()
        status_var.set("Zapisano ustawienia")

    def refresh_candidates() -> None:
        tree.delete(*tree.get_children())
        candidates = list_window_candidates()
        for c in candidates:
            cw = c.client_rect["right"] - c.client_rect["left"]
            ch = c.client_rect["bottom"] - c.client_rect["top"]
            tree.insert("", tk.END, values=(c.hwnd, c.title[:70], c.process_name, c.class_name, f"{c.monitor_index}:{c.monitor_name}", f"{c.score:.1f}", f"{cw}x{ch}"))
        status_var.set(f"Wykryto okna: {len(candidates)}")

    def pick_under_cursor_gui() -> None:
        status_var.set("Masz 3 sekundy aby najechać kursorem na docelowe okno...")

        def worker():
            c = pick_window_under_cursor()
            if c:
                status_var.set(f"Wybrane okno: {c.title[:60]} | {c.process_name} | hwnd={c.hwnd} | mon={c.monitor_index}")
                log_event(f"PICKED hwnd={c.hwnd} pid={c.pid} proc={c.process_name} monitor={c.monitor_name}")
            else:
                status_var.set("Nie udało się wybrać okna pod kursorem")

        threading.Thread(target=worker, daemon=True).start()

    def test_highlight_client() -> None:
        hwnd = resolve_target_window()
        geom = get_window_geometry(hwnd) if hwnd else None
        if not geom:
            status_var.set("Brak okna do zaznaczenia")
            return
        cw = geom.client_rect["right"] - geom.client_rect["left"]
        ch = geom.client_rect["bottom"] - geom.client_rect["top"]
        draw_overlay_rect(root, geom.client_origin["x"], geom.client_origin["y"], cw, ch)
        status_var.set("Zaznaczono client-area")

    def test_show_click_point() -> None:
        hwnd = resolve_target_window()
        geom = get_window_geometry(hwnd) if hwnd else None
        if not geom:
            status_var.set("Brak okna")
            return
        cw = geom.client_rect["right"] - geom.client_rect["left"]
        ch = geom.client_rect["bottom"] - geom.client_rect["top"]
        cx, cy = int(cw * 0.5), int(ch * 0.5)
        point = client_to_screen_point(hwnd, cx, cy)
        if not point:
            status_var.set("ClientToScreen fail")
            return
        draw_overlay_point(root, point[0], point[1])
        status_var.set(f"Punkt kliknięcia: {point[0]}, {point[1]}")

    def snapshot_client() -> None:
        hwnd = resolve_target_window()
        if not hwnd:
            status_var.set("Brak okna")
            return
        p = capture_client_area(hwnd)
        if p:
            status_var.set(f"Zapisano screenshot: {p.name}")
        else:
            status_var.set("Nie udało się zrobić screenshotu")

    def calibrate_active() -> None:
        if sys.platform != "win32":
            status_var.set("Kalibracja tylko Windows")
            return
        hwnd = ctypes.windll.user32.GetForegroundWindow()
        geom = get_window_geometry(hwnd) if hwnd else None
        if not geom:
            status_var.set("Brak aktywnego okna do kalibracji")
            return
        cw = geom.client_rect["right"] - geom.client_rect["left"]
        ch = geom.client_rect["bottom"] - geom.client_rect["top"]
        calib = {
            "client_width": cw,
            "client_height": ch,
            "origin_x": geom.client_origin["x"],
            "origin_y": geom.client_origin["y"],
            "monitor_name": geom.monitor_name,
            "monitor_index": geom.monitor_index,
            "preset_points": {k: {"x": int(cw * v[0]), "y": int(ch * v[1])} for k, v in TEST_POINT_PRESETS.items()},
        }
        with config_lock:
            config["calibration"] = calib
        save_settings_to_disk()
        status_var.set(f"Kalibracja zapisana: {cw}x{ch}, monitor {geom.monitor_index}")

    def run_test_points() -> None:
        hwnd = resolve_target_window()
        geom = get_window_geometry(hwnd) if hwnd else None
        if not geom:
            status_var.set("Brak okna")
            return
        cw = geom.client_rect["right"] - geom.client_rect["left"]
        ch = geom.client_rect["bottom"] - geom.client_rect["top"]
        for name, (rx, ry) in TEST_POINT_PRESETS.items():
            ok, msg, payload = click_in_game(cw * rx, ch * ry, label=f"gui_{name}")
            log_event(f"TEST {name}: {msg} -> {payload}")
            if not ok:
                status_var.set(f"Test punktu {name} nieudany")
                return
            time.sleep(0.12)
        status_var.set("Test wszystkich punktów zakończony")

    def test_pre_zapadki() -> None:
        hwnd = resolve_target_window()
        geom = get_window_geometry(hwnd) if hwnd else None
        if not geom:
            status_var.set("Brak okna")
            return
        cw = geom.client_rect["right"] - geom.client_rect["left"]
        ch = geom.client_rect["bottom"] - geom.client_rect["top"]
        rx, ry = TEST_POINT_PRESETS.get("pre_zapadki", (0.50, 0.50))
        px, py = resolve_click_point("pre_zapadki", (rx, ry), cw, ch)
        ok, msg, payload = click_in_game(px, py, label="gui_pre_zapadki")
        if ok:
            status_var.set(f"Pre zapadki klik: {payload}")
        else:
            status_var.set(f"Pre zapadki błąd: {msg}")

    def show_last_click() -> None:
        last = runtime_state.get("last_click")
        status_var.set(f"Ostatni klik: {last}" if last else "Brak historii kliknięć")

    def toggle_pause_gui() -> None:
        runtime_state["paused"] = not bool(runtime_state.get("paused"))
        status_var.set(f"PAUSE {'ON' if runtime_state['paused'] else 'OFF'}")

    def export_diag() -> None:
        p = export_diagnostics_json()
        status_var.set(f"Wyeksportowano diagnostykę: {p.name}")

    def save_manual_point(point_key: str, point_label: str) -> None:
        hwnd = resolve_target_window()
        geom = get_window_geometry(hwnd) if hwnd else None
        if not geom:
            status_var.set("Brak okna do zapisu punktu")
            return

        status_var.set(f"Kliknij teraz punkt: {point_label} (max 10s)")

        def _worker() -> None:
            clicked = wait_for_left_click(10.0)
            if not clicked:
                root.after(0, lambda: status_var.set(f"Timeout: nie kliknięto punktu {point_label}"))
                return
            sx, sy = clicked
            cpt = screen_to_client_point(hwnd, sx, sy)
            if not cpt:
                root.after(0, lambda: status_var.set("Nie udało się przeliczyć punktu"))
                return
            cx, cy = int(cpt[0]), int(cpt[1])
            with config_lock:
                points = config.setdefault("manual_click_points", {})
                points[point_key] = {"x": cx, "y": cy}
            save_settings_to_disk()
            root.after(0, lambda: status_var.set(f"Zapisano {point_label}: client=({cx}, {cy})"))

        threading.Thread(target=_worker, daemon=True).start()

    def test_answer_click() -> None:
        hwnd = resolve_target_window()
        geom = get_window_geometry(hwnd) if hwnd else None
        if not geom:
            status_var.set("Brak okna")
            return
        cw = geom.client_rect["right"] - geom.client_rect["left"]
        ch = geom.client_rect["bottom"] - geom.client_rect["top"]
        px, py = resolve_click_point("answer", (0.50, 0.56), cw, ch)
        ok, msg, payload = click_in_game(px, py, label="gui_answer", use_manual_offset=False, is_answer_click=True)
        status_var.set(f"Odpowiedź klik: {payload}" if ok else f"Odpowiedź błąd: {msg}")

    def test_confirm_click() -> None:
        hwnd = resolve_target_window()
        geom = get_window_geometry(hwnd) if hwnd else None
        if not geom:
            status_var.set("Brak okna")
            return
        cw = geom.client_rect["right"] - geom.client_rect["left"]
        ch = geom.client_rect["bottom"] - geom.client_rect["top"]
        px, py = resolve_click_point("confirm", (0.50, 0.63), cw, ch)
        ok, msg, payload = click_in_game(px, py, label="gui_confirm", use_manual_offset=False)
        status_var.set(f"Potwierdź klik: {payload}" if ok else f"Potwierdź błąd: {msg}")

    btns1 = ttk.Frame(frame, style="Dark.TFrame")
    btns1.pack(fill=tk.X, pady=(4, 2))
    ttk.Button(btns1, text="Zapisz ustawienia", command=save_from_gui).pack(side=tk.LEFT)
    ttk.Button(btns1, text="Pokaż wykryte okna", command=refresh_candidates).pack(side=tk.LEFT, padx=6)
    ttk.Button(btns1, text="Odśwież kandydatów", command=refresh_candidates).pack(side=tk.LEFT)
    ttk.Button(btns1, text="Wskaż okno myszą", command=pick_under_cursor_gui).pack(side=tk.LEFT, padx=6)

    btns2 = ttk.Frame(frame, style="Dark.TFrame")
    btns2.pack(fill=tk.X, pady=(2, 2))
    ttk.Button(btns2, text="Test: zaznacz client-area", command=test_highlight_client).pack(side=tk.LEFT)
    ttk.Button(btns2, text="Test: pokaż punkt kliknięcia", command=test_show_click_point).pack(side=tk.LEFT, padx=6)
    ttk.Button(btns2, text="Zrzut client-area", command=snapshot_client).pack(side=tk.LEFT)
    ttk.Button(btns2, text="Kalibracja aktywnego okna", command=calibrate_active).pack(side=tk.LEFT, padx=6)

    btns3 = ttk.Frame(frame, style="Dark.TFrame")
    btns3.pack(fill=tk.X, pady=(2, 4))
    ttk.Button(btns3, text="PAUSE ON/OFF", command=toggle_pause_gui).pack(side=tk.LEFT)
    ttk.Button(btns3, text="Test wszystkie punkty", command=run_test_points).pack(side=tk.LEFT)
    ttk.Button(btns3, text="Test: Pre zapadki", command=test_pre_zapadki).pack(side=tk.LEFT, padx=6)
    ttk.Button(btns3, text="Test: Odpowiedź", command=test_answer_click).pack(side=tk.LEFT, padx=6)
    ttk.Button(btns3, text="Test: Potwierdź", command=test_confirm_click).pack(side=tk.LEFT, padx=6)
    ttk.Button(btns3, text="Pokaż współrzędne ostatniego kliknięcia", command=show_last_click).pack(side=tk.LEFT, padx=6)
    ttk.Button(btns3, text="Eksport diagnostyki do JSON", command=export_diag).pack(side=tk.LEFT)


    btns4 = ttk.Frame(frame, style="Dark.TFrame")
    btns4.pack(fill=tk.X, pady=(2, 4))
    ttk.Button(btns4, text="Ustaw punkt: Pre zapadka", command=lambda: save_manual_point("pre_zapadki", "Pre zapadka")).pack(side=tk.LEFT)
    ttk.Button(btns4, text="Ustaw punkt: Odpowiedź", command=lambda: save_manual_point("answer", "Odpowiedź")).pack(side=tk.LEFT, padx=6)
    ttk.Button(btns4, text="Ustaw punkt: Potwierdź", command=lambda: save_manual_point("confirm", "Potwierdź")).pack(side=tk.LEFT)

    ttk.Label(frame, textvariable=status_var, style="Dark.TLabel").pack(anchor="w", pady=(4, 0))
    ttk.Label(
        frame,
        text="W Chromium zakładki nie mają osobnego HWND - aktywowane jest całe okno przeglądarki. Dla stabilności uruchom grę w osobnym oknie.",
        style="Dark.TLabel",
        wraplength=1080,
    ).pack(anchor="w", pady=(3, 0))
    ttk.Label(
        frame,
        text="launch_command uruchamia program. browser_url_hint to wyłącznie notatka diagnostyczna i NIE jest używany do wykrywania okna.",
        style="Dark.TLabel",
        wraplength=1080,
    ).pack(anchor="w", pady=(3, 0))

    root.after(300, refresh_candidates)
    root.mainloop()


# =========================
# BOOTSTRAP
# =========================

def run_console_policy() -> None:
    with config_lock:
        should_hide = bool(config.get("hide_console_on_start", True))
    if should_hide:
        hide_console_window()


def start_http_server() -> None:
    app.run(port=5000, host="127.0.0.1", debug=False, use_reloader=False)


def check_required_dependencies() -> bool:
    missing: List[str] = []
    if pyautogui is None:
        missing.append("pyautogui")
    if not FLASK_AVAILABLE:
        missing.extend(["flask", "flask-cors"])
    if missing:
        uniq = ", ".join(sorted(set(missing)))
        print("Brak wymaganych bibliotek Pythona:", uniq)
        print("Zainstaluj je poleceniem:")
        print("  pip install pyautogui flask flask-cors")
        return False
    return True


if __name__ == "__main__":
    if not check_required_dependencies():
        raise SystemExit(1)
    load_settings_from_disk()
    configure_flask_logging()
    setup_dpi_awareness()
    run_console_policy()
    register_hotkey()
    pyautogui.FAILSAFE = False

    log_event("MargoClicker start")
    server_thread = threading.Thread(target=start_http_server, daemon=True)
    server_thread.start()
    launch_gui()
