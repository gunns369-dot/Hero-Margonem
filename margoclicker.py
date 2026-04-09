from flask import Flask, request, make_response
from flask_cors import CORS
import pyautogui
import random
import time
import ctypes
import sys

# Wymuszenie sprzętowego skalowania dla VM
if sys.platform == 'win32':
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(2)
    except Exception:
        try:
            ctypes.windll.user32.SetProcessDPIAware()
        except:
            pass

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}) 

def _get_browser_client_origin():
    """
    Zwraca (x, y) lewego-górnego rogu obszaru klienta aktywnego okna.
    Dzięki temu kliknięcia nie zależą od paska przeglądarki, ramek ani monitora.
    """
    if sys.platform != 'win32':
        return 0, 0

    user32 = ctypes.windll.user32
    hwnd = user32.GetForegroundWindow()
    if not hwnd:
        return 0, 0

    class POINT(ctypes.Structure):
        _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]

    pt = POINT(0, 0)
    # (0,0) obszaru klienta -> współrzędne ekranu
    if user32.ClientToScreen(hwnd, ctypes.byref(pt)) == 0:
        return 0, 0

    return int(pt.x), int(pt.y)

@app.route('/click', methods=['GET', 'OPTIONS'])
def click():
    if request.method == 'OPTIONS':
        return make_response("", 200)

    try:
        # Tryb legacy: x/y = absolutne współrzędne ekranu
        # Tryb zalecany: vx/vy = współrzędne względem viewportu gry
        vx = request.args.get('vx')
        vy = request.args.get('vy')

        if vx is not None and vy is not None:
            viewport_x = float(vx)
            viewport_y = float(vy)
            origin_x, origin_y = _get_browser_client_origin()
            x = origin_x + viewport_x
            y = origin_y + viewport_y
            mode = "viewport"
        else:
            x = float(request.args.get('x'))
            y = float(request.args.get('y'))
            mode = "absolute"
        
        # Lekki offset dla humanizacji
        final_x = x + random.uniform(-4, 4)
        final_y = y + random.uniform(-3, 3)
        
        print(f"🎯 Klik ({mode}): X:{final_x:.0f} Y:{final_y:.0f}")
        
        # Płynny ruch
        duration = random.uniform(0.15, 0.3)
        pyautogui.moveTo(final_x, final_y, duration, pyautogui.easeInOutQuad)
        
        # Fizyczny klik
        time.sleep(random.uniform(0.05, 0.1))
        pyautogui.mouseDown()
        time.sleep(random.uniform(0.05, 0.1))
        pyautogui.mouseUp()
        
        return "OK", 200
    except Exception as e:
        print(f"❌ Błąd: {e}")
        return "ERROR", 500

if __name__ == '__main__':
    print("🚀 MargoClicker V4 (multi-monitor + viewport) działa!")
    pyautogui.FAILSAFE = False 
    app.run(port=5000, host='127.0.0.1', debug=False)
