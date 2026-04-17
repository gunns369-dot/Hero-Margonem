from flask import Flask, request, make_response
from flask_cors import CORS
import pyautogui
import random
import time
import ctypes
import sys

FALLBACK_OFFSET_Y = 7

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


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


def kliknij_w_grze(x, y):
    hwnd = get_target_hwnd()
    client = get_client_origin(hwnd)

    if client:
        origin_x, origin_y, client_w, client_h = client
        local_x = float(x)
        local_y = float(y)

        if client_w is not None:
            local_x = min(max(0.0, local_x), max(0.0, client_w - 1))
        if client_h is not None:
            local_y = min(max(0.0, local_y), max(0.0, client_h - 1))

        screen_x = origin_x + local_x
        screen_y = origin_y + local_y
        mode = "client-area"
    else:
        # Fallback awaryjny: stary offset Y, gdy WinAPI nie działa.
        screen_x = float(x)
        screen_y = float(y) + FALLBACK_OFFSET_Y
        mode = "fallback-offset"
        print(f"⚠️ WinAPI niedostępne, używam fallback OFFSET_Y={FALLBACK_OFFSET_Y}")

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
            pyautogui.click(float(request.args.get('x')), float(request.args.get('y')))
            print(f"🎯 Klik (absolute): X:{float(request.args.get('x')):.0f} Y:{float(request.args.get('y')):.0f}")

        return "OK", 200
    except Exception as e:
        print(f"❌ Błąd: {e}")
        return "ERROR", 500


if __name__ == '__main__':
    setup_dpi_awareness()
    print("🚀 MargoClicker V5 (client-area click) działa!")
    pyautogui.FAILSAFE = False
    app.run(port=5000, host='127.0.0.1', debug=False)
