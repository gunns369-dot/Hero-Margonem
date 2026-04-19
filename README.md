# Hero-Margonem
## Berserk/Trap FSM - fallback fullscreen

Bot traktuje pełny ekran jako sterowany idempotentnie flagą `__fullscreenByBotForTrap`.
Jeśli przeglądarka nie udostępnia pewnego źródła prawdy o stanie F11 (lub blokuje odczyt),
bot przełącza F11 tylko wtedy, gdy sam wcześniej go przełączył w cyklu zapadki.
Dzięki temu nie ma podwójnych toggle wywołanych przez bota.

## MargoClicker v2 - szybki start

Jeżeli `margoclicker_v2.py` przestał się uruchamiać, najczęstszą przyczyną są brakujące zależności Pythona.

1. (Opcjonalnie) utwórz i aktywuj virtualenv.
2. Zainstaluj zależności:

```bash
pip install -r requirements-margoclicker-v2.txt
```

3. Uruchom:

```bash
python margoclicker_v2.py
```

## MargoClicker (legacy) - gdy nie startuje

Jeśli `margoclicker.py` kończy się błędem `ModuleNotFoundError`, doinstaluj brakujące pakiety:

```bash
pip install pyautogui flask flask-cors
```

Następnie uruchom ponownie:

```bash
python margoclicker.py
```
