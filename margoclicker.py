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

@app.route('/click', methods=['GET', 'OPTIONS'])
def click():
    if request.method == 'OPTIONS':
        return make_response("", 200)

    try:
        x = float(request.args.get('x'))
        y = float(request.args.get('y'))
        
        # Lekki offset dla humanizacji
        final_x = x + random.uniform(-4, 4)
        final_y = y + random.uniform(-3, 3)
        
        print(f"🎯 Atakuję wirtualną myszką: X:{final_x:.0f} Y:{final_y:.0f}")
        
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
    print("🚀 MargoClicker V3 (VM Edition) działa!")
    pyautogui.FAILSAFE = False 
    app.run(port=5000, host='127.0.0.1', debug=False)