from flask import Flask, request, make_response
from flask_cors import CORS
import pyautogui
import random
import time
import ctypes
import sys
import threading
import tkinter as tk
from tkinter import ttk
import logging
import json
import subprocess
from pathlib import Path

FALLBACK_OFFSET_Y = 7
PRETRAP_TEST_RATIO_X = 0.50
PRETRAP_TEST_RATIO_Y = 0.34

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

config_lock = threading.Lock()
SETTINGS_PATH = Path(__file__).with_name("margoclicker_settings.json")
config = {
    "use_client_area": True,
    "manual_offset_enabled": True,
    "manual_offset_y": 0.0,
    "window_keyword": "margonem",
    "app_path": "",
    "restore_window_before_click": True,
    "hide_console_on_start": True,
}


def configure_flask_logging():
    logging.getLogger("werkzeug").setLevel(logging.ERROR)
    app.logger.setLevel(logging.ERROR)


def hide_console_window():
    if sys.platform != "win32":
        return
    try:
        kernel32 = ctypes.windll.kernel32
        user32 = ctypes.windll.user32
        hwnd = kernel32.GetConsoleWindow()
        if hwnd:
            SW_HIDE = 0
            user32.ShowWindow(hwnd, SW_HIDE)
    except Exception:
        pass


def show_console_window():
    if sys.platform != "win32":
        return
    try:
        kernel32 = ctypes.windll.kernel32
        user32 = ctypes.windll.user32
        hwnd = kernel32.GetConsoleWindow()
        if hwnd:
            SW_SHOW = 5
            user32.ShowWindow(hwnd, SW_SHOW)
    except Exception:
        pass


def run_console_policy():
    with config_lock:
        should_hide = bool(config["hide_console_on_start"])
    if should_hide:
        hide_console_window()


def _normalize_config(raw):
    normalized = {
        "use_client_area": bool(raw.get("use_client_area", config["use_client_area"])),
        "manual_offset_enabled": bool(raw.get("manual_offset_enabled", config["manual_offset_enabled"])),
        "manual_offset_y": float(raw.get("manual_offset_y", config["manual_offset_y"])),
        "window_keyword": str(raw.get("window_keyword", config["window_keyword"])).strip() or "margonem",
        "app_path": str(raw.get("app_path", config.get("app_path", ""))).strip(),
        "restore_window_before_click": bool(raw.get("restore_window_before_click", config.get("restore_window_before_click", True))),
        "hide_console_on_start": bool(raw.get("hide_console_on_start", config["hide_console_on_start"])),
    }
    return normalized


def load_settings_from_disk():
    if not SETTINGS_PATH.exists():
        return
    try:
        saved = json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"⚠️ Nie udało się odczytać ustawień z pliku: {e}")
        return

    if not isinstance(saved, dict):
        print("⚠️ Plik ustawień ma nieprawidłowy format, pomijam.")
        return

    try:
        normalized = _normalize_config(saved)
    except Exception as e:
        print(f"⚠️ Nie udało się znormalizować ustawień: {e}")
        return

    with config_lock:
        config.update(normalized)


def save_settings_to_disk():
    with config_lock:
        payload = {
            "use_client_area": config["use_client_area"],
            "manual_offset_enabled": config["manual_offset_enabled"],
            "manual_offset_y": config["manual_offset_y"],
            "window_keyword": config["window_keyword"],
            "app_path": config.get("app_path", ""),
            "restore_window_before_click": config.get("restore_window_before_click", True),
            "hide_console_on_start": config["hide_console_on_start"],
        }
    try:
        SETTINGS_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as e:
        print(f"⚠️ Nie udało się zapisać ustawień do pliku: {e}")


def setup_dpi_awareness():
    if sys.platform != 'win32':
        return
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(2)
        print("🖥️ DPI awareness: Per-monitor (SetProcessDpiAwareness=2)")
    except Exception:
        try:
            ctypes.windll.user32.SetProcessDPIAware()
            print("🖥️ DPI awareness: System (SetProcessDPIAware)")
        except Exception as e:
            print(f"⚠️ Nie udało się ustawić DPI awareness: {e}")


def get_target_hwnd():
    if sys.platform != 'win32':
        return None
    try:
        hwnd = ctypes.windll.user32.GetForegroundWindow()
        return hwnd if hwnd else None
    except Exception:
        return None


def get_window_text(hwnd):
    if sys.platform != "win32" or not hwnd:
        return ""
    user32 = ctypes.windll.user32
    length = user32.GetWindowTextLengthW(hwnd)
    if length <= 0:
        return ""
    buffer = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buffer, length + 1)
    return buffer.value or ""


def find_best_margonem_hwnd():
    if sys.platform != "win32":
        return None

    with config_lock:
        keyword = (config.get("window_keyword") or "margonem").strip().lower()

    user32 = ctypes.windll.user32
    found = []
    WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)

    def enum_handler(hwnd, _lparam):
        if not user32.IsWindowVisible(hwnd):
            return True
        title = get_window_text(hwnd).strip()
        if not title:
            return True
        lowered = title.lower()
        score = 0
        if keyword and keyword in lowered:
            score += 100
        if "margonem" in lowered:
            score += 80
        if any(browser in lowered for browser in ("brave", "chrome", "firefox", "edge")):
            score += 10
        if score > 0:
            found.append((score, hwnd))
        return True

    user32.EnumWindows(WNDENUMPROC(enum_handler), 0)
    if not found:
        return None
    found.sort(key=lambda x: x[0], reverse=True)
    return found[0][1]


def ensure_window_ready(hwnd):
    if sys.platform != "win32" or not hwnd:
        return False

    user32 = ctypes.windll.user32
    SW_RESTORE = 9
    SW_SHOW = 5

    try:
        if user32.IsIconic(hwnd):
            user32.ShowWindow(hwnd, SW_RESTORE)
        else:
            user32.ShowWindow(hwnd, SW_SHOW)
        user32.SetForegroundWindow(hwnd)
        time.sleep(0.07)
        return True
    except Exception:
        return False


def send_f11_to_window(hwnd=None):
    if sys.platform != "win32":
        pyautogui.press("f11")
        return True

    user32 = ctypes.windll.user32
    target = hwnd or find_best_margonem_hwnd() or get_target_hwnd()
    if not target:
        return False

    SW_RESTORE = 9
    VK_F11 = 0x7A
    KEYEVENTF_KEYUP = 0x0002

    try:
        user32.ShowWindow(target, SW_RESTORE)
        user32.SetForegroundWindow(target)
        time.sleep(0.08)
        user32.keybd_event(VK_F11, 0, 0, 0)
        time.sleep(0.02)
        user32.keybd_event(VK_F11, 0, KEYEVENTF_KEYUP, 0)
        return True
    except Exception:
        return False


def get_client_origin(hwnd):
    """Zwraca (origin_x, origin_y, client_w, client_h) dla client-area okna."""
    if sys.platform != 'win32' or not hwnd:
        return None

    try:
        user32 = ctypes.windll.user32

        class POINT(ctypes.Structure):
            _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]

        class RECT(ctypes.Structure):
            _fields_ = [
                ("left", ctypes.c_long),
                ("top", ctypes.c_long),
                ("right", ctypes.c_long),
                ("bottom", ctypes.c_long),
            ]

        pt = POINT(0, 0)
        if user32.ClientToScreen(hwnd, ctypes.byref(pt)) == 0:
            return None

        rc = RECT()
        if user32.GetClientRect(hwnd, ctypes.byref(rc)) == 0:
            return int(pt.x), int(pt.y), None, None

        client_w = max(0, int(rc.right - rc.left))
        client_h = max(0, int(rc.bottom - rc.top))
        return int(pt.x), int(pt.y), client_w, client_h
    except Exception:
        return None


def get_click_config():
    with config_lock:
        return {
            "use_client_area": bool(config["use_client_area"]),
            "manual_offset_enabled": bool(config["manual_offset_enabled"]),
            "manual_offset_y": float(config["manual_offset_y"]),
            "restore_window_before_click": bool(config.get("restore_window_before_click", True)),
        }


