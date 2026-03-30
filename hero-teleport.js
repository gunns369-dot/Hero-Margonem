// hero-teleport.js
console.log("%c[HERO] Załadowano NOWY, bezklawiszowy moduł teleportacji!", "color: #00acc1; font-weight: bold;");

window.HeroTeleportModule = {
    // Główna logika przetwarzania okna rozmowy
    processDialog: function(targetMap, stopCallback, continueCallback, retryCallback) {
        
        let dialogBox = document.querySelector('.dialog-texts') || document.querySelector('.dialog-content');
        let isDialogOpen = dialogBox && dialogBox.offsetParent !== null;

        // ETAP 1: Otwieranie dialogu (Bezpośrednio przez silnik gry)
        if (!isDialogOpen) {
            console.log("%c[HERO] Szukam Zakonnika w pobliżu...", "color: yellow;");
            
            let npcs = (typeof Engine !== 'undefined' && Engine.npcs) ? (typeof Engine.npcs.check === 'function' ? Engine.npcs.check() : Engine.npcs.d) : {};
            let zakonnikId = null;
            
            // Szukamy ID Zakonnika na mapie
            for (let id in npcs) {
                let n = npcs[id].d || npcs[id];
                if (n.nick && n.nick.toLowerCase().includes("zakonnik planu astralnego")) {
                    zakonnikId = id;
                    break;
                }
            }

            if (zakonnikId && typeof Engine.npcs.interact === 'function') {
                console.log("%c[HERO] Otwieram dialog z Zakonnikiem (Wymuszenie silnika)...", "color: yellow;");
                Engine.npcs.interact(zakonnikId);
            } else {
                // Fallback (zapasowa opcja), jeśli silnik by nie odpowiedział
                this.simulateKeyPress('r');
            }

            retryCallback();
            return;
        }

        // ETAP 2: Wybieranie opcji (Fizyczne klikanie w element DOM)
        let options = Array.from(document.querySelectorAll('.dialog-texts li, .dialog-options li, .answer, [data-option]'));
        
        if (options.length > 0) {
            
            // A. Krok pierwszy rozmowy: "Chciałam/Chciałbym się teleportować"
            let startOpt = options.find(el => el.innerText.toLowerCase().includes("teleportować"));
            if (startOpt) {
                console.log(`%c[HERO] Klikam opcję teleportacji...`, "color: #00acc1;");
                startOpt.click(); 
                retryCallback();
                return;
            }

            // B. Krok drugi rozmowy: Wybór miasta
            let destOpt = options.find(el => el.innerText.toLowerCase().includes(targetMap.toLowerCase()));
            if (destOpt) {
                
                // Zabezpieczenie przed brakiem wykupionego zezwolenia (Brak opłaty u zakonnika)
                if (destOpt.innerText.toLowerCase().includes("brak zezwolenia")) {
                    console.log(`%c[HERO] Zablokowane! Nie wykupiłeś zezwolenia do: ${targetMap}!`, "color: red; font-weight: bold;");
                    let closeOpt = options.find(el => el.innerText.toLowerCase().includes("nigdzie") || el.innerText.toLowerCase().includes("zakończ"));
                    if (closeOpt) closeOpt.click();
                    stopCallback(); // Zatrzymuje bota (chroni przed zacięciem w pętli)
                    return;
                }

                console.log(`%c[HERO] 🚀 Cel: ${targetMap} -> Klikam docelowe przejście!`, "color: #4caf50; font-weight: bold;");
                destOpt.click();
                
                // Sukces! Gra ładuje mapę, puszczamy logikę dalej.
                continueCallback(); 
                return;
            }
        }
        
        // Jeżeli opcje się jeszcze nie załadowały po stronie Margonem, zapętl sprawdzanie
        retryCallback(); 
    },

    // Awaryjna symulacja klawiatury dla starszych przeglądarek/interfejsów
    simulateKeyPress: function(keyChar) {
        let keyCode = keyChar.toUpperCase().charCodeAt(0);
        let evtDown = new KeyboardEvent('keydown', { key: keyChar, keyCode: keyCode, which: keyCode, bubbles: true });
        let evtUp = new KeyboardEvent('keyup', { key: keyChar, keyCode: keyCode, which: keyCode, bubbles: true });
        document.dispatchEvent(evtDown);
        document.dispatchEvent(evtUp);
    }
};
