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

FALLBACK_OFFSET_Y = 7

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

config_lock = threading.Lock()
config = {
    "use_client_area": True,
    "manual_offset_enabled": True,
    "manual_offset_x": 0.0,
    "manual_offset_y": 0.0,
    "launch_fullscreen": False,
}



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



def maybe_enable_fullscreen_from_config():
    with config_lock:
        launch_fullscreen = bool(config["launch_fullscreen"])

    if not launch_fullscreen:
        return

    try:
        time.sleep(1.2)
        pyautogui.press("f11")
        print("🖥️ Wysłano F11 (automatyczny tryb pełnoekranowy).")
    except Exception as e:
        print(f"⚠️ Nie udało się wysłać F11: {e}")



def trigger_fullscreen_now():
    try:
        pyautogui.press("f11")
        print("🖥️ Wysłano F11 (ręczne przełączenie pełnego ekranu).")
    except Exception as e:
        print(f"⚠️ Nie udało się wysłać F11: {e}")



def get_click_config():
    with config_lock:
        return {
            "use_client_area": bool(config["use_client_area"]),
            "manual_offset_enabled": bool(config["manual_offset_enabled"]),
            "manual_offset_x": float(config["manual_offset_x"]),
            "manual_offset_y": float(config["manual_offset_y"]),
        }



def kliknij_w_grze(x, y):
    cfg = get_click_config()

    local_x = float(x)
    local_y = float(y)
    if cfg["manual_offset_enabled"]:
        local_x += cfg["manual_offset_x"]
        local_y += cfg["manual_offset_y"]

    hwnd = get_target_hwnd() if cfg["use_client_area"] else None
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
    root.geometry("420x300")
    root.resizable(False, False)

    frame = ttk.Frame(root, padding=12)
    frame.pack(fill=tk.BOTH, expand=True)

    use_client_area_var = tk.BooleanVar(value=config["use_client_area"])
    manual_offset_enabled_var = tk.BooleanVar(value=config["manual_offset_enabled"])
    launch_fullscreen_var = tk.BooleanVar(value=config["launch_fullscreen"])
    offset_x_var = tk.StringVar(value=str(config["manual_offset_x"]))
    offset_y_var = tk.StringVar(value=str(config["manual_offset_y"]))
    status_var = tk.StringVar(value="Serwer działa na http://127.0.0.1:5000")

    ttk.Label(frame, text="MargoClicker (GUI)", font=("Segoe UI", 14, "bold")).pack(anchor="w", pady=(0, 10))

    ttk.Checkbutton(
        frame,
        text="Używaj mapowania do client-area aktywnego okna (WinAPI)",
        variable=use_client_area_var,
    ).pack(anchor="w", pady=3)

    ttk.Checkbutton(
        frame,
        text="Włącz ręczny offset (dla paska przeglądarki / UI)",
        variable=manual_offset_enabled_var,
    ).pack(anchor="w", pady=3)

    offsets = ttk.Frame(frame)
    offsets.pack(anchor="w", pady=(6, 8), fill=tk.X)
    ttk.Label(offsets, text="Offset X:").grid(row=0, column=0, sticky="w")
    ttk.Entry(offsets, textvariable=offset_x_var, width=10).grid(row=0, column=1, padx=(6, 16))
    ttk.Label(offsets, text="Offset Y:").grid(row=0, column=2, sticky="w")
    ttk.Entry(offsets, textvariable=offset_y_var, width=10).grid(row=0, column=3, padx=(6, 0))

    ttk.Checkbutton(
        frame,
        text="Automatycznie wyślij F11 po starcie (tryb pełnoekranowy)",
        variable=launch_fullscreen_var,
    ).pack(anchor="w", pady=3)

    def save_settings():
        try:
            parsed_x = float(offset_x_var.get().strip())
            parsed_y = float(offset_y_var.get().strip())
        except ValueError:
            status_var.set("Błąd: Offset X/Y musi być liczbą.")
            return

        with config_lock:
            config["use_client_area"] = bool(use_client_area_var.get())
            config["manual_offset_enabled"] = bool(manual_offset_enabled_var.get())
            config["launch_fullscreen"] = bool(launch_fullscreen_var.get())
            config["manual_offset_x"] = parsed_x
            config["manual_offset_y"] = parsed_y

        status_var.set("Zapisano ustawienia.")
        print(
            "⚙️ Zapisano ustawienia:",
            {
                "use_client_area": config["use_client_area"],
                "manual_offset_enabled": config["manual_offset_enabled"],
                "manual_offset_x": config["manual_offset_x"],
                "manual_offset_y": config["manual_offset_y"],
                "launch_fullscreen": config["launch_fullscreen"],
            },
        )

    controls = ttk.Frame(frame)
    controls.pack(anchor="w", pady=(10, 4))

    ttk.Button(controls, text="Zapisz ustawienia", command=save_settings).pack(side=tk.LEFT)
    ttk.Button(
        controls,
        text="Przełącz pełny ekran (F11)",
        command=trigger_fullscreen_now,
    ).pack(side=tk.LEFT, padx=8)

    ttk.Label(frame, textvariable=status_var, foreground="#1e5f2e").pack(anchor="w", pady=(8, 0))

    root.mainloop()


if __name__ == '__main__':
    setup_dpi_awareness()
    pyautogui.FAILSAFE = False

    print("🚀 MargoClicker V6 (GUI + fullscreen + offset) działa!")
    server_thread = threading.Thread(target=start_http_server, daemon=True)
    server_thread.start()

    auto_fullscreen_thread = threading.Thread(target=maybe_enable_fullscreen_from_config, daemon=True)
    auto_fullscreen_thread.start()

    launch_gui()
