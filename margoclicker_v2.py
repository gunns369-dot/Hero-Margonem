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

# =====================================================
# Optional dependencies (fallback-safe)
# =====================================================

try:
    import cv2
except ModuleNotFoundError:
    cv2 = None

try:
    import keyboard
except ModuleNotFoundError:
    keyboard = None

try:
    import numpy as np
except ModuleNotFoundError:
    np = None

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

try:
    from win10toast import ToastNotifier
except ModuleNotFoundError:

    class ToastNotifier:  # type: ignore[override]
        def show_toast(self, *_args, **_kwargs) -> None:
            return None


try:
    import customtkinter as ctk

    USING_CUSTOMTKINTER = True
except ModuleNotFoundError:
    import tkinter as tk
    from tkinter import scrolledtext, ttk

    USING_CUSTOMTKINTER = False

    class _TabView(ttk.Notebook):
        def __init__(self, master=None, width: int = 0, height: int = 0, **kwargs):
            super().__init__(master, **kwargs)
            if width > 0:
                self.configure(width=width)
            if height > 0:
                self.configure(height=height)

        def add(self, name: str):
            frame = tk.Frame(self)
            super().add(frame, text=name)
            return frame

    class _CTkCompat:
        CTk = tk.Tk
        CTkLabel = tk.Label
        CTkEntry = tk.Entry
        CTkFrame = tk.Frame
        CTkButton = tk.Button
        CTkTextbox = scrolledtext.ScrolledText
        CTkTabview = _TabView
        BooleanVar = tk.BooleanVar
        StringVar = tk.StringVar
        END = tk.END

        @staticmethod
        def CTkSwitch(master=None, text: str = "", variable=None, **kwargs):
            return ttk.Checkbutton(master, text=text, variable=variable, **kwargs)

        @staticmethod
        def CTkOptionMenu(master=None, variable=None, values=None, **kwargs):
            vals = values or []
            return ttk.Combobox(master, textvariable=variable, values=vals, state="readonly", **kwargs)

        @staticmethod
        def CTkScrollableFrame(master=None, **kwargs):
            return tk.Frame(master, **kwargs)

        @staticmethod
        def set_appearance_mode(_mode: str) -> None:
            return None

        @staticmethod
        def set_default_color_theme(_theme: str) -> None:
            return None

    ctk = _CTkCompat()

# =====================================================
# Konfiguracja i runtime
# =====================================================

IS_WINDOWS = sys.platform == "win32"
user32 = ctypes.windll.user32 if IS_WINDOWS else None
gdi32 = ctypes.windll.gdi32 if IS_WINDOWS else None
kernel32 = ctypes.windll.kernel32 if IS_WINDOWS else None

BROWSER_PROCESS_NAMES = {"brave.exe", "chrome.exe", "firefox.exe", "msedge.exe", "opera.exe", "opera_gx.exe"}
TEST_POINT_PRESETS = {
    "center": (0.50, 0.50),
    "pre_zapadki": (0.50, 0.42),
    "top_center": (0.50, 0.12),
    "left_top_margin": (0.10, 0.10),
    "right_top_margin": (0.90, 0.10),
    "bottom_center": (0.50, 0.88),
}

SETTINGS_PATH = Path(__file__).with_name("margoclicker_v2_settings.json")
TEMPLATES_DIR = Path(__file__).with_name("templates")

DEFAULT_CONFIG: Dict[str, Any] = {
    "api_enabled": True,
    "use_virtual_mouse": True,
    "window_selection_mode": "auto",  # auto/title/process/picked
    "target_hwnd": 0,
    "target_pid": 0,
    "target_process_name": "",
    "target_window_title": "",
    "target_class_name": "",
    "target_monitor_index": -1,
    "target_title_hint": "margonem",
    "restore_window_before_click": True,
    "click_hold_ms_min": 60,
    "click_hold_ms_max": 130,
    "click_jitter_px": 3,
    "manual_offset_enabled": False,
    "manual_offset_y": 0.0,
    "cv_threshold": 0.84,
    "hotkey": "f9",
    "file_logging": False,
    "launch_command": "",
    "browser_url_hint": "",
    "appearance_mode": "dark",
    "disable_randomness": False,
}


config_lock = threading.Lock()
config: Dict[str, Any] = dict(DEFAULT_CONFIG)
runtime_state: Dict[str, Any] = {
    "paused": False,
    "log_hook": None,
    "last_click": None,
    "last_cv": None,
    "click_history": deque(maxlen=40),
    "last_candidates": [],
    "last_selected_candidate": None,
    "hotkey_registered": False,
    "hotkey_registered_key": "",
}


# =====================================================
# Flask / fallback
# =====================================================

if FLASK_AVAILABLE:
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})
else:

    class _DummyRequest:
        method = "GET"
        args: Dict[str, Any] = {}

    class _DummyApp:
        logger = logging.getLogger("margoclicker_v2_dummy")

        @staticmethod
        def route(*_args, **_kwargs):
            def decorator(func):
                return func

            return decorator

        @staticmethod
        def run(*_args, **_kwargs):
            return None

    def jsonify(payload):
        return payload

    def make_response(body, _code):
        return body

    def send_file(_path, **_kwargs):
        return "NOT_AVAILABLE"

    request = _DummyRequest()
    app = _DummyApp()


# =====================================================
# WinAPI structures
# =====================================================


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


# =====================================================
# Logging / config
# =====================================================


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
    append_log_to_file(line)


def _normalize_config(raw: Dict[str, Any]) -> Dict[str, Any]:
    normalized = dict(DEFAULT_CONFIG)
    normalized.update(raw or {})

    normalized["window_selection_mode"] = str(normalized.get("window_selection_mode", "auto")).lower().strip()
    if normalized["window_selection_mode"] not in {"auto", "title", "process", "picked"}:
        normalized["window_selection_mode"] = "auto"

    normalized["target_title_hint"] = str(normalized.get("target_title_hint", "margonem")).strip() or "margonem"
    normalized["target_process_name"] = str(normalized.get("target_process_name", "")).strip().lower()
    normalized["target_window_title"] = str(normalized.get("target_window_title", "")).strip()
    normalized["target_class_name"] = str(normalized.get("target_class_name", "")).strip()
    normalized["hotkey"] = str(normalized.get("hotkey", "f9")).strip().lower() or "f9"
    normalized["appearance_mode"] = str(normalized.get("appearance_mode", "dark")).strip().lower() or "dark"
    if normalized["appearance_mode"] not in {"dark", "light", "system"}:
        normalized["appearance_mode"] = "dark"

    for key in ["target_hwnd", "target_pid", "target_monitor_index", "click_hold_ms_min", "click_hold_ms_max", "click_jitter_px"]:
        normalized[key] = int(float(normalized.get(key, DEFAULT_CONFIG[key])))
    for key in ["manual_offset_y", "cv_threshold"]:
        normalized[key] = float(normalized.get(key, DEFAULT_CONFIG[key]))

    return normalized