def kliknij_w_grze(x, y):
    cfg = get_click_config()

    local_x = float(x)
    local_y = float(y)
    if cfg["manual_offset_enabled"]:
        local_y += cfg["manual_offset_y"]

    hwnd = find_best_margonem_hwnd() if cfg["use_client_area"] else None
    if hwnd and cfg["restore_window_before_click"]:
        ensure_window_ready(hwnd)
    client = get_client_origin(hwnd) if hwnd else None

    if client:
        origin_x, origin_y, client_w, client_h = client

        if client_w is not None:
            local_x = min(max(0.0, local_x), max(0.0, client_w - 1))
        if client_h is not None:
            local_y = min(max(0.0, local_y), max(0.0, client_h - 1))

        screen_x = origin_x + local_x
        screen_y = origin_y + local_y
        mode = "client-area"
    else:
        screen_x = local_x
        screen_y = local_y + FALLBACK_OFFSET_Y
        mode = "fallback-offset"
        print(f"⚠️ WinAPI niedostępne lub wyłączone, używam fallback OFFSET_Y={FALLBACK_OFFSET_Y}")

    final_x = screen_x + random.uniform(-4, 4)
    final_y = screen_y + random.uniform(-3, 3)
    print(f"🎯 Klik ({mode}): X:{final_x:.0f} Y:{final_y:.0f}")

    duration = random.uniform(0.15, 0.3)
    pyautogui.moveTo(final_x, final_y, duration, pyautogui.easeInOutQuad)
    time.sleep(random.uniform(0.05, 0.1))
    pyautogui.mouseDown()
    time.sleep(random.uniform(0.05, 0.1))
    pyautogui.mouseUp()


@app.route('/health', methods=['GET'])
def health():
    return "OK", 200


@app.route('/fullscreen', methods=['GET', 'POST', 'OPTIONS'])
def fullscreen():
    if request.method == 'OPTIONS':
        return make_response("", 200)
    ok = send_f11_to_window()
    return ("OK", 200) if ok else ("NO_WINDOW", 404)


@app.route('/launch', methods=['POST', 'OPTIONS'])
def launch_target_app():
    if request.method == 'OPTIONS':
        return make_response("", 200)

    with config_lock:
        app_path = str(config.get("app_path", "")).strip()

    if not app_path:
        return "NO_APP_PATH", 400

    try:
        subprocess.Popen(app_path, shell=True)
        print(f"🚀 Uruchomiono aplikację: {app_path}")
        return "OK", 200
    except Exception as e:
        print(f"❌ Nie udało się uruchomić aplikacji: {e}")
        return "ERROR", 500


@app.route('/click', methods=['GET', 'OPTIONS'])
def click():
    if request.method == 'OPTIONS':
        return make_response("", 200)

    try:
        vx = request.args.get('vx')
        vy = request.args.get('vy')
        ax = request.args.get('ax')
        ay = request.args.get('ay')

        if vx is not None and vy is not None:
            kliknij_w_grze(float(vx), float(vy))
        elif ax is not None and ay is not None:
            pyautogui.click(float(ax), float(ay))
            print(f"🎯 Klik (browser_absolute): X:{float(ax):.0f} Y:{float(ay):.0f}")
        else:
            x_abs = float(request.args.get('x'))
            y_abs = float(request.args.get('y'))
            pyautogui.click(x_abs, y_abs)
            print(f"🎯 Klik (absolute): X:{x_abs:.0f} Y:{y_abs:.0f}")

        return "OK", 200
    except Exception as e:
        print(f"❌ Błąd: {e}")
        return "ERROR", 500


def start_http_server():
    app.run(port=5000, host='127.0.0.1', debug=False, use_reloader=False)


def launch_gui():
    root = tk.Tk()
    root.title("MargoClicker - Ustawienia")
    root.geometry("650x560")
    root.resizable(False, False)
    root.configure(bg="#111827")

    style = ttk.Style(root)
    style.theme_use("clam")
    style.configure("Dark.TFrame", background="#111827")
    style.configure("Dark.TLabel", background="#111827", foreground="#e5e7eb")
    style.configure("Title.TLabel", background="#111827", foreground="#f9fafb", font=("Segoe UI", 16, "bold"))
    style.configure("Dark.TCheckbutton", background="#111827", foreground="#e5e7eb")
    style.map("Dark.TCheckbutton", background=[("active", "#111827")], foreground=[("active", "#f9fafb")])
    style.configure("Dark.TEntry", fieldbackground="#1f2937", foreground="#f9fafb", insertcolor="#f9fafb")
    style.configure("Dark.TButton", background="#2563eb", foreground="#ffffff", padding=(8, 5))
    style.map("Dark.TButton", background=[("active", "#1d4ed8")])
    style.configure("Success.TLabel", background="#111827", foreground="#86efac")
    style.configure("Muted.TLabel", background="#111827", foreground="#93c5fd")

    frame = ttk.Frame(root, padding=14, style="Dark.TFrame")
    frame.pack(fill=tk.BOTH, expand=True)

    use_client_area_var = tk.BooleanVar(value=config["use_client_area"])
    manual_offset_enabled_var = tk.BooleanVar(value=config["manual_offset_enabled"])
    hide_console_var = tk.BooleanVar(value=config["hide_console_on_start"])
    restore_before_click_var = tk.BooleanVar(value=config.get("restore_window_before_click", True))
    offset_y_var = tk.StringVar(value=str(config["manual_offset_y"]))
    keyword_var = tk.StringVar(value=str(config["window_keyword"]))
    app_path_var = tk.StringVar(value=str(config.get("app_path", "")))
    status_var = tk.StringVar(value="Serwer działa na http://127.0.0.1:5000")

    ttk.Label(frame, text="MargoClicker", style="Title.TLabel").pack(anchor="w", pady=(0, 10))

    ttk.Checkbutton(
        frame,
        text="Używaj mapowania do client-area wybranego okna (WinAPI)",
        variable=use_client_area_var,
        style="Dark.TCheckbutton",
    ).pack(anchor="w", pady=3)

    ttk.Checkbutton(
        frame,
        text="Włącz ręczny offset (dla paska przeglądarki / UI)",
        variable=manual_offset_enabled_var,
        style="Dark.TCheckbutton",
    ).pack(anchor="w", pady=3)

    offsets = ttk.Frame(frame, style="Dark.TFrame")
    offsets.pack(anchor="w", pady=(6, 8), fill=tk.X)
    ttk.Label(offsets, text="Offset Y:", style="Dark.TLabel").grid(row=0, column=0, sticky="w")
    ttk.Entry(offsets, textvariable=offset_y_var, width=10, style="Dark.TEntry").grid(row=0, column=1, padx=(6, 0))

    ttk.Label(offsets, text="Fraza okna gry:", style="Dark.TLabel").grid(row=1, column=0, sticky="w", pady=(8, 0))
    ttk.Entry(offsets, textvariable=keyword_var, width=28, style="Dark.TEntry").grid(row=1, column=1, columnspan=3, sticky="w", pady=(8, 0))

    ttk.Label(offsets, text="Ścieżka aplikacji (opcjonalnie):", style="Dark.TLabel").grid(row=2, column=0, sticky="w", pady=(8, 0))
    ttk.Entry(offsets, textvariable=app_path_var, width=48, style="Dark.TEntry").grid(row=2, column=1, columnspan=3, sticky="w", pady=(8, 0))

    ttk.Checkbutton(
        frame,
        text="Przed kliknięciem przywracaj i aktywuj wybrane okno (gdy inna karta/minimalizacja)",
        variable=restore_before_click_var,
        style="Dark.TCheckbutton",
    ).pack(anchor="w", pady=3)

    ttk.Checkbutton(
        frame,
        text="Ukryj konsolę CMD przy starcie (Windows)",
        variable=hide_console_var,
        style="Dark.TCheckbutton",
    ).pack(anchor="w", pady=3)

    def save_settings():
        try:
            parsed_y = float(offset_y_var.get().strip())
        except ValueError:
            status_var.set("Błąd: Offset Y musi być liczbą.")
            return

        with config_lock:
            config["use_client_area"] = bool(use_client_area_var.get())
            config["manual_offset_enabled"] = bool(manual_offset_enabled_var.get())
            config["hide_console_on_start"] = bool(hide_console_var.get())
            config["manual_offset_y"] = parsed_y
            config["window_keyword"] = keyword_var.get().strip() or "margonem"
            config["app_path"] = app_path_var.get().strip()
            config["restore_window_before_click"] = bool(restore_before_click_var.get())
        save_settings_to_disk()

        if config["hide_console_on_start"]:
            hide_console_window()
        else:
            show_console_window()

        status_var.set("Zapisano ustawienia.")
        print(
            "⚙️ Zapisano ustawienia:",
            {
                "use_client_area": config["use_client_area"],
                "manual_offset_enabled": config["manual_offset_enabled"],
                "manual_offset_y": config["manual_offset_y"],
                "window_keyword": config["window_keyword"],
                "app_path": config.get("app_path", ""),
                "restore_window_before_click": config.get("restore_window_before_click", True),
                "hide_console_on_start": config["hide_console_on_start"],
            },
        )

    def choose_active_window():
        hwnd = get_target_hwnd()
        title = get_window_text(hwnd).strip() if hwnd else ""
        if not title:
            status_var.set("Nie udało się pobrać tytułu aktywnego okna.")
            return
        keyword_var.set(title)
        status_var.set(f"Ustawiono cel kliknięć na aktywne okno: {title}")

    def launch_app_now():
        app_path = app_path_var.get().strip()
        if not app_path:
            status_var.set("Podaj ścieżkę aplikacji, aby ją uruchomić.")
            return
        try:
            subprocess.Popen(app_path, shell=True)
            status_var.set("Uruchomiono aplikację.")
        except Exception as e:
            status_var.set(f"Błąd uruchamiania aplikacji: {e}")

    def calibrate_from_active_window():
        hwnd = get_target_hwnd()
        client = get_client_origin(hwnd) if hwnd else None
        if not client:
            status_var.set("Nie udało się pobrać aktywnego okna do kalibracji.")
            return
        _ox, _oy, client_w, client_h = client
        if not client_w or not client_h:
            status_var.set("Brak rozmiaru client-area do kalibracji.")
            return
        status_var.set(f"Kalibracja OK. Obszar gry: {client_w}x{client_h}. Offset Y bez zmian.")

    def test_click_center():
        hwnd = find_best_margonem_hwnd() or get_target_hwnd()
        client = get_client_origin(hwnd) if hwnd else None
        if not client or not client[2] or not client[3]:
            status_var.set("Nie znaleziono okna gry do testowego kliknięcia.")
            return
        _, _, cw, ch = client
        kliknij_w_grze(cw / 2, ch / 2)
        status_var.set("Wysłano testowe kliknięcie w środek client-area.")

    def test_click_pretrap():
        hwnd = find_best_margonem_hwnd() or get_target_hwnd()
        client = get_client_origin(hwnd) if hwnd else None
        if not client or not client[2] or not client[3]:
            status_var.set("Nie znaleziono okna gry do testu pre-zapadki.")
            return
        _, _, cw, ch = client
        target_x = cw * PRETRAP_TEST_RATIO_X
        target_y = ch * PRETRAP_TEST_RATIO_Y
        kliknij_w_grze(target_x, target_y)
        status_var.set("Wysłano testowe kliknięcie w obszar pre-zapadki (górna część).")

    controls = ttk.Frame(frame, style="Dark.TFrame")
    controls.pack(anchor="w", pady=(10, 4))

    ttk.Button(controls, text="Zapisz ustawienia", command=save_settings, style="Dark.TButton").pack(side=tk.LEFT)

    extra_controls = ttk.Frame(frame, style="Dark.TFrame")
    extra_controls.pack(anchor="w", pady=(8, 0))
    ttk.Button(extra_controls, text="Kalibracja aktywnego okna", command=calibrate_from_active_window, style="Dark.TButton").pack(side=tk.LEFT)
    ttk.Button(extra_controls, text="Test kliknięcia środka", command=test_click_center, style="Dark.TButton").pack(side=tk.LEFT, padx=8)
    ttk.Button(extra_controls, text="Test pre-zapadki", command=test_click_pretrap, style="Dark.TButton").pack(side=tk.LEFT, padx=8)

    target_controls = ttk.Frame(frame, style="Dark.TFrame")
    target_controls.pack(anchor="w", pady=(8, 0))
    ttk.Button(target_controls, text="Wybierz aktywne okno jako cel", command=choose_active_window, style="Dark.TButton").pack(side=tk.LEFT)
    ttk.Button(target_controls, text="Uruchom aplikację", command=launch_app_now, style="Dark.TButton").pack(side=tk.LEFT, padx=8)

    ttk.Label(frame, textvariable=status_var, style="Success.TLabel", wraplength=480).pack(anchor="w", pady=(8, 0))
    ttk.Label(frame, text="Ustawienia zapisują się do pliku i ładują po restarcie.", style="Muted.TLabel").pack(anchor="w", pady=(8, 0))

    root.mainloop()


if __name__ == '__main__':
    load_settings_from_disk()
    configure_flask_logging()
    run_console_policy()
    setup_dpi_awareness()
    pyautogui.FAILSAFE = False

    print("🚀 MargoClicker działa!")
    server_thread = threading.Thread(target=start_http_server, daemon=True)
    server_thread.start()

    launch_gui()
