// hero-teleport.js
console.log("%c[HERO] Załadowano WZMOCNIONY moduł teleportacji (Pakiety Serwerowe)!", "color: #00acc1; font-weight: bold;");

window.HeroTeleportModule = {
    processDialog: function(targetMap, stopCallback, continueCallback, retryCallback) {
        
        let dialogBox = document.querySelector('.dialog-texts') || document.querySelector('.dialog-content');
        let isDialogOpen = dialogBox && dialogBox.offsetParent !== null;

        // ETAP 1: Otwieranie dialogu (Bezpośrednie uderzenie do serwera gry)
        if (!isDialogOpen) {
            console.log("%c[HERO] Szukam Zakonnika w pobliżu...", "color: yellow;");
            
            let npcs = (typeof Engine !== 'undefined' && Engine.npcs) ? (typeof Engine.npcs.check === 'function' ? Engine.npcs.check() : Engine.npcs.d) : {};
            let zakonnikId = null;
            
            // Solidne szukanie (usuwamy kolorowe tagi HTML z nicku i szukamy tylko słowa "zakonnik")
            for (let id in npcs) {
                let n = npcs[id].d || npcs[id];
                if (n && n.nick) {
                    let cleanNick = n.nick.replace(/<[^>]*>?/gm, '').toLowerCase();
                    if (cleanNick.includes("zakonnik")) {
                        zakonnikId = parseInt(id, 10);
                        break;
                    }
                }
            }

            if (zakonnikId) {
                console.log(`%c[HERO] Znalazłem Zakonnika (ID: ${zakonnikId}). Wymuszam pakiet rozmowy z serwerem!`, "color: #4caf50; font-weight: bold;");
                
                // Bezpośrednia komenda serwerowa (najskuteczniejsza opcja - ta sama co w auto-ataku)
                if (typeof window._g === 'function') {
                    window._g(`talk&id=${zakonnikId}`);
                } else if (typeof Engine.npcs.interact === 'function') {
                    Engine.npcs.interact(zakonnikId);
                }
            } else {
                console.log("%c[HERO] BŁĄD: Nie widzę Zakonnika na tej mapie!", "color: red; font-weight: bold;");
            }

            retryCallback();
            return;
        }

        // ETAP 2: Wybieranie opcji
        let options = Array.from(document.querySelectorAll('.dialog-texts li, .dialog-options li, .answer, [data-option]'));
        
        if (options.length > 0) {
            
            // A. Szukamy słowa "teleport", bo frazy mogą się różnić (Chciałabym / Chciałbym się teleportować)
            let startOpt = options.find(el => el.innerText.toLowerCase().includes("teleport"));
            if (startOpt) {
                console.log(`%c[HERO] Klikam: ${startOpt.innerText.trim()}`, "color: #00acc1;");
                startOpt.click(); 
                retryCallback();
                return;
            }

            // B. Wybór miasta
            let destOpt = options.find(el => el.innerText.toLowerCase().includes(targetMap.toLowerCase()));
            if (destOpt) {
                
                // Zabezpieczenie przed brakiem zezwolenia
                if (destOpt.innerText.toLowerCase().includes("brak zezwolenia")) {
                    console.log(`%c[HERO] Zablokowane! Brak zezwolenia do: ${targetMap}!`, "color: red; font-weight: bold;");
                    let closeOpt = options.find(el => el.innerText.toLowerCase().includes("nigdzie") || el.innerText.toLowerCase().includes("zakończ"));
                    if (closeOpt) closeOpt.click();
                    stopCallback(); 
                    return;
                }

                console.log(`%c[HERO] 🚀 Cel: ${targetMap} -> Przenoszę!`, "color: #4caf50; font-weight: bold;");
                destOpt.click();
                continueCallback(); 
                return;
            } else {
                // Gdyby miasto było na drugiej stronie u zakonnika
                let moreOpt = options.find(el => el.innerText.toLowerCase().includes("inne") || el.innerText.toLowerCase().includes("dalej") || el.innerText.toLowerCase().includes("pokaż więcej"));
                if(moreOpt) {
                    console.log(`%c[HERO] Szukam miasta na kolejnej stronie...`, "color: #00acc1;");
                    moreOpt.click();
                    retryCallback();
                    return;
                }
            }
        }
        
        retryCallback(); 
    }
};