def load_settings() -> None:
    if not SETTINGS_PATH.exists():
        return
    try:
        raw = json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
        with config_lock:
            config.clear()
            config.update(_normalize_config(raw if isinstance(raw, dict) else {}))
    except Exception as exc:
        log_event(f"Nie udało się wczytać ustawień: {exc}", "error")


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
    current = log_path.read_text(encoding="utf-8") if log_path.exists() else ""
    log_path.write_text(current + message + "\n", encoding="utf-8")


# =====================================================
# WinAPI helpers
# =====================================================


def setup_dpi_awareness() -> None:
    if not IS_WINDOWS:
        return
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(2)
        log_event("DPI awareness ustawione: Per Monitor v1")
    except Exception:
        try:
            ctypes.windll.user32.SetProcessDPIAware()
            log_event("DPI awareness ustawione: System")
        except Exception:
            log_event("Nie udało się ustawić DPI awareness", "warn")


def _is_valid_hwnd(hwnd: int) -> bool:
    if not IS_WINDOWS or user32 is None:
        return False
    return bool(hwnd and user32.IsWindow(hwnd))


def _rect_to_dict(rc: RECT) -> Dict[str, int]:
    return {"left": int(rc.left), "top": int(rc.top), "right": int(rc.right), "bottom": int(rc.bottom)}


def get_window_text(hwnd: int) -> str:
    if not _is_valid_hwnd(hwnd):
        return ""
    length = user32.GetWindowTextLengthW(hwnd)
    if length <= 0:
        return ""
    buff = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buff, length + 1)
    return buff.value.strip()


def get_class_name(hwnd: int) -> str:
    if not _is_valid_hwnd(hwnd):
        return ""
    buff = ctypes.create_unicode_buffer(256)
    user32.GetClassNameW(hwnd, buff, 255)
    return buff.value.strip()


def get_window_pid(hwnd: int) -> int:
    if not _is_valid_hwnd(hwnd):
        return 0
    pid = ctypes.c_ulong(0)
    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    return int(pid.value)


def get_process_name(pid: int) -> str:
    if not IS_WINDOWS or not pid:
        return ""
    PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
    hproc = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
    if not hproc:
        return ""
    try:
        size = ctypes.c_ulong(32768)
        buff = ctypes.create_unicode_buffer(size.value)
        ok = kernel32.QueryFullProcessImageNameW(hproc, 0, buff, ctypes.byref(size))
        if not ok:
            return ""
        return Path(buff.value).name.lower()
    finally:
        kernel32.CloseHandle(hproc)


def get_window_rect(hwnd: int) -> Optional[Dict[str, int]]:
    if not _is_valid_hwnd(hwnd):
        return None
    rc = RECT()
    if user32.GetWindowRect(hwnd, ctypes.byref(rc)) == 0:
        return None
    return _rect_to_dict(rc)


def get_client_rect(hwnd: int) -> Optional[Dict[str, int]]:
    if not _is_valid_hwnd(hwnd):
        return None
    rc = RECT()
    if user32.GetClientRect(hwnd, ctypes.byref(rc)) == 0:
        return None
    return _rect_to_dict(rc)


def get_client_origin(hwnd: int) -> Optional[Dict[str, int]]:
    if not _is_valid_hwnd(hwnd):
        return None
    pt = POINT(0, 0)
    if user32.ClientToScreen(hwnd, ctypes.byref(pt)) == 0:
        return None
    return {"x": int(pt.x), "y": int(pt.y)}


def client_to_screen(hwnd: int, client_x: int, client_y: int) -> Optional[Tuple[int, int]]:
    if not _is_valid_hwnd(hwnd):
        return None
    pt = POINT(int(client_x), int(client_y))
    if user32.ClientToScreen(hwnd, ctypes.byref(pt)) == 0:
        return None
    return int(pt.x), int(pt.y)


def screen_to_client(hwnd: int, screen_x: int, screen_y: int) -> Optional[Tuple[int, int]]:
    """
    KRYTYCZNE: endpoint /click dostaje absolutny punkt ekranu.
    SendMessage oczekuje punktu RELATYWNEGO do client area -> ScreenToClient.
    """
    if not _is_valid_hwnd(hwnd):
        return None
    pt = POINT(int(screen_x), int(screen_y))
    if user32.ScreenToClient(hwnd, ctypes.byref(pt)) == 0:
        return None
    return int(pt.x), int(pt.y)


def get_client_size(hwnd: int) -> Tuple[int, int]:
    rc = get_client_rect(hwnd)
    if not rc:
        return 0, 0
    return max(0, rc["right"] - rc["left"]), max(0, rc["bottom"] - rc["top"])


def ensure_window_ready(hwnd: int) -> bool:
    if not _is_valid_hwnd(hwnd):
        return False
    try:
        if user32.IsIconic(hwnd):
            user32.ShowWindow(hwnd, 9)  # SW_RESTORE
            time.sleep(0.07)
        with config_lock:
            should_restore = bool(config.get("restore_window_before_click", True))
        if should_restore:
            user32.SetForegroundWindow(hwnd)
        return True
    except Exception:
        return False


def monitor_info_from_window(hwnd: int) -> Tuple[int, str, Dict[str, int], Dict[str, int]]:
    if not _is_valid_hwnd(hwnd):
        return -1, "", {}, {}

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


# =====================================================
# Window discovery
# =====================================================


def score_window_candidate(candidate: WindowCandidate, cfg: Dict[str, Any]) -> Tuple[float, List[str]]:
    score = 0.0
    reasons: List[str] = []
    title_low = candidate.title.lower()
    hint = str(cfg.get("target_title_hint", "margonem")).lower().strip()

    if hint and hint in title_low:
        score += 120
        reasons.append("title_hint")
    if "margonem" in title_low:
        score += 80
        reasons.append("title_margonem")
    if candidate.process_name in BROWSER_PROCESS_NAMES:
        score += 60
        reasons.append("browser_process")
    process_hint = str(cfg.get("target_process_name", "")).lower().strip()
    if process_hint and process_hint in candidate.process_name:
        score += 90
        reasons.append("process_hint")
    if candidate.process_name == "brave.exe":
        score += 25
        reasons.append("brave_bonus")
    if candidate.title.lower().startswith("margoclicker"):
        score -= 180
        reasons.append("self_window_penalty")

    cw = candidate.client_rect["right"] - candidate.client_rect["left"]
    ch = candidate.client_rect["bottom"] - candidate.client_rect["top"]
    if cw > 700 and ch > 450:
        score += 20
        reasons.append("sensible_size")

    mode = cfg.get("window_selection_mode", "auto")
    if mode == "picked":
        if cfg.get("target_pid") and candidate.pid == int(cfg.get("target_pid", 0)):
            score += 100
            reasons.append("picked_pid")
    elif mode == "process":
        proc = str(cfg.get("target_process_name", "")).lower().strip()
        if proc and proc == candidate.process_name:
            score += 150
            reasons.append("process_mode")
    elif mode == "title":
        title = str(cfg.get("target_window_title", "")).lower().strip()
        if title and title in title_low:
            score += 150
            reasons.append("title_mode")

    target_monitor = int(cfg.get("target_monitor_index", -1))
    if target_monitor >= 0 and candidate.monitor_index == target_monitor:
        score += 20
        reasons.append("target_monitor")

    return score, reasons


def list_window_candidates() -> List[WindowCandidate]:
    if not IS_WINDOWS:
        return []

    candidates: List[WindowCandidate] = []
    CALLBACK = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)

    def enum_handler(hwnd, _lparam):
        hwnd = int(hwnd)
        if not user32.IsWindowVisible(hwnd):
            return True
        title = get_window_text(hwnd)
        if not title:
            return True
        wr = get_window_rect(hwnd)
        cr = get_client_rect(hwnd)
        co = get_client_origin(hwnd)
        if not wr or not cr or not co:
            return True
        cw = cr["right"] - cr["left"]
        ch = cr["bottom"] - cr["top"]
        if cw <= 0 or ch <= 0:
            return True

        pid = get_window_pid(hwnd)
        proc = get_process_name(pid)
        cls = get_class_name(hwnd)
        midx, mname, mrect, wrect = monitor_info_from_window(hwnd)

        candidates.append(
            WindowCandidate(
                hwnd=hwnd,
                title=title,
                class_name=cls,
                pid=pid,
                process_name=proc,
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

    user32.EnumWindows(CALLBACK(enum_handler), 0)

    with config_lock:
        cfg = dict(config)

    for candidate in candidates:
        candidate.score, candidate.reasons = score_window_candidate(candidate, cfg)

    candidates.sort(key=lambda c: c.score, reverse=True)
    runtime_state["last_candidates"] = [asdict(c) for c in candidates]
    return candidates


def resolve_target_window() -> Optional[int]:
    if not IS_WINDOWS:
        return None

    with config_lock:
        cfg = dict(config)

    saved_hwnd = int(cfg.get("target_hwnd", 0))
    saved_pid = int(cfg.get("target_pid", 0))

    if saved_hwnd and _is_valid_hwnd(saved_hwnd):
        if not saved_pid or get_window_pid(saved_hwnd) == saved_pid:
            return saved_hwnd

    for candidate in list_window_candidates():
        if saved_pid and candidate.pid == saved_pid:
            with config_lock:
                config["target_hwnd"] = candidate.hwnd
            runtime_state["last_selected_candidate"] = asdict(candidate)
            return candidate.hwnd

    candidates = list_window_candidates()
    if not candidates:
        return None

    best = candidates[0]
    with config_lock:
        config["target_hwnd"] = best.hwnd
        config["target_pid"] = best.pid
        config["target_process_name"] = best.process_name
        config["target_window_title"] = best.title
        config["target_class_name"] = best.class_name
        config["target_monitor_index"] = best.monitor_index
    runtime_state["last_selected_candidate"] = asdict(best)
    return best.hwnd


def pick_window_under_cursor() -> Optional[WindowCandidate]:
    if not IS_WINDOWS:
        return None

    time.sleep(3.0)
    pt = POINT()
    if user32.GetCursorPos(ctypes.byref(pt)) == 0:
        return None

    hwnd = user32.WindowFromPoint(pt)
    if not hwnd:
        return None

    hwnd = user32.GetAncestor(hwnd, 2) or hwnd  # GA_ROOT
    candidates = list_window_candidates()
    for candidate in candidates:
        if candidate.hwnd == int(hwnd):
            with config_lock:
                config["window_selection_mode"] = "picked"
                config["target_hwnd"] = candidate.hwnd
                config["target_pid"] = candidate.pid
                config["target_process_name"] = candidate.process_name
                config["target_window_title"] = candidate.title
                config["target_class_name"] = candidate.class_name
                config["target_monitor_index"] = candidate.monitor_index
            save_settings()
            runtime_state["last_selected_candidate"] = asdict(candidate)
            return candidate
    return None


# =====================================================
# Click execution
# =====================================================


def make_lparam(x: int, y: int) -> int:
    return ((y & 0xFFFF) << 16) | (x & 0xFFFF)


def virtual_click(hwnd: int, client_x: int, client_y: int, hold_ms: Optional[int] = None) -> bool:
    """Kliknięcie w tle po relatywnym punkcie client-area HWND."""
    if not _is_valid_hwnd(hwnd):
        return False

    with config_lock:
        hold_min = int(config.get("click_hold_ms_min", 60))
        hold_max = int(config.get("click_hold_ms_max", 130))
    if hold_max < hold_min:
        hold_min, hold_max = hold_max, hold_min

    real_hold = hold_ms if hold_ms is not None else random.randint(max(1, hold_min), max(1, hold_max))

    WM_MOUSEMOVE = 0x0200
    WM_LBUTTONDOWN = 0x0201
    WM_LBUTTONUP = 0x0202
    MK_LBUTTON = 0x0001

    lp = make_lparam(client_x, client_y)
    user32.SendMessageW(hwnd, WM_MOUSEMOVE, 0, lp)
    user32.SendMessageW(hwnd, WM_LBUTTONDOWN, MK_LBUTTON, lp)
    time.sleep(max(1, real_hold) / 1000.0)
    user32.SendMessageW(hwnd, WM_LBUTTONUP, 0, lp)
    return True


def physical_click(screen_x: int, screen_y: int) -> bool:
    if pyautogui is None:
        return False
    with config_lock:
        disable_randomness = bool(config.get("disable_randomness", False))

    if disable_randomness:
        pyautogui.moveTo(screen_x, screen_y, duration=0)
        pyautogui.click()
        return True

    pyautogui.moveTo(screen_x + random.uniform(-2, 2), screen_y + random.uniform(-2, 2), duration=random.uniform(0.06, 0.18))
    pyautogui.click()
    return True


def do_click_absolute(screen_x: int, screen_y: int, label: str = "api") -> Tuple[bool, str, Dict[str, Any]]:
    """
    Wejście: absolutne współrzędne ekranu z JS / API.
    Gdy aktywna myszka wirtualna -> ScreenToClient i dopiero SendMessage.
    """
    hwnd = resolve_target_window()
    if not hwnd:
        return False, "NO_TARGET_WINDOW", {}

    ensure_window_ready(hwnd)

    with config_lock:
        use_virtual = bool(config.get("use_virtual_mouse", True))
        manual_offset_enabled = bool(config.get("manual_offset_enabled", False))
        offset_y = float(config.get("manual_offset_y", 0.0))

    x = int(screen_x)
    y = int(screen_y + (offset_y if manual_offset_enabled else 0.0))

    if use_virtual:
        client_pt = screen_to_client(hwnd, x, y)
        if not client_pt:
            return False, "SCREEN_TO_CLIENT_FAILED", {"screen_x": x, "screen_y": y}

        cw, ch = get_client_size(hwnd)
        cx = max(0, min(client_pt[0], max(0, cw - 1)))
        cy = max(0, min(client_pt[1], max(0, ch - 1)))

        with config_lock:
            jitter_px = max(0, int(config.get("click_jitter_px", 3)))

        if jitter_px > 0:
            cx = max(0, min(cx + random.randint(-jitter_px, jitter_px), max(0, cw - 1)))
            cy = max(0, min(cy + random.randint(-jitter_px, jitter_px), max(0, ch - 1)))

        ok = virtual_click(hwnd, cx, cy)
        payload = {
            "mode": "virtual",
            "label": label,
            "hwnd": hwnd,
            "screen_x": x,
            "screen_y": y,
            "client_x": cx,
            "client_y": cy,
            "client_size": {"width": cw, "height": ch},
        }
    else:
        ok = physical_click(x, y)
        payload = {
            "mode": "pyautogui",
            "label": label,
            "hwnd": hwnd,
            "screen_x": x,
            "screen_y": y,
        }

    runtime_state["last_click"] = payload
    runtime_state["click_history"].append({"ts": time.time(), **payload})
    return ok, ("OK" if ok else "CLICK_FAILED"), payload


def click_in_game_client(client_x: float, client_y: float, label: str = "client") -> Tuple[bool, str, Dict[str, Any]]:
    hwnd = resolve_target_window()
    if not hwnd:
        return False, "NO_TARGET_WINDOW", {}

    ensure_window_ready(hwnd)
    cw, ch = get_client_size(hwnd)
    if cw <= 0 or ch <= 0:
        return False, "NO_CLIENT_AREA", {}

    with config_lock:
        manual_offset_enabled = bool(config.get("manual_offset_enabled", False))
        offset_y = float(config.get("manual_offset_y", 0.0))

    cx = max(0, min(int(round(client_x)), cw - 1))
    cy_raw = float(client_y) + (offset_y if manual_offset_enabled else 0.0)
    cy = max(0, min(int(round(cy_raw)), ch - 1))
    screen_pt = client_to_screen(hwnd, cx, cy)

    with config_lock:
        use_virtual = bool(config.get("use_virtual_mouse", True))

    if use_virtual:
        ok = virtual_click(hwnd, cx, cy)
    else:
        ok = physical_click(screen_pt[0], screen_pt[1]) if screen_pt else False

    payload = {
        "mode": "virtual" if use_virtual else "pyautogui",
        "label": label,
        "hwnd": hwnd,
        "client_x": cx,
        "client_y": cy,
        "offset_applied_y": offset_y if manual_offset_enabled else 0.0,
        "screen_x": screen_pt[0] if screen_pt else None,
        "screen_y": screen_pt[1] if screen_pt else None,
    }
    runtime_state["last_click"] = payload
    runtime_state["click_history"].append({"ts": time.time(), **payload})
    return ok, ("OK" if ok else "CLICK_FAILED"), payload


# =====================================================
# Computer Vision
# =====================================================


def capture_window_client_bgr(hwnd: int) -> Optional[np.ndarray]:
    """Przechwycenie client-area przez PrintWindow(PW_CLIENTONLY) także dla okna w tle."""
    if not (_is_valid_hwnd(hwnd) and cv2 is not None and np is not None and gdi32 is not None):
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


def capture_client_area_to_file(hwnd: int) -> Optional[Path]:
    frame = capture_window_client_bgr(hwnd)
    if frame is None or cv2 is None:
        return None
    out_path = SETTINGS_PATH.with_name(f"client_area_{int(time.time())}.png")
    cv2.imwrite(str(out_path), frame)
    return out_path


def find_template_and_click(template_name: str) -> Tuple[bool, str, Dict[str, Any]]:
    if cv2 is None or np is None:
        return False, "DEPENDENCY_MISSING_CV", {}

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
    cx = int(max_loc[0] + (w / 2) + random.randint(-5, 5))
    cy = int(max_loc[1] + (h / 2) + random.randint(-5, 5))

    ok = virtual_click(hwnd, cx, cy)
    screen_pt = client_to_screen(hwnd, cx, cy)

    payload = {
        "ok": ok,
        "template": template_name,
        "score": float(max_val),
        "threshold": threshold,
        "client_x": cx,
        "client_y": cy,
        "screen_x": screen_pt[0] if screen_pt else None,
        "screen_y": screen_pt[1] if screen_pt else None,
    }
    runtime_state["last_cv"] = payload
    return ok, ("OK" if ok else "CLICK_FAILED"), payload


# =====================================================
# Diagnostics
# =====================================================


def export_diagnostics_json() -> Path:
    with config_lock:
        cfg = dict(config)
    payload = {
        "config": cfg,
        "last_selected_candidate": runtime_state.get("last_selected_candidate"),
        "last_candidates": runtime_state.get("last_candidates"),
        "last_click": runtime_state.get("last_click"),
        "last_cv": runtime_state.get("last_cv"),
        "click_history": list(runtime_state.get("click_history", [])),
    }
    path = SETTINGS_PATH.with_name(f"diagnostics_{int(time.time())}.json")
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


# =====================================================
# Hotkey / emergency pause
# =====================================================


def toggle_pause_from_hotkey() -> None:
    runtime_state["paused"] = not bool(runtime_state.get("paused"))
    state = "ZATRZYMANY (F9)" if runtime_state["paused"] else "AKTYWNY"
    log_event(f"Hotkey -> STATUS: {state}", "warn" if runtime_state["paused"] else "info")


def register_hotkey() -> None:
    if keyboard is None:
        log_event("Brak modułu 'keyboard' -> globalny hotkey wyłączony.", "warn")
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
        log_event(f"Nie udało się aktywować hotkey '{hotkey}': {exc}", "error")


# =====================================================
# API routes
# =====================================================


def _api_blocked_response() -> Tuple[Any, int]:
    return jsonify({"ok": False, "status": "PAUSED", "message": "Bot zatrzymany (F9)"}), 423


@app.route("/health", methods=["GET"])
def health() -> Tuple[str, int]:
    return "OK", 200


@app.route("/fullscreen", methods=["GET", "POST", "OPTIONS"])
def fullscreen_route():
    if request.method == "OPTIONS":
        return make_response("", 200)
    hwnd = resolve_target_window()
    if not hwnd:
        return jsonify({"ok": False, "status": "NO_WINDOW"}), 404
    try:
        ensure_window_ready(hwnd)
        user32.keybd_event(0x7A, 0, 0, 0)  # F11 down
        time.sleep(0.02)
        user32.keybd_event(0x7A, 0, 0x0002, 0)  # F11 up
        return jsonify({"ok": True, "status": "OK"}), 200
    except Exception as exc:
        return jsonify({"ok": False, "status": "ERROR", "error": str(exc)}), 500


def launch_configured_target() -> Tuple[bool, str]:
    with config_lock:
        cmd = str(config.get("launch_command", "")).strip()
        url_hint = str(config.get("browser_url_hint", "")).strip() or "https://www.margonem.pl/"
    if cmd:
        try:
            subprocess.Popen(cmd, shell=True)
            return True, "OK"
        except Exception as exc:
            return False, f"ERROR: {exc}"

    if not IS_WINDOWS:
        return False, "NO_LAUNCH_COMMAND"

    fallback_commands = [
        f'start "" brave "{url_hint}"',
        f'start "" chrome "{url_hint}"',
        f'start "" msedge "{url_hint}"',
    ]
    for fallback_cmd in fallback_commands:
        try:
            subprocess.Popen(fallback_cmd, shell=True)
            return True, f"OK_FALLBACK ({fallback_cmd})"
        except Exception:
            continue
    return False, "NO_LAUNCH_COMMAND"


@app.route("/launch", methods=["POST", "OPTIONS"])
def launch_route():
    if request.method == "OPTIONS":
        return make_response("", 200)
    ok, status = launch_configured_target()
    if ok:
        return jsonify({"ok": True, "status": status}), 200
    return jsonify({"ok": False, "status": status}), 400


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
        ax = request.args.get("ax")
        ay = request.args.get("ay")

        # kompatybilność ze "starą" wersją: klik client-area (vx,vy)
        if vx is not None and vy is not None:
            ok, status, payload = click_in_game_client(float(vx), float(vy), label="api_v")
            if ok:
                log_event(f"Klik API(vx/vy): {payload}", "click")
            else:
                log_event(f"Klik API(vx/vy) NIEUDANY: {status} | {payload}", "error")
            return jsonify({"ok": ok, "status": status, "payload": payload}), (200 if ok else 404)

        # kompatybilność: ax/ay traktowane jak absolutne
        if ax is not None and ay is not None:
            ok, status, payload = do_click_absolute(int(float(ax)), int(float(ay)), label="api_abs")
            return jsonify({"ok": ok, "status": status, "payload": payload}), (200 if ok else 404)

        # standard: x/y absolutne
        x = int(float(request.args.get("x")))
        y = int(float(request.args.get("y")))
    except Exception:
        return jsonify({"ok": False, "status": "BAD_ARGS", "example": "/click?x=1200&y=800"}), 400

    ok, status, payload = do_click_absolute(x, y, label="api_click")
    if ok:
        log_event(f"Klik API: screen=({x},{y}) -> {payload}", "click")
    else:
        log_event(f"Klik API NIEUDANY: {status} | payload={payload}", "error")
    return jsonify({"ok": ok, "status": status, "payload": payload}), (200 if ok else 404)


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
    if ok:
        log_event(f"CV trafienie: {template_name} | {payload}", "click")
    else:
        log_event(f"CV brak: {template_name} | {status} | {payload}", "warn")
    return jsonify({"ok": ok, "status": status, "payload": payload}), (200 if ok else 404)


notifier = ToastNotifier()


@app.route("/alert", methods=["GET", "OPTIONS"])
def alert_route():
    if request.method == "OPTIONS":
        return make_response("", 200)

    msg = str(request.args.get("msg", "Alert z MargoClicker")).replace("_", " ")
    try:
        notifier.show_toast("MargoClicker", msg, duration=4, threaded=True)
    except Exception:
        pass
    log_event(f"Toast: {msg}", "warn")
    return jsonify({"ok": True, "status": "OK", "message": msg}), 200


@app.route("/debug/window", methods=["GET"])
def debug_window_route():
    hwnd = resolve_target_window()
    if not hwnd:
        return jsonify({"ok": False, "status": "NO_WINDOW"}), 404
    return jsonify(
        {
            "ok": True,
            "status": "OK",
            "hwnd": hwnd,
            "title": get_window_text(hwnd),
            "class": get_class_name(hwnd),
            "pid": get_window_pid(hwnd),
            "client_rect": get_client_rect(hwnd),
            "window_rect": get_window_rect(hwnd),
            "client_origin": get_client_origin(hwnd),
            "selected_candidate": runtime_state.get("last_selected_candidate"),
        }
    )


@app.route("/debug/candidates", methods=["GET"])
def debug_candidates_route():
    candidates = [asdict(c) for c in list_window_candidates()]
    return jsonify({"ok": True, "status": "OK", "count": len(candidates), "candidates": candidates})


@app.route("/debug/screenshot", methods=["GET"])
def debug_screenshot_route():
    hwnd = resolve_target_window()
    if not hwnd:
        return jsonify({"ok": False, "status": "NO_WINDOW"}), 404
    path = capture_client_area_to_file(hwnd)
    if not path or not path.exists():
        return jsonify({"ok": False, "status": "CAPTURE_FAILED"}), 500
    return send_file(path, mimetype="image/png")


@app.route("/test_points", methods=["POST", "GET"])
def test_points_route():
    hwnd = resolve_target_window()
    if not hwnd:
        return jsonify({"ok": False, "status": "NO_WINDOW"}), 404
    cw, ch = get_client_size(hwnd)
    if cw <= 0 or ch <= 0:
        return jsonify({"ok": False, "status": "NO_CLIENT_AREA"}), 404

    results = []
    for name, (rx, ry) in TEST_POINT_PRESETS.items():
        ok, status, payload = click_in_game_client(cw * rx, ch * ry, label=f"test_{name}")
        results.append({"name": name, "ok": ok, "status": status, "payload": payload})
        time.sleep(0.11)
    return jsonify({"ok": True, "status": "OK", "results": results})


@app.route("/debug/export", methods=["GET"])
def export_route():
    path = export_diagnostics_json()
    return jsonify({"ok": True, "status": "OK", "path": str(path)})


# =====================================================
# GUI (CustomTkinter)
# =====================================================


def launch_gui() -> None:
    with config_lock:
        appearance_mode = str(config.get("appearance_mode", "dark")).strip().lower() or "dark"
    ctk.set_appearance_mode(appearance_mode)
    ctk.set_default_color_theme("dark-blue")

    root = ctk.CTk()
    root.title("MargoClicker v2")
    root.geometry("1420x920")
    root.minsize(980, 680)

    if not USING_CUSTOMTKINTER:
        log_event("CustomTkinter nie znaleziony -> GUI w trybie zgodności tkinter.", "warn")

    with config_lock:
        cfg = dict(config)

    api_var = ctk.BooleanVar(value=bool(cfg.get("api_enabled", True)))
    virtual_var = ctk.BooleanVar(value=bool(cfg.get("use_virtual_mouse", True)))
    mode_var = ctk.StringVar(value=str(cfg.get("window_selection_mode", "auto")))
    title_hint_var = ctk.StringVar(value=str(cfg.get("target_title_hint", "margonem")))
    process_hint_var = ctk.StringVar(value=str(cfg.get("target_process_name", "")))
    hold_min_var = ctk.StringVar(value=str(cfg.get("click_hold_ms_min", 60)))
    hold_max_var = ctk.StringVar(value=str(cfg.get("click_hold_ms_max", 130)))
    jitter_var = ctk.StringVar(value=str(cfg.get("click_jitter_px", 3)))
    hotkey_var = ctk.StringVar(value=str(cfg.get("hotkey", "f9")))
    threshold_var = ctk.StringVar(value=str(cfg.get("cv_threshold", 0.84)))
    offset_enabled_var = ctk.BooleanVar(value=bool(cfg.get("manual_offset_enabled", False)))
    offset_y_var = ctk.StringVar(value=str(cfg.get("manual_offset_y", 0.0)))
    file_log_var = ctk.BooleanVar(value=bool(cfg.get("file_logging", False)))
    restore_var = ctk.BooleanVar(value=bool(cfg.get("restore_window_before_click", True)))
    disable_random_var = ctk.BooleanVar(value=bool(cfg.get("disable_randomness", False)))
    launch_cmd_var = ctk.StringVar(value=str(cfg.get("launch_command", "")))
    browser_url_var = ctk.StringVar(value=str(cfg.get("browser_url_hint", "")))
    appearance_var = ctk.StringVar(value=str(cfg.get("appearance_mode", "dark")))

    main = ctk.CTkFrame(root)
    main.pack(fill="both", expand=True, padx=16, pady=14)

    top_row = ctk.CTkFrame(main)
    top_row.pack(fill="x", padx=10, pady=(8, 6))
    top_status = ctk.CTkLabel(top_row, text="STATUS: AKTYWNY", font=("Segoe UI", 20, "bold"), anchor="w")
    top_status.pack(side="left", fill="x", expand=True, padx=(6, 8), pady=(6, 4))

    tabview = ctk.CTkTabview(main, width=1380, height=830)
    tabview.pack(fill="both", expand=True, padx=8, pady=8)

    tab_dashboard = tabview.add("Dashboard")
    tab_tools = tabview.add("Testowanie & Narzędzia")
    tab_settings = tabview.add("Ustawienia")

    def toggle_active_from_gui() -> None:
        runtime_state["paused"] = not bool(runtime_state.get("paused"))
        state = "ZATRZYMANY" if runtime_state["paused"] else "AKTYWNY"
        log_event(f"GUI -> STATUS: {state}", "warn" if runtime_state["paused"] else "info")

    def launch_browser_from_gui() -> None:
        ok, status = launch_configured_target()
        log_event(f"LAUNCH -> {status}", "info" if ok else "error")

    ctk.CTkButton(top_row, text="Aktywuj / Pauza", command=toggle_active_from_gui).pack(side="right", padx=6, pady=6)
    ctk.CTkButton(top_row, text="Uruchom Brave + Margonem", command=launch_browser_from_gui).pack(side="right", padx=6, pady=6)

    # ---------- Dashboard ----------
    controls = ctk.CTkFrame(tab_dashboard)
    controls.pack(fill="x", padx=12, pady=(12, 8))

    left = ctk.CTkFrame(controls)
    left.pack(side="left", fill="both", expand=True, padx=(8, 4), pady=8)
    right = ctk.CTkFrame(controls)
    right.pack(side="left", fill="both", expand=True, padx=(4, 8), pady=8)

    ctk.CTkLabel(left, text="Tryb API", font=("Segoe UI", 16, "bold")).pack(anchor="w", padx=12, pady=(10, 4))
    ctk.CTkSwitch(left, text="Nasłuchiwanie API", variable=api_var).pack(anchor="w", padx=12)
    ctk.CTkSwitch(left, text="Wirtualna myszka (SendMessage)", variable=virtual_var).pack(anchor="w", padx=12, pady=(4, 0))
    ctk.CTkSwitch(left, text="Przywracaj / aktywuj okno", variable=restore_var).pack(anchor="w", padx=12, pady=(4, 0))

    ctk.CTkLabel(left, text="Tryb wyboru okna").pack(anchor="w", padx=12, pady=(10, 0))
    ctk.CTkOptionMenu(left, variable=mode_var, values=["auto", "title", "process", "picked"]).pack(anchor="w", padx=12, pady=(0, 6))

    ctk.CTkLabel(left, text="Podpowiedź tytułu (auto/title)").pack(anchor="w", padx=12)
    ctk.CTkEntry(left, textvariable=title_hint_var, width=360).pack(anchor="w", padx=12, pady=(0, 6))

    ctk.CTkLabel(left, text="Podpowiedź procesu (process)").pack(anchor="w", padx=12)
    ctk.CTkEntry(left, textvariable=process_hint_var, width=360).pack(anchor="w", padx=12, pady=(0, 10))

    ctk.CTkLabel(right, text="Szybkie akcje", font=("Segoe UI", 16, "bold")).pack(anchor="w", padx=12, pady=(10, 4))
    ctk.CTkButton(right, text="Odśwież listę okien", command=lambda: refresh_candidates()).pack(anchor="w", padx=12, pady=4)
    ctk.CTkButton(right, text="Wybierz okno pod kursorem (3s)", command=lambda: pick_window_gui()).pack(anchor="w", padx=12, pady=4)
    ctk.CTkButton(right, text="Pokaż ostatni klik", command=lambda: log_event(f"Ostatni klik: {runtime_state.get('last_click')}")).pack(anchor="w", padx=12, pady=4)

    candidates_box = ctk.CTkTextbox(tab_dashboard, width=1340, height=190)
    candidates_box.pack(fill="x", padx=12, pady=(0, 8))

    log_box = ctk.CTkTextbox(tab_dashboard, width=1340, height=410)
    log_box.pack(fill="both", expand=True, padx=12, pady=(0, 12))
    try:
        log_box.tag_config("error", foreground="#ef4444")
        log_box.tag_config("click", foreground="#22c55e")
        log_box.tag_config("warn", foreground="#f59e0b")
        log_box.tag_config("info", foreground="#d1d5db")
    except Exception:
        pass

    def gui_log(message: str, level: str = "info") -> None:
        tag = level if level in {"error", "click", "warn", "info"} else "info"
        log_box.insert("end", message + "\n", tag)
        log_box.see("end")

    runtime_state["log_hook"] = gui_log

    def refresh_candidates() -> None:
        candidates = list_window_candidates()
        candidates_box.delete("1.0", "end")
        if not candidates:
            candidates_box.insert("end", "Brak wykrytych kandydatów okna.\n")
            return
        for idx, c in enumerate(candidates[:20], start=1):
            cw = c.client_rect["right"] - c.client_rect["left"]
            ch = c.client_rect["bottom"] - c.client_rect["top"]
            line = (
                f"{idx:02d}. hwnd={c.hwnd} | pid={c.pid} | proc={c.process_name} | score={c.score:.1f} | "
                f"client={cw}x{ch} | title={c.title}\n"
            )
            candidates_box.insert("end", line)

    def pick_window_gui() -> None:
        log_event("Masz 3 sekundy aby najechać kursorem na docelowe okno...", "warn")

        def worker() -> None:
            selected = pick_window_under_cursor()
            if selected:
                log_event(
                    f"Wybrane okno: hwnd={selected.hwnd} pid={selected.pid} proc={selected.process_name} title={selected.title}",
                    "info",
                )
                refresh_candidates()
            else:
                log_event("Nie udało się wybrać okna pod kursorem.", "error")

        threading.Thread(target=worker, daemon=True).start()

    # ---------- Tools ----------
    trow1 = ctk.CTkFrame(tab_tools)
    trow1.pack(fill="x", padx=12, pady=(12, 6))

    ctk.CTkLabel(trow1, text="Klik absolutny (x,y)", font=("Segoe UI", 15, "bold")).pack(side="left", padx=8)
    test_x_var = ctk.StringVar(value="1200")
    test_y_var = ctk.StringVar(value="800")
    ctk.CTkEntry(trow1, textvariable=test_x_var, width=120).pack(side="left", padx=4)
    ctk.CTkEntry(trow1, textvariable=test_y_var, width=120).pack(side="left", padx=4)

    def test_abs_click() -> None:
        try:
            x = int(float(test_x_var.get()))
            y = int(float(test_y_var.get()))
        except ValueError:
            log_event("Błędne x/y testu", "error")
            return
        ok, status, payload = do_click_absolute(x, y, label="gui_test_abs")
        log_event(f"TEST ABS -> {status} | {payload}", "click" if ok else "error")

    ctk.CTkButton(trow1, text="Test kliknięcia", command=test_abs_click).pack(side="left", padx=8)

    trow2 = ctk.CTkFrame(tab_tools)
    trow2.pack(fill="x", padx=12, pady=6)
    ctk.CTkLabel(trow2, text="Klik client-area (vx,vy)", font=("Segoe UI", 15, "bold")).pack(side="left", padx=8)
    test_vx_var = ctk.StringVar(value="500")
    test_vy_var = ctk.StringVar(value="350")
    ctk.CTkEntry(trow2, textvariable=test_vx_var, width=120).pack(side="left", padx=4)
    ctk.CTkEntry(trow2, textvariable=test_vy_var, width=120).pack(side="left", padx=4)

    def test_client_click() -> None:
        try:
            vx = float(test_vx_var.get())
            vy = float(test_vy_var.get())
        except ValueError:
            log_event("Błędne vx/vy testu", "error")
            return
        ok, status, payload = click_in_game_client(vx, vy, label="gui_test_client")
        log_event(f"TEST CLIENT -> {status} | {payload}", "click" if ok else "error")

    ctk.CTkButton(trow2, text="Test client click", command=test_client_click).pack(side="left", padx=8)

    trow3 = ctk.CTkFrame(tab_tools)
    trow3.pack(fill="x", padx=12, pady=6)
    ctk.CTkLabel(trow3, text="Presety testowe", font=("Segoe UI", 15, "bold")).pack(side="left", padx=8)

    def run_preset(name: str) -> None:
        hwnd = resolve_target_window()
        if not hwnd:
            log_event("Brak okna dla presetu", "error")
            return
        cw, ch = get_client_size(hwnd)
        rx, ry = TEST_POINT_PRESETS[name]
        ok, status, payload = click_in_game_client(cw * rx, ch * ry, label=f"gui_{name}")
        log_event(f"PRESET {name} -> {status} | {payload}", "click" if ok else "error")

    for preset_name in TEST_POINT_PRESETS.keys():
        ctk.CTkButton(trow3, text=preset_name, command=lambda n=preset_name: run_preset(n)).pack(side="left", padx=4)

    trow4 = ctk.CTkFrame(tab_tools)
    trow4.pack(fill="x", padx=12, pady=6)
    ctk.CTkLabel(trow4, text="Computer Vision Test", font=("Segoe UI", 15, "bold")).pack(side="left", padx=8)
    cv_img_var = ctk.StringVar(value="zapadka.png")
    ctk.CTkEntry(trow4, textvariable=cv_img_var, width=220).pack(side="left", padx=4)

    def cv_test() -> None:
        ok, status, payload = find_template_and_click(cv_img_var.get().strip())
        log_event(f"CV TEST -> {status} | {payload}", "click" if ok else "warn")

    ctk.CTkButton(trow4, text="Find & Click", command=cv_test).pack(side="left", padx=8)

    def save_screenshot_debug() -> None:
        hwnd = resolve_target_window()
        if not hwnd:
            log_event("Brak okna do screenshotu", "error")
            return
        path = capture_client_area_to_file(hwnd)
        if path:
            log_event(f"Zapisano screenshot client-area: {path.name}", "info")
        else:
            log_event("Nie udało się zapisać screenshotu client-area", "error")

    ctk.CTkButton(trow4, text="Screenshot client-area", command=save_screenshot_debug).pack(side="left", padx=8)

    trow5 = ctk.CTkFrame(tab_tools)
    trow5.pack(fill="x", padx=12, pady=6)
    ctk.CTkButton(trow5, text="Eksport diagnostyki JSON", command=lambda: log_event(f"Eksport: {export_diagnostics_json()}"))\
        .pack(side="left", padx=8)
    ctk.CTkButton(trow5, text="Toast test", command=lambda: alert_route()).pack(side="left", padx=8)

    # ---------- Settings ----------
    sgrid = ctk.CTkFrame(tab_settings)
    sgrid.pack(fill="x", padx=12, pady=(12, 10))

    def add_label_entry(row: int, label: str, var, width: int = 140) -> None:
        ctk.CTkLabel(sgrid, text=label).grid(row=row, column=0, sticky="w", padx=8, pady=6)
        ctk.CTkEntry(sgrid, textvariable=var, width=width).grid(row=row, column=1, sticky="w", padx=8, pady=6)

    add_label_entry(0, "Hold min [ms]", hold_min_var)
    add_label_entry(1, "Hold max [ms]", hold_max_var)
    add_label_entry(2, "Jitter [px]", jitter_var)
    add_label_entry(3, "CV threshold", threshold_var)
    add_label_entry(4, "Hotkey", hotkey_var)
    add_label_entry(5, "Manual offset Y", offset_y_var)
    add_label_entry(6, "Launch command", launch_cmd_var, width=480)
    add_label_entry(7, "Browser URL hint", browser_url_var, width=480)

    ctk.CTkSwitch(sgrid, text="Manual offset włączony", variable=offset_enabled_var).grid(row=0, column=2, sticky="w", padx=8)
    ctk.CTkSwitch(sgrid, text="Logi do pliku", variable=file_log_var).grid(row=1, column=2, sticky="w", padx=8)
    ctk.CTkSwitch(sgrid, text="Bez losowości (pyautogui)", variable=disable_random_var).grid(row=2, column=2, sticky="w", padx=8)
    ctk.CTkLabel(sgrid, text="Tryb wyglądu").grid(row=3, column=2, sticky="w", padx=8, pady=(6, 0))
    ctk.CTkOptionMenu(sgrid, variable=appearance_var, values=["dark", "light", "system"]).grid(row=4, column=2, sticky="w", padx=8)

    def save_from_gui() -> None:
        try:
            parsed_hold_min = int(float(hold_min_var.get()))
            parsed_hold_max = int(float(hold_max_var.get()))
            parsed_jitter = int(float(jitter_var.get()))
            parsed_thr = float(threshold_var.get())
            parsed_offset = float(offset_y_var.get())
        except ValueError:
            log_event("Niepoprawne wartości numeryczne w Ustawieniach", "error")
            return

        with config_lock:
            config["api_enabled"] = bool(api_var.get())
            config["use_virtual_mouse"] = bool(virtual_var.get())
            config["window_selection_mode"] = mode_var.get().strip() or "auto"
            config["target_title_hint"] = title_hint_var.get().strip() or "margonem"
            config["target_process_name"] = process_hint_var.get().strip().lower()
            config["click_hold_ms_min"] = parsed_hold_min
            config["click_hold_ms_max"] = parsed_hold_max
            config["click_jitter_px"] = parsed_jitter
            config["cv_threshold"] = parsed_thr
            config["hotkey"] = hotkey_var.get().strip().lower() or "f9"
            config["manual_offset_enabled"] = bool(offset_enabled_var.get())
            config["manual_offset_y"] = parsed_offset
            config["file_logging"] = bool(file_log_var.get())
            config["restore_window_before_click"] = bool(restore_var.get())
            config["disable_randomness"] = bool(disable_random_var.get())
            config["launch_command"] = launch_cmd_var.get().strip()
            config["browser_url_hint"] = browser_url_var.get().strip()
            config["appearance_mode"] = appearance_var.get().strip().lower() or "dark"

        save_settings()
        ctk.set_appearance_mode(str(config.get("appearance_mode", "dark")))
        register_hotkey()
        log_event("Ustawienia zapisane", "info")

    ctk.CTkButton(tab_settings, text="Zapisz ustawienia", command=save_from_gui).pack(anchor="w", padx=12, pady=12)

    def sync_status() -> None:
        paused = bool(runtime_state.get("paused"))
        top_status.configure(
            text=(
                f"STATUS: ZATRZYMANY ({str(config.get('hotkey', 'f9')).upper()})"
                if paused
                else "STATUS: AKTYWNY"
            )
        )
        root.after(200, sync_status)

    def on_resize(event) -> None:
        if event.widget is not root:
            return
        scale = max(0.78, min(1.0, event.width / 1420.0))
        if USING_CUSTOMTKINTER:
            try:
                ctk.set_widget_scaling(scale)
            except Exception:
                pass
        elif hasattr(root, "tk"):
            try:
                root.tk.call("tk", "scaling", max(1.0, 1.25 * scale))
            except Exception:
                pass

    refresh_candidates()
    sync_status()
    root.bind("<Configure>", on_resize)
    root.mainloop()


# =====================================================
# Bootstrap
# =====================================================


def configure_logging() -> None:
    logging.getLogger("werkzeug").setLevel(logging.ERROR)
    app.logger.setLevel(logging.ERROR)


def start_server() -> None:
    if not FLASK_AVAILABLE:
        log_event("Brak modułu 'flask'/'flask-cors' -> API HTTP wyłączone.", "warn")
        return
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)


def print_js_relative_coords_tip() -> None:
    snippet = (
        "// Opcjonalny JS: wysyłaj relatywne vx/vy zamiast x/y\n"
        "const rect = gameCanvas.getBoundingClientRect();\n"
        "const vx = Math.round(screenX - rect.left);\n"
        "const vy = Math.round(screenY - rect.top);\n"
        "fetch(`http://127.0.0.1:5000/click?vx=${vx}&vy=${vy}`);"
    )
    log_event("TIP (Tampermonkey relatywne koordynaty):\n" + snippet, "info")


if __name__ == "__main__":
    if pyautogui is not None:
        pyautogui.FAILSAFE = False
    else:
        log_event("Brak modułu 'pyautogui' -> fizyczne klikanie wyłączone.", "warn")

    if not IS_WINDOWS:
        log_event("System inny niż Windows: część funkcji WinAPI będzie niedostępna.", "warn")
    if cv2 is None:
        log_event("Brak modułu 'cv2' -> funkcje Computer Vision wyłączone.", "warn")
    if np is None:
        log_event("Brak modułu 'numpy' -> funkcje Computer Vision wyłączone.", "warn")
    if keyboard is None:
        log_event("Brak modułu 'keyboard' -> globalny hotkey wyłączony.", "warn")
    if not FLASK_AVAILABLE:
        log_event("Brak modułu 'flask'/'flask-cors' -> API HTTP wyłączone.", "warn")

    setup_dpi_awareness()
    load_settings()
    configure_logging()
    register_hotkey()

    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    log_event("MargoClicker v2 start")
    print_js_relative_coords_tip()

    try:
        launch_gui()
    except Exception as exc:
        log_event(f"Nie udało się uruchomić GUI: {exc}", "error")
        sys.exit(1)
