// hero-teleport.js
console.log("%c[HERO] Załadowano zewnętrzny moduł teleportacji (Zakonników)!", "color: #00acc1; font-weight: bold;");

window.HeroTeleportModule = {
    // Funkcja symulująca wciśnięcie klawisza (np. 'r' do rozmowy, '1', '2' do opcji)
    simulateKeyPress: function(keyChar) {
        let keyCode = keyChar.toUpperCase().charCodeAt(0);
        if (keyChar >= '1' && keyChar <= '9') {
            keyCode = 48 + parseInt(keyChar);
        }
        let codeStr = keyChar === 'r' ? 'KeyR' : 'Digit' + keyChar;

        let evtDown = new KeyboardEvent('keydown', { key: keyChar, code: codeStr, keyCode: keyCode, which: keyCode, bubbles: true });
        let evtUp = new KeyboardEvent('keyup', { key: keyChar, code: codeStr, keyCode: keyCode, which: keyCode, bubbles: true });

        document.dispatchEvent(evtDown);
        document.dispatchEvent(evtUp);
    },

    // Pobieranie cyfry przypisanej do opcji dialogowej
    getOptionKey: function(el, index) {
        let match = el.innerText.match(/^(\d+)\./);
        if (match) return match[1];
        return (index + 1).toString();
    },

    // Główna logika przetwarzania okna rozmowy
    processDialog: function(targetMap, stopCallback, continueCallback, retryCallback) {
        let dialogBox = document.querySelector('.dialog-texts') || document.querySelector('.dialog-content');
        let isDialogOpen = dialogBox && dialogBox.offsetParent !== null;

        if (!isDialogOpen) {
            console.log("%c[HERO] Wciskam klawisz [ R ], aby zacząć rozmowę z Zakonnikiem...", "color: yellow; font-weight: bold;");
            this.simulateKeyPress('r');
            retryCallback();
            return;
        }

        let options = Array.from(document.querySelectorAll('.dialog-texts li, .dialog-options li, .answer, [data-option]'));
        if (options.length > 0) {
            
            // ETAP 1: Klawisz dla "Chciałam się teleportować"
            let startOptIndex = options.findIndex(el => el.innerText.toLowerCase().includes("teleportować"));
            if (startOptIndex !== -1) {
                let key = this.getOptionKey(options[startOptIndex], startOptIndex);
                console.log(`%c[HERO] Wybieram opcję teleportacji -> Wciskam klawisz [ ${key} ]`, "color: #00acc1;");
                this.simulateKeyPress(key);
                retryCallback();
                return;
            }

            // ETAP 2: Klawisz dla miasta docelowego
            let destOptIndex = options.findIndex(el => el.innerText.toLowerCase().includes(targetMap.toLowerCase()));
            if (destOptIndex !== -1) {
                let destOpt = options[destOptIndex];

                // Zabezpieczenie przed brakiem zezwolenia
                if (destOpt.innerText.toLowerCase().includes("brak zezwolenia")) {
                    console.log(`%c[HERO] Zablokowane! Nie wykupiłeś zezwolenia do: ${targetMap}!`, "color: red; font-weight: bold;");
                    let closeOptIndex = options.findIndex(el => el.innerText.toLowerCase().includes("nigdzie") || el.innerText.toLowerCase().includes("zakończ"));
                    if (closeOptIndex !== -1) {
                        let closeKey = this.getOptionKey(options[closeOptIndex], closeOptIndex);
                        this.simulateKeyPress(closeKey);
                    }
                    stopCallback(); // Wyłącza bota, bo nie mamy jak przejść dalej
                    return;
                }

                let key = this.getOptionKey(destOpt, destOptIndex);
                console.log(`%c[HERO] 🚀 Cel: ${targetMap} -> Wciskam klawisz [ ${key} ]!`, "color: #4caf50; font-weight: bold;");
                this.simulateKeyPress(key);
                
                // Udało się kliknąć, pozwalamy botowi czekać na załadowanie mapy
                continueCallback(); 
                return;
            }
        }
        // Jeśli nie znalazł opcji, odświeża pętle sprawdzania
        retryCallback(); 
    }
};
