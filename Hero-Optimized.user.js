// ==UserScript==
// @name         MargoNeuro - Optimized Edition
// @version      64.3
// @description  Automatyczne wykrywanie, inteligentny zasięg, natywny auto-atak, poprawne limity poziomowe, naprawiony scroll.
// @author       Ty & Gemini
// @match        https://*.margonem.pl/
// @grant        none
// @updateURL    https://raw.githubusercontent.com/gunns369-dot/Hero-Margonem/main/Hero-Optimized.user.js
// @downloadURL  https://raw.githubusercontent.com/gunns369-dot/Hero-Margonem/main/Hero-Optimized.user.js
// ==/UserScript==

(function() {
    'use strict';

 // ==========================================
        // SILNIK ANTI-THROTTLE V3 (NIESKOŃCZONOŚĆ) - Omijanie uśpienia kart
        // ==========================================
        if (!window.__antiThrottleInstalled) {
    window.__antiThrottleInstalled = true;
            
            // 1. OSZUKIWANIE PRZEGLĄDARKI (Główny powód zamrażania Margonem)
            // Wycinamy grze możliwość sprawdzenia, czy karta jest zminimalizowana
            Object.defineProperty(document, 'hidden', { get: () => false });
            Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
            
            // Blokujemy eventy usypiające - gra nigdy nie dostanie sygnału "straciłem focus"
            const blockEvent = (e) => e.stopImmediatePropagation();
            document.addEventListener('visibilitychange', blockEvent, true);
            window.addEventListener('visibilitychange', blockEvent, true);
            window.addEventListener('blur', blockEvent, true);
            window.addEventListener('focus', blockEvent, true);

            // 2. WEB WORKER (Niezabijalne zegary z prawdziwego zdarzenia)
            const workerCode = `
                let timers = {};
                self.onmessage = function(e) {
                    if (e.data.command === 'setInterval') {
                        timers[e.data.id] = setInterval(() => self.postMessage({id: e.data.id, type: 'interval'}), e.data.timeout);
                    } else if (e.data.command === 'clearInterval') {
                        clearInterval(timers[e.data.id]);
                        delete timers[e.data.id];
                    } else if (e.data.command === 'setTimeout') {
                        timers[e.data.id] = setTimeout(() => self.postMessage({id: e.data.id, type: 'timeout'}), e.data.timeout);
                    } else if (e.data.command === 'clearTimeout') {
                        clearTimeout(timers[e.data.id]);
                        delete timers[e.data.id];
                    }
                };
            `;
            const worker = new Worker(URL.createObjectURL(new Blob([workerCode], { type: 'application/javascript' })));
            
            const callbacks = {};
            let timerId = 1;
            
            worker.onmessage = function(e) {
                if (callbacks[e.data.id]) {
                    callbacks[e.data.id]();
                    if (e.data.type === 'timeout') delete callbacks[e.data.id];
                }
            };
            
            window.originalSetInterval = window.setInterval;
            window.originalClearInterval = window.clearInterval;
            window.originalSetTimeout = window.setTimeout;
            window.originalClearTimeout = window.clearTimeout;
            window.originalRequestAnimationFrame = window.requestAnimationFrame;
            window.originalCancelAnimationFrame = window.cancelAnimationFrame;
            
            window.setInterval = function(cb, timeout, ...args) {
                let id = timerId++; callbacks[id] = () => cb(...args);
                worker.postMessage({ command: 'setInterval', id: id, timeout: timeout }); return id;
            };
            window.clearInterval = function(id) { worker.postMessage({ command: 'clearInterval', id: id }); delete callbacks[id]; };
            window.setTimeout = function(cb, timeout, ...args) {
                let id = timerId++; callbacks[id] = () => cb(...args);
                worker.postMessage({ command: 'setTimeout', id: id, timeout: timeout }); return id;
            };
            window.clearTimeout = function(id) { worker.postMessage({ command: 'clearTimeout', id: id }); delete callbacks[id]; };

            // 3. WYMUSZANIE KLATEK ANIMACJI (Oszukiwanie silnika graficznego)
            let rafCounter = 0;
            let rafMap = new Map();
            
            window.requestAnimationFrame = function(cb) {
                let id = ++rafCounter;
                // Rzucamy własne, niezabijalne (dzięki Workerowi) klatki animacji co 16ms (~60 FPS)
                // Używamy performance.now(), bo silnik Margonem używa tego do obliczania płynności chodu
                let timeoutId = window.setTimeout(() => {
                    rafMap.delete(id);
                    cb(performance.now()); 
                }, 16); 
                rafMap.set(id, timeoutId);
                return id;
            };
            
            window.cancelAnimationFrame = function(id) {
                let timeoutId = rafMap.get(id);
                if (timeoutId) {
                    window.clearTimeout(timeoutId);
                    rafMap.delete(id);
                }
            };

            console.log("%c[System] Anti-Throttle V3 (Nieskończoność) Aktywny! Gra została odcięta od wiedzy o ukrytej karcie.", "color: #ff5252; font-weight: bold; font-size: 14px;");
        }
        // ==========================================
   // WBUDOWANY SKANER PRZEJŚĆ (Agresywny Skaner Multi-Engine - z Twoją metodą NI)
    const HeroScannerModule = {
        scanCurrentMap: function(currentMapName, zakkonicyData) {
            let foundGateways = [];
            let processedCoords = new Set();

            // 1. GŁÓWNA METODA DLA NOWEGO INTERFEJSU (Zbudowana na Twoim kodzie)
            if (typeof Engine !== 'undefined' && Engine.map && typeof Engine.map.getGateways === 'function') {
                try {
                    let list = Engine.map.getGateways().getList();
                    list.forEach(g => {
                        if (!g || !g.d) return;

                        let px = g.rx !== undefined ? g.rx : g.d.x;
                        let py = g.ry !== undefined ? g.ry : g.d.y;

                        if (px === undefined || py === undefined) return;

                        // Ignorowanie Zakonników
                        let tp = zakkonicyData ? zakkonicyData[currentMapName] : null;
                        if (tp && Math.abs(px - tp.x) <= 2 && Math.abs(py - tp.y) <= 2) return;

                        let coordKey = px + "_" + py;
                        if (processedCoords.has(coordKey)) return;
                        processedCoords.add(coordKey);

                       // Wyciąganie nazwy - ZAAWANSOWANE CZYSZCZENIE (Odcina poziomy i nowe linie)
                        let rawName = (g.tip && g.tip[0]) ? g.tip[0] : (g.d.name || g.d.targetName || "");
                        let cleanName = rawName.toString().replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]*>?/gm, '').split('\n')[0];
                        cleanName = cleanName.replace("Przejście do:", "").replace("Przejście do ", "").split(" .")[0].split("Przejście dostępne")[0].trim();

                        if (!cleanName || cleanName.length < 2 || cleanName === "Wyjście") {
                            cleanName = `Wejście [${px}, ${py}]`;
                        }

                        if (cleanName !== currentMapName && !cleanName.includes("Brak")) {
                            foundGateways.push({ x: px, y: py, targetMap: cleanName });
                        }
                    });

                    // Jeśli znaleźliśmy przejścia Twoją metodą, natychmiast je zwracamy
                    if (foundGateways.length > 0) return foundGateways;
                } catch(e) {
                    console.log("%c[HERO] Skaner NI zawiódł, przechodzę do trybu zapasowego...", "color: orange;");
                }
            }

            // 2. METODA ZAPASOWA DLA STAREGO INTERFEJSU (SI)
            let gwsObj = {};
            if (typeof Engine !== 'undefined' && Engine.map) {
                if (Engine.map.gateways) gwsObj = Engine.map.gateways;
                else if (Engine.map.d && Engine.map.d.gw) gwsObj = Engine.map.d.gw;
            } else if (typeof g !== 'undefined' && g.townname) {
                gwsObj = g.townname;
            }

            let gwsList = [];
            try {
                if (typeof gwsObj.values === 'function') gwsList = Array.from(gwsObj.values());
                else gwsList = Object.values(gwsObj);
            } catch(e) {
                for (let key in gwsObj) { if (gwsObj.hasOwnProperty(key)) gwsList.push(gwsObj[key]); }
            }

            gwsList.forEach(gw => {
                let data = gw.d || gw;
                if (!data) return;
                let px = data.x; let py = data.y;
                if (px === undefined || py === undefined) return;

                let tp = zakkonicyData ? zakkonicyData[currentMapName] : null;
                if (tp && Math.abs(px - tp.x) <= 2 && Math.abs(py - tp.y) <= 2) return;

                let coordKey = px + "_" + py;
                if (processedCoords.has(coordKey)) return;
                processedCoords.add(coordKey);

              let rawName = data.name || data.targetName || data.title || data.tooltip || "";
                let cleanName = rawName.toString().replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]*>?/gm, '').split('\n')[0];
                cleanName = cleanName.replace("Przejście do:", "").replace("Przejście do ", "").split(" .")[0].split("Przejście dostępne")[0].trim();

                if (!cleanName || cleanName.length < 2 || cleanName === "Wyjście") {
                    cleanName = `Wejście [${px}, ${py}]`;
                }

                if (cleanName !== currentMapName && !cleanName.includes("Brak")) {
                    foundGateways.push({ x: px, y: py, targetMap: cleanName });
                }
            });

            return foundGateways;
        }
    };

    // WBUDOWANY MODUŁ TELEPORTACJI (Złoty środek: Niezawodny, LUDZKI - Anty-Captcha i Anty-Blokada NI)
    const HeroTeleportModule = {
        isClicking: false,

       processDialog: function(targetMap, stopCallback, continueCallback, retryCallback) {
    if (this.isClicking) return;

    let options = Array.from(
        document.querySelectorAll('.answer, .dialog-answer, #dialog li, .dialog-options li, .dialog-texts li, [data-option]')
    );

    if (options.length === 0) {
        let npcs = (typeof Engine !== 'undefined' && Engine.npcs)
            ? (typeof Engine.npcs.check === 'function' ? Engine.npcs.check() : Engine.npcs.d)
            : {};

        let zakonnikId = null;

        for (let id in npcs) {
            let n = npcs[id].d || npcs[id];
            let nick = (n && n.nick) ? n.nick.replace(/<[^>]*>?/gm, '').toLowerCase() : "";
            if (nick.includes("zakonnik")) {
                zakonnikId = parseInt(id, 10);
                break;
            }
        }

        if (zakonnikId) {
            this.isClicking = true;
            let approachDelay = Math.floor(Math.random() * 401) + 400;

            setTimeout(() => {
                if (typeof Engine !== 'undefined' && Engine.npcs && typeof Engine.npcs.interact === 'function') {
                    Engine.npcs.interact(zakonnikId);
                } else if (typeof window._g === 'function') {
                    window._g(`talk&id=${zakonnikId}`);
                }

                this.isClicking = false;
                retryCallback();
            }, approachDelay);
        } else {
            retryCallback();
        }

        return;
    }

    const humanClick = (element, nextStepFunction) => {
        if (!element) return;
        this.isClicking = true;

        let humanDelay = Math.floor(Math.random() * 601) + 600;

        setTimeout(() => {
            if (typeof MouseEvent !== 'undefined') {
                element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
                element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
            }

            if (typeof element.click === 'function') element.click();

            this.isClicking = false;
            if (nextStepFunction) nextStepFunction();
        }, humanDelay);
    };

    const safeText = el => ((el && (el.innerText || el.textContent)) || "").toLowerCase();

    let startOpt = options.find(el => safeText(el).includes("teleport"));
    if (startOpt) {
        humanClick(startOpt, retryCallback);
        return;
    }

    let targetLower = (targetMap || "").toLowerCase();
    let destOpt = options.find(el => safeText(el).includes(targetLower));

    if (destOpt) {
        if (safeText(destOpt).includes("brak zezwolenia")) {
            let closeOpt = options.find(el =>
                safeText(el).includes("nigdzie") ||
                safeText(el).includes("zakończ") ||
                safeText(el).includes("niczego")
            );
            if (closeOpt) humanClick(closeOpt, stopCallback);
            else stopCallback();
            return;
        }

        humanClick(destOpt, continueCallback);
        return;
    }

    let moreOpt = options.find(el =>
        safeText(el).includes("inne") ||
        safeText(el).includes("dalej") ||
        safeText(el).includes("więcej")
    );

    if (moreOpt) {
        humanClick(moreOpt, retryCallback);
        return;
    }

    retryCallback();
}
    };

// ==========================================
    // MODUŁ ZEWNĘTRZNYCH BAZ DANYCH (MargoWorld)
    // ==========================================
    window.DatabaseModule = {
        kupcy: [],
        ekwipunek: [],

        initDatabases: async function() {
            try {
                // GOTOWE LINKI DO TWOJEGO GITHUBA:
                let urlShops = 'https://raw.githubusercontent.com/gunns369-dot/Hero-Margonem/main/margoworld_shops_full_database.json';
                let urlTooltips = 'https://raw.githubusercontent.com/gunns369-dot/Hero-Margonem/main/margoworld_tooltip_cache_full.json';

                console.log("[Baza] Rozpoczęto pobieranie zewnętrznych baz danych...");
                let [resShops, resEq] = await Promise.all([fetch(urlShops), fetch(urlTooltips)]);
                let rawShops = await resShops.json();
                let rawEq = await resEq.json();

                this.parseShops(rawShops);
                this.parseEq(rawEq);
                console.log(`[Baza] Pomyślnie załadowano: ${this.kupcy.length} kupców i ${this.ekwipunek.length} przedmiotów!`);
            } catch (e) {
                console.error("[Baza] Błąd pobierania plików JSON. Sprawdź linki!", e);
            }
        },
    parseShops: function(rawShops) {
            let merchants = [];
            for (let category in rawShops) {
                let shopsInCategory = rawShops[category];
                for (let shopUrl in shopsInCategory) {
                    let shopData = shopsInCategory[shopUrl];

                    let itemsList = [];
                    for (let key in shopData) {
                        if (Array.isArray(shopData[key]) && shopData[key].length > 0 && shopData[key][0].name) {
                            itemsList = shopData[key];
                            break;
                        }
                    }

                    if (shopData.shop_npcs) {
                        shopData.shop_npcs.forEach(npc => {
                            if (npc.maps) {
                                npc.maps.forEach(mapObj => {
                                    let mapName = mapObj.map_name;
                                    if (mapObj.coords && mapObj.coords.length > 0) {
                                        mapObj.coords.forEach(coord => {
                                            merchants.push({
                                                npc_name: npc.npc_name,
                                                map_name: mapName,
                                                x: coord.x, y: coord.y,
                                                category: shopData.category,
                                                shop_name: shopData.shop_name || npc.npc_name,
                                                shop_url: shopData.shop_url || shopUrl,
                                                items: itemsList
                                            });
                                        });
                                    }
                                });
                            }
                        });
                    }
                }
            }
            this.kupcy = merchants;
        },
parseEq: function(rawEq) {
            let items = [];
            for (let itemUrl in rawEq) {
                let itemData = rawEq[itemUrl];
                if (itemData.required_level) {
                    let cleanName = itemData.name.split(" Typ:")[0].split(" Pospolity")[0].split(" Unikat")[0].split(" Heroik")[0].split(" Legendarny")[0].trim();
                    let fullStats = itemData.tooltip_text || itemData.raw_detected_text || itemData.name || "";

                    // --- INTELIGENTNE ODCZYTYWANIE TYPU Z OPISU (TOOLTIPA) ---
                    let detectedType = itemData.slot_type || "Nieznany";

                    let typeMatch = fullStats.match(/Typ:\s*([A-Za-zżźćńółęąśŻŹĆŃÓŁĘĄŚ]+(?:\s[A-Za-zżźćńółęąśŻŹĆŃÓŁĘĄŚ]+)?)/i);
                    if (typeMatch && typeMatch[1]) {
                        // Ucinamy wszystkie formy rzadkości (Unikat, Unikatowy itp.)
                        detectedType = typeMatch[1].replace(/\s*(Pospolity|Unikatowy|Unikat|Heroiczny|Heroik|Legendarny)/gi, '').trim();
                    }

                    detectedType = detectedType.charAt(0).toUpperCase() + detectedType.slice(1).toLowerCase();

                    items.push({
                        name: cleanName,
                        level: itemData.required_level,
                        prof: itemData.allowed_professions || [],
                        type: detectedType,
                        url: itemUrl,
                        stats: fullStats
                    });
                }
            }
            this.ekwipunek = items;
        },
getRecommendedEq: function() {
            if (typeof Engine === 'undefined' || !Engine.hero || !Engine.hero.d) return [];
            let myLvl = Engine.hero.d.lvl;
            let myProfLetter = Engine.hero.d.prof;

            const profMap = { "w": "wojownik", "m": "mag", "t": "tropiciel", "p": "paladyn", "b": "tancerz ostrzy", "h": "łowca" };
            let fullProf = profMap[myProfLetter];

            return this.ekwipunek.filter(item => {
                // TUTA ZMIANA: Pokazuje tylko przedmioty od (Twój lvl - 5) do Twojego aktualnego poziomu!
                let isLevelOk = (item.level >= myLvl - 5) && (item.level <= myLvl);

                let profArray = item.prof.map(p => p.toLowerCase());
                let isProfOk = false;
                if (profArray.length === 0) {
                    isProfOk = true;
                } else {
                    isProfOk = profArray.some(p => p.includes(fullProf));
                }

              return isLevelOk && isProfOk;
        }).sort((a, b) => a.level - b.level);
    }
}; // <--- TEGO ZNAKU BRAKOWAŁO (Zamknięcie całego obiektu DatabaseModule)

// Automatyczne załadowanie bazy 3 sekundy po włączeniu gry
setTimeout(() => window.DatabaseModule.initDatabases(), 3000);
    // ==========================================
    // BAZA DANYCH HEROSÓW
    // ==========================================
    const heroData = {

        "Domina Ecclesiae": {"Stare Ruiny": [[56,53],[57,48],[58,25],[66,22],[72,17]], "Przeklęty Zamek - wejście południowe": [[9,8],[16,7]], "Przeklęty Zamek - wejście północne": [[6,9],[18,7]], "Przeklęty Zamek - wejście wschodnie": [[8,8],[12,7]], "Przeklęty Zamek - podziemia południowe": [[8,27],[11,8],[19,27],[21,8]], "Przeklęty Zamek - kanały": [[8,8],[20,28]], "Przeklęty Zamek - sala zgromadzeń": [[4,8],[10,10],[30,9],[42,29]], "Przeklęty Zamek p.1": [[8,13],[13,4]], "Przeklęty Zamek p.2": [[2,11],[21,6]], "Orla Grań": [[44,9],[46,24],[52,10],[54,12],[56,22]], "Przeklęta Strażnica": [[4,10],[6,13],[8,9],[13,12],[17,8]], "Przeklęta Strażnica p.1": [[3,10],[4,17],[5,8],[12,8],[15,16],[17,14]], "Przeklęta Strażnica p.2": [[5,14],[8,4],[9,14],[13,12],[15,6]], "Przeklęta Strażnica - podziemia p.1 s.1": [[5,36],[7,35],[9,9],[15,27],[22,33],[24,6],[26,34],[27,20],[30,8],[31,21],[31,35]], "Przeklęta Strażnica - podziemia p.1 s.2": [[5,9],[5,35],[12,17],[17,4],[17,34],[21,22],[22,4],[27,24]], "Przeklęta Strażnica - podziemia p.2 s.2": [[2,5],[7,11],[8,5],[12,6],[12,18]]},

        "Mroczny Patryk": {"Orla Grań": [[7,87],[28,92],[33,89],[10,84]], "Przełęcz Łotrzyków": [[6,84],[11,62],[14,22],[14,51],[27,14],[36,81],[40,29],[42,11],[44,75],[45,40],[46,49],[46,83],[51,62],[53,38],[55,78]], "Pagórki Łupieżców": [[8,25],[8,55],[10,65],[15,17],[26,73],[29,47],[37,6],[45,30],[56,4],[58,86]], "Skład Grabieżców": [[7,17],[9,5],[24,13],[27,17]], "Dolina Rozbójników": [[8,44],[12,57],[14,70],[15,82],[17,49],[20,36],[21,29],[22,5],[23,91],[28,23],[29,40],[33,68],[37,24],[39,19],[41,11],[41,57],[41,76],[45,66],[47,19],[54,42],[56,51],[57,41]], "Kamienna Kryjówka": [[4,15],[13,9],[16,6],[28,12]], "Ghuli Mogilnik": [[6,54],[7,39],[16,11],[32,35]], "Polana Ścierwojadów": [[10,30],[22,14],[23,34],[43,7]], "Mokradła": [[4,46],[8,43],[8,53],[9,50],[19,11],[34,44],[40,4],[44,46],[47,54],[54,8],[54,58]], "Las Goblinów": [[4,87],[6,80],[7,37],[8,18],[17,35],[20,9],[22,81],[32,87],[33,78],[36,45],[37,27],[46,38],[51,46],[52,21],[55,10]], "Morwowe Przejście": [[4,51],[8,62],[9,6],[16,35],[32,23],[46,19],[52,40],[55,8]], "Podmokła Dolina": [[4,37],[15,33],[42,4],[54,56]]},

        "Karmazynowy Mściciel": {"Pieczara Niepogody p.1": [[9,26],[16,23]], "Pieczara Niepogody p.2 - sala 1": [[20,6],[41,15]], "Pieczara Niepogody p.2 - sala 2": [[21,37],[22,13]], "Pieczara Niepogody p.3": [[26,12],[28,36],[51,38]], "Pieczara Niepogody p.4": [[4,21],[34,10]], "Pieczara Niepogody p.5": [[12,20],[32,22],[40,11]], "Warczące Osuwiska": [[15,19],[16,50],[60,48]], "Wilcza Nora p.2": [[18,5]], "Legowisko Wilczej Hordy": [[32,25],[38,2],[45,56],[58,34]], "Krasowa Pieczara p.2": [[6,25],[32,35]], "Krasowa Pieczara p.3": [[13,9]], "Wilcza Skarpa": [[4,40],[33,39],[35,8],[48,34],[60,31],[60,68]], "Skarpiska Tolloków": [[4,61],[36,32],[37,15],[52,25]], "Skalne Turnie": [[30,36],[31,3],[42,57],[61,39]]},

        "Złodziej": {"Dom Erniego": [[6,7]], "Dom Erniego p.1": [[6,5]], "Dom Artenii i Tafina": [[5,5]], "Dom Artenii i Tafina - piwnica": [[11,12]], "Dom Etrefana - pracownia": [[6,12]], "Dom Etrefana p.2": [[5,6]], "Dom Mrocznego Zgrzyta": [[10,5]], "Dom Mikliniosa p.1": [[9,5]], "Dom Mikliniosa - przyziemie": [[8,10]], "Pracownia Bonifacego p.1": [[5,6]], "Siedziba Kultystów": [[11,11]], "Fort Eder": [[59,60]], "Fortyfikacja": [[7,17]], "Fortyfikacja p.2": [[10,4]], "Fortyfikacja p.4": [[11,14]], "Fortyfikacja p.5": [[10,10]], "Ciemnica Szubrawców p.1 - sala 1": [[8,14]], "Ciemnica Szubrawców p.1 - sala 2": [[13,5]], "Ciemnica Szubrawców p.1 - sala 3": [[45,12],[51,53]], "Stary Kupiecki Trakt": [[8,8],[51,12],[55,44],[55,92]], "Stukot Widmowych Kół": [[5,5],[20,28],[23,61],[48,72]], "Wertepy Rzezimieszków": [[12,55],[53,12],[53,51]], "Chata szabrowników": [[6,4]]},

        "Zły Przewodnik": {"Zniszczone Opactwo": [[6,46]], "Uroczysko": [[13,26],[22,53],[80,33],[90,9],[92,50]], "Lazurytowa Grota p.1": [[13,16]], "Lazurytowa Grota p.2": [[25,20],[35,9],[55,17]], "Lazurytowa Grota p.3 - sala 1": [[10,16],[22,41],[34,16]], "Lazurytowa Grota p.3 - sala 2": [[9,18]], "Zapomniany Szlak": [[6,34],[17,15],[25,24],[26,49],[38,34],[41,5],[47,13],[48,60],[55,50],[58,41],[64,34],[66,48],[79,22],[86,36],[89,51]], "Mokra Grota p.1": [[20,52],[37,41],[58,13]], "Mokra Grota p.1 - boczny korytarz": [[17,40],[25,35],[44,56]], "Mokra Grota p.2 - korytarz": [[13,44],[23,18],[36,33]], "Grota Bezszelestnych Kroków - sala 1": [[18,12],[19,16]], "Grota Bezszelestnych Kroków - sala 2": [[12,19],[33,10],[51,17],[52,43]], "Grota Bezszelestnych Kroków - sala 3": [[5,15],[28,42],[34,13],[34,29],[45,49]], "Mroczny Przesmyk": [[15,51],[18,7],[30,24],[30,59],[42,2],[42,16],[42,34],[49,50],[56,24],[59,54]]},

        "Opętany Paladyn": {"Skały Mroźnych Śpiewów": [[8,48],[28,60],[43,21],[44,39]], "Cmentarzysko Szerpów": [[43,20],[46,60],[63,47],[75,55]], "Andarum Ilami": [[17,40],[23,55],[26,18],[37,20]], "Świątynia Andarum": [[12,10],[16,26],[34,10]], "Świątynia Andarum - zejście lewe": [[15,16]], "Świątynia Andarum - zejście prawe": [[7,26]], "Świątynia Andarum - podziemia": [[4,33],[11,9],[24,21],[29,9],[41,19],[47,7]], "Świątynia Andarum - biblioteka": [[12,29],[16,47],[51,7],[59,52],[61,35]], "Świątynia Andarum - lokum mnichów": [[10,17],[12,44],[31,13],[49,20],[51,52]], "Krypty Dusz Śniegu p.1": [[13,35],[15,18],[30,31],[37,18]], "Krypty Dusz Śniegu p.2": [[9,12],[12,43],[27,14],[42,29]], "Krypty Dusz Śniegu p.3": [[5,41],[8,19],[30,29]]},

        "Piekielny Kościej": {"Zdradzieckie Przejście p.1": [[8,85],[9,42]], "Zdradzieckie Przejście p.2": [[9,28],[19,6],[51,45]], "Wylęgarnia Choukkerów p.1": [[23,14],[26,59]], "Wylęgarnia Choukkerów p.2": [[11,20],[36,24],[54,47]], "Wylęgarnia Choukkerów p.3": [[19,50],[52,42]], "Labirynt Margorii": [[6,35],[29,22],[62,42],[86,26],[87,44]], "Kopalnia Margorii": [[8,40],[30,92],[58,71]], "Margoria": [[10,47],[30,39],[51,39],[55,15]], "Szyb Zdrajców": [[11,34],[32,13],[49,47]], "Ślepe Wyrobisko": [[23,56],[28,24],[35,8],[54,28]]},

        "Koziec Mąciciel Ścieżek": {"Liściaste Rozstaje": [[12,68],[47,11],[51,77]], "Sosnowe Odludzie": [[4,15],[24,21],[31,85],[40,41],[41,65],[56,23]], "Księżycowe Wzniesienie": [[10,25],[15,75],[44,61],[60,13]], "Zapomniany Święty Gaj p.1 - sala 1": [[14,8]], "Trupia Przełęcz": [[16,42],[25,2],[57,5],[58,78]], "Zapomniany Święty Gaj p.2": [[16,27],[30,25]], "Mglista Polana Vesy": [[25,52],[44,75],[56,48]], "Wzgórze Płaczek": [[15,49],[67,20],[77,31]], "Płacząca Grota p.1 - sala 1": [[20,21]], "Płacząca Grota p.1 - sala 2": [[11,15],[36,42]], "Płacząca Grota p.2": [[19,34],[39,32],[41,8],[52,50]], "Płacząca Grota p.3": [[19,34],[20,24]]},

        "Kochanka Nocy": {"Błędny Szlak": [[8,44],[22,5],[40,42],[75,23]], "Zawiły Bór": [[14,43],[47,39],[48,5],[87,8]], "Iglaste Ścieżki": [[23,10],[29,56],[68,47],[83,9],[88,40]], "Selva Oscura": [[23,35],[24,19],[72,37],[76,12]], "Gadzia Kotlina": [[10,32],[38,43],[50,26],[60,49],[72,14]], "Mglista Polana Vesy": [[7,12],[44,11]], "Dolina Centaurów": [[11,54],[56,44],[69,16],[84,46]], "Złowrogie Bagna": [[10,10],[23,39],[52,20],[53,41]], "Zagrzybiałe Ścieżki p.1 - sala 1": [[5,12],[18,35],[33,21]], "Zagrzybiałe Ścieżki p.1 - sala 2": [[17,6],[36,17]], "Zagrzybiałe Ścieżki p.1 - sala 3": [[7,7],[28,28],[38,11]], "Zagrzybiałe Ścieżki p.2": [[29,14],[30,43]]},

        "Książę Kasim": {"Stare Sioło": [[84,44],[91,7]], "Sucha Dolina": [[28,34],[31,77],[44,23]], "Wioska Rybacka": [[23,15],[85,5],[88,43]], "Płaskowyż Arpan": [[37,32],[71,15],[73,50]], "Skalne Cmentarzysko p.1": [[5,17]], "Skalne Cmentarzysko p.2": [[8,40],[40,20]], "Skalne Cmentarzysko p.3": [[19,44],[35,39],[55,10]], "Oaza Siedmiu Wichrów": [[22,67],[32,42],[48,35],[49,72]], "Złote Piaski": [[11,60],[13,29],[18,69],[44,7],[44,55]], "Piramida Pustynnego Władcy p.1": [[9,11],[41,35]], "Piramida Pustynnego Władcy p.2": [[19,24]], "Ruiny Pustynnych Burz": [[22,23],[23,83],[44,70]], "Ciche Rumowiska": [[19,55],[22,3],[26,27],[64,48],[80,47],[85,11]], "Dolina Suchych Łez": [[34,52],[56,12],[61,61],[79,35],[80,16]]},

        "Święty Braciszek": {"Agia Triada": [[10,32],[23,72],[46,22],[58,35],[77,44]], "Klasztor Różanitów - świątynia": [[11,15],[38,15]], "Klasztor Różanitów - wirydarz": [[8,14]], "Klasztor Różanitów - cela opata": [[11,5]], "Klasztor Różanitów - wieża płn.-wsch. p.1": [[6,5]], "Klasztor Różanitów - strych p.1": [[19,20]], "Klasztor Różanitów - strych p.2": [[20,19],[36,20]], "Klasztor Różanitów - kapitularz": [[12,15]], "Klasztor Różanitów - fraternia": [[13,16]], "Klasztor Różanitów - refektarz": [[9,13]], "Klasztor Różanitów - dormitoria": [[3,16]], "Klasztor Różanitów - pomieszczenia gospodarcze": [[11,13]], "Klasztor Różanitów - klasztorny browar": [[11,7]], "Klasztor Różanitów - dzwonnica": [[12,12]], "Archipelag Bremus An": [[10,15],[30,28],[48,35],[75,41]], "Wyspa Rem": [[9,22],[22,55],[25,30],[39,46],[57,8],[82,29]], "Wyspa Caneum": [[23,35],[42,8],[45,54],[57,88],[81,27]], "Wyspa Magradit": [[12,36],[15,78],[60,52],[80,81],[82,36]], "Wyspa Wraków": [[5,89],[15,67],[16,15],[38,32]]},

        "Złoty Roger": {"Latarniane Wybrzeże": [[6,59],[18,31],[21,4],[47,20],[79,55],[87,58]], "Korsarska Nora - sala 1": [[9,15],[23,21]], "Korsarska Nora - sala 2": [[10,25],[20,13],[25,20]], "Korsarska Nora - sala 3": [[13,25],[14,7]], "Korsarska Nora - sala 4": [[15,26],[21,16]], "Korsarska Nora - sala 5": [[23,37],[29,11]], "Korsarska Nora - sala 6": [[12,26],[28,12]], "Ukryta Grota Morskich Diabłów - korytarz": [[21,14]], "Ukryta Grota Morskich Diabłów - arsenał": [[18,10],[19,21]], "Ukryta Grota Morskich Diabłów": [[20,18],[29,38],[46,22]], "Dolina Pustynnych Kręgów": [[3,61],[7,11],[8,29],[28,76],[38,35],[55,11],[58,82]], "Piachy Zniewolonych": [[7,18],[25,42],[47,52],[54,12],[59,28],[90,16]], "Piaszczysta Grota p.1 - sala 1": [[16,42],[27,6],[37,23]], "Ruchome Piaski": [[4,26],[4,59],[8,6],[28,44],[43,16],[80,24],[84,61],[90,3]]},

        "Baca bez Łowiec": {"Wyjący Wąwóz": [[3,36],[5,62],[20,84],[26,80],[27,33],[30,66],[42,38],[46,67],[52,19]], "Wyjąca Jaskinia": [[8,53],[29,37],[45,26],[49,15],[54,57]], "Babi Wzgórek": [[8,8],[8,27],[12,55],[28,17],[37,83],[55,74],[56,3],[57,41]], "Góralska Pieczara p.1": [[11,13],[32,38],[39,26]], "Góralska Pieczara p.2": [[22,38],[23,15],[23,28],[32,14]], "Góralska Pieczara p.3": [[15,32],[21,14],[30,52],[36,28],[50,22],[51,59]], "Góralskie Przejście": [[2,5],[3,45],[17,86],[22,37],[41,90],[45,13],[52,62]]},

        "Czarująca Atalia": {"Wiedźmie Kotłowisko": [[7,45],[12,9],[52,22],[79,12],[91,44]], "Upiorna Droga": [[25,6],[26,39],[65,55],[66,7],[89,22]], "Sabatowe Góry": [[18,55],[32,18],[36,52],[42,14],[52,41]], "Tristam": [[3,56],[14,13],[34,27],[46,11],[59,57],[64,17],[89,35]], "Splądrowana kaplica": [[12,7]], "Ograbiona świątynia": [[7,9],[19,6]], "Splugawiona kaplica": [[6,5]], "Dom Atalii": [[6,9]], "Opuszczone więzienie": [[10,5]], "Dom Amry": [[5,6],[11,8]], "Dom nawiedzonej wiedźmy": [[4,9],[11,5]], "Dom Adariel": [[11,7]], "Dom starej czarownicy": [[16,14],[17,8]], "Dom czarnej magii": [[8,6]], "Magazyn mioteł": [[11,6]], "Lochy Tristam": [[13,48],[30,59],[39,28],[52,48]]},

        "Obłąkany Łowca Orków": {"Orcza Wyżyna": [[4,21],[16,9],[25,40],[35,3],[68,17]], "Grota Orczych Szamanów p.1 s.1": [[14,28],[18,13]], "Grota Orczych Szamanów p.1 s.2": [[9,18],[21,10],[28,16]], "Grota Orczych Szamanów p.2 s.1": [[6,16],[10,23],[12,7]], "Grota Orczych Szamanów p.2 s.2": [[16,8],[18,17],[22,35]], "Osada Czerwonych Orków": [[3,13],[18,40],[21,3],[22,27],[32,45],[42,6],[42,25],[49,37],[52,17],[62,5],[63,12]], "Grota Orczej Hordy p.1 s.1": [[7,7],[16,19],[25,19],[33,28]], "Grota Orczej Hordy p.1 s.2": [[10,12],[21,23],[34,35]], "Grota Orczej Hordy p.2 s.1": [[14,32],[17,9],[39,14]], "Grota Orczej Hordy p.2 s.2": [[15,26],[27,16],[33,39],[34,20]], "Kurhany Zwyciężonych": [[26,53],[63,56],[74,38],[77,14],[83,54]], "Włości rodu Kruzo": [[15,8],[25,36],[29,3]]},

        "Lichwiarz Grauhaz": {"Kryształowa Grota p.1": [[12,11],[33,46],[35,28],[55,6]], "Kryształowa Grota p.2 - sala 1": [[5,25],[27,9],[35,57],[36,40]], "Kryształowa Grota p.2 - sala 2": [[8,36],[33,19],[43,13],[52,40]], "Kryształowa Grota - Sala Smutku": [[13,12],[15,34],[18,23],[32,20]], "Kryształowa Grota p.3 - sala 1": [[10,11],[10,40],[30,33],[50,44]], "Kryształowa Grota p.3 - sala 2": [[9,45],[17,12],[38,40]], "Kryształowa Grota p.4": [[19,54],[38,9],[51,32],[52,56]], "Kryształowa Grota p.5": [[18,32],[19,45],[55,34]], "Kryształowa Grota p.6": [[14,49],[42,50],[46,15]]},

        "Viviana Nandin": {"Grań Gawronich Piór": [[56,31],[87,17],[87,53]], "Ruiny Tass Zhil": [[7,22],[17,49],[20,12],[23,58],[25,25],[29,10],[41,25],[60,37],[63,10],[68,35],[71,20],[73,23],[78,44],[88,9]], "Błota Sham Al": [[9,8],[16,54],[21,17],[41,56],[42,4],[48,14],[56,5]], "Głusza Świstu": [[7,12],[13,12],[24,93],[32,73],[41,11],[50,62],[57,91],[58,20],[59,9],[60,78]], "Las Porywów Wiatru": [[6,13],[29,52],[35,15],[41,37],[49,61]], "Kwieciste Kresy": [[29,55],[51,50],[66,8],[75,11],[76,25],[80,54]]},

        "Przeraza": {"Złudny Trakt": [[22,47],[53,37],[76,13],[7,11]], "Bór Zagubionych": [[9,9],[58,12],[58,53],[24,76],[31,38]], "Martwy Las": [[3,5],[26,39],[93,54],[74,21],[45,24]], "Ziemia Szepczących Cierni": [[19,35],[51,54],[78,51],[62,18],[90,11]], "Zbocze Starych Bogów": [[47,62],[2,79],[36,28],[51,33],[5,24]], "Bezgwiezdna Gęstwina": [[32,81],[41,7],[22,59],[58,27],[50,62]], "Grota Skamieniałej Kory p.1 - sala 1": [[24,18],[10,35]], "Grota Skamieniałej Kory p.1 - sala 2": [[41,29],[6,17],[19,28]], "Grota Skamieniałej Kory p.2": [[17,13],[9,37],[36,36]]},

        "Demonis Pan Nicości": {"Przedsionek Kultu": [[9,9],[26,26]], "Mroczne Komnaty": [[42,26],[52,9]], "Przerażające Sypialnie": [[10,36],[58,20],[59,51]], "Tajemnicza Siedziba": [[9,15],[48,45]], "Sala Spowiedzi Konających": [[7,10],[9,51],[54,51],[57,10]], "Sala Tysiąca Świec": [[9,7],[17,27],[47,30],[72,26],[89,21]], "Lochy Kultu": [[22,31],[45,51],[52,9]], "Sale Rozdzierania": [[11,13],[13,60]], "Korytarz Ostatnich Nadziei": [[24,15],[70,15]]},

        "Mulher Ma": {"Gildia Teologów": [[5,4]], "Zapomniane Sztolnie": [[14,17],[31,34],[29,16]], "Zamierzchłe Arterie p.2 - sala 1": [[31,56],[56,51],[53,35],[31,13]], "Zamierzchłe Arterie p.2 - sala 2": [[10,53],[34,45],[34,20],[52,43]], "Zamierzchłe Arterie p.3": [[10,41],[32,37],[28,18]], "Dawny Przełaz": [[17,19]], "Szczerba Samobójców": [[56,14]], "Zakazana Grota": [[17,8]], "Porzucone Noiridum p.2": [[45,15],[10,23]], "Porzucone Noiridum p.3 - sala 1": [[19,17],[11,13]], "Porzucone Noiridum p.3 - sala 2": [[33,20],[35,40]], "Porzucone Noiridum p.3 - sala 3": [[40,52],[37,17],[52,13]]},

        "Vapor Veneno": {"Zawodzące Kaskady": [[88,6],[59,42],[51,29],[16,24]], "Głuchy Las": [[15,92]], "Strumienie Szemrzących Wód": [[74,40],[7,9],[39,43]], "Skryty Azyl": [[17,77],[7,11],[42,37],[50,18]], "Złota Dąbrowa": [[12,55],[46,29],[27,23]], "Dolina Potoku Śmierci": [[7,45],[53,37],[64,72],[43,13]], "Bagna Umarłych": [[25,79],[14,46],[46,79],[54,25]], "Gnijące Topielisko": [[42,88],[60,36],[20,10]], "Urwisko Vapora": [[14,25],[67,4]], "Dolina Pełznącego Krzyku": [[27,37],[53,4],[11,16]], "Zatrute Torfowiska": [[26,32],[40,49],[53,38],[11,49]], "Grząska Ziemia": [[9,17],[87,9],[52,16],[20,53],[75,49]], "Mglisty Las": [[58,53],[12,40],[44,41],[80,21]]},

        "Dęborożec": {"Urwisko Zdrewniałych": [[11,21],[41,46],[68,14],[80,50]], "Wąwóz Zakorzenionych Dusz": [[85,50],[60,33],[38,13]], "Krzaczasta Grota p.1 - sala 1": [[8,13]], "Krzaczasta Grota p.1 - sala 2": [[11,10]], "Krzaczasta Grota p.1 - sala 3": [[36,22],[19,10]], "Krzaczasta Grota p.2 - sala 1": [[25,13]], "Krzaczasta Grota p.2 - sala 2": [[12,19]], "Krzaczasta Grota p.2 - sala 3": [[24,43],[22,15]], "Regiel Zabłąkanych": [[16,32],[5,60],[71,39]], "Źródło Zakorzenionego Ludu": [[26,31],[25,76],[71,20]], "Jaskinia Korzennego Czaru p.1 - sala 1": [[52,45],[11,49],[39,11]], "Jaskinia Korzennego Czaru p.1 - sala 2": [[30,9],[23,18]], "Jaskinia Korzennego Czaru p.1 - sala 3": [[17,17],[6,24]], "Jaskinia Korzennego Czaru p.1 - sala 4": [[17,17],[52,22],[41,40]], "Jaskinia Korzennego Czaru p.2 - sala 1": [[11,15],[17,8]], "Jaskinia Korzennego Czaru p.2 - sala 2": [[13,11],[17,17]], "Piaskowa Gęstwina": [[34,11],[7,47],[33,33]]},

        "Tepeyollotl": {"Altepetl Mahoptekan": [[45,31],[7,71],[54,5]], "Zachodni Mictlan p.2": [[5,15]], "Zachodni Mictlan p.3": [[3,11],[29,18]], "Zachodni Mictlan p.4": [[20,22],[12,16]], "Zachodni Mictlan p.5": [[7,11]], "Zachodni Mictlan p.6": [[28,17],[4,23]], "Zachodni Mictlan p.7": [[4,6],[28,17]], "Zachodni Mictlan p.8": [[10,15],[24,16]], "Wschodni Mictlan p.2": [[19,8]], "Wschodni Mictlan p.3": [[28,18],[9,17]], "Wschodni Mictlan p.4": [[28,26],[20,15]], "Wschodni Mictlan p.5": [[14,11]], "Wschodni Mictlan p.6": [[10,15],[29,24]], "Wschodni Mictlan p.7": [[29,29],[3,11]], "Wschodni Mictlan p.8": [[23,8],[3,20]], "Topan p.2": [[16,18]], "Topan p.3": [[11,14]], "Topan p.4": [[7,17]], "Topan p.5": [[6,6]], "Topan p.6": [[3,17],[28,17]], "Topan p.7": [[23,26],[9,11]], "Topan p.8": [[12,8]], "Topan p.9": [[3,12],[22,12]], "Niecka Xiuh Atl": [[41,35],[39,5],[39,64]], "Oztotl Tzacua p.1 - sala 2": [[19,17]], "Oztotl Tzacua p.2 - sala 1": [[24,50],[25,11]], "Oztotl Tzacua p.2 - sala 2": [[24,26],[25,57]], "Oztotl Tzacua p.3 - sala 1": [[49,41],[14,20]], "Oztotl Tzacua p.3 - sala 2": [[42,21],[52,40]], "Oztotl Tzacua p.4 - sala 1": [[17,14]], "Oztotl Tzacua p.4 - sala 2": [[12,10]], "Oztotl Tzacua p.5": [[22,10]]},

        "Widmo Triady": {"Potępione Zamczysko": [[6,10],[6,46],[50,60],[53,7],[23,77]], "Potępione Zamczysko - korytarz wejściowy": [[13,11]], "Potępione Zamczysko - lochy zachodnie p.1": [[10,14],[21,30]], "Potępione Zamczysko - lochy wschodnie p.1": [[19,13],[9,30]], "Potępione Zamczysko - sala ofiarna": [[25,24]], "Potępione Zamczysko - korytarz zachodni": [[16,17],[5,13]], "Potępione Zamczysko - korytarz wschodni": [[15,18],[26,13]], "Potępione Zamczysko - zachodnia komnata": [[10,15],[17,7]], "Potępione Zamczysko - wschodnia komnata": [[9,19],[14,13]], "Potępione Zamczysko - lochy zachodnie p.2": [[22,17],[17,39]], "Potępione Zamczysko - lochy wschodnie p.2": [[25,22],[32,7],[7,31]], "Potępione Zamczysko - głębokie lochy": [[13,24]], "Potępione Zamczysko - północna komnata": [[17,14],[15,25]], "Potępione Zamczysko - łącznik wschodni": [[22,22],[42,40]], "Potępione Zamczysko - łącznik zachodni": [[11,23],[33,26],[16,43]], "Zachodnie Zbocze": [[6,42],[58,47],[47,11]], "Plugawe Pustkowie": [[5,53],[45,57],[28,24],[26,77]], "Jęczywąwóz": [[60,75],[41,29],[16,68],[10,10]], "Pogranicze Wisielców": [[1,62],[19,14],[47,48]], "Skalisty Styk": [[48,41],[10,22],[75,35],[61,11],[7,56]], "Zacisze Zimnych Wiatrów": [[14,8],[82,32],[39,51]]},

        "Negthotep Czarny Kapłan": {"Pustynne Katakumby": [[13,7]], "Pustynne Katakumby - sala 1": [[7,23],[10,17]], "Pustynne Katakumby - sala 2": [[8,13],[11,22]], "Komnaty Bezdusznych - sala 1": [[19,35],[23,40],[49,24],[52,14],[71,14]], "Komnaty Bezdusznych - sala 2": [[11,40],[50,29],[69,40],[78,25]], "Katakumby Gwałtownej Śmierci": [[30,31],[46,34]], "Korytarz Porzuconych Marzeń": [[15,13],[16,15]], "Katakumby Opętanych Dusz": [[15,40],[16,20]], "Katakumby Odnalezionych Skrytobójców": [[7,15],[19,20]], "Korytarz Porzuconych Nadziei": [[12,11]], "Wschodni Tunel Jaźni": [[18,13],[26,48],[61,42],[73,20]], "Katakumby Krwawych Wypraw": [[29,26],[38,13]], "Zachodni Tunel Jaźni": [[11,16],[20,37],[35,8],[39,45],[52,10]], "Katakumby Poległych Legionistów": [[21,33],[23,6]], "Grobowiec Seta": [[26,38]]},

        "Młody Smok": {"Pustynia Shaiharrud - zachód": [[4,19],[26,8],[30,90],[52,38],[55,6]], "Sępiarnia": [[7,5]], "Jaskinia Szczęk": [[23,5]], "Jaskinia Piaskowej Burzy s.1": [[16,8]], "Jaskinia Piaskowej Burzy s.2": [[5,20]], "Pustynia Shaiharrud - wschód": [[5,2],[21,76],[24,61],[47,24],[55,62]], "Jurta Nomadzka": [[4,7]], "Jaskinia Odwagi": [[27,11]], "Grota Poświęcenia": [[4,21]], "Świątynia Hebrehotha - przedsionek": [[26,12]], "Smocze Skalisko": [[52,50],[67,23]], "Jaskinia Sępa s.1": [[29,11],[29,41]], "Jaskinia Sępa s.2": [[14,19]], "Urwisko Vapora": [[20,58],[29,46],[64,37]], "Skały Umarłych": [[30,31],[31,87],[54,70],[60,30]]}

    };



    const heroLevels = { "Domina Ecclesiae": "23", "Mietek Żul": "32", "Mroczny Patryk": "35", "Karmazynowy Mściciel": "47", "Złodziej": "50", "Zły Przewodnik": "63", "Piekielny Kościej": "74", "Opętany Paladyn": "85", "Koziec Mąciciel Ścieżek": "95", "Kochanka Nocy": "105", "Książę Kasim": "116", "Święty Braciszek": "127", "Złoty Roger": "135", "Czarująca Atalia": "150", "Obłąkany Łowca Orków": "160", "Baca bez Łowiec": "174", "Lichwiarz Grauhaz": "187", "Viviana Nandin": "195", "Przeraza": "200", "Demonis Pan Nicości": "210", "Mulher Ma": "226", "Vapor Veneno": "237", "Dęborożec": "247", "Tepeyollotl": "260", "Widmo Triady": "275", "Negthotep Czarny Kapłan": "288", "Młody Smok": "300" };



    // Upewnij się, że dla E2/Kolosów masz w bazie właściwość "resp", a nie "coords"!

    // Przykład: {"name": "Mushita", "level": 23, "prof": "Wojownik", "limit": 999, "pvp": "za zgodą", "path": ["Torneg", "Leśna Przełęcz", "Kryjówka Dzikich Kotów", "Grota Dzikiego Kota"], "resp": {"Grota Dzikiego Kota": [[23, 11]]}}

    // ==========================================

    // BAZA DANYCH ELIT II (Zaktualizowana o punkty 'resp')

    // ==========================================

    const elityIIData = [

        {"name": "Mushita", "level": 23, "prof": "Wojownik", "limit": 999, "pvp": "za zgodą", "path": ["Torneg", "Leśna Przełęcz", "Kryjówka Dzikich Kotów", "Grota Dzikiego Kota"], "resp": {"Grota Dzikiego Kota": [[23, 11]]}},

        {"name": "Kotołak Tropiciel", "level": 27, "prof": "Tropiciel", "limit": 999, "pvp": "za zgodą", "path": ["Torneg", "Stare Ruiny", "Dziewicza Knieja", "Las Tropicieli"], "resp": {"Las Tropicieli": [[51, 75]]}},

        {"name": "Shae Phu", "level": 30, "prof": "Mag", "limit": 43, "pvp": "włączone", "path": ["Torneg", "Orla Grań", "Przeklęta Strażnica", "Przeklęta Strażnica - podziemia p.1 s.2", "Przeklęta Strażnica - podziemia p.2 s.2", "Przeklęta Strażnica - podziemia p.2 s.3"], "resp": {"Przeklęta Strażnica - podziemia p.2 s.1": [[25, 24]], "Przeklęta Strażnica - podziemia p.2 s.3": [[29, 19]]}},

        {"name": "Zorg Jednooki Baron", "level": 33, "prof": "Łowca", "limit": 999, "pvp": "za zgodą", "path": ["Eder", "Fort Eder", "Mokradła", "Dolina Rozbójników", "Przełęcz Łotrzyków", "Pagórki Łupieżców", "Schowek na łupy"], "resp": {"Schowek na łupy": [[17, 57]]}},

        {"name": "Władca rzek", "level": 37, "prof": "Mag", "limit": 999, "pvp": "za zgodą", "path": ["Eder", "Fort Eder", "Las Goblinów", "Podmokła Dolina"], "resp": {"Podmokła Dolina": [[9, 11]]}},

        {"name": "Gobbos", "level": 40, "prof": "Tancerz Ostrzy", "limit": 53, "pvp": "włączone", "path": ["Eder", "Fort Eder", "Las Goblinów", "Morwowe Przejście", "Podmokła Dolina", "Jaskinia Pogardy"], "resp": {"Jaskinia Pogardy": [[10, 7]]}},

        {"name": "Tyrtajos", "level": 42, "prof": "Wojownik", "limit": 55, "pvp": "za zgodą", "path": ["Eder", "Gościniec Bardów", "Racicowy Matecznik", "Pieczara Kwiku - sala 1", "Pieczara Kwiku - sala 2"], "resp": {"Pieczara Kwiku - sala 2": [[13, 13]]}},

        {"name": "Szczęt alias Gładki", "level": 47, "prof": "Paladyn", "limit": 999, "pvp": "za zgodą", "path": ["Eder", "Fort Eder", "Ciemnica Szubrawców p.1 - sala 1", "Ciemnica Szubrawców p.1 - sala 2", "Ciemnica Szubrawców p.1 - sala 3", "Stary Kupiecki Trakt"], "resp": {"Stary Kupiecki Trakt": [[12, 75]]}},

        {"name": "Tollok Shimger", "level": 47, "prof": "Łowca", "limit": 999, "pvp": "za zgodą", "path": ["Eder", "Fort Eder", "Mokradła", "Skarpiska Tolloków", "Skalne Turnie"], "resp": {"Skalne Turnie": [[48, 5]]}},

        {"name": "Razuglag Oklash", "level": 51, "prof": "Mag", "limit": 999, "pvp": "za zgodą", "path": ["Ithan", "Zniszczone Opactwo", "Zburzona Twierdza", "Nawiedzony Jar", "Stare Wyrobisko p.4", "Stare Wyrobisko p.3"], "resp": {"Stare Wyrobisko p.3": [[5, 6]]}},

        {"name": "Agar", "level": 51, "prof": "Paladyn", "limit": 64, "pvp": "włączone", "path": ["Ithan", "Zniszczone Opactwo", "Uroczysko", "Zapomniany Szlak", "Mokra Grota", "Mokra Grota p.2"], "resp": {"Mokra Grota p.2": [[18, 38]]}},

        {"name": "Foverk Turrim", "level": 57, "prof": "Tancerz Ostrzy", "limit": 70, "pvp": "włączone", "path": ["Ithan", "Zniszczone Opactwo", "Uroczysko", "Lazurytowa Grota p.1", "Lazurytowa Grota p.2", "Lazurytowa Grota p.3", "Lazurytowa Grota p.4"], "resp": {"Lazurytowa Grota p.4": [[19, 21]]}},

        {"name": "Owadzia Matka", "level": 58, "prof": "Tropiciel", "limit": 71, "pvp": "za zgodą", "path": ["Ithan", "Porzucone Pasieki", "Kopalnia Kapiącego Miodu p.1", "Kopalnia Kapiącego Miodu p.2 - sala 1", "Kopalnia Kapiącego Miodu p.2 - sala Owadziej Matki"], "resp": {"Kopalnia Kapiącego Miodu p.2 - sala Owadziej Matki": [[33, 15]]}},

        {"name": "Vari Kruger", "level": 66, "prof": "Mag", "limit": 79, "pvp": "za zgodą", "path": ["Ithan", "Porzucone Pasieki", "Wioska Pszczelarzy", "Dom Jofusa", "Piwnica Jofusa", "Zakurzone Przejście", "Radosna Polana", "Wioska Gnolli", "Namiot Vari Krugera"], "resp": {"Namiot Vari Krugera": [[4, 4]]}},

        {"name": "Furruk Kozug", "level": 66, "prof": "Mag", "limit": 79, "pvp": "włączone", "path": ["Ithan", "Jaskinia Łowców p.1", "Jaskinia Łowców p.2", "Wioska Gnolli", "Jaskinia Gnollich Szamanów p.2", "Jaskinia Gnollich Szamanów p.3", "Jaskinia Gnollich Szamanów - komnata Kozuga"], "resp": {"Jaskinia Gnollich Szamanów - komnata Kozuga": [[42, 14]]}},

        {"name": "Jotun", "level": 70, "prof": "Wojownik", "limit": 83, "pvp": "włączone", "path": ["Ithan", "Zniszczone Opactwo", "Uroczysko", "Zapomniany Szlak", "Kamienna Jaskinia - sala 1", "Kamienna Jaskinia - sala 3"], "resp": {"Kamienna Jaskinia - sala 3": [[11, 22]]}},

        {"name": "Tollok Atamatu", "level": 73, "prof": "Łowca", "limit": 999, "pvp": "za zgodą", "path": ["Ithan", "Zniszczone Opactwo", "Uroczysko", "Zapomniany Szlak", "Kamienna Jaskinia", "Andarum Ilami", "Zdradzieckie Przejście p.1", "Głębokie Skałki p.1", "Głębokie Skałki p.2", "Głębokie Skałki p.3"], "resp": {"Głębokie Skałki p.3": [[13, 20]]}},

        {"name": "Tollok Utumutu", "level": 73, "prof": "Łowca", "limit": 86, "pvp": "włączone", "path": ["Ithan", "Zniszczone Opactwo", "Uroczysko", "Zapomniany Szlak", "Kamienna Jaskinia", "Andarum Ilami", "Zdradzieckie Przejście p.1", "Głębokie Skałki p.1", "Głębokie Skałki p.2", "Głębokie Skałki p.3", "Głębokie Skałki p.4"], "resp": {"Głębokie Skałki p.4": [[7, 18]]}},

        {"name": "Lisz", "level": 75, "prof": "Mag", "limit": 88, "pvp": "włączone", "path": ["Ithan", "Zniszczone Opactwo", "Uroczysko", "Zapomniany Szlak", "Kamienna Jaskinia", "Andarum Ilami", "Skały Mroźnych Śpiewów", "Cmentarzysko Szerpów", "Krypty Dusz Śniegu p.1", "Krypty Dusz Śniegu p.2", "Krypty Dusz Śniegu p.3 - komnata Lisza"], "resp": {"Krypty Dusz Śniegu p.3 - komnata Lisza": [[16, 18]]}},

        {"name": "Grabarz świątynny", "level": 80, "prof": "Paladyn", "limit": 93, "pvp": "włączone", "path": ["Ithan", "Zniszczone Opactwo", "Uroczysko", "Zapomniany Szlak", "Kamienna Jaskinia", "Andarum Ilami", "Skały Mroźnych Śpiewów", "Erem Czarnego Słońca p.1 - północ", "Erem Czarnego Słońca p.2", "Erem Czarnego Słońca p.3", "Erem Czarnego Słońca p.4 - sala 1", "Erem Czarnego Słońca p.5"], "resp": {"Erem Czarnego Słońca p.5": [[28, 14]]}},

        {"name": "Podły zbrojmistrz", "level": 82, "prof": "Wojownik", "limit": 999, "pvp": "włączone", "path": ["Ithan", "Zniszczone Opactwo", "Uroczysko", "Zapomniany Szlak", "Kamienna Jaskinia", "Andarum Ilami", "Świątynia Andarum", "Świątynia Andarum - podziemia", "Świątynia Andarum - magazyn p.1", "Świątynia Andarum - magazyn p.2", "Świątynia Andarum - zbrojownia"], "resp": {"Świątynia Andarum - zbrojownia": [[25, 5]]}},

        {"name": "Wielka Stopa", "level": 82, "prof": "Mag", "limit": 999, "pvp": "włączone", "path": ["Ithan", "Zniszczone Opactwo", "Uroczysko", "Zapomniany Szlak", "Kamienna Jaskinia", "Andarum Ilami", "Skały Mroźnych Śpiewów", "Firnowa Grota p.2", "Firnowa Grota p.2 s.1"], "resp": {"Firnowa Grota p.2 s.1": [[13, 8]]}},

        {"name": "Choukker", "level": 84, "prof": "Paladyn", "limit": 999, "pvp": "włączone", "path": ["Ithan", "Zniszczone Opactwo", "Zburzona Twierdza", "Nawiedzony Jar", "Mroczny Przesmyk", "Zapomniany Szlak", "Kamienna Jaskinia", "Andarum Ilami", "Zdradzieckie Przejście p.1", "Wylęgarnia Choukkerów p.1", "Wylęgarnia Choukkerów p.2", "Wylęgarnia Choukkerów p.3"], "resp": {"Wylęgarnia Choukkerów p.1": [[40, 19]], "Wylęgarnia Choukkerów p.3": [[21, 19]]}},

        {"name": "Nadzorczyni krasnoludów", "level": 88, "prof": "Wojownik", "limit": 999, "pvp": "włączone", "path": ["Ithan", "Zniszczone Opactwo", "Uroczysko", "Zapomniany Szlak", "Kamienna Jaskinia", "Andarum Ilami", "Zdradzieckie Przejście p.1", "Zdradzieckie Przejście p.2", "Labirynt Margorii", "Kopalnia Margorii"], "resp": {"Kopalnia Margorii": [[28, 54]]}},

        {"name": "Morthen", "level": 89, "prof": "Wojownik", "limit": 102, "pvp": "włączone", "path": ["Ithan", "Zniszczone Opactwo", "Uroczysko", "Zapomniany Szlak", "Kamienna Jaskinia", "Andarum Ilami", "Zdradzieckie Przejście p.1", "Zdradzieckie Przejście p.2", "Labirynt Margorii", "Margoria", "Margoria - Sala Królewska"], "resp": {"Margoria - Sala Królewska": [[21, 11]]}},

        {"name": "Żelazoręki Ohydziarz", "level": 92, "prof": "Paladyn", "limit": 999, "pvp": "włączone", "path": ["Liściaste Rozstaje", "Grota Samotnych Dusz p.3 - sala wyjściowa", "Grota Samotnych Dusz p.3", "Grota Samotnych Dusz p.4", "Grota Samotnych Dusz p.5", "Grota Samotnych Dusz p.6"], "resp": {"Grota Samotnych Dusz p.6": [[43, 14]]}},

        {"name": "Leśne Widmo", "level": 92, "prof": "Tropiciel", "limit": 999, "pvp": "włączone", "path": ["Trupia Przełęcz", "Księżycowe Wzniesienie", "Zapomniany Święty Gaj p.1", "Zapomniany Święty Gaj p.1 - sala 1", "Zapomniany Święty Gaj p.2", "Zapomniany Święty Gaj p.3"], "resp": {"Zapomniany Święty Gaj p.3": [[20, 16]]}},

        {"name": "Goplana", "level": 93, "prof": "Paladyn", "limit": 106, "pvp": "włączone", "path": ["Trupia Przełęcz", "Kamienna Strażnica - wsch. baszta p.1", "Kamienna Strażnica - wsch. baszta skalna sala p.1", "Kamienna Strażnica - wsch. baszta zasypany tunel", "Kamienna Strażnica - tunel", "Kamienna Strażnica - Sanktuarium"], "resp": {"Kamienna Strażnica - Sanktuarium": [[12, 7]]}},

        {"name": "Gnom Figlid", "level": 96, "prof": "Mag", "limit": 999, "pvp": "włączone", "path": ["Mythar", "Złowrogie Bagna", "Zagrzybiałe Ścieżki p.1 - sala 1", "Zagrzybiałe Ścieżki p.2", "Zagrzybiałe Ścieżki p.3"], "resp": {"Zagrzybiałe Ścieżki p.3": [[21, 20]]}},

        {"name": "Centaur Zyfryd", "level": 99, "prof": "Łowca", "limit": 999, "pvp": "włączone", "path": ["Mythar", "Zawiły Bór", "Iglaste Ścieżki", "Dolina Centaurów"], "resp": {"Dolina Centaurów": [[47, 25]]}},

        {"name": "Kambion", "level": 101, "prof": "Tancerz Ostrzy", "limit": 114, "pvp": "włączone", "path": ["Mythar", "Złowrogie Bagna", "Las Dziwów", "Namiot Kambiona"], "resp": {"Namiot Kambiona": [[10, 6]]}},

        {"name": "Jertek Moxos", "level": 105, "prof": "Paladyn", "limit": 118, "pvp": "włączone", "path": ["Mythar", "Smocze Góry", "Przełaz olbrzymów", "Selva Oscura", "Ruiny Wieży Magów - przedsionek", "Podziemia Zniszczonej Wieży p.2", "Podziemia Zniszczonej Wieży p.3", "Podziemia Zniszczonej Wieży p.4", "Podziemia Zniszczonej Wieży p.5"], "resp": {"Podziemia Zniszczonej Wieży p.5": [[19, 23]]}},

        {"name": "Miłośnik łowców", "level": 108, "prof": "Łowca", "limit": 999, "pvp": "włączone", "path": ["Mythar", "Zawiły Bór", "Zabłocona Jama p.1 - sala 1", "Zabłocona Jama p.2 - sala 1", "Zabłocona Jama p.2 - Sala Duszącej Stęchlizny"], "resp": {"Zabłocona Jama p.2 - Sala Duszącej Stęchlizny": [[33, 31]]}},

        {"name": "Miłośnik rycerzy", "level": 108, "prof": "Wojownik", "limit": 999, "pvp": "włączone", "path": ["Mythar", "Zawiły Bór", "Zabłocona Jama p.1 - sala 1", "Zabłocona Jama p.2 - sala 1", "Zabłocona Jama p.2 - sala 2", "Zabłocona Jama p.2 - Sala Błotnistych Odmętów"], "resp": {"Zabłocona Jama p.2 - Sala Błotnistych Odmętów": [[30, 42]]}},

        {"name": "Miłośnik magii", "level": 108, "prof": "Mag", "limit": 999, "pvp": "włączone", "path": ["Mythar", "Zawiły Bór", "Zabłocona Jama p.1 - sala 1", "Zabłocona Jama p.2 - sala 1", "Zabłocona Jama p.2 - sala 2", "Zabłocona Jama p.2 - sala 3", "Zabłocona Jama p.2 - Sala Magicznego Błota"], "resp": {"Zabłocona Jama p.2 - Sala Magicznego Błota": [[39, 15]]}},

        {"name": "Łowca czaszek", "level": 112, "prof": "Łowca", "limit": 125, "pvp": "włączone", "path": ["Trupia Przełęcz", "Płaskowyż Arpan", "Skalne Cmentarzysko p.1", "Skalne Cmentarzysko p.2", "Skalne Cmentarzysko p.3", "Skalne Cmentarzysko p.4"], "resp": {"Skalne Cmentarzysko p.4": [[25, 14]]}},

        {"name": "Ozirus Władca Hieroglifów", "level": 115, "prof": "Mag", "limit": 999, "pvp": "za zgodą", "path": ["Trupia Przełęcz", "Płaskowyż Arpan", "Złote Piaski", "Piramida Pustynnego Władcy p.1", "Piramida Pustynnego Władcy p.2", "Piramida Pustynnego Władcy p.3"], "resp": {"Piramida Pustynnego Władcy p.3": [[22, 13]]}},

        {"name": "Morski potwór", "level": 118, "prof": "Tropiciel", "limit": 999, "pvp": "włączone", "path": ["Tuzmer", "Port Tuzmer", "Archipelag Bremus An", "Jama Morskiej Macki p.1 - sala 1", "Jama Morskiej Macki p.1 - sala 2", "Jama Morskiej Macki p.1 - sala 3"], "resp": {"Jama Morskiej Macki p.1 - sala 3": [[9, 12]]}},

        {"name": "Krab pustelnik", "level": 124, "prof": "Tancerz Ostrzy", "limit": 137, "pvp": "włączone", "path": ["Tuzmer", "Port Tuzmer", "Kapitan Fork la Rush", "Wyspa Rem", "Opuszczony statek - pokład pod rufą"], "resp": {"Opuszczony statek - pokład pod rufą": [[7, 7]], "Wyspa Rem": [[63, 33]]}},

        {"name": "Borgoros Garamir III", "level": 124, "prof": "Wojownik", "limit": 999, "pvp": "włączone", "path": ["Tuzmer", "Port Tuzmer", "Wyspa Ingotia", "Korytarze Wygnańców p.1 - Sala Ech", "Korytarze Wygnańców p.2 - Sala Żądzy - Komnata Przeklętego Daru", "Twierdza Rogogłowych - Sala Byka"], "resp": {"Twierdza Rogogłowych - Sala Byka": [[16, 7]]}},

        {"name": "Stworzyciel", "level": 125, "prof": "Tancerz Ostrzy", "limit": 999, "pvp": "włączone", "path": ["Tuzmer", "Port Tuzmer", "Wyspa Caneum", "Piaskowy wir", "Piaskowa Pułapka p.1 - sala 2", "Piaskowa Pułapka - Grota Piaskowej Śmierci"], "resp": {"Piaskowa Pułapka - Grota Piaskowej Śmierci": [[22, 10]]}},

        {"name": "Ifryt", "level": 128, "prof": "Mag", "limit": 999, "pvp": "włączone", "path": ["Tuzmer", "Port Tuzmer", "Magradit", "Magradit - Góra Ognia", "Wulkan Politraki p.2 - sala 1", "Wulkan Politraki p.2 - sala 2", "Wulkan Politraki p.1 - sala 3"], "resp": {"Wulkan Politraki p.1 - sala 3": [[10, 51]]}},

        {"name": "Henry Kaprawe Oko", "level": 131, "prof": "Paladyn", "limit": 999, "pvp": "włączone", "path": ["Tuzmer", "Port Tuzmer", "Latarniane Wybrzeże", "Ukryta Grota Morskich Diabłów", "Ukryta Grota Morskich Diabłów - skarbiec"], "resp": {"Ukryta Grota Morskich Diabłów - skarbiec": [[14, 14]]}},

        {"name": "Helga Opiekunka Rumu", "level": 131, "prof": "Tropiciel", "limit": 999, "pvp": "włączone", "path": ["Tuzmer", "Port Tuzmer", "Latarniane Wybrzeże", "Ukryta Grota Morskich Diabłów", "Ukryta Grota Morskich Diabłów - siedziba"], "resp": {"Ukryta Grota Morskich Diabłów - siedziba": [[15, 23]]}},

        {"name": "Młody Jack Truciciel", "level": 131, "prof": "Wojownik", "limit": 144, "pvp": "włączone", "path": ["Tuzmer", "Port Tuzmer", "Latarniane Wybrzeże", "Ukryta Grota Morskich Diabłów", "Ukryta Grota Morskich Diabłów - magazyn"], "resp": {"Ukryta Grota Morskich Diabłów - magazyn": [[25, 16]]}},

        {"name": "Eol", "level": 135, "prof": "Łowca", "limit": 148, "pvp": "włączone", "path": ["Tuzmer", "Ruchome Piaski", "Piachy Zniewolonych", "Piaszczysta Grota p.1 - sala 1", "Piaszczysta Grota p.1 - sala 2"], "resp": {"Piaszczysta Grota p.1 - sala 2": [[12, 8]]}},

        {"name": "Grubber Ochlaj", "level": 136, "prof": "Wojownik", "limit": 999, "pvp": "włączone", "path": ["Tuzmer", "Stare Sioło", "Sucha Dolina", "Dolina Pustynnych Kręgów", "Kopalnia Żółtego Kruszcu p.1 - sala 1", "Kopalnia Żółtego Kruszcu p.2 - sala 1", "Kopalnia Żółtego Kruszcu p.2 - sala 2"], "resp": {"Kopalnia Żółtego Kruszcu p.2 - sala 2": [[15, 10]]}},

        {"name": "Mistrz Worundriel", "level": 139, "prof": "Paladyn", "limit": 152, "pvp": "włączone", "path": ["Liściaste Rozstaje", "Sosnowe Odludzie", "Podziemne Rozpadliny", "Kuźnia Worundriela p.1", "Kuźnia Worundriela p.2", "Kuźnia Worundriela p.3", "Kuźnia Worundriela - Komnata Żaru"], "resp": {"Kuźnia Worundriela - Komnata Żaru": [[24, 31]]}},

        {"name": "Wójt Fistuła", "level": 144, "prof": "Tancerz Ostrzy", "limit": 999, "pvp": "za zgodą", "path": ["Liściaste Rozstaje", "Jezioro Ważek", "Góralskie Przejście", "Chata wójta Fistuły", "Chata wójta Fistuły p.1"], "resp": {"Chata wójta Fistuły p.1": [[13, 7]]}},

        {"name": "Teściowa Rumcajsa", "level": 145, "prof": "Mag", "limit": 999, "pvp": "włączone", "path": ["Liściaste Rozstaje", "Jezioro Ważek", "Góralskie Przejście", "Babi Wzgórek", "Chata Teściowej"], "resp": {"Chata Teściowej": [[13, 7]]}},

        {"name": "Berserker Amuno", "level": 148, "prof": "Wojownik", "limit": 999, "pvp": "włączone", "path": ["Werbin", "Brama Północy", "Zaginiona Dolina", "Grobowiec Przodków", "Cenotaf Berserkerów - przejście przodków", "Cenotaf Berserkerów p.1 - sala 1", "Cenotaf Berserkerów p.1 - sala 2"], "resp": {"Cenotaf Berserkerów p.1 - sala 2": [[23, 13]]}},

        {"name": "Fodug Zolash", "level": 150, "prof": "Mag", "limit": 163, "pvp": "włączone", "path": ["Werbin", "Brama Północy", "Zaginiona Dolina", "Opuszczona Twierdza", "Mała Twierdza - sala wejściowa", "Mała Twierdza - sala główna"], "resp": {"Mała Twierdza - sala główna": [[16, 5]]}},

        {"name": "Goons Asterus", "level": 154, "prof": "Łowca", "limit": 167, "pvp": "włączone", "path": ["Werbin", "Brama Północy", "Włości rodu Kruzo", "Lokum Złych Goblinów - wieża", "Lokum Złych Goblinów - zejście p.1", "Lokum Złych Goblinów p.2 - sala 1", "Lokum Złych Goblinów p.2 - sala 2", "Lokum Złych Goblinów - warsztat"], "resp": {"Lokum Złych Goblinów - warsztat": [[18, 11]]}},

        {"name": "Adariel", "level": 155, "prof": "Mag", "limit": 999, "pvp": "włączone", "path": ["Werbin", "Orcza Wyżyna", "Wiedźmie Kotłowisko", "Upiorna Droga", "Sabatowe Góry", "Tristam", "Opuszczone Więzienie", "Lochy Tristam", "Laboratorium Adariel"], "resp": {"Laboratorium Adariel": [[20, 25]]}},

        {"name": "Sheba Orcza Szamanka", "level": 160, "prof": "Mag", "limit": 999, "pvp": "włączone", "path": ["Werbin", "Orcza Wyżyna", "Grota Orczych Szamanów p.1 s.1", "Grota Orczych Szamanów p.3 s.1"], "resp": {"Grota Orczych Szamanów p.3 s.1": [[16, 10]]}},

        {"name": "Burkog Lorulk", "level": 160, "prof": "Wojownik", "limit": 173, "pvp": "włączone", "path": ["Werbin", "Orcza Wyżyna", "Osada Czerwonych Orków", "Grota Orczej Hordy p.1 s.2", "Grota Orczej Hordy p.2 s.1", "Grota Orczej Hordy p.2 s.2", "Grota Orczej Hordy p.2 s.3"], "resp": {"Grota Orczej Hordy p.2 s.3": [[19, 16]]}},

        {"name": "Shakkru", "level": 160, "prof": "Nieznana", "limit": 999, "pvp": "włączone", "path": ["Werbin", "Orcza Wyżyna", "Grota Orczych Szamanów p.3 s.1"], "resp": {"Grota Orczych Szamanów p.3 s.1": [[12, 4]]}},

        {"name": "Duch Władcy Klanów", "level": 165, "prof": "Paladyn", "limit": 999, "pvp": "włączone", "path": ["Werbin", "Brama Północy", "Włości rodu Kruzo", "Osada Czerwonych Orków", "Kurhany Zwyciężonych", "Nawiedzone Komnaty - przedsionek", "Nawiedzone Kazamaty p.1 s.2", "Nawiedzone Kazamaty p.2 s.2", "Nawiedzone Kazamaty p.3 s.2", "Nawiedzone Kazamaty p.4"], "resp": {"Nawiedzone Kazamaty p.4": [[15, 30]]}},

        {"name": "Bragarth Myśliwy Dusz", "level": 170, "prof": "Łowca", "limit": 999, "pvp": "włączone", "path": ["Werbin", "Orcza Wyżyna", "Osada Czerwonych Orków", "Kurhany Zwyciężonych", "Nawiedzone Komnaty - przedsionek", "Sala Dowódcy Orków", "Sala Rady Orków"], "resp": {"Sala Rady Orków": [[22, 26]]}},

        {"name": "Fursharag Pożeracz Umysłów", "level": 170, "prof": "Nieznana", "limit": 999, "pvp": "włączone", "path": ["Sala Rady Orków"], "resp": {"Sala Rady Orków": [[9, 10]]}},

        {"name": "Ziuggrael Strażnik Królowej", "level": 170, "prof": "Nieznana", "limit": 999, "pvp": "włączone", "path": ["Sala Rady Orków"], "resp": {"Sala Rady Orków": [[40, 7]]}},

        {"name": "Królowa Śniegu", "level": 175, "prof": "Mag", "limit": 999, "pvp": "włączone", "path": ["Karka-han", "Przedmieścia Karka-han", "Przełęcz Dwóch Koron", "Kryształowa Grota p.1", "Kryształowa Grota p.2 - sala 1", "Kryształowa Grota - Sala Smutku"], "resp": {"Kryształowa Grota - Sala Smutku": [[21, 9]]}},

        {"name": "Lusgrathera Królowa Pramatka", "level": 175, "prof": "Mag", "limit": 999, "pvp": "włączone", "path": ["Werbin", "Orcza Wyżyna", "Osada Czerwonych Orków", "Kurhany Zwyciężonych", "Nawiedzone Komnaty - przedsionek", "Sala Dowódcy Orków", "Sala Rady Orków", "Sala Królewska"], "resp": {"Sala Królewska": [[22, 23]]}},

        {"name": "Wrzosera", "level": 177, "prof": "Wojownik", "limit": 190, "pvp": "włączone", "path": ["Thuzal", "Grań Gawronich Piór", "Błota Sham Al", "Głusza Świstu", "Drzewo Dusz p.1", "Drzewo Dusz p.2"], "resp": {"Drzewo Dusz p.2": [[11, 48]]}},

        {"name": "Chryzoprenia", "level": 177, "prof": "Nieznana", "limit": 999, "pvp": "włączone", "path": ["Drzewo Dusz p.2"], "resp": {"Drzewo Dusz p.2": [[29, 8]]}},

        {"name": "Cantedewia", "level": 177, "prof": "Nieznana", "limit": 999, "pvp": "włączone", "path": ["Drzewo Dusz p.2"], "resp": {"Drzewo Dusz p.2": [[49, 21]]}},

        {"name": "Ogr Stalowy Pazur", "level": 183, "prof": "Tancerz Ostrzy", "limit": 999, "pvp": "za zgodą", "path": ["Thuzal", "Grań Gawronich Piór", "Ogrza Kawerna p.1", "Ogrza Kawerna p.2", "Ogrza Kawerna p.3", "Ogrza Kawerna p.4"], "resp": {"Ogrza Kawerna p.4": [[16, 10]]}},

        {"name": "Torunia Ankelwald", "level": 186, "prof": "Paladyn", "limit": 999, "pvp": "włączone", "path": ["Thuzal", "Grań Gawronich Piór", "Błota Sham Al", "Ruiny Tass Zhil", "Krypty Bezsennych p.1 s.1", "Krypty Bezsennych p.2 s.1", "Krypty Bezsennych p.3"], "resp": {"Krypty Bezsennych p.3": [[17, 5]]}},

        {"name": "Pięknotka Mięsożerna", "level": 189, "prof": "Łowca", "limit": 999, "pvp": "włączone", "path": ["Thuzal", "Grań Gawronich Piór", "Lazurowe Wzgórze", "Kwieciste Przejście", "Głuchy Las", "Skarpa Trzech Słów"], "resp": {"Skarpa Trzech Słów": [[28, 38]]}},

        {"name": "Breheret Żelazny Łeb", "level": 192, "prof": "Wojownik", "limit": 999, "pvp": "włączone", "path": ["Thuzal", "Żołnierski Korytarz", "Szczerba Samobójców", "Przysiółek Valmirów"], "resp": {"Przysiółek Valmirów": [[29, 11]]}},

        {"name": "Cerasus", "level": 193, "prof": "Łowca", "limit": 206, "pvp": "włączone", "path": ["Nithal", "Podgrodzie Nithal", "Nizina Wieśniaków", "Zbocze Starych Bogów", "Bezgwiezdna Gęstwina", "Martwy Las", "Starodrzew Przedwiecznych p.1", "Starodrzew Przedwiecznych p.2"], "resp": {"Starodrzew Przedwiecznych p.2": [[10, 17]]}},

        {"name": "Mysiur Myświórowy Król", "level": 197, "prof": "Mag", "limit": 999, "pvp": "włączone", "path": ["Nithal", "Izba chorych płn", "Izba chorych płn. - piwnica p1", "Izba chorych płn. - piwnica p2", "Izba chorych płn. - piwnica p3", "Izba chorych - piwniczne przejście", "Kanały Nithal p.1 - sala 1", "Kanały Nithal p.1 - sala 3", "Szlamowe Kanały p.2 - sala 1", "Szlamowe Kanały p.2 - sala 3"], "resp": {"Szlamowe Kanały p.2 - sala 3": [[19, 7]]}},

        {"name": "Sadolia Nadzorczyni Hurys", "level": 200, "prof": "Tancerz Ostrzy", "limit": 999, "pvp": "włączone", "path": ["Nithal", "Izba chorych płn", "Izba chorych płn. - piwnica p1", "Izba chorych płn. - piwnica p2", "Izba chorych płn. - piwnica p3", "Izba chorych - piwniczne przejście", "Kanały Nithal p.1 - sala 1", "Kanały Nithal p.1 - sala 3", "Szlamowe Kanały p.2 - sala 1", "Przedsionek Kultu", "Przerażające Sypialnie"], "resp": {"Przerażające Sypialnie": [[18, 11]]}},

        {"name": "Bergermona Krwawa Hrabina", "level": 204, "prof": "Tropiciel", "limit": 999, "pvp": "włączone", "path": ["Nithal", "Izba chorych płn", "Izba chorych płn. - piwnica p1", "Izba chorych płn. - piwnica p2", "Izba chorych płn. - piwnica p3", "Izba chorych - piwniczne przejście", "Kanały Nithal p.1 - sala 1", "Kanały Nithal p.1 - sala 3", "Szlamowe Kanały p.2 - sala 1", "Przedsionek Kultu", "Przerażające Sypialnie", "Mroczne Komnaty", "Tajemnicza Siedziba", "Lochy Kultu", "Sale Rozdzierania"], "resp": {"Sale Rozdzierania": [[43, 60]]}},

        {"name": "Sataniel Skrytobójca", "level": 204, "prof": "Łowca", "limit": 217, "pvp": "włączone", "path": ["Nithal", "Izba chorych płn", "Izba chorych płn. - piwnica p1", "Izba chorych płn. - piwnica p2", "Izba chorych płn. - piwnica p3", "Izba chorych - piwniczne przejście", "Kanały Nithal p.1 - sala 1", "Kanały Nithal p.1 - sala 3", "Szlamowe Kanały p.2 - sala 1", "Przedsionek Kultu", "Przerażające Sypialnie", "Mroczne Komnaty", "Tajemnicza Siedziba", "Sala Spowiedzi Konających", "Przejście Oczyszczenia", "Sala Skaryfikacji Grzeszników"], "resp": {"Sala Skaryfikacji Grzeszników": [[20, 14]]}},

        {"name": "Annaniel Wysysacz Marzeń", "level": 204, "prof": "Mag", "limit": 999, "pvp": "włączone", "path": ["Nithal", "Izba chorych płn", "Izba chorych płn. - piwnica p1", "Izba chorych płn. - piwnica p2", "Izba chorych płn. - piwnica p3", "Izba chorych - piwniczne przejście", "Kanały Nithal p.1 - sala 1", "Kanały Nithal p.1 - sala 3", "Szlamowe Kanały p.2 - sala 1", "Przedsionek Kultu", "Przerażające Sypialnie", "Mroczne Komnaty", "Tajemnicza Siedziba"], "resp": {"Tajemnicza Siedziba": [[26, 22]]}},

        {"name": "Gothardus Kolekcjoner Głów", "level": 204, "prof": "Wojownik", "limit": 999, "pvp": "włączone", "path": ["Nithal", "Izba chorych płn", "Izba chorych płn. - piwnica p1", "Izba chorych płn. - piwnica p2", "Izba chorych płn. - piwnica p3", "Izba chorych - piwniczne przejście", "Kanały Nithal p.1 - sala 1", "Kanały Nithal p.1 - sala 3", "Szlamowe Kanały p.2 - sala 1", "Przedsionek Kultu", "Przerażające Sypialnie", "Mroczne Komnaty", "Tajemnicza Siedziba"], "resp": {"Tajemnicza Siedziba": [[44, 22]]}},

        {"name": "Zufulus Smakosz Serc", "level": 205, "prof": "Mag", "limit": 999, "pvp": "włączone", "path": ["Nithal", "Izba chorych płd.", "Izba chorych płd. - piwnica p.1", "Izba- piwniczne przejście", "Kanały Nithal", "Szlamowe kanały", "Przedsionek Kultu", "Mroczne Komnaty", "Tajemnicza Siedziba", "Sala Spowiedzi Konających", "Sala Tysiąca Świec"], "resp": {"Sala Tysiąca Świec": [[47, 30]]}},

        {"name": "Czempion Furboli", "level": 210, "prof": "Wojownik", "limit": 999, "pvp": "włączone", "path": ["Torneg", "Zapomniany Las", "Terytorium Furii", "Dolina Gniewu", "Zalana Grota"], "resp": {"Zalana Grota": [[16, 9]]}},

        {"name": "Arachniregina Colosseus", "level": 214, "prof": "Tancerz Ostrzy", "limit": 227, "pvp": "za zgodą", "path": ["Torneg", "Zapomniany Las", "Terytorium Furii", "Zapadlisko Zniewolonych", "Pajęczy las", "Otchłań Pajęczych Sieci", "Dolina Pajęczych Korytarzy", "Arachnitopia p1", "Arachnitopia p2", "Arachnitopia p3", "Arachnitopia p4", "Arachnitopia p.5", "Arachnitopia p.6"], "resp": {"Arachnitopia p.6": [[12, 14]]}},

        {"name": "Rycerz z za małym mieczem", "level": 214, "prof": "Nieznana", "limit": 999, "pvp": "włączone", "path": ["Arachnitopia p.6"], "resp": {"Arachnitopia p.6": [[8, 9]]}},

        {"name": "Al'diphrin Ilythirahel", "level": 218, "prof": "Mag", "limit": 231, "pvp": "włączone", "path": ["Thuzal", "Żołnierski korytarz", "Zakazana Grota", "Porzucone Noiridum p.2", "Porzucone Noiridum p.3 - sala 1", "Porzucone Noiridum p.3 - sala 2", "Porzucone Noiridum p.3 - sala 3", "Erem Aldiphrina"], "resp": {"Erem Aldiphrina": [[23, 11]]}},

        {"name": "Marlloth Malignitas", "level": 220, "prof": "Tancerz Ostrzy", "limit": 999, "pvp": "włączone", "path": ["Thuzal", "Gildia Teologów", "Gildia Teologów - korytarz za ołtarzem", "Gildia Teologów - przejście do jaskiń", "Zapomniane Sztolnie", "Zamierzchłe Arterie p.2 - sala 1", "Ołtarz Pajęczej Bogini"], "resp": {"Ołtarz Pajęczej Bogini": [[29, 14]]}},

        {"name": "Arytodam olbrzymi", "level": 226, "prof": "Paladyn", "limit": 999, "pvp": "włączone", "path": ["Liściaste Rozstaje", "Zapomniana Ścieżyna", "Mglisty Las", "Grząska Ziemia", "Gnijące Topielisko"], "resp": {"Gnijące Topielisko": [[27, 58]]}},

        {"name": "Mocny Maddoks", "level": 231, "prof": "Mag", "limit": 244, "pvp": "włączone", "path": ["Thuzal", "Grań Gawronich Piór", "Lazurowe Wzgórze", "Kwieciste Przejście", "Złudny Trakt", "Złota Dąbrowa", "Strumienie Szemrzących Wód", "Jaszczurze Korytarze p.1 - sala 4", "Jaszczurze Korytarze p.2 - sala 2", "Jaszczurze Korytarze p.2 - sala 4", "Jaszczurze Korytarze p.2 - sala 5"], "resp": {"Jaszczurze Korytarze p.2 - sala 5": [[9, 9]]}},

        {"name": "Fangaj", "level": 235, "prof": "Łowca", "limit": 999, "pvp": "za zgodą", "path": ["Karka-han", "Prastara Puszcza", "Zalesiony Step", "Garb Połamanych Konarów", "Gardziel Podgnitych Mchów p.1", "Gardziel Podgnitych Mchów p.2", "Gardziel Podgnitych Mchów p.3"], "resp": {"Gardziel Podgnitych Mchów p.3": [[33, 33]]}},

        {"name": "Dendroculus", "level": 240, "prof": "Wojownik", "limit": 999, "pvp": "włączone", "path": ["Tuzmer", "Stare Sioło", "Piachy Zniewolonych", "Piaskowa Gęstwina", "Źródło Zakorzenionego Ludu", "Jaskinia Korzennego Czaru p.2 - sala 1", "Jaskinia Korzennego Czaru p.1 - sala 1", "Jaskinia Korzennego Czaru p.1 - sala 2", "Jaskinia Korzennego Czaru p.1 - sala 4", "Jaskinia Korzennego Czaru p.2 - sala 2", "Jaskinia Korzennego Czaru p.1 - sala 1", "Źródło Zakorzenionego Ludu"], "resp": {"Źródło Zakorzenionego Ludu": [[35, 46]]}},

        {"name": "Tolypeutes", "level": 245, "prof": "Wojownik", "limit": 258, "pvp": "włączone", "path": ["Mythar", "Urwisko Zdrewniałych", "Dolina Chmur", "Złota Góra p.2 - sala 3", "Złota Góra p.2 - sala 4", "Złota Góra p.3 - sala 2"], "resp": {"Złota Góra p.3 - sala 2": [[5, 6]]}},

        {"name": "Cuaitl Citlalin", "level": 250, "prof": "Wojownik", "limit": 999, "pvp": "włączone", "path": ["Mythar", "Urwisko Zdrewniałych", "Dolina Chmur", "Niecka Xiuh Atl", "Chantli Cuaitla Citlalina"], "resp": {"Chantli Cuaitla Citlalina": [[13, 8]]}},

        {"name": "Yaotl", "level": 258, "prof": "Łowca", "limit": 271, "pvp": "włączone", "path": ["Trupia Przełęcz", "Niecka Xiuh Atl", "Altepetl Mahoptekan", "Zachodni Mictlan p.1", "Zachodni Mictlan p.2", "Zachodni Mictlan p.3", "Zachodni Mictlan p.4", "Zachodni Mictlan p.5", "Zachodni Mictlan p.6", "Zachodni Mictlan p.7", "Zachodni Mictlan p.8", "Zachodni Mictlan p.9"], "resp": {"Zachodni Mictlan p.9": [[7, 10]]}},

        {"name": "Quetzalcoatl", "level": 258, "prof": "Mag", "limit": 999, "pvp": "włączone", "path": ["Trupia przełęcz", "Niecka Xiuh Atl", "Altepetl Mahoptekan", "Wschodni Mictlan p.1", "Wschodni Mictlan p.2", "Wschodni Mictlan p.3", "Wschodni Mictlan p.4", "Wschodni Mictlan p.5", "Wschodni Mictlan p.6", "Wschodni Mictlan p.7", "Wschodni Mictlan p.8", "Wschodni Mictlan p.9"], "resp": {"Wschodni Mictlan p.9": [[11, 9]]}},

        {"name": "Wabicielka", "level": 260, "prof": "Tancerz Ostrzy", "limit": 999, "pvp": "włączone", "path": ["Werbin", "Orcza Wyżyna", "Upiorna Droga", "Pogranicze Wisielców", "Jęczywąwóz", "Skalisty Styk", "Zacisze Zimnych Wiatrów", "Siedlisko Przyjemnej Woni", "Siedlisko Przyjemnej Woni - źródło"], "resp": {"Siedlisko Przyjemnej Woni - źródło": [[19, 13]]}},

        {"name": "Pogardliwa Sybilla", "level": 263, "prof": "Mag", "limit": 999, "pvp": "za zgodą", "path": ["Werbin", "Orcza Wyżyna", "Upiorna Droga", "Wiedźmie Kotłowisko", "Sabatowe Góry", "Tristam", "Potępione Zamczysko", "Potępione Zamczysko - korytarz wejściowy", "Potępione Zamczysko - sala ofiarna", "Potępione Zamczysko - pracownia"], "resp": {"Potępione Zamczysko - pracownia": [[10, 10]]}},

        {"name": "Chopesz", "level": 267, "prof": "Tancerz Ostrzy", "limit": 999, "pvp": "włączone", "path": ["Tuzmer", "Stare Sioło", "Sucha Dolina", "Płaskowyż Arpan", "Oaza Siedmiu Wichrów", "Ruiny Pustynnych Burz", "Pustynne Katakumby", "Pustynne Katakumby - sala 2", "Komnaty Bezdusznych - sala 1", "Komnaty Bezdusznych - sala 2", "Katakumby Gwałtownej Śmierci"], "resp": {"Katakumby Gwałtownej Śmierci": [[36, 39]]}},

        {"name": "Neferkar Set", "level": 274, "prof": "Wojownik", "limit": 999, "pvp": "włączone", "path": ["Tuzmer", "Stare Sioło", "Sucha Dolina", "Płaskowyż Arpan", "Oaza Siedmiu Wichrów", "Ruiny Pustynnych Burz", "Pustynne Katakumby", "Pustynne Katakumby - sala 2", "Komnaty Bezdusznych - sala 1", "Komnaty Bezdusznych - sala 2", "Katakumby Gwałtownych Śmierci", "Wschodni Tunel Jaźni", "Korytarz Porzuconych Nadziei", "Zachodni Tunel Jaźni", "Katakumby Poległych Legionistów", "Grobowiec Seta"], "resp": {"Grobowiec Seta": [[48, 57]]}},

        {"name": "Chaegd Agnrakh", "level": 280, "prof": "Wojownik", "limit": 999, "pvp": "włączone", "path": ["Tuzmer", "Port Tuzmer", "Wioska Rybacka", "Ciche Rumowiska", "Dolina Suchych Łez", "Skały Umarłych", "Smocze Skalisko", "Jaskinia Próby", "Jaskinia Odwagi", "Smocze Skalisko", "Pustynia Shaiharrud - zachód", "Pustynia Schaiharrud - wschód", "Świątynia Hebrehotha - przedsionek", "Świątynia Hebrehotha - sala ofiary", "Świątynia Hebrehotha - sala czciciela"], "resp": {"Świątynia Hebrehotha - sala czciciela": [[24, 22]]}},

        {"name": "Vaenra Charkhaam", "level": 280, "prof": "Mag", "limit": 999, "pvp": "włączone", "path": ["Tuzmer", "Port Tuzmer", "Wioska Rybacka", "Ciche Rumowiska", "Dolina Suchych Łez", "Skały Umarłych", "Smocze Skalisko", "Jaskinia Próby", "Jaskinia Odwagi", "Smocze Skalisko", "Pustynia Shaiharrud - zachód", "Pustynia Schaiharrud - wschód", "Świątynia Hebrehotha - przedsionek", "Świątynia Hebrehotha - sala ofiary"], "resp": {"Świątynia Hebrehotha - sala ofiary": [[26, 24]]}},

        {"name": "Terrozaur", "level": 280, "prof": "Tancerz Ostrzy", "limit": 293, "pvp": "włączone", "path": ["Tuzmer", "Port Tuzmer", "Wioska Rybacka", "Ciche Rumowiska", "Dolina Suchych Łez", "Skały Umarłych", "Pustynia Shaiharrud - zachód", "Jaskinia Smoczej Paszczy p.1", "Jaskinia Smoczej Paszczy p.2"], "resp": {"Jaskinia Smoczej Paszczy p.2": [[18, 22]]}},

        {"name": "Nymphemonia", "level": 287, "prof": "Łowca", "limit": 999, "pvp": "włączone", "path": ["Thuzal", "Grań Gawronich Piór", "Gvar Hamryd", "Matecznik Szelestu", "Drzewo życia p.1", "Drzewo życia p.2", "Drzewo życia p.3"], "resp": {"Drzewo życia p.3": [[4, 13]]}},

        {"name": "Zorin", "level": 300, "prof": "Tancerz Ostrzy", "limit": 999, "pvp": "włączone", "path": ["Thuzal", "Rozlewisko Kai", "Korytarz Zagubionych Marzeń", "Przejście Władców Mrozu", "Sala Mroźnych Szeptów"], "resp": {"Sala Mroźnych Szeptów": [[20, 42]]}},

        {"name": "Furion", "level": 300, "prof": "Łowca", "limit": 999, "pvp": "włączone", "path": ["Thuzal", "Rozlewisko Kai", "Korytarz Zagubionych Marzeń", "Przejście Władców Mrozu", "Sala Mroźnych Strzał"], "resp": {"Sala Mroźnych Strzał": [[31, 21]]}},

        {"name": "Artenius", "level": 300, "prof": "Mag", "limit": 999, "pvp": "włączone", "path": ["Thuzal", "Rozlewisko Kai", "Korytarz Zagubionych Marzeń", "Przejście Władców Mrozu", "Sala Lodowej Magii"], "resp": {"Sala Lodowej Magii": [[36, 46]]}}

    ];



    elityIIData.forEach(e => {

        if (e.limit === 999) e.limit = e.level + 13;

    });



    // ==========================================

    // BAZA DANYCH KOLOSÓW (Zaktualizowana o punkty 'resp')

    // ==========================================

    const kolosyData = [

        {"name": "Mamlambo", "level": 36, "prof": "Tancerz Ostrzy", "limit": 999, "pvp": "włączone", "path": ["Torneg", "Leśna Przełęcz", "Tygrysia Polana", "Dzikie Pagórki", "Pradawne Wzgórze Przodków", "Świątynia Mzintlavy"], "resp": {"Świątynia Mzintlavy": [[32, 14]]}},

        {"name": "Regulus Mętnooki", "level": 63, "prof": "Wojownik", "limit": 999, "pvp": "włączone", "path": ["Ithan", "Porzucone Pasieki", "Wioska Pszczelarzy", "Dom Jofusa", "Dom Jofusa - piwnica", "Zakurzone przejście", "Radosna Polana", "Pieczara Szaleńców - sala 1", "Pieczara Szaleńców - sala 2", "Pieczara Szaleńców - sala 3", "Pieczara Szaleńców - sala 4", "Pieczara Szaleńców - przedsionek", "Pieczara Szaleńców - sala Regulusa Mętnookiego"], "resp": {"Pieczara Szaleńców - sala Regulusa Mętnookiego": [[31, 9]]}},

        {"name": "Amaimon Soploręki", "level": 83, "prof": "Paladyn", "limit": 999, "pvp": "włączone", "path": ["Andarum Ilami", "Skały Mroźnych Śpiewów", "Zmarzlina Amaimona Soplorękiego - przedsionek", "Zmarzlina Amaimona Soplorękiego - sala"], "resp": {"Zmarzlina Amaimona Soplorękiego - sala": [[33, 16]]}},

        {"name": "Umibozu", "level": 114, "prof": "Tancerz Ostrzy", "limit": 999, "pvp": "włączone", "path": ["Tuzmer", "Port Tuzmer", "Archipelag Bremus An", "Głębia Przeklętych Fal - przedsionek", "Głębia Przeklętych Fal - sala"], "resp": {"Głębia Przeklętych Fal - sala": [[49, 9]]}},

        {"name": "Vashkar", "level": 144, "prof": "Łowca", "limit": 999, "pvp": "włączone", "path": ["Liściaste Rozstaje", "Jezioro Ważek", "Przepaść Zadumy - przedsionek", "Przepaść Zadumy - sala"], "resp": {"Przepaść Zadumy - sala": [[21, 24]]}},

        {"name": "Hydrokora Chimeryczna", "level": 167, "prof": "Wojownik", "limit": 999, "pvp": "włączone", "path": ["Dziki Zagajnik", "Przepaść Aguti", "Las Pamięci Nikantosa", "Przełęcz Krwistego Posłańca", "Czeluść Chimerycznej Natury - przedsionek", "Czeluść Chimerycznej Natury - sala"], "resp": {"Czeluść Chimerycznej Natury - sala": [[36, 22]]}},

        {"name": "Lulukav", "level": 190, "prof": "Mag", "limit": 999, "pvp": "włączone", "path": ["Thuzal", "Grań Gawronich Piór", "Błota Sham Al", "Ruiny Tass Zhil", "Krypty Bezsennych p.1 s.1", "Krypty Bezsennych p.2 s.2", "Grobowiec Przeklętego Krakania - przedsionek", "Grobowiec Przeklętego Krakania - sala"], "resp": {"Grobowiec Przeklętego Krakania - sala": [[36, 16]]}},

        {"name": "Arachin Podstępny", "level": 213, "prof": "Tancerz Ostrzy", "limit": 999, "pvp": "włączone", "path": ["Torneg", "Zapomniany Las", "Rozległa Równina", "Dolina Gniewu", "Terytorium Furii", "Zapadlisko Zniewolonych", "Pajęczy Las", "Grota Przebiegłego Tkacza - przedsionek", "Grota Przebiegłego Tkacza - sala"], "resp": {"Grota Przebiegłego Tkacza - sala": [[27, 11]]}},

        {"name": "Reuzen", "level": 244, "prof": "Wojownik", "limit": 999, "pvp": "włączone", "path": ["Mythar", "Urwisko Zdrewniałych", "Wąwóz Zakorzenionych Dusz", "Regiel Zabłąkanych", "Grota Martwodrzewów - przedsionek", "Grota Martwodrzewów - sala"], "resp": {"Grota Martwodrzewów - sala": [[24, 27]]}},

        {"name": "Wernoradzki Drakolisz", "level": 279, "prof": "Mag", "limit": 999, "pvp": "włączone", "path": ["Ruiny Pustynnych Burz", "Pustynne Katakumby", "Pustynne Katakumby - sala 2", "Komnaty Bezdusznych - sala 1", "Komnaty Bezdusznych - sala 2", "Katakumby Gwałtownej Śmierci", "Wschodni Tunel Jaźni", "Katakumby Krwawych Wypraw", "Katakumby Antycznego Gniewu - przedsionek", "Katakumby Antycznego Gniewu - sala"], "resp": {"Katakumby Antycznego Gniewu - sala": [[16, 14]]}}

    ];

    let currentCordsList = [];

    let globalGateways = {};

    let heroMapOrder = {};



    let bossSavedCoords = JSON.parse(localStorage.getItem('hero_boss_coords_v64') || localStorage.getItem('hero_e2_coords_v62') || '{}');

let opacityValue = 0.95;



   window.defaultExpProfiles = [
      {"name": "Grobowce (18lvl)", "desc": "Zoptymalizowana baza (Potworów: 197)", "mobCount": 197, "maps": ["Grobowiec Rodziny Tywelta", "Grobowiec Rodziny Tywelta p.1", "Grobowiec Rodziny Tywelta p.2", "Krypta Rodu Heregata", "Krypta Rodu Heregata p.1", "Krypta Rodu Heregata p.2 - lewe skrzydło", "Krypta Rodu Heregata p.2 - prawe skrzydło"]},
      {"name": "Mrówki (20lvl)", "desc": "Zoptymalizowana baza (Potworów: 192)", "mobCount": 192, "maps": ["Kopiec Mrówek", "Kopiec Mrówek p.1", "Kopiec Mrówek p.2", "Mrowisko", "Mrowisko p.1", "Mrowisko p.2"]},
      {"name": "Pumy i tygrysy (21lvl)", "desc": "Zoptymalizowana baza (Potworów: 255)", "mobCount": 255, "maps": ["Jaskinia Dzikich Kotów", "Kryjówka Dzikich Kotów", "Leśna Przełęcz", "Tygrysia Polana"]},
      {"name": "Niedźwiedzie i nietoperze (23lvl)", "desc": "Zoptymalizowana baza (Potworów: 247)", "mobCount": 247, "maps": ["Dziewicza Knieja", "Siedlisko Nietoperzy p.1", "Siedlisko Nietoperzy p.2", "Siedlisko Nietoperzy p.3 - sala 1", "Siedlisko Nietoperzy p.3 - sala 2", "Siedlisko Nietoperzy p.4", "Siedlisko Nietoperzy p.5"]},
      {"name": "Bazyliszki (26lvl)", "desc": "Zoptymalizowana baza (Potworów: 96)", "mobCount": 96, "maps": ["Las Tropicieli"]},
      {"name": "Mulusy (28lvl)", "desc": "Zoptymalizowana baza (Potworów: 306)", "mobCount": 306, "maps": ["Dzikie Pagórki", "Osada Mulusów", "Pradawne Wzgórze Przodków"]},
      {"name": "Demony (29lvl)", "desc": "Zoptymalizowana baza (Potworów: 242)", "mobCount": 242, "maps": ["Przeklęta Strażnica", "Przeklęta Strażnica - podziemia p.1 s.1", "Przeklęta Strażnica - podziemia p.1 s.2", "Przeklęta Strażnica - podziemia p.2 s.1", "Przeklęta Strażnica - podziemia p.2 s.2", "Przeklęta Strażnica - podziemia p.2 s.3", "Przeklęta Strażnica p.1", "Przeklęta Strażnica p.2"]},
      {"name": "Rozbojnicy (32lvl)", "desc": "Zoptymalizowana baza (Potworów: 185)", "mobCount": 185, "maps": ["Dolina Rozbójników", "Kamienna Kryjówka", "Namiot Bandytów", "Pagórki Łupieżców", "Przełęcz Łotrzyków", "Skład Grabieżców"]},
      {"name": "Gobliny (34lvl)", "desc": "Zoptymalizowana baza (Potworów: 120)", "mobCount": 120, "maps": ["Jaskinia Pogardy", "Las Goblinów", "Morwowe Przejście", "Podmokła Dolina"]},
      {"name": "Puffy (37lvl)", "desc": "Zoptymalizowana baza (Potworów: 140)", "mobCount": 140, "maps": ["Pieczara Niepogody p.1", "Pieczara Niepogody p.2 - sala 1", "Pieczara Niepogody p.2 - sala 2", "Pieczara Niepogody p.3", "Pieczara Niepogody p.4", "Pieczara Niepogody p.5"]},
      {"name": "Dziki (40lvl)", "desc": "Zoptymalizowana baza (Potworów: 155)", "mobCount": 155, "maps": ["Pieczara Kwiku - sala 1", "Pieczara Kwiku - sala 2", "Racicowy Matecznik", "Spokojne Przejście", "Ukwiecona Skarpa"]},
      {"name": "Ghule (40lvl)", "desc": "Zoptymalizowana baza (Potworów: 165)", "mobCount": 165, "maps": ["Ghuli Mogilnik", "Polana Ścierwojadów", "Zapomniany Grobowiec p.1", "Zapomniany Grobowiec p.2", "Zapomniany Grobowiec p.3", "Zapomniany Grobowiec p.4", "Zapomniany Grobowiec p.5"]},
      {"name": "Wilcze plemię (44lvl)", "desc": "Zoptymalizowana baza (Potworów: 175)", "mobCount": 175, "maps": ["Krasowa Pieczara p.1", "Krasowa Pieczara p.2", "Krasowa Pieczara p.3", "Legowisko Wilczej Hordy", "Warczące Osuwiska", "Wilcza Nora p.1", "Wilcza Nora p.2", "Wilcza Skarpa"]},
      {"name": "Tolloki (45lvl)", "desc": "Zoptymalizowana baza (Potworów: 110)", "mobCount": 110, "maps": ["Skalne Turnie", "Skarpiska Tolloków"]},
      {"name": "Zbiry (46lvl)", "desc": "Zoptymalizowana baza (Potworów: 145)", "mobCount": 145, "maps": ["Ciemnica Szubrawców p.1 - sala 1", "Ciemnica Szubrawców p.1 - sala 2", "Ciemnica Szubrawców p.1 - sala 3", "Stary Kupiecki Trakt", "Stukot Widmowych Kół", "Wertepy Rzezimieszków"]},
      {"name": "Orkowie (47lvl)", "desc": "Zoptymalizowana baza (Potworów: 210)", "mobCount": 210, "maps": ["Nawiedzony Jar", "Opuszczony Bastion", "Podziemne Przejście p.1", "Podziemne Przejście p.2", "Stare Wyrobisko p.1", "Stare Wyrobisko p.2", "Stare Wyrobisko p.3", "Stare Wyrobisko p.4", "Stare Wyrobisko p.5", "Zburzona Twierdza", "Zrujnowana Wieża", "Świszcząca Grota p.1", "Świszcząca Grota p.2", "Świszcząca Grota p.3", "Świszcząca Grota p.4"]},
      {"name": "Przesmyk (50lvl)", "desc": "Zoptymalizowana baza (Potworów: 130)", "mobCount": 130, "maps": ["Migotliwa Pieczara", "Mroczna Pieczara p.0", "Mroczna Pieczara p.1 - sala 1", "Mroczna Pieczara p.1 - sala 2", "Mroczna Pieczara p.1 - sala 3", "Mroczna Pieczara p.2", "Mroczny Przesmyk", "Zapomniany Szlak"]},
      {"name": "Galarety (51lvl)", "desc": "Zoptymalizowana baza (Potworów: 95)", "mobCount": 95, "maps": ["Mokra Grota p.1", "Mokra Grota p.1 - boczny korytarz", "Mokra Grota p.1 - przełaz", "Mokra Grota p.2", "Mokra Grota p.2 - korytarz"]},
      {"name": "Pokątniki (52lvl)", "desc": "Zoptymalizowana baza (Potworów: 80)", "mobCount": 80, "maps": ["Grota Bezszelestnych Kroków - sala 1", "Grota Bezszelestnych Kroków - sala 2", "Grota Bezszelestnych Kroków - sala 3"]},
      {"name": "Koboldy (54lvl)", "desc": "Zoptymalizowana baza (Potworów: 115)", "mobCount": 115, "maps": ["Lazurytowa Grota p.1", "Lazurytowa Grota p.2", "Lazurytowa Grota p.3 - sala 1", "Lazurytowa Grota p.3 - sala 2", "Lazurytowa Grota p.4"]},
      {"name": "Żądłaki (58lvl)", "desc": "Zoptymalizowana baza (Potworów: 142)", "mobCount": 142, "maps": ["Kopalnia Kapiącego Miodu p.1 - sala 1", "Kopalnia Kapiącego Miodu p.1 - sala 2", "Kopalnia Kapiącego Miodu p.2 - sala 1", "Kopalnia Kapiącego Miodu p.2 - sala 2", "Kopalnia Kapiącego Miodu p.2 - sala Owadziej Matki", "Kopalnia Kapiącego Miodu p.3", "Porzucone Pasieki"]},
      {"name": "Bazyliszki (61lvl)", "desc": "Zoptymalizowana baza (Potworów: 85)", "mobCount": 85, "maps": ["Pieczara Szaleńców - sala 1", "Pieczara Szaleńców - sala 2", "Pieczara Szaleńców - sala 3", "Pieczara Szaleńców - sala 4"]},
      {"name": "Gnolle (64lvl)", "desc": "Zoptymalizowana baza (Potworów: 195)", "mobCount": 195, "maps": ["Czeluść Ognistej Pożogi", "Grota Pragnolli p.1", "Grota Pragnolli p.1 - sala 2", "Grota Pragnolli p.2", "Grota Pragnolli p.3", "Jaskinia Gnollich Szamanów - komnata Kozuga", "Jaskinia Gnollich Szamanów p.1", "Jaskinia Gnollich Szamanów p.2", "Jaskinia Gnollich Szamanów p.3", "Namiot Vari Krugera", "Radosna Polana", "Wioska Gnolli"]},
      {"name": "Mrówcza kolonia (66lvl)", "desc": "Zoptymalizowana baza (Potworów: 180)", "mobCount": 180, "maps": ["Mrówcza Kolonia p.1 - lewy tunel", "Mrówcza Kolonia p.1 - prawy tunel", "Mrówcza Kolonia p.2 - lewe korytarze", "Mrówcza Kolonia p.2 - prawe korytarze", "Mrówcza Kolonia p.3 - lewa komora jaj", "Mrówcza Kolonia p.3 - prawa komora jaj", "Mrówcza Kolonia p.4 - królewskie gniazdo"]},
      {"name": "Olbrzymy (67lvl)", "desc": "Zoptymalizowana baza (Potworów: 65)", "mobCount": 65, "maps": ["Kamienna Jaskinia - sala 1", "Kamienna Jaskinia - sala 2", "Ukryty Kanion"]},
      {"name": "Andarum i okolice (70lvl)", "desc": "Zoptymalizowana baza (Potworów: 175)", "mobCount": 175, "maps": ["Andarum Ilami", "Cmentarzysko Szerpów", "Skały Mroźnych Śpiewów", "Śnieżna Granica"]},
      {"name": "Jaskiniowe tolloki (71lvl)", "desc": "Zoptymalizowana baza (Potworów: 110)", "mobCount": 110, "maps": ["Głębokie Skałki p.1", "Głębokie Skałki p.2", "Głębokie Skałki p.3", "Głębokie Skałki p.4", "Zdradzieckie Przejście p.1"]},
      {"name": "Demilisze (72lvl)", "desc": "Zoptymalizowana baza (Potworów: 88)", "mobCount": 88, "maps": ["Krypty Dusz Śniegu p.1", "Krypty Dusz Śniegu p.2", "Krypty Dusz Śniegu p.3", "Krypty Dusz Śniegu p.3 - komnata Lisza"]},
      {"name": "Mnisi (74lvl)", "desc": "Zoptymalizowana baza (Potworów: 125)", "mobCount": 125, "maps": ["Świątynia Andarum", "Świątynia Andarum - lokum mnichów", "Świątynia Andarum - podziemia", "Świątynia Andarum - zejście lewe", "Świątynia Andarum - zejście prawe"]},
      {"name": "Biblioteka Andarum (75lvl)", "desc": "Zoptymalizowana baza (Potworów: 92)", "mobCount": 92, "maps": ["Świątynia Andarum - biblioteka"]},
      {"name": "Wodniki (75lvl)", "desc": "Zoptymalizowana baza (Potworów: 115)", "mobCount": 115, "maps": ["Moczary Rybiego Oka", "Uroczysko Wodnika", "Źródło Narumi"]},
      {"name": "Magazynierzy (77lvl)", "desc": "Zoptymalizowana baza (Potworów: 105)", "mobCount": 105, "maps": ["Świątynia Andarum - magazyn p.1", "Świątynia Andarum - magazyn p.2", "Świątynia Andarum - zbrojownia"]},
      {"name": "Erem (80lvl)", "desc": "Zoptymalizowana baza (Potworów: 165)", "mobCount": 165, "maps": ["Erem Czarnego Słońca p.1 - północ", "Erem Czarnego Słońca p.2", "Erem Czarnego Słońca p.3", "Erem Czarnego Słońca p.3 - południe", "Erem Czarnego Słońca p.4 - sala 1", "Erem Czarnego Słońca p.4 - sala 2", "Erem Czarnego Słońca p.5"]},
      {"name": "Minotaury (81lvl)", "desc": "Zoptymalizowana baza (Potworów: 105)", "mobCount": 105, "maps": ["Labirynt Wyklętych p.1", "Labirynt Wyklętych p.2 - sala 1", "Labirynt Wyklętych p.2 - sala 2", "Pieczara Czaszek"]},
      {"name": "Dławiciele (83lvl)", "desc": "Zoptymalizowana baza (Potworów: 95)", "mobCount": 95, "maps": ["Wylęgarnia Choukkerów p.1", "Wylęgarnia Choukkerów p.2", "Wylęgarnia Choukkerów p.3"]},
      {"name": "Miśki (83lvl)", "desc": "Zoptymalizowana baza (Potworów: 125)", "mobCount": 125, "maps": ["Firnowa Grota p.1", "Firnowa Grota p.2", "Firnowa Grota p.2 s.1", "Lodowa Wyrwa p.1 s.1", "Lodowa Wyrwa p.1 s.2", "Lodowa Wyrwa p.2", "Sala Lodowych Iglic"]},
      {"name": "Wermonty (85lvl)", "desc": "Zoptymalizowana baza (Potworów: 65)", "mobCount": 65, "maps": ["Zdradzieckie Przejście p.2"]},
      {"name": "Krasnoludy (86lvl)", "desc": "Zoptymalizowana baza (Potworów: 145)", "mobCount": 145, "maps": ["Kopalnia Margorii", "Labirynt Margorii", "Margoria", "Margoria - Sala Królewska"]},
      {"name": "Darhouny (87lvl)", "desc": "Zoptymalizowana baza (Potworów: 75)", "mobCount": 75, "maps": ["Szyb Zdrajców", "Ślepe Wyrobisko"]},
      {"name": "Grexy (89 lvl)", "desc": "Zoptymalizowana baza (Potworów: 120)", "mobCount": 120, "maps": ["Grota Samotnych Dusz p.1", "Grota Samotnych Dusz p.2", "Grota Samotnych Dusz p.3", "Grota Samotnych Dusz p.3 - sala wyjściowa", "Grota Samotnych Dusz p.4", "Grota Samotnych Dusz p.5", "Grota Samotnych Dusz p.6"]},
      {"name": "Leszy (91lvl)", "desc": "Zoptymalizowana baza (Potworów: 115)", "mobCount": 115, "maps": ["Księżycowe Wzniesienie", "Liściaste Rozstaje", "Sosnowe Odludzie", "Zapomniany Święty Gaj p.1", "Zapomniany Święty Gaj p.1 - sala 1", "Zapomniany Święty Gaj p.2", "Zapomniany Święty Gaj p.3"]},
      {"name": "Wieczornice i Południce (92lvl)", "desc": "Zoptymalizowana baza (Potworów: 155)", "mobCount": 155, "maps": ["Kamienna Strażnica - Sala Chwały", "Kamienna Strażnica - Sanktuarium", "Kamienna Strażnica - tunel", "Kamienna Strażnica - wsch. baszta skalna sala p.0", "Kamienna Strażnica - wsch. baszta skalna sala p.1", "Kamienna Strażnica - wsch. baszta zasypany tunel", "Kamienna Strażnica - zach. baszta p.1", "Kamienna Strażnica - zach. baszta p.2", "Mglista Polana Vesy", "Płacząca Grota - sala Lamentu", "Płacząca Grota p.1 - sala 1", "Płacząca Grota p.1 - sala 2", "Płacząca Grota p.2", "Płacząca Grota p.3", "Trupia Przełęcz", "Wzgórze Płaczek"]},
      {"name": "Błotniste gady (94lvl)", "desc": "Zoptymalizowana baza (Potworów: 95)", "mobCount": 95, "maps": ["Gadzia Kotlina", "Złowrogie Bagna"]},
      {"name": "Gnomy (94lvl)", "desc": "Zoptymalizowana baza (Potworów: 155)", "mobCount": 155, "maps": ["Gadzia Kotlina", "Mglista Polana Vesy", "Wzgórze Płaczek", "Zagrzybiałe Ścieżki p.1 - sala 1", "Zagrzybiałe Ścieżki p.1 - sala 2", "Zagrzybiałe Ścieżki p.1 - sala 3", "Zagrzybiałe Ścieżki p.2", "Zagrzybiałe Ścieżki p.3", "Złowrogie Bagna"]},
      {"name": "Ogniki (96lvl)", "desc": "Zoptymalizowana baza (Potworów: 75)", "mobCount": 75, "maps": ["Gadzia Kotlina", "Złowrogie Bagna"]},
      {"name": "Centaury (98lvl)", "desc": "Zoptymalizowana baza (Potworów: 135)", "mobCount": 135, "maps": ["Błędny Szlak", "Dolina Centaurów", "Iglaste Ścieżki", "Ostępy Szalbierskich Lasów", "Selva Oscura", "Zawiły Bór"]},
      {"name": "Małe gady i płazy (99lvl)", "desc": "Zoptymalizowana baza (Potworów: 85)", "mobCount": 85, "maps": ["Ostępy Szalbierskich Lasów", "Selva Oscura"]},
      {"name": "Bandyci (100lvl)", "desc": "Zoptymalizowana baza (Potworów: 115)", "mobCount": 115, "maps": ["Cienisty Bór", "Las Dziwów", "Ostępy Szalbierskich Lasów"]},
      {"name": "Mykonidy (102lvl)", "desc": "Zoptymalizowana baza (Potworów: 125)", "mobCount": 125, "maps": ["Lodowa Sala", "Przejście Lodowatego Wiatru", "Przejście Magicznego Mrozu", "Przejście Zamarzniętych Kości", "Sala Lodowatego Wiatru", "Sala Magicznego Mrozu", "Sala Zamarzniętych Kości", "Śnieżna Grota p.2", "Śnieżna Grota p.3"]},
      {"name": "Molochy (103lvl)", "desc": "Zoptymalizowana baza (Potworów: 95)", "mobCount": 95, "maps": ["Podziemia Zniszczonej Wieży p.2", "Podziemia Zniszczonej Wieży p.3", "Podziemia Zniszczonej Wieży p.4", "Podziemia Zniszczonej Wieży p.5"]},
      {"name": "Dwugłowe olbrzymy (105lvl)", "desc": "Zoptymalizowana baza (Potworów: 75)", "mobCount": 75, "maps": ["Przełaz olbrzymów", "Selva Oscura", "Smocza Jaskinia", "Smocze Góry"]},
      {"name": "Gady i płazy (106lvl)", "desc": "Zoptymalizowana baza (Potworów: 105)", "mobCount": 105, "maps": ["Solny Szyb p.3", "Zabłocona Jama p.1 - sala 1", "Zabłocona Jama p.1 - sala 2", "Zabłocona Jama p.2 - sala 1", "Zabłocona Jama p.2 - sala 3"]},
      {"name": "Alghule (111lvl)", "desc": "Zoptymalizowana baza (Potworów: 95)", "mobCount": 95, "maps": ["Skalne Cmentarzysko p.1", "Skalne Cmentarzysko p.2", "Skalne Cmentarzysko p.3", "Skalne Cmentarzysko p.4"]},
      {"name": "Szkielety-koty (111lvl)", "desc": "Zoptymalizowana baza (Potworów: 85)", "mobCount": 85, "maps": ["Grobowiec Nieznających Spokoju", "Płaskowyż Arpan", "Sucha Dolina"]},
      {"name": "Mumie (114lvl)", "desc": "Zoptymalizowana baza (Potworów: 145)", "mobCount": 145, "maps": ["Ciche Rumowiska", "Dolina Suchych Łez", "Oaza Siedmiu Wichrów", "Piramida Pustynnego Władcy p.1", "Piramida Pustynnego Władcy p.2", "Piramida Pustynnego Władcy p.3", "Złote Piaski"]},
      {"name": "Kałamarnice (118lvl)", "desc": "Zoptymalizowana baza (Potworów: 65)", "mobCount": 65, "maps": ["Archipelag Bremus An", "Jama Morskiej Macki p.1 - sala 1", "Jama Morskiej Macki p.1 - sala 2", "Jama Morskiej Macki p.1 - sala 3"]},
      {"name": "Ingotia (121lvl)", "desc": "Zoptymalizowana baza (Potworów: 255)", "mobCount": 255, "maps": ["Korytarze Wygnańców p.1 - Bezdenne Przepaści", "Korytarze Wygnańców p.1 - Hala Odszczepieńców", "Korytarze Wygnańców p.1 - Jaskinia Zagubionych", "Korytarze Wygnańców p.1 - Komora Opuszczonych", "Korytarze Wygnańców p.1 - Sala Ech", "Korytarze Wygnańców p.1 - Sala Szlachetnych", "Korytarze Wygnańców p.2 - Komnata Wygnańców", "Korytarze Wygnańców p.2 - Komora Budowniczego", "Korytarze Wygnańców p.2 - Sala Żądzy", "Korytarze Wygnańców p.3 - Komnata Przeklętego Daru", "Twierdza Rogogłowych - Sala Byka", "Wyspa Ingotia"]},
      {"name": "Kraby (122lvl)", "desc": "Zoptymalizowana baza (Potworów: 55)", "mobCount": 55, "maps": ["Wyspa Rem"]},
      {"name": "Caneum (124lvl)", "desc": "Zoptymalizowana baza (Potworów: 155)", "mobCount": 155, "maps": ["Piaskowa Pułapka - Grota Piaskowej Śmierci", "Piaskowa Pułapka p.1 - sala 1", "Piaskowa Pułapka p.1 - sala 2", "Piaskowa Pułapka p.1 - sala 3", "Piaskowa Pułapka p.1 - sala 4", "Wyspa Caneum"]},
      {"name": "Magradit (127lvl)", "desc": "Zoptymalizowana baza (Potworów: 125)", "mobCount": 125, "maps": ["Wulkan Politraki p.1 - sala 1", "Wulkan Politraki p.1 - sala 2", "Wulkan Politraki p.1 - sala 3", "Wulkan Politraki p.2 - sala 1", "Wulkan Politraki p.2 - sala 2"]},
      {"name": "Wraki (127lvl)", "desc": "Zoptymalizowana baza (Potworów: 85)", "mobCount": 85, "maps": ["Grota Trzeszczących Kości p.1 - sala 1", "Grota Trzeszczących Kości p.1 - sala 2", "Wrak statku", "Wyspa Wraków"]},
      {"name": "Pajaki (129lvl)", "desc": "Zoptymalizowana baza (Potworów: 165)", "mobCount": 165, "maps": ["Szlak Thorpa p.1", "Szlak Thorpa p.2", "Szlak Thorpa p.3", "Szlak Thorpa p.4", "Szlak Thorpa p.5", "Szlak Thorpa p.6"]},
      {"name": "Piraci (130lvl)", "desc": "Zoptymalizowana baza (Potworów: 205)", "mobCount": 205, "maps": ["Korsarska Nora - sala 1", "Korsarska Nora - sala 2", "Korsarska Nora - sala 3", "Korsarska Nora - sala 4", "Korsarska Nora - sala 5", "Korsarska Nora - sala 6", "Korsarska Nora - statek", "Korsarska Nora - wschodni przełaz", "Korsarska Nora - zachodni przełaz", "Ukryta Grota Morskich Diabłów", "Ukryta Grota Morskich Diabłów - arsenał", "Ukryta Grota Morskich Diabłów - korytarz", "Ukryta Grota Morskich Diabłów - magazyn", "Ukryta Grota Morskich Diabłów - siedziba", "Ukryta Grota Morskich Diabłów - skarbiec"]},
      {"name": "Piaskowi niewolnicy (133lvl)", "desc": "Zoptymalizowana baza (Potworów: 166)", "mobCount": 166, "maps": ["Dolina Pustynnych Kręgów", "Piachy Zniewolonych", "Piaskowa Gęstwina", "Piaszczysta Grota p.1 - sala 1", "Piaszczysta Grota p.1 - sala 2", "Ruchome Piaski"]},
      {"name": "Korredy (134lvl)", "desc": "Zoptymalizowana baza (Potworów: 95)", "mobCount": 95, "maps": ["Kopalnia Żółtego Kruszcu p.1 - sala 1", "Kopalnia Żółtego Kruszcu p.1 - sala 2", "Kopalnia Żółtego Kruszcu p.2 - sala 1", "Kopalnia Żółtego Kruszcu p.2 - sala 2"]},
      {"name": "Impy (136lvl)", "desc": "Zoptymalizowana baza (Potworów: 115)", "mobCount": 115, "maps": ["Chodniki Mrinding", "Chodniki Mrinding p.1 - sala 1", "Chodniki Mrinding p.1 - sala 2", "Chodniki Mrinding p.2 - sala 1", "Chodniki Mrinding p.2 - sala 2"]},
      {"name": "Ognie (137lvl)", "desc": "Zoptymalizowana baza (Potworów: 85)", "mobCount": 85, "maps": ["Ognista Studnia p.1", "Ścieżki Erebeth p.2 - sala 1", "Ścieżki Erebeth p.2 - sala 2", "Ścieżki Erebeth p.3"]},
      {"name": "Ogniste golemy (138lvl)", "desc": "Zoptymalizowana baza (Potworów: 105)", "mobCount": 105, "maps": ["Kuźnia Worundriela - Komnata Żaru", "Kuźnia Worundriela p.1", "Kuźnia Worundriela p.2", "Kuźnia Worundriela p.3", "Ognista Studnia p.2", "Ognista Studnia p.3"]},
      {"name": "Ważki (140lvl)", "desc": "Zoptymalizowana baza (Potworów: 75)", "mobCount": 75, "maps": ["Jezioro Ważek"]},
      {"name": "Górale (143lvl)", "desc": "Zoptymalizowana baza (Potworów: 185)", "mobCount": 185, "maps": ["Babi Wzgórek", "Chata Teściowej", "Chata wójta Fistuły", "Chata wójta Fistuły p.1", "Góralska Pieczara p.1", "Góralska Pieczara p.2", "Góralska Pieczara p.3", "Góralskie Przejście", "Wyjąca Jaskinia", "Wyjący Wąwóz"]},
      {"name": "Berserkerzy (147lvl)", "desc": "Zoptymalizowana baza (Potworów: 225)", "mobCount": 225, "maps": ["Cenotaf Berserkerów - przejście przodków", "Cenotaf Berserkerów p.1 - sala 1", "Cenotaf Berserkerów p.1 - sala 2", "Czarcie Oparzeliska", "Grobowiec Przodków", "Mała Twierdza - korytarz zachodni", "Mała Twierdza - magazyn", "Mała Twierdza - mały barak", "Mała Twierdza - mury wschodnie", "Mała Twierdza - mury zachodnie", "Mała Twierdza - podziemny magazyn", "Mała Twierdza - sala główna", "Mała Twierdza - sala wejściowa", "Mała Twierdza - wieża strażnicza", "Mała Twierdza - wieża wschodnia", "Mała Twierdza - wieża zachodnia", "Mała Twierdza p.1", "Opuszczona Twierdza", "Zaginiona Dolina", "Śnieżna Granica"]},
      {"name": "Duchy (149lvl)", "desc": "Zoptymalizowana baza (Potworów: 95)", "mobCount": 95, "maps": ["Korytarze Milczących Intryg p.1", "Korytarze Milczących Intryg p.2 - sala 1", "Korytarze Milczących Intryg p.2 - sala 2", "Korytarze Milczących Intryg p.3", "Sala Ukrytych Paktów"]},
      {"name": "Mechaniczne gobliny (151lvl)", "desc": "Zoptymalizowana baza (Potworów: 125)", "mobCount": 125, "maps": ["Lokum Złych Goblinów - warsztat", "Lokum Złych Goblinów - wieża", "Lokum Złych Goblinów - zejście p.1", "Lokum Złych Goblinów p.2 - sala 1", "Lokum Złych Goblinów p.2 - sala 2", "Lokum Złych Goblinów p.3 - sala 1", "Lokum Złych Goblinów p.3 - sala 2"]},
      {"name": "Dusze (152lvl)", "desc": "Zoptymalizowana baza (Potworów: 45)", "mobCount": 45, "maps": ["Upiorna Droga"]},
      {"name": "Wiedzmy (154lvl)", "desc": "Zoptymalizowana baza (Potworów: 175)", "mobCount": 175, "maps": ["Dom Adariel", "Dom Amry", "Dom Atalii", "Dom czarnej magii", "Dom starej czarownicy", "Laboratorium Adariel", "Lochy Tristam", "Magazyn mioteł", "Ograbiona świątynia", "Opuszczone więzienie", "Sabatowe Góry", "Splugawiona kaplica", "Splądrowana kaplica", "Tristam", "Wiedźmie Kotłowisko"]},
      {"name": "Czerwoni orkowie (156lvl)", "desc": "Zoptymalizowana baza (Potworów: 205)", "mobCount": 205, "maps": ["Grota Orczej Hordy p.1 s.1", "Grota Orczej Hordy p.1 s.2", "Grota Orczej Hordy p.2 s.1", "Grota Orczej Hordy p.2 s.2", "Grota Orczej Hordy p.2 s.3", "Grota Orczych Szamanów p.1 s.1", "Grota Orczych Szamanów p.1 s.2", "Grota Orczych Szamanów p.2 s.1", "Grota Orczych Szamanów p.2 s.2", "Kurhany Zwyciężonych", "Orcza Wyżyna", "Osada Czerwonych Orków"]},
      {"name": "Dziki zagajnik (161lvl)", "desc": "Zoptymalizowana baza (Potworów: 145)", "mobCount": 145, "maps": ["Dziki Zagajnik", "Przepaść Aguti", "Przełęcz Krwistego Posłańca", "Skały Pamięci Nikantosa", "Ukryty Kanion"]},
      {"name": "Kazamaty (163lvl)", "desc": "Zoptymalizowana baza (Potworów: 165)", "mobCount": 165, "maps": ["Nawiedzone Kazamaty p.1 s.1", "Nawiedzone Kazamaty p.1 s.2", "Nawiedzone Kazamaty p.2 s.1", "Nawiedzone Kazamaty p.2 s.2", "Nawiedzone Kazamaty p.3 s.1", "Nawiedzone Kazamaty p.3 s.2", "Nawiedzone Kazamaty p.4", "Nawiedzone Komnaty - przedsionek"]},
      {"name": "Komnaty (170lvl)", "desc": "Zoptymalizowana baza (Potworów: 135)", "mobCount": 135, "maps": ["Komnaty Czarnej Gwardii - wschód", "Komnaty Czarnej Gwardii - zachód", "Nawiedzone Komnaty - przedsionek", "Nawiedzone Komnaty - wschód", "Nawiedzone Komnaty - zachód", "Sala Dowódcy Orków", "Sala Królewska", "Sala Rady Orków"]},
      {"name": "Kryształowa grota (174lvl)", "desc": "Zoptymalizowana baza (Potworów: 185)", "mobCount": 185, "maps": ["Kryształowa Grota - Sala Smutku", "Kryształowa Grota - przepaść", "Kryształowa Grota p.1", "Kryształowa Grota p.2 - sala 1", "Kryształowa Grota p.2 - sala 2", "Kryształowa Grota p.3 - sala 1", "Kryształowa Grota p.3 - sala 2", "Kryształowa Grota p.4", "Kryształowa Grota p.5", "Kryształowa Grota p.6"]},
      {"name": "Driady (178lvl)", "desc": "Zoptymalizowana baza (Potworów: 155)", "mobCount": 155, "maps": ["Błota Sham Al", "Drzewo Dusz p.1", "Drzewo Dusz p.2", "Grota Arbor s.1", "Grota Arbor s.2", "Głusza Świstu", "Kwieciste Kresy", "Las Porywów Wiatru", "Ruiny Tass Zhil"]},
      {"name": "Ogry (181lvl)", "desc": "Zoptymalizowana baza (Potworów: 115)", "mobCount": 115, "maps": ["Ogrza Kawerna p.1", "Ogrza Kawerna p.2", "Ogrza Kawerna p.3", "Ogrza Kawerna p.4"]},
      {"name": "Patrycjusze (184lvl)", "desc": "Zoptymalizowana baza (Potworów: 145)", "mobCount": 145, "maps": ["Krypty Bezsennych p.1 s.1", "Krypty Bezsennych p.1 s.2", "Krypty Bezsennych p.2 s.1", "Krypty Bezsennych p.2 s.2", "Krypty Bezsennych p.3"]},
      {"name": "Zmutowane rośliny (187lvl)", "desc": "Zoptymalizowana baza (Potworów: 125)", "mobCount": 125, "maps": ["Głuchy Las", "Kwieciste Przejście", "Skarpa Trzech Słów", "Ukwiecona Skarpa", "Zapomniana Ścieżyna", "Złudny Trakt"]},
      {"name": "Draki (189lvl)", "desc": "Zoptymalizowana baza (Potworów: 105)", "mobCount": 105, "maps": ["Kwieciste Kresy", "Przysiółek Valmirów", "Szczerba Samobójców", "Śnieżna Granica", "Śnieżycowy Las"]},
      {"name": "Mroczny las (192lvl)", "desc": "Zoptymalizowana baza (Potworów: 255)", "mobCount": 255, "maps": ["Bezgwiezdna Gęstwina", "Bór Zagubionych", "Grota Skamieniałej Kory p.1 - sala 1", "Grota Skamieniałej Kory p.1 - sala 2", "Grota Skamieniałej Kory p.2", "Martwy Las", "Starodrzew Przedwiecznych p.1", "Starodrzew Przedwiecznych p.2", "Zbocze Starych Bogów", "Ziemia Szepczących Cierni", "Złudny Trakt"]},
      {"name": "Myświóry (196lvl)", "desc": "Zoptymalizowana baza (Potworów: 145)", "mobCount": 145, "maps": ["Kanały Nithal p.1 - sala 1", "Kanały Nithal p.1 - sala 2", "Kanały Nithal p.1 - sala 3", "Szlamowe Kanały p.2 - sala 1", "Szlamowe Kanały p.2 - sala 2", "Szlamowe Kanały p.2 - sala 3"]},
      {"name": "Hurysy (199lvl)", "desc": "Zoptymalizowana baza (Potworów: 95)", "mobCount": 95, "maps": ["Mroczne Komnaty", "Przedsionek Kultu", "Przerażające Sypialnie"]},
      {"name": "Heretycy (203lvl)", "desc": "Zoptymalizowana baza (Potworów: 165)", "mobCount": 165, "maps": ["Korytarz Ostatnich Nadziei", "Lochy Kultu", "Przejście Oczyszczenia", "Sala Skaryfikacji Grzeszników", "Sala Spowiedzi Konających", "Sala Tysiąca Świec", "Sale Rozdzierania", "Tajemnicza Siedziba"]},
      {"name": "Furbole (208lvl)", "desc": "Zoptymalizowana baza (Potworów: 185)", "mobCount": 185, "maps": ["Dolina Gniewu", "Rozległa Równina", "Terytorium Furii", "Wzgórza Obłędu", "Zalana Grota", "Zapadlisko Zniewolonych", "Zapomniany Las"]},
      {"name": "Pająki (212lvl)", "desc": "Zoptymalizowana baza (Potworów: 225)", "mobCount": 225, "maps": ["Arachnitopia p.1", "Arachnitopia p.2", "Arachnitopia p.3", "Arachnitopia p.4", "Arachnitopia p.5", "Arachnitopia p.6", "Dolina Pajęczych Korytarzy", "Otchłań Pajęczych Sieci", "Pajęczy Las", "Zapadlisko Zniewolonych"]},
      {"name": "Drowy (216lvl)", "desc": "Zoptymalizowana baza (Potworów: 155)", "mobCount": 155, "maps": ["Dawny Przełaz", "Erem Aldiphrina", "Porzucone Noiridum p.2", "Porzucone Noiridum p.3 - sala 1", "Porzucone Noiridum p.3 - sala 2", "Porzucone Noiridum p.3 - sala 3", "Zakazana Grota"]},
      {"name": "Dridery (219lvl)", "desc": "Zoptymalizowana baza (Potworów: 135)", "mobCount": 135, "maps": ["Dawny Przełaz", "Zamierzchłe Arterie p.2 - sala 1", "Zamierzchłe Arterie p.2 - sala 2", "Zamierzchłe Arterie p.3", "Zapomniane Sztolnie"]},
      {"name": "Anuraki (223lvl)", "desc": "Zoptymalizowana baza (Potworów: 214)", "mobCount": 214, "maps": ["Bagna Umarłych", "Gnijące Topielisko", "Grząska Ziemia", "Mglisty Las", "Smocze Skalisko", "Urwisko Vapora"]},
      {"name": "Maddoki (227lvl)", "desc": "Zoptymalizowana baza (Potworów: 255)", "mobCount": 255, "maps": ["Dolina Potoku Śmierci", "Grota Porośniętych Stalagmitów p.1 - sala 1", "Grota Porośniętych Stalagmitów p.1 - sala 2", "Grota Porośniętych Stalagmitów p.2 - sala 1", "Grota Porośniętych Stalagmitów p.2 - sala 2", "Jaszczurze Korytarze p.1 - sala 1", "Jaszczurze Korytarze p.1 - sala 2", "Jaszczurze Korytarze p.1 - sala 3", "Jaszczurze Korytarze p.1 - sala 4", "Jaszczurze Korytarze p.2 - sala 1", "Jaszczurze Korytarze p.2 - sala 2", "Jaszczurze Korytarze p.2 - sala 3", "Jaszczurze Korytarze p.2 - sala 4", "Jaszczurze Korytarze p.2 - sala 5", "Mechata Jama p.1", "Mechata Jama p.2", "Mechata Jama p.3", "Nora Jaszczurzych Koszmarów p.1 - sala 1", "Nora Jaszczurzych Koszmarów p.1 - sala 2", "Skryty Azyl", "Strumienie Szemrzących Wód", "Zawodzące Kaskady", "Złota Dąbrowa"]},
      {"name": "Zagrzybiony las (232lvl)", "desc": "Zoptymalizowana baza (Potworów: 205)", "mobCount": 205, "maps": ["Garb Połamanych Konarów", "Gardziel Podgnitych Mchów p.1", "Gardziel Podgnitych Mchów p.2", "Gardziel Podgnitych Mchów p.3", "Gęste Sploty", "Zalesiony Step", "Zarosłe Szczeliny p.1 - sala 1", "Zarosłe Szczeliny p.1 - sala 2", "Zarosłe Szczeliny p.1 - sala 3", "Zmurszały Łęg"]},
      {"name": "Elgary (236lvl)", "desc": "Zoptymalizowana baza (Potworów: 155)", "mobCount": 155, "maps": ["Gaj Księżycowego Blasku", "Głusza Srebrnego Rogu", "Knieja Lunarnych Głazów", "Szepty Menhirów", "Zacienione Wnęki p.1 - sala 1", "Zacienione Wnęki p.1 - sala 2", "Zacienione Wnęki p.2 - sala 1", "Zacienione Wnęki p.2 - sala 2", "Zakątek Nocnych Szelestów"]},
      {"name": "Drzewce (239lvl)", "desc": "Zoptymalizowana baza (Potworów: 215)", "mobCount": 215, "maps": ["Jaskinia Korzennego Czaru p.1 - sala 1", "Jaskinia Korzennego Czaru p.1 - sala 2", "Jaskinia Korzennego Czaru p.1 - sala 3", "Jaskinia Korzennego Czaru p.1 - sala 4", "Jaskinia Korzennego Czaru p.2 - sala 1", "Jaskinia Korzennego Czaru p.2 - sala 2", "Jaskinia Korzennego Czaru p.3", "Krzaczasta Grota p.1 - sala 1", "Krzaczasta Grota p.1 - sala 2", "Krzaczasta Grota p.1 - sala 3", "Krzaczasta Grota p.2 - sala 1", "Krzaczasta Grota p.2 - sala 2", "Krzaczasta Grota p.2 - sala 3", "Piaskowa Gęstwina", "Regiel Zabłąkanych", "Urwisko Zdrewniałych", "Wąwóz Zakorzenionych Dusz", "Źródło Zakorzenionego Ludu"]},
      {"name": "Bolity (244lvl)", "desc": "Zoptymalizowana baza (Potworów: 135)", "mobCount": 135, "maps": ["Dolina Chmur", "Złota Góra p.1 - sala 1", "Złota Góra p.1 - sala 2", "Złota Góra p.1 - sala 3", "Złota Góra p.1 - sala 4", "Złota Góra p.2 - sala 1", "Złota Góra p.2 - sala 2", "Złota Góra p.2 - sala 3", "Złota Góra p.2 - sala 4", "Złota Góra p.3 - sala 1", "Złota Góra p.3 - sala 2"]},
      {"name": "Niecka (248lvl)", "desc": "Zoptymalizowana baza (Potworów: 165)", "mobCount": 165, "maps": ["Chantli", "Chantli Cuaitla Citlalina", "Niecka Xiuh Atl", "Oztotl Tzacua p.1 - sala 1", "Oztotl Tzacua p.1 - sala 2", "Oztotl Tzacua p.2 - sala 1", "Oztotl Tzacua p.2 - sala 2", "Oztotl Tzacua p.3 - sala 1", "Oztotl Tzacua p.3 - sala 2", "Oztotl Tzacua p.4 - sala 1", "Oztotl Tzacua p.4 - sala 2", "Oztotl Tzacua p.5"]},
      {"name": "Maho (253lvl)", "desc": "Zoptymalizowana baza (Potworów: 285)", "mobCount": 285, "maps": ["Altepetl Mahoptekan", "Topan p.1", "Topan p.10", "Topan p.11", "Topan p.12", "Topan p.13", "Topan p.2", "Topan p.3", "Topan p.4", "Topan p.5", "Topan p.6", "Topan p.7", "Topan p.8", "Topan p.9", "Wschodni Mictlan p.1", "Wschodni Mictlan p.2", "Wschodni Mictlan p.3", "Wschodni Mictlan p.4", "Wschodni Mictlan p.5", "Wschodni Mictlan p.6", "Wschodni Mictlan p.7", "Wschodni Mictlan p.8", "Zachodni Mictlan p.1", "Zachodni Mictlan p.2", "Zachodni Mictlan p.3", "Zachodni Mictlan p.4", "Zachodni Mictlan p.5", "Zachodni Mictlan p.6", "Zachodni Mictlan p.7", "Zachodni Mictlan p.8", "Zachodni Mictlan p.9"]},
      {"name": "Wiedźmowe potwory (258lvl)", "desc": "Zoptymalizowana baza (Potworów: 175)", "mobCount": 175, "maps": ["Jęczywąwóz", "Plugawe Pustkowie", "Pogranicze Wisielców", "Siedlisko Przyjemnej Woni", "Siedlisko Przyjemnej Woni - źródło", "Skalisty Styk", "Zachodnie Zbocze", "Zacisze Zimnych Wiatrów"]},
      {"name": "Potępione zamczysko (261lvl)", "desc": "Zoptymalizowana baza (Potworów: 235)", "mobCount": 235, "maps": ["Potępione Zamczysko", "Potępione Zamczysko - głębokie lochy", "Potępione Zamczysko - korytarz wejściowy", "Potępione Zamczysko - korytarz wschodni", "Potępione Zamczysko - korytarz zachodni", "Potępione Zamczysko - lochy wschodnie p.1", "Potępione Zamczysko - lochy wschodnie p.2", "Potępione Zamczysko - lochy zachodnie p.1", "Potępione Zamczysko - lochy zachodnie p.2", "Potępione Zamczysko - północna komnata", "Potępione Zamczysko - sala ofiarna", "Potępione Zamczysko - wschodnia komnata", "Potępione Zamczysko - zachodnia komnata", "Potępione Zamczysko - łącznik wschodni", "Potępione Zamczysko - łącznik zachodni", "Wieża Szlochów p.1", "Wieża Szlochów p.2", "Wieża Szlochów p.3"]},
      {"name": "Katakumby (268lvl)", "desc": "Zoptymalizowana baza (Potworów: 205)", "mobCount": 205, "maps": ["Grobowiec Seta", "Katakumby Gwałtownej Śmierci", "Katakumby Krwawych Wypraw", "Katakumby Odnalezionych Skrytobójców", "Katakumby Opętanych Dusz", "Katakumby Poległych Legionistów", "Komnaty Bezdusznych - sala 1", "Komnaty Bezdusznych - sala 2", "Korytarz Porzuconych Marzeń", "Korytarz Porzuconych Nadziei", "Pustynne Katakumby", "Pustynne Katakumby - sala 1", "Pustynne Katakumby - sala 2", "Wschodni Tunel Jaźni", "Zachodni Tunel Jaźni"]},
      {"name": "Pustynia (275lvl)", "desc": "Zoptymalizowana baza (Potworów: 265)", "mobCount": 265, "maps": ["Grota Poświęcenia", "Jaskinia Odwagi", "Jaskinia Piaskowej Burzy s.1", "Jaskinia Piaskowej Burzy s.2", "Jaskinia Próby", "Jaskinia Smoczej Paszczy p.1", "Jaskinia Smoczej Paszczy p.2", "Jaskinia Szczęk", "Jaskinia Sępa s.1", "Jaskinia Sępa s.2", "Jurta Chaegda", "Jurta Czcicieli", "Jurta Nomadzka", "Namiot Błogosławionych", "Namiot Gwardii Smokoszczękich", "Namiot Naznaczonych", "Namiot Piechoty Piłowej", "Namiot Pustynnych Smoków", "Pustynia Shaiharrud - wschód", "Pustynia Shaiharrud - zachód", "Skały Umarłych", "Smocze Skalisko", "Sępiarnia", "Urwisko Vapora", "Świątynia Hebrehotha - przedsionek", "Świątynia Hebrehotha - sala czciciela", "Świątynia Hebrehotha - sala ofiary"]},
      {"name": "Driady (280lvl)", "desc": "Zoptymalizowana baza (Potworów: 155)", "mobCount": 155, "maps": ["Drzewo Życia p.1", "Drzewo Życia p.2", "Drzewo Życia p.3", "Gvar Hamryd", "Jaskinia Suchych Pędów s.1", "Jaskinia Suchych Pędów s.2", "Jaskinia Suchych Pędów s.3", "Jaskinia Suchych Pędów s.4", "Matecznik Szelestu", "Rozlewisko Kai"]}
    ];

// === BEZWZGLĘDNA ŁATKA CZYSZCZĄCA v64.4 ===
    let lsProfiles = JSON.parse(localStorage.getItem('exp_profiles_v64_4') || 'null');

    // Jeśli baza jest pusta lub różni się długością od tej z kodu - wymusza twardy reset
    if (!lsProfiles || lsProfiles.length !== window.defaultExpProfiles.length) {
        lsProfiles = JSON.parse(JSON.stringify(window.defaultExpProfiles));
        localStorage.setItem('exp_profiles_v64_4', JSON.stringify(lsProfiles));
        console.log("%c[System] Baza expowisk zaktualizowana pomyślnie z kodu!", "color: #00e5ff; font-weight: bold;");
    }
    let loadedProfiles = lsProfiles;
    window.loadedProfiles = lsProfiles; // Globalne zabezpieczenie przed błędem ReferenceError

// --- NOWA LOGIKA BAZY I POLECANYCH EXPOWISK ---
    window.renderRecommendedExp = function() {
        let c = document.getElementById('expRecList');
        if(!c) return;

        let playerLvl = (typeof Engine !== 'undefined' && Engine.hero && Engine.hero.d && Engine.hero.d.lvl) ? Engine.hero.d.lvl : 1;
        // ROZSZERZONY ZAKRES: Od -10 do +25 leveli!
        let minTarget = playerLvl - 10;
        let maxTarget = playerLvl + 25;

        let html = '';

        // Wyeliminowanie ReferenceError, sięgamy wprost do botSettings lub zabezpieczenia
        let profilesToRender = (botSettings && botSettings.expProfiles) ? botSettings.expProfiles : window.defaultExpProfiles;

        if (profilesToRender) {
            profilesToRender.forEach((p, index) => {
                let lvlMatch = p.name.match(/\((\d+)\s*lvl\)/i);
                if(lvlMatch && lvlMatch[1]) {
                    let baseLvl = parseInt(lvlMatch[1]);
                    if(baseLvl >= minTarget && baseLvl <= maxTarget) {
                        html += `
                            <label style="display:flex; align-items:flex-start; gap:5px; background:#1a1a1a; padding:5px; border:1px solid #333; cursor:pointer; color:#d4af37; font-size:11px; margin-bottom:2px;">
                                <input type="checkbox" class="chk-rec-profile" data-index="${index}" style="margin-top:2px;">
                                <div style="display:flex; flex-direction:column;">
                                    <b style="color:#00acc1;">${p.name}</b>
                                    <span style="color:#888; font-size:9px;">Mapy: ${p.maps.join(', ')}</span>
                                </div>
                            </label>
                        `;
                    }
                }
            });
        }

        if(html === '') {
            c.innerHTML = '<div style="text-align:center; color:#777; padding:10px; font-size:10px;">Brak gotowych expowisk w bazie dla Twojego przedziału poziomowego.</div>';
        } else {
            c.innerHTML = html;
        }
    };
  const ZAKONNICY = {

        "Thuzal": {x: 72, y: 20},

        "Tuzmer": {x: 51, y: 33},

        "Karka-han": {x: 43, y: 28},

        "Werbin": {x: 27, y: 19},

        "Torneg": {x: 54, y: 28},

        "Ithan": {x: 56, y: 26},

        "Eder": {x: 26, y: 40}

    };



    let botSettings = {

        radarEnabled: true, autoAttack: false,

        reactionMin: 400, reactionMax: 900,

        attackDelayMin: 800, attackDelayMax: 1500,

        isRecording: false, toggleKey: '',

        mapLoadMin: 1000, mapLoadMax: 1500,

        stepMin: 100, stepMax: 150, waitMin: 200, waitMax: 500,

        throttleMin: 500, throttleMax: 800,

        randomRadius: 2, visionRange: 7,

        expAntiLagMin: 1500, expAntiLagMax: 2500,

        useTeleports: true,
        discord: { enabled: false, url: '' }, // NOWOŚĆ: Pamięć ustawień Discorda

        unlockedTeleports: JSON.parse(localStorage.getItem('hero_teleports_v64') || '{"Thuzal":false, "Tuzmer":false, "Karka-han":false, "Werbin":false, "Torneg":false, "Ithan":false, "Eder":false}'),
        exp: {

            enabled: false, minLvl: 1, maxLvl: 300,

            normal: true, elite: true, berserk: 999,

            mapOrder: JSON.parse(localStorage.getItem('exp_map_order_v64') || '[]')

        },

        expProfiles: loadedProfiles

    };

    let checkedPoints = new Set();

    let positionHistory = [];

    let lastMapName = "";



    let editingGatewayFor = null;

    let currentRouteIndex = parseInt(sessionStorage.getItem('hero_route_index')) || -1;

    let checkedMapsThisSession = new Set(JSON.parse(sessionStorage.getItem('hero_checked_maps') || '[]'));

    let heroFoundAlerted = false;



    let isRushing = false;

    let rushTarget = "";

    let rushTargetX = null;

    let rushTargetY = null;

    let rushInterval = null;



    let isPatrolling = false;

    let patrolIndex = 0;

    let smoothPatrolInterval = null;

    let stuckCount = 0;

    let lastX = -1, lastY = -1;

    let nextAllowedClickTime = 0;



    let isWaitingForBossClick = false;

    let activeBossTarget = null;



    function saveCheckedMaps() { sessionStorage.setItem('hero_checked_maps', JSON.stringify([...checkedMapsThisSession])); }

    function saveBossCoords() { localStorage.setItem('hero_boss_coords_v64', JSON.stringify(bossSavedCoords)); }



    // ==========================================

    // LOGIKA INTELIGENTNEGO ZASIĘGU

    // ==========================================

    function checkVisionRange() {

        if (!isPatrolling || !Engine || !Engine.hero || !Engine.hero.d || currentCordsList.length === 0) return;



        const h = Engine.hero.d;

        let anyPointMarked = false;



        currentCordsList.forEach((coord, index) => {

            if (checkedPoints.has(index)) return;

            const dx = Math.abs(h.x - coord[0]);

            const dy = Math.abs(h.y - coord[1]);

            const distance = Math.max(dx, dy);



            if (distance <= botSettings.visionRange) {

                checkedPoints.add(index);

                anyPointMarked = true;

            }

        });



        if (anyPointMarked) {

            renderCordsList(patrolIndex);

        }

    }



    // ==========================================

    // INICJALIZACJA

    // ==========================================

   const bootloader = setInterval(() => {
        if (typeof Engine !== 'undefined' && Engine.hero && Engine.hero.d && Engine.map && Engine.map.d && Engine.map.d.id) {
            clearInterval(bootloader);
            loadData();
            cleanOldGateways();
            initGUI();
            setInterval(autoDetectEngineData, 800);
            setInterval(heroPositionTracker, 100);
            setInterval(radarLoop, 150);
            document.addEventListener('keydown', handleGlobalKeydown);
            setupMapClickListener();
        }
    }, 2000);

    // Zabezpieczenie brakującej funkcji, naprawia krytyczny CRASH!
    function setupMapClickListener() {
        document.body.addEventListener('click', (e) => {
            if (isWaitingForBossClick && activeBossTarget) {
                isWaitingForBossClick = false;
                if(document.getElementById('bossClickBanner')) document.getElementById('bossClickBanner').remove();
            }
        });
    }



function loadData() {
        let s1 = localStorage.getItem('hero_settings_db_v64') || localStorage.getItem('hero_settings_db_v61');
        if (s1) {
            let parsed = JSON.parse(s1);
            if (parsed.waitMin === undefined) { parsed.waitMin = 200; parsed.waitMax = 500; }
            if (parsed.autoAttack === undefined) { parsed.autoAttack = false; }
            delete parsed.combatKey;

            if (!parsed.expProfiles || parsed.expProfiles.length !== window.defaultExpProfiles.length) {
                parsed.expProfiles = JSON.parse(JSON.stringify(window.defaultExpProfiles));
            }
            botSettings = {...botSettings, ...parsed};
        }

        let s2 = localStorage.getItem('hero_global_gateways_v20'); if (s2) globalGateways = JSON.parse(s2);
        let s3 = localStorage.getItem('hero_map_order_v20'); if (s3) heroMapOrder = JSON.parse(s3);
    }



    function saveSettings() { localStorage.setItem('hero_settings_db_v64', JSON.stringify(botSettings)); }

    function saveSettings() { localStorage.setItem('hero_settings_db_v64', JSON.stringify(botSettings)); }

    // --- SILNIK MARGONEURO: DISCORD WEBHOOK ---
    window.sendDiscordWebhook = function(title, description, colorHex = 16753920) {
        if (!botSettings.discord || !botSettings.discord.enabled || !botSettings.discord.url) return;
        
        let payload = {
            username: "MargoNeuro",
            avatar_url: "https://www.margonem.pl/favicon.ico",
            embeds: [{
                title: title,
                description: description,
                color: colorHex,
                timestamp: new Date().toISOString()
            }]
        };

        fetch(botSettings.discord.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(e => console.error("[MargoNeuro] Błąd wysyłania na Discorda:", e));
    };

    function saveGateways() { localStorage.setItem('hero_global_gateways_v20', JSON.stringify(globalGateways)); }

    function saveMapOrder() { localStorage.setItem('hero_map_order_v20', JSON.stringify(heroMapOrder)); }



// Twój perfekcyjny kalkulator na bazie Engine.bags
    window.getBagStats = function() {
        if (typeof Engine === 'undefined' || !Engine.bags) return { freeSlots: 0, usedSlots: 0, totalCapacity: 0 };

        const bagsRaw = Engine.bags || [];
        const bags = bagsRaw
            .map((b, idx) => {
                if (!Array.isArray(b) || !b[2]) return null;
                return {
                    capacity: Number(b[0]) || 0,
                    used: Number(b[1]) || 0,
                    free: (Number(b[0]) || 0) - (Number(b[1]) || 0)
                };
            })
            .filter(Boolean);

        return {
            bagsCount: bags.length,
            totalCapacity: bags.reduce((s, b) => s + b.capacity, 0),
            usedSlots: bags.reduce((s, b) => s + b.used, 0),
            freeSlots: bags.reduce((s, b) => s + b.free, 0)
        };
    };

    function updateUI() {
        // --- DYNAMICZNY LICZNIK WOLNEGO MIEJSCA ---
        if (document.getElementById('autosellCapacityDisplay') && typeof window.getBagStats === 'function') {
            let stats = window.getBagStats();
            let display = document.getElementById('autosellCapacityDisplay');
            display.innerText = stats.freeSlots;
            if (stats.freeSlots <= 0) display.style.color = "#e53935";
            else display.style.color = "#4caf50";
        }
        // ------------------------------------------

        if (document.getElementById('heroGatewaysGUI') && document.getElementById('heroGatewaysGUI').style.display === 'flex') {

            renderGatewaysDatabase();

        }

        if (document.getElementById('heroMapListContainer') && document.getElementById('heroMapListContainer').parentElement.style.display !== 'none') {

            if (typeof window.renderMapOrderList === 'function') window.renderMapOrderList();

        }

        if (document.getElementById('e2Container') && document.getElementById('e2Container').style.display !== 'none') {

            renderBossList('e2ListContainer', elityIIData, 'e2Search', '#ba68c8');

        }

        if (document.getElementById('kolosyContainer') && document.getElementById('kolosyContainer').style.display !== 'none') {

            renderBossList('kolosyListContainer', kolosyData, 'kolosySearch', '#e64a19');

        }

        if (document.getElementById('expContainer') && document.getElementById('expContainer').style.display !== 'none') {

            if(typeof window.renderExpMaps === 'function') window.renderExpMaps();

        }

    }



function cleanOldGateways() {
        let changed = false;
        for (let src in globalGateways) {
            for (let target in globalGateways[src]) {
                let gw = globalGateways[src][target];
                let tp = ZAKONNICY[src];

                // AUTOMATYCZNE USUWANIE ZAKONNIKÓW Z BAZY BRAM
                if (tp && gw && Math.abs(gw.x - tp.x) <= 2 && Math.abs(gw.y - tp.y) <= 2) {
                    delete globalGateways[src][target];
                    changed = true;
                    continue;
                }

                if (target.includes(" .")) {
                    let base = target.split(" .")[0];
                    if (!globalGateways[src][base]) {
                        globalGateways[src][base] = { x: gw.x, y: gw.y, allCoords: [[gw.x, gw.y]] };
                    } else {
                        if (!globalGateways[src][base].allCoords) globalGateways[src][base].allCoords = [[globalGateways[src][base].x, globalGateways[src][base].y]];
                        let exists = globalGateways[src][base].allCoords.some(c => c[0]===gw.x && c[1]===gw.y);
                        if (!exists) globalGateways[src][base].allCoords.push([gw.x, gw.y]);
                    }
                    delete globalGateways[src][target];
                    changed = true;
                }
            }
        }
        if (changed) saveGateways();
    }

    window.saveGatewayToDB = function(source, target, x, y) {
        // Blokada przed ręcznym nagraniem Zakonnika
        let tp = ZAKONNICY[source];
        if (tp && Math.abs(x - tp.x) <= 2 && Math.abs(y - tp.y) <= 2) return;

        if (!globalGateways[source]) globalGateways[source] = {};
        let baseTarget = target.trim().split(" .")[0];



        if (!globalGateways[source][baseTarget]) {

            globalGateways[source][baseTarget] = { x: x, y: y, allCoords: [[x, y]] };

        } else {

            let gw = globalGateways[source][baseTarget];

            if (!gw.allCoords) gw.allCoords = [[gw.x, gw.y]];

            let exists = gw.allCoords.some(c => c[0] === x && c[1] === y);

            if (!exists) { gw.allCoords.push([x, y]); }

        }

        saveGateways();

        updateUI();

        return baseTarget;

    }



    // ==========================================

    // ATAK & RADAR

    // ==========================================

    function showHeroAlertBanner(heroName) {

        let b = document.createElement('div');

        b.style.cssText = "position:fixed; top:20%; left:50%; transform:translateX(-50%); background:rgba(200, 0, 0, 0.95); border:4px solid #ffeb3b; color:#fff; padding:30px 50px; font-size:30px; font-weight:bold; z-index:999999; border-radius:10px; text-shadow:2px 2px 5px #000; text-align:center; animation: blinker 1s linear infinite;";

        b.innerHTML = `🚨 ZNALEZIONO CEL! 🚨<br><br><span style="color:#ffcc00; font-size:40px;">${heroName}</span><br><br><span style="font-size:16px;cursor:pointer;display:block;margin-top:20px; text-decoration:underline;" onclick="this.parentElement.remove()">[ZAMKNIJ ALARM]</span>`;

        document.body.appendChild(b);

        let s = document.createElement('style');

        s.innerHTML = `@keyframes blinker { 50% { opacity: 0.5; } }`;

        document.head.appendChild(s);

    }



let attackInterval = null;

    let lastGoToTime = 0;



    function attackTarget(npcId) {

        if (attackInterval) clearInterval(attackInterval);



        let targetId = parseInt(npcId, 10);

        console.log(`%c[HERO] Cel namierzony (ID: ${targetId}). Włączam Kieszonkowego Berserka...`, "color: #f44336; font-weight: bold;");



        // METODA GARGONEMA - Włącza natywnego auto-ataka prosto na serwerze gry

        if (typeof window._g === 'function') {

            window._g(`settings&action=update&id=34&v=1`); // Włącz Berserka

            window._g(`settings&action=update&id=34&key=elite&v=1`); // Bij Elity

            window._g(`settings&action=update&id=34&key=elite2&v=1`); // Bij Elity 2 i Herosów

            window._g(`fight&a=attack&id=${targetId}`); // Wymuś start

        }



        attackInterval = setInterval(() => {

            if (typeof Engine === 'undefined' || !Engine.hero || !Engine.hero.d) return;



            // 1. Jeśli walka trwa - wyłączamy Berserka (żeby nie biegał dalej) i kończymy pętlę

            if (Engine.battle && (Engine.battle.show || Engine.battle.d)) {

                clearInterval(attackInterval);

                if (typeof window._g === 'function') window._g(`settings&action=update&id=34&v=0`);

                console.log(`%c[HERO] Walka rozpoczęta. Berserk wyłączony.`, "color: #4caf50;");

                return;

            }



            // 2. Jeśli serwer jeszcze nie zareagował, podbiegamy standardowo i klikamy (Zabezpieczenie)

            let npcs = (typeof Engine.npcs.check === 'function') ? Engine.npcs.check() : Engine.npcs.d;

            let targetNpc = npcs ? npcs[npcId] : null;



            if (!targetNpc) {

                clearInterval(attackInterval);

                return;

            }



            let tx = targetNpc.d ? targetNpc.d.x : targetNpc.x;

            let ty = targetNpc.d ? targetNpc.d.y : targetNpc.y;

            let hx = Engine.hero.d.x;

            let hy = Engine.hero.d.y;



            let dist = Math.max(Math.abs(hx - tx), Math.abs(hy - ty));



            if (dist > 1) {

                let now = Date.now();

                if (now - lastGoToTime > 600) {

                    if (typeof Engine.hero.autoGoTo === 'function') Engine.hero.autoGoTo({x: tx, y: ty});

                    lastGoToTime = now;

                }

            } else {

                if (Engine.npcs && typeof Engine.npcs.interact === 'function') Engine.npcs.interact(targetId);

                let confirmBtn = document.querySelector(".green.button, .podejdz-btn, .zaatakuj-btn");

                if (confirmBtn && confirmBtn.innerText.toLowerCase().includes("zaatakuj")) confirmBtn.click();

            }

        }, 150);

    }

    function radarLoop() {

        if (!botSettings.radarEnabled || heroFoundAlerted) return;

        if (typeof Engine !== 'undefined' && Engine.map && Engine.map.isLoading) return;



        let targetHero = document.getElementById('selHero').value;

        let isE2Mode = document.getElementById('e2ModeToggle').classList.contains('active-tab');

        let isKolosMode = document.getElementById('kolosyModeToggle').classList.contains('active-tab');



        let npcList = {};

        if (typeof Engine !== 'undefined' && Engine.npcs) {

            if (typeof Engine.npcs.check === 'function') npcList = Engine.npcs.check();

            else if (Engine.npcs.d) npcList = Engine.npcs.d;

        }



        for (let id in npcList) {

            let npc = npcList[id];

            if (!npc) continue;



            let nData = npc.d ? npc.d : npc;

            if (nData.type === 4 || nData.dead === true || nData.del === true || npc.del === true) continue;



            let isTarget = false;

            let wt = parseInt(nData.wt);



            if (!isE2Mode && !isKolosMode) {

                if (targetHero && targetHero !== "") {

                    if (nData.nick) {

                        let cleanNick = nData.nick.replace(/<[^>]*>?/gm, '').toLowerCase();

                        if (cleanNick.includes(targetHero.toLowerCase())) isTarget = true;

                    }

                    if (wt === 8 || wt === 9) isTarget = true;

                } else {

                    if (wt === 8 || wt === 9 || wt === 14) isTarget = true;

                }

            } else {

                if (activeBossTarget) {

                     if (nData.nick && nData.nick.replace(/<[^>]*>?/gm, '').toLowerCase() === activeBossTarget.toLowerCase()) {

                         isTarget = true;

                     }

                }

            }



            if (isTarget) {

                heroFoundAlerted = true;



                let reactionDelay = Math.floor(Math.random() * (botSettings.reactionMax - botSettings.reactionMin + 1)) + botSettings.reactionMin;

                setTimeout(() => {

                    stopPatrol(true);



                    try {

                        let audio = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg');

                        audio.play();

                        setTimeout(() => { try { audio.pause(); audio.currentTime = 0; } catch(e){} }, 2000);

                    } catch(e) {}




                    let foundName = nData.nick ? nData.nick.replace(/<[^>]*>?/gm, '') : targetHero;
                    showHeroAlertBanner(foundName);
                    
           // PUSH NA DISCORD
                    if (botSettings.discord?.alerts?.hero) {
                        let mapName = typeof Engine !== 'undefined' ? Engine.map.d.name : lastMapName;
                        window.sendDiscordWebhook(
                            "🚨 WYKRYTO CEL NA RADARZE!", 
                            `**Znalazłem:** ${foundName}\n**Lokalizacja:** ${mapName} [X: ${nData.x}, Y: ${nData.y}]`, 
                            16753920 // Złoty kolor
                        );
                    }



                    document.getElementById('chkRadar').checked = false;

                    botSettings.radarEnabled = false;

                    saveSettings();



                   if (botSettings.autoAttack) {

                        let attackDelay = Math.floor(Math.random() * (botSettings.attackDelayMax - botSettings.attackDelayMin + 1)) + botSettings.attackDelayMin;

                        setTimeout(() => {

                            // Naprawa: zamieniamy tekstowe ID (string) na liczbę (integer)

                            attackTarget(parseInt(id, 10), nData.x, nData.y);

                        }, attackDelay);

                    }



                }, reactionDelay);

                return;

            }

        }

    }



   // ==========================================

    // E2 / KOLOSY: Zapisywanie Aktualnych Koordynatów

    // ==========================================

    window.saveCurrentCoordsForBoss = function(bossName) {

        if (typeof Engine === 'undefined' || !Engine.hero || !Engine.hero.d) return heroAlert("Błąd: Nie można pobrać Twojej pozycji.");

        let cx = Engine.hero.d.x; let cy = Engine.hero.d.y;

        bossSavedCoords[bossName] = { map: lastMapName, x: cx, y: cy };

        saveBossCoords(); updateUI();

        heroAlert(`✅ Pomyślnie zapisano koordynaty dla ${bossName}!\n\nZapisano Twoją obecną pozycję:\nMapa: ${lastMapName}\nKratka: [${cx}, ${cy}]`);

    };



    window.editBossCoords = function(bossName) {

        let currentData = bossSavedCoords[bossName]; if (!currentData) return;

        heroPrompt(`Edytuj oś X dla ${bossName}:`, currentData.x, (newX) => {

            if(newX !== null && newX !== "") {

                heroPrompt(`Edytuj oś Y dla ${bossName}:`, currentData.y, (newY) => {

                    if(newY !== null && newY !== "") {

                        bossSavedCoords[bossName].x = parseInt(newX); bossSavedCoords[bossName].y = parseInt(newY);

                        saveBossCoords(); updateUI(); heroAlert(`Zaktualizowano kordy dla ${bossName}: [${newX}, ${newY}]`);

                    }

                });

            }

        });

    };



    window.deleteBossCoords = function(bossName) {

        heroConfirm(`Czy na pewno usunąć zapisane koordynaty dla bosa:\n${bossName}?`, (res) => {

            if(res) { delete bossSavedCoords[bossName]; saveBossCoords(); updateUI(); }

        });

    };



    window.toggleBossCoordPicker = function(bossName) {

        if (!Engine || !Engine.map) return;

        activeBossTarget = bossName;

        isWaitingForBossClick = true;



        let banner = document.createElement('div');

        banner.id = "bossClickBanner";

        banner.style.cssText = "position:fixed; top:10%; left:50%; transform:translateX(-50%); background:rgba(0, 172, 193, 0.9); border:2px solid #fff; color:#fff; padding:15px; font-size:16px; font-weight:bold; z-index:999999; border-radius:10px; pointer-events:none;";

        banner.innerHTML = `🖱️ Kliknij w mapę by ustawić respawn dla: ${bossName}`;

        document.body.appendChild(banner);



        let checkClick = setInterval(() => {

            if (!isWaitingForBossClick) {

                clearInterval(checkClick);

                if(document.getElementById('bossClickBanner')) document.getElementById('bossClickBanner').remove();

            }

        }, 200);

    }



    function updateSuitableBosses(containerId, searchId, dataArray, labelColor) {

        let container = document.getElementById(containerId);

        if (!container || !Engine || !Engine.hero) return;



        let playerLvl = Engine.hero.d.lvl;

        if (!playerLvl) return;



        // Boss wyświetla się od (boss.level - 13) do jego maksa. Kolosy mają limit = 999.

        let suitable = dataArray.filter(e => playerLvl >= (e.level - 13) && playerLvl <= e.limit);

        let html = suitable.map(e => `<span style="color:${labelColor}; font-weight:bold; cursor:pointer;" onclick="document.getElementById('${searchId}').value='${e.name}'; document.getElementById('${searchId}').dispatchEvent(new Event('input'));">${e.name} (${e.level})</span>`).join(', ');



        container.innerHTML = `<div style="font-size:10px; color:#a99a75; font-weight:bold;">Moby na Twój poziom (od ${playerLvl - 13 > 0 ? playerLvl - 13 : 1} w górę):</div>

                               <div style="font-size:11px; margin-top:3px; max-height:60px; overflow-y:auto; line-height:1.4;">${html || 'Brak mobów w Twoim przedziale'}</div>`;

    }



    // ==========================================

    // TRACKING & DETEKCJA MAP

    // ==========================================

    function heroPositionTracker() {

        if (typeof Engine !== 'undefined' && Engine.hero && Engine.hero.d && Engine.map && Engine.map.d && Engine.map.d.name) {

            let cx = Engine.hero.d.x; let cy = Engine.hero.d.y;

            if (cx > 0 || cy > 0) { positionHistory.push({ x: cx, y: cy, map: Engine.map.d.name }); if (positionHistory.length > 5) positionHistory.shift(); }

        }

    }

// ==========================================

// ==========================================
    // AUTO-SKANER SILNIKA MARGONEM (Deep Engine Read - Grupujący wejścia)
    // ==========================================
    function autoLearnGateways() {
    if (typeof Engine === 'undefined' || !Engine.map || !Engine.map.d) return;

    let currMap = Engine.map.d.name;
    if (!currMap) return;

    let gatewaysFound = HeroScannerModule.scanCurrentMap(currMap, ZAKONNICY) || [];
    let addedOrUpdated = false;

    if (!globalGateways[currMap]) globalGateways[currMap] = {};

    gatewaysFound.forEach(gw => {
        if (!gw) return;

        let target = gw.targetMap;
        let px = gw.x;
        let py = gw.y;

        if (!target || px === undefined || py === undefined) return;

        if (!globalGateways[currMap][target]) {
            globalGateways[currMap][target] = {
                x: px,
                y: py,
                allCoords: [[px, py]]
            };
            addedOrUpdated = true;
        } else {
            if (!globalGateways[currMap][target].allCoords) {
                globalGateways[currMap][target].allCoords = [
                    [globalGateways[currMap][target].x, globalGateways[currMap][target].y]
                ];
            }

            let exists = globalGateways[currMap][target].allCoords.some(c => c[0] === px && c[1] === py);

            if (!exists) {
                globalGateways[currMap][target].allCoords.push([px, py]);
                addedOrUpdated = true;
            }
        }
    });

    if (addedOrUpdated) {
        saveGateways();
        updateUI();
    }
}
function autoDetectEngineData() {
    if (typeof Engine === 'undefined' || !Engine.map || !Engine.map.d) return;

    let currentName = Engine.map.d.name;
    if (!currentName || currentName === "undefined") return;

    // --- ŁATKA: SYNCHRONIZACJA TELEPORTÓW NA PODSTAWIE NICKU ---
    if (Engine.hero && Engine.hero.d && Engine.hero.d.nick) {
        if (window.lastLoadedNick !== Engine.hero.d.nick) {
            window.lastLoadedNick = Engine.hero.d.nick;
            let allTps = JSON.parse(localStorage.getItem('hero_teleports_by_nick_v64') || '{}');

            if (allTps[window.lastLoadedNick]) {
                botSettings.unlockedTeleports = allTps[window.lastLoadedNick];
            } else {
                botSettings.unlockedTeleports = {"Thuzal":false, "Tuzmer":false, "Karka-han":false, "Werbin":false, "Torneg":false, "Ithan":false, "Eder":false};
            }
            if (typeof window.renderTeleportList === 'function' && document.getElementById('heroTeleportsGUI') && document.getElementById('heroTeleportsGUI').style.display !== 'none') {
                window.renderTeleportList();
            }
        }
    }

    // --- ŁATKA: SPRAWDZANIE AWANSU I AUTO-EXPOWISKO ---
    if (Engine.hero && Engine.hero.d && Engine.hero.d.lvl) {
        let currentLvl = Engine.hero.d.lvl;
        if (window.lastHeroExpLevel !== currentLvl) {
            if (window.lastHeroExpLevel !== 0 && currentLvl > window.lastHeroExpLevel) {
                if (typeof window.logExp === 'function') window.logExp(`🎉 Awans na ${currentLvl} poziom!`, "#4caf50");
                if (typeof window.checkAndLoadBestExpProfile === 'function') {
                    setTimeout(() => window.checkAndLoadBestExpProfile(false), 500);
                }
            }
            window.lastHeroExpLevel = currentLvl;

            let minOff = Math.abs(botSettings.berserk.minLvlOffset || 20);
            let maxOff = parseInt(botSettings.berserk.maxLvlOffset || 100);
            botSettings.exp.minLvl = Math.max(1, currentLvl - minOff);
            botSettings.exp.maxLvl = currentLvl + maxOff;

            let elMin = document.getElementById('expMinL'); let elMax = document.getElementById('expMaxL');
            if (elMin) elMin.value = botSettings.exp.minLvl; if (elMax) elMax.value = botSettings.exp.maxLvl;

            saveSettings();
            if (typeof window.updateServerBerserk === 'function') window.updateServerBerserk();
            if (botSettings.exp.useAggro && typeof window.toggleNativeAggroVisuals === 'function') window.toggleNativeAggroVisuals(true);
        }
    }

    updateSuitableBosses('e2SuitableContainer', 'e2Search', elityIIData, '#ba68c8');
    updateSuitableBosses('kolosySuitableContainer', 'kolosySearch', kolosyData, '#ff7043');

    if (currentName !== lastMapName) {
        positionHistory = [];
        lastMapName = currentName;
        heroFoundAlerted = false;

        if (typeof autoLearnGateways === 'function') autoLearnGateways();

        const domMap = document.getElementById('currentMapNameDisplay');
        if (domMap) domMap.innerText = currentName;

        const domHero = document.getElementById('selHero');
        const heroModeToggle = document.getElementById('heroModeToggle');

        if (domHero && heroModeToggle && heroModeToggle.classList.contains('active-tab')) {
            let matchingHero = domHero.value;
            let mapHasCurrent = matchingHero && heroData[matchingHero] && heroData[matchingHero][currentName];

            if (!isPatrolling && !isRushing && !mapHasCurrent) {
                let foundHero = null;
                for (const h in heroData) {
                    if (heroData[h][currentName]) {
                        foundHero = h;
                        break;
                    }
                }
                if (foundHero) matchingHero = foundHero;
            }

            if (matchingHero) {
                if (!heroMapOrder[matchingHero] || heroMapOrder[matchingHero].length === 0) {
                    heroMapOrder[matchingHero] = Object.keys(heroData[matchingHero]);
                    saveMapOrder();
                }

                if (domHero.value !== matchingHero) {
                    domHero.value = matchingHero;
                    currentRouteIndex = -1;
                    sessionStorage.removeItem('hero_route_index');
                    checkedMapsThisSession.clear();
                    saveCheckedMaps();
                }

                let mapList = heroMapOrder[matchingHero];

                if (currentRouteIndex !== -1 && mapList[currentRouteIndex] === currentName) {
                    // Oczekiwana mapa
                } else if (currentRouteIndex !== -1 && mapList[(currentRouteIndex + 1) % mapList.length] === currentName) {
                    currentRouteIndex = (currentRouteIndex + 1) % mapList.length;
                    sessionStorage.setItem('hero_route_index', currentRouteIndex);
                } else if (mapList.includes(currentName)) {
                    currentRouteIndex = mapList.indexOf(currentName);
                    sessionStorage.setItem('hero_route_index', currentRouteIndex);
                }

                if (checkedMapsThisSession.has(currentName)) {
                    currentCordsList = [];
                } else if (heroData[matchingHero] && heroData[matchingHero][currentName]) {
                    currentCordsList = [...heroData[matchingHero][currentName]];
                } else {
                    currentCordsList = [];
                }

                checkedPoints.clear();
                updateUI();

                setTimeout(() => {
                    if (currentCordsList.length > 0 && typeof optimizeRoute === 'function') optimizeRoute();
                    if (typeof renderCordsList === 'function') renderCordsList();
                }, 200);
            } else {
                currentCordsList = [];
                checkedPoints.clear();
                if (typeof renderCordsList === 'function') renderCordsList();
                updateUI();
            }
        } else if (heroModeToggle && !heroModeToggle.classList.contains('active-tab')) {
            currentCordsList = [];
            checkedPoints.clear();
            if (typeof renderCordsList === 'function') renderCordsList();
            updateUI();
        }

        if (isRushing) {
            clearTimeout(rushInterval);
            let loadDelay = Math.floor(Math.random() * (botSettings.mapLoadMax - botSettings.mapLoadMin + 1)) + botSettings.mapLoadMin;
            setTimeout(() => {
                if (isRushing && typeof window.executeRushStep === 'function') window.executeRushStep();
            }, loadDelay);
        } else if (isPatrolling) {
            clearTimeout(smoothPatrolInterval);
            let loadDelay = Math.floor(Math.random() * (botSettings.mapLoadMax - botSettings.mapLoadMin + 1)) + botSettings.mapLoadMin;
            if (typeof window.logHero === 'function') window.logHero(`Wczytywanie mapy... Czekam ${(loadDelay/1000).toFixed(1)}s.`, "#777");
            setTimeout(() => {
                if (isPatrolling && typeof executePatrolStep === 'function') executePatrolStep();
            }, loadDelay);
        }
    }
}

// ==========================================
    // RUSH MODE (PŁYNNY RUCH)
    // ==========================================
    window.rushToMap = function(targetMapName, x = null, y = null, fullPath = null, resumePatrol = false) {
        let currentSysMap = lastMapName;
        if (currentSysMap === targetMapName) {
            if (x !== null && y !== null) safeGoTo(x, y, false);
            if (resumePatrol) {
                isPatrolling = true;
                setTimeout(() => { if(typeof executePatrolStep === 'function') executePatrolStep(); }, 500);
            }
            return;
        }

        isPatrolling = false;
        isRushing = true;
        window.isRushing = true; // Synchronizacja dla bezpiecznika
        rushTarget = targetMapName;
        rushTargetX = x;
        rushTargetY = y;
        window.rushFullPath = (typeof fullPath === 'string') ? JSON.parse(fullPath) : (fullPath || []);
        window.resumePatrolAfterRush = resumePatrol; // Flaga wznawiająca szukanie Herosa!

        let btn = document.getElementById('btnStartStop');
        if (btn) {
            btn.innerHTML = '<span class="btn-icon">⏹</span><span>Stop RUSH</span>';
            btn.style.color = "#00acc1";
            btn.style.borderColor = "#00acc1";
        }

        // Zabezpieczenie przed podwójnymi logami
        let msg = `🏃 Obieram kurs na: [${targetMapName}]`;
        if (window._lastRushTargetLog !== msg) {
            if (window.logHero) window.logHero(msg, "#00acc1");
            if (window.logExp) window.logExp(msg, "#00acc1");
            window._lastRushTargetLog = msg;
        }

        window.executeRushStep();
    };

// --- SYSTEM ZWOJÓW TELEPORTACJI Z BAZĄ MAP (V4 - PARSER ZEWNĘTRZNY) ---
    window.parseStatString = function(stat) {
        if (!stat || typeof stat !== "string") return {};
        const out = {};
        for (const part of stat.split(";")) {
            if (!part) continue;
            const idx = part.indexOf("=");
            if (idx === -1) {
                out[part] = true;
            } else {
                const key = part.slice(0, idx);
                const value = part.slice(idx + 1);
                out[key] = value;
            }
        }
        return out;
    };

    window.getMyItems = function() {
        // Priorytetowo używamy metody testMyItems() jeśli jest dostępna
        if (typeof Engine !== 'undefined' && Engine.items && typeof Engine.items.testMyItems === 'function') {
            return Object.values(Engine.items.testMyItems()).map(i => i?.d || i).filter(Boolean);
        }
        // Fallback dla innych trybów
        if (typeof Engine !== 'undefined' && Engine.heroEquipment && typeof Engine.heroEquipment.getHItems === 'function') {
            return Object.values(Engine.heroEquipment.getHItems()).map(i => i?.d || i).filter(Boolean);
        }
        if (typeof Engine !== 'undefined' && Engine.items && Engine.items.d) {
            return Object.values(Engine.items.d).map(i => i?.d || i).filter(Boolean);
        }
        return [];
    };

    window.getAvailableTeleports = function() {
        let items = window.getMyItems();
        let heroLvl = parseInt(Engine.hero?.d?.lvl) || 1;
        let tps = [];
        let allMapNames = typeof globalGateways !== 'undefined' ? Object.keys(globalGateways) : [];

        for (let item of items) {
            if (!item || item.del || item.dead) continue;

            const stats = window.parseStatString(item.stat);
            if (!stats.teleport) continue;

            // Wyciągamy [mapId, x, y, mapName]
            const [mapId, x, y, mapName] = stats.teleport.split(",");
            if (!mapName) continue;

            // Sprawdzenie wymaganego levela
            let reqLvl = parseInt(stats.reqLvl || stats.reqlvl || 0);
            if (reqLvl && heroLvl < reqLvl) continue;

            // Wyrównanie wielkości liter do bazy pathfindera
            let exactMapName = allMapNames.find(k => k.toLowerCase() === mapName.trim().toLowerCase()) || mapName.trim();
            if (!allMapNames.includes(exactMapName)) exactMapName = exactMapName.replace(/\b\w/g, c => c.toUpperCase());

            tps.push({ id: item.id, map: exactMapName, item: item });
        }
        return tps;
    };

    window.useItemById = function(itemId) {
        try {
            if (typeof Engine !== 'undefined' && Engine.items && typeof Engine.items.useItem === 'function') {
                Engine.items.useItem(itemId);
            } else if (typeof Engine !== 'undefined' && Engine.heroEquipment && typeof Engine.heroEquipment.sendUseRequest === 'function') {
                let itemsList = typeof Engine.heroEquipment.getHItems === 'function' ? Engine.heroEquipment.getHItems() : {};
                let itemObj = Object.values(itemsList).find(i => (i.d||i).id == itemId);
                if (itemObj) Engine.heroEquipment.sendUseRequest(itemObj);
            } else {
                window._g(`moveitem&st=1&id=${itemId}`);
            }
        } catch (e) {
            console.error("❌ Błąd użycia teleportu:", e);
        }
    };

    window.executeRushStep = function() {
        if (!isRushing && !window.isRushing) return;
        let currentSysMap = lastMapName;

        if (currentSysMap === rushTarget) {
            isRushing = false;
            window.isRushing = false;
            window._lastRushNextMap = null; 
            window._lastRushTargetLog = null;
            let btn = document.getElementById('btnStartStop');
            if (btn) { btn.innerHTML = '<span class="btn-icon">▶</span><span>START</span>'; btn.style.color = "#4caf50"; btn.style.borderColor = "#4caf50"; }

            if (rushTargetX !== null && rushTargetY !== null) {
                setTimeout(() => safeGoTo(rushTargetX, rushTargetY, false), 500);
            }
            
            if (window.resumePatrolAfterRush) {
                window.resumePatrolAfterRush = false;
                isPatrolling = true;
                if (btn) { btn.innerHTML = '<span class="btn-icon">⏹</span><span>STOP</span>'; btn.style.color = "#f44336"; btn.style.borderColor = "#f44336"; }
                if (window.logHero) window.logHero(`✅ Dotarto na nową mapę. Analizuję teren...`, "#4caf50");
                setTimeout(() => { if (typeof executePatrolStep === 'function') executePatrolStep(); }, 1500);
            }
            return;
        }

        let nextMap = null;
        let path = typeof getShortestPath === 'function' ? getShortestPath(currentSysMap, rushTarget) : null;
        let currentDistance = path ? path.length : 999;

        // --- MĄDRE ZWOJE TELEPORTACJI Z KALKULATOREM TRASY ---
        let tps = window.getAvailableTeleports();
        let bestTp = null;
        // Wymagamy skrócenia trasy przynajmniej o 1 mapę, żeby opłacało się zużyć zwój (np. z 4 map na 2)
        let bestDist = currentDistance - 1; 

        for (let tp of tps) {
            if (tp.map === currentSysMap) continue; // Nie używaj zwoju na mapę, na której stoisz
            
            let tpPath = typeof getShortestPath === 'function' ? getShortestPath(tp.map, rushTarget) : null;
            if (tpPath && tpPath.length < bestDist) {
                bestDist = tpPath.length;
                bestTp = tp;
            } else if (tp.map.toLowerCase() === rushTarget.toLowerCase()) {
                // Bezpośredni skok ratunkowy (gdyby pathfinder głupiał na exact matchu)
                bestDist = 0;
                bestTp = tp;
            }
        }

        if (bestTp) {
            if (window._lastRushNextMap !== bestTp.map) {
                let msg = `📜 Używam zwoju: ${bestTp.map}! (Trasa skraca się z ${currentDistance} do ${bestDist} map)`;
                if (window.logExp) window.logExp(msg, "#e040fb");
                if (window.logHero) window.logHero(msg, "#e040fb");
                window._lastRushNextMap = bestTp.map;
            }
            clearTimeout(rushInterval);
            window.useItemById(bestTp.id);
            // Czekamy na przelot i animację
            rushInterval = setTimeout(window.executeRushStep, 2500);
            return;
        }
        // --- KONIEC SYSTEMU ZWOJÓW ---

        if (path && path.length > 1) {
            nextMap = path[1];
        } else if (window.rushFullPath && window.rushFullPath.length > 0) {
            let idx = window.rushFullPath.indexOf(currentSysMap);
            if (idx !== -1 && idx < window.rushFullPath.length - 1) {
                nextMap = window.rushFullPath[idx + 1];
            } else {
                let startMap = window.rushFullPath[0];
                let pathToStart = typeof getShortestPath === 'function' ? getShortestPath(currentSysMap, startMap) : null;
                if (pathToStart && pathToStart.length > 1) nextMap = pathToStart[1];
                else if (currentSysMap === startMap && window.rushFullPath.length > 1) nextMap = window.rushFullPath[1];
            }
        }

        if (!nextMap) {
            isRushing = false;
            window.isRushing = false;
            let msg = `🚨 BŁĄD TRASY! Bot nie wie jak dojść z [${currentSysMap}] do [${rushTarget}].`;
            if (window.logHero) window.logHero(msg, "#e53935");
            if (window.logExp) window.logExp(msg, "#e53935");
            if (window.isExping) document.getElementById('btnStartExp')?.click();
            return;
        }

        window.rushNextMap = nextMap;
        let tp = ZAKONNICY[currentSysMap];
        let door = globalGateways[currentSysMap] && globalGateways[currentSysMap][nextMap];
        let isFakeDoor = door && tp && Math.abs(door.x - tp.x) <= 2 && Math.abs(door.y - tp.y) <= 2;
        let isTeleportRoute = tp && (botSettings.unlockedTeleports[nextMap] || isFakeDoor);

        if (isTeleportRoute) {
            if (window._lastRushNextMap !== nextMap) {
                if (window.logExp) window.logExp(`🚀 Teleportuję (Zakonnik) do: ${nextMap}`, "#9c27b0");
                window._lastRushNextMap = nextMap;
            }
            clearTimeout(rushInterval);
            rushInterval = setTimeout(() => window.handleTeleportNPC(nextMap), 200);
        } else if (door) {
            if (window._lastRushNextMap !== nextMap) {
                if (window.logExp) window.logExp(`🚪 Biegnę do przejścia na: ${nextMap}`, "#ba68c8");
                window._lastRushNextMap = nextMap;
            }

            let targetX = door.x; let targetY = door.y;
            if (door.allCoords && door.allCoords.length > 0) {
                let rnd = door.allCoords[Math.floor(Math.random() * door.allCoords.length)];
                targetX = rnd[0]; targetY = rnd[1];
            }

            window.rushLastX = Engine.hero.d.x;
            window.rushLastY = Engine.hero.d.y;
            stuckCount = 0;
            window.rushGatewayArrivalTime = 0; 

            safeGoTo(targetX, targetY, false);
            clearTimeout(rushInterval);
            rushInterval = setTimeout(window.checkRushArrival, 500);
        }
    };
 window.checkRushArrival = function() {
        if (!isRushing || typeof Engine === 'undefined' || !Engine.hero) return;
        let currentSysMap = lastMapName;
        if (currentSysMap === rushTarget) { window.executeRushStep(); return; }

        let nextMap = window.rushNextMap;
        if (!nextMap) return;

        let tp = ZAKONNICY[currentSysMap];
        let door = globalGateways[currentSysMap] && globalGateways[currentSysMap][nextMap];
        let isFakeDoor = door && tp && Math.abs(door.x - tp.x) <= 2 && Math.abs(door.y - tp.y) <= 2;
        if (tp && (botSettings.unlockedTeleports[nextMap] || isFakeDoor)) return;

        if (!door) return;

        let cx = Engine.hero.d.x; let cy = Engine.hero.d.y;
        let dist = Math.abs(cx - door.x) + Math.abs(cy - door.y);

        if (dist > 1) {
            let isMoving = Engine.hero.d.path && Engine.hero.d.path.length > 0;
            window.rushGatewayArrivalTime = 0; 
            
            if (!isMoving) {
                if (cx === window.rushLastX && cy === window.rushLastY) {
                    stuckCount++;
                    if (stuckCount > 6) { 
                        safeGoTo(door.x, door.y, false);
                        stuckCount = 0;
                    }
                } else {
                    window.rushLastX = cx; window.rushLastY = cy;
                    stuckCount = 0;
                }
            } else {
                stuckCount = 0;
            }
        } else {
            // --- FIZYCZNIE STOIMY NA BRAMIE LUB OBOK NIEJ ---
            if (!window.rushGatewayArrivalTime) window.rushGatewayArrivalTime = Date.now();
            
            // SKRÓCONY CZAS: Reaguje błyskawicznie po 3.5 sekundach!
            if (Date.now() - window.rushGatewayArrivalTime > 3500) {
                if (window.logHero) window.logHero("⚠️ Brama zacięta. Robię krok w tył...", "#ffb300");
                if (window.logExp) window.logExp("⚠️ Brama zacięta. Robię krok w tył...", "#ffb300");
                    
                // ZAKŁADAMY KAGANIEC: Blokujemy silnik Rusha na 1.5 sekundy!
                window.__movementLock = Date.now() + 1500; 
                    
                // Resetujemy licznik, żeby nie spamowało komunikatu
                if (typeof window.lastMapChange !== 'undefined') window.lastMapChange = Date.now(); 
                if (typeof window.lastGatewayAttempt !== 'undefined') window.lastGatewayAttempt = Date.now();
                    
                let hx = parseInt(Engine.hero.d.x);
                let hy = parseInt(Engine.hero.d.y);
                    
                // Mądry krok w tył: bot szuka dookoła siebie wolnej kratki, żeby nie wejść w ścianę
                let dirs = [[0,1], [0,-1], [1,0], [-1,0], [1,1], [-1,-1]];
                for (let d of dirs) {
                    let nx = hx + d[0], ny = hy + d[1];
                    if (typeof Engine.map.checkCollision === 'function' && !Engine.map.checkCollision(nx, ny)) {
                        if (window.originalAutoWalk) window.originalAutoWalk.call(Engine.hero, nx, ny);
                        else if (typeof Engine.hero.autoWalk === 'function') Engine.hero.autoWalk(nx, ny);
                        else window._g(`walk=${nx},${ny}`);
                        break;
                    }
                }
            } // Koniec mechaniki kroku w tył
        } // Koniec warunku stania na bramie
        
        rushInterval = setTimeout(window.checkRushArrival, 500);
    };

// ==========================================
    // ALGORYTM DIJKSTRY (Z CZARNĄ LISTĄ BRAM I WAGAMI)
    // ==========================================
    function getShortestPath(start, end) {
        if (start === end) return [start];
        
        let distances = {};
        let previous = {};
        let queue = [];
        
        distances[start] = 0;
        queue.push({node: start, dist: 0});
        
        let visited = new Set();

        while (queue.length > 0) {
            queue.sort((a, b) => a.dist - b.dist);
            let current = queue.shift();
            let u = current.node;
            
            if (u === end) {
                let path = [];
                let curr = end;
                while (curr) { path.unshift(curr); curr = previous[curr]; }
                return path;
            }
            
            if (visited.has(u)) continue;
            visited.add(u);
            
            if (globalGateways[u]) {
                for (let v in globalGateways[u]) {
                    // --- NOWOŚĆ: SPRAWDZENIE CZARNEJ LISTY ---
                    if (window.__bannedMaps && window.__bannedMaps[v] && Date.now() < window.__bannedMaps[v]) {
                        continue; // Brama jest uszkodzona/zamknięta - udajemy, że jej nie ma!
                    }

                    let penalty = 1; 
                    let vLower = v.toLowerCase();
                    if (v !== end && (vLower.includes(" p.") || vLower.includes(" s.") || vLower.includes(" - ") || vLower.includes("dom ") || vLower.includes("młyn") || vLower.includes("jaskinia") || vLower.includes("grota") || vLower.includes("kopalnia"))) {
                        penalty = 50; 
                    }
                    
                    let alt = distances[u] + penalty;
                    if (distances[v] === undefined || alt < distances[v]) {
                        distances[v] = alt; previous[v] = u; queue.push({node: v, dist: alt});
                    }
                }
            }
            
            if (botSettings.useTeleports && ZAKONNICY[u]) {
                for (let tpMap in botSettings.unlockedTeleports) {
                    if (botSettings.unlockedTeleports[tpMap] && tpMap !== u) {
                        let alt = distances[u] + 2; 
                        if (distances[tpMap] === undefined || alt < distances[tpMap]) {
                            distances[tpMap] = alt; previous[tpMap] = u; queue.push({node: tpMap, dist: alt});
                        }
                    }
                }
            }
        }
        return null; 
    }
window.handleTeleportNPC = function(targetMap) {
        if (!isRushing && !isPatrolling && !window.isExping) return;
        let currentSysMap = lastMapName;
        let tp = ZAKONNICY[currentSysMap];
        if (!tp) return;

        let cx = Engine.hero.d.x; let cy = Engine.hero.d.y;
        let dist = Math.max(Math.abs(cx - tp.x), Math.abs(cy - tp.y));

        if (dist > 1) {
            if (!Engine.hero.d.path || Engine.hero.d.path.length === 0) {
                console.log(`%c[HERO] Podbiegam do Zakonnika na [${tp.x}, ${tp.y}]...`, "color: #9c27b0;");
                safeGoTo(tp.x, tp.y, false);
            }
            rescheduleTeleportCheck(targetMap);
            return;
        }

        HeroTeleportModule.processDialog(
            targetMap,
            () => {
                if (window.isExping) { window.logExp("Teleport zablokowany! Brak opłaty.", "#e53935"); document.getElementById('btnStartExp').click(); }
                else stopPatrol(false);
            },
            () => {
                if (isRushing) { clearTimeout(rushInterval); rushInterval = setTimeout(executeRushStep, 3500); }
                else if (isPatrolling) { clearTimeout(smoothPatrolInterval); smoothPatrolInterval = setTimeout(executePatrolStep, 3500); }
                else if (window.isExping) { expMapTransitionCooldown = Date.now() + 4000; }
            },
            () => rescheduleTeleportCheck(targetMap)
        );
    };

    function rescheduleTeleportCheck(targetMap) {
        if (isRushing) { clearTimeout(rushInterval); rushInterval = setTimeout(() => window.handleTeleportNPC(targetMap), 600); }
        else if (isPatrolling) { clearTimeout(smoothPatrolInterval); smoothPatrolInterval = setTimeout(() => window.handleTeleportNPC(targetMap), 600); }
        else if (window.isExping) { setTimeout(() => window.handleTeleportNPC(targetMap), 600); }
    }

    // --- FUNKCJE WSPOMAGAJĄCE ---

    // Symuluje uderzenie palcem w klawiaturę (KeyDown + KeyUp)

    function simulateKeyPress(keyChar) {

        let keyCode = keyChar.toUpperCase().charCodeAt(0);

        // Poprawka dla cyfr (1-9)

        if (keyChar >= '1' && keyChar <= '9') {

            keyCode = 48 + parseInt(keyChar);

        }

        let codeStr = keyChar === 'r' ? 'KeyR' : 'Digit' + keyChar;



        let evtDown = new KeyboardEvent('keydown', { key: keyChar, code: codeStr, keyCode: keyCode, which: keyCode, bubbles: true });

        let evtUp = new KeyboardEvent('keyup', { key: keyChar, code: codeStr, keyCode: keyCode, which: keyCode, bubbles: true });



        document.dispatchEvent(evtDown);

        document.dispatchEvent(evtUp);

    }





    window.openAutoRouteModal = function() {

        let hero = document.getElementById('selHero').value;

        if (!hero || !heroData[hero]) return heroAlert("Najpierw wybierz herosa z listy!");



        let targets = Object.keys(heroData[hero]);

        let currentMap = lastMapName;



        let optionsHtml = targets.map(t => `<option value="${t}" ${t===currentMap?'selected':''}>${t}</option>`).join('');



        let modalContent = `

            <div style="margin-bottom:10px; color:#00acc1; font-weight:bold;">⚙️ KREATOR AUTO-TRASY</div>

            <div style="margin-bottom:10px; font-size:11px; color:#a99a75;">Algorytm połączy mapy logiczną pętlą, duplikując ślepe zaułki na liście.</div>

            <select id="startMapSelect" style="width:100%; padding:5px; background:#0f0f0f; color:#d4af37; border:1px solid #4a3f2b; margin-bottom:10px; outline:none; text-align:center;">

                ${optionsHtml}

            </select>

            <div class="nav-row"><label style="margin-bottom: 2px;">Zasięg omijania punktów / losowość trasy (kratki):</label><input type="number" id="inpRandomInKreator" value="${botSettings.randomRadius}" min="0" max="5"></div>

        `;



        heroModal('confirm', modalContent, "", (res) => {

            if(res) {

                botSettings.randomRadius = parseInt(document.getElementById('inpRandomInKreator').value) || 0; saveSettings();

                let startMapNode = document.getElementById('startMapSelect').value;

                runRoutingAlgorithm(hero, targets, startMapNode);

            }

        });

    }



window.runRoutingAlgorithm = function(hero, targets, startMap) {
        let unvisited = new Set(targets);
        let currentMap = startMap;
        let finalRoute = [currentMap];
        
        if (unvisited.has(currentMap)) unvisited.delete(currentMap);

        // Do kalkulacji odległości śledzimy naszą fizyczną pozycję X, Y
        let currentX = (typeof Engine !== 'undefined' && Engine.hero) ? Engine.hero.d.x : 32;
        let currentY = (typeof Engine !== 'undefined' && Engine.hero) ? Engine.hero.d.y : 32;

        if (heroData[hero][currentMap] && heroData[hero][currentMap].length > 0) {
            currentX = heroData[hero][currentMap][0][0]; currentY = heroData[hero][currentMap][0][1];
        }

        // --- FAZA 1: OPTYMALIZACJA KOLEJNOŚCI MAP ---
        while(unvisited.size > 0) {
            let bestPath = null;
            let bestTarget = null;
            let minScore = Infinity;

            for (let target of unvisited) {
                let path = getShortestPath(currentMap, target);
                if (path) {
                    // Waga 1: Ilość przejść między mapami (bardzo duży koszt, unikamy ładowania map)
                    let score = (path.length - 1) * 10000;

                    // Waga 2: Dystans fizyczny do bramy
                    if (path.length > 1) {
                        let door = globalGateways[currentMap] && globalGateways[currentMap][path[1]];
                        if (door) score += (Math.abs(currentX - door.x) + Math.abs(currentY - door.y)) * 10;
                    }

                    // Waga 3: Szacowany koszt wejścia na pierwszego moba na nowej mapie
                    if (heroData[hero][target] && heroData[hero][target].length > 0) {
                        let entryDoor = null;
                        if (path.length > 1 && globalGateways[path[path.length-2]] && globalGateways[path[path.length-2]][target]) {
                            entryDoor = globalGateways[path[path.length-2]][target];
                        }
                        if (entryDoor) {
                            let firstMobX = heroData[hero][target][0][0];
                            let firstMobY = heroData[hero][target][0][1];
                            score += Math.abs(entryDoor.x - firstMobX) + Math.abs(entryDoor.y - firstMobY);
                        }
                    }

                    if (score < minScore) { minScore = score; bestPath = path; bestTarget = target; }
                }
            }

            if (!bestPath) {
                heroAlert(`🚨 Zatrzymano układanie!\nAlgorytm utknął na mapie:\n[${currentMap}]\nNie potrafi stąd wyjść. Upewnij się, że nagrałeś bramy.`);
                break;
            }

            // Wrzucamy ścieżkę do finalnej pętli
            for (let i = 1; i < bestPath.length; i++) finalRoute.push(bestPath[i]);
            unvisited.delete(bestTarget);
            currentMap = bestTarget;

            // Zaktualizuj pozycję do końca obliczonej mapy
            if (heroData[hero][currentMap] && heroData[hero][currentMap].length > 0) {
                let coords = heroData[hero][currentMap];
                currentX = coords[coords.length - 1][0]; currentY = coords[coords.length - 1][1];
            }
        }

        // --- FAZA 2: WEWNĘTRZNA OPTYMALIZACJA KOORDYNATÓW (Smart-Pathing na każdej mapie) ---
        finalRoute.forEach((mapName, idx) => {
            if (heroData[hero] && heroData[hero][mapName] && heroData[hero][mapName].length > 1) {
                let nextMap = finalRoute[(idx + 1) % finalRoute.length];
                let exitPath = getShortestPath(mapName, nextMap);
                let exitGw = null;

                if (exitPath && exitPath.length > 1 && globalGateways[mapName] && globalGateways[mapName][exitPath[1]]) {
                    exitGw = globalGateways[mapName][exitPath[1]];
                }

                let originalCoords = [...heroData[hero][mapName]];
                let optimizedCoords = [];

                // Szacowanie punktu wejścia na mapę
                let startX = 32, startY = 32;
                let prevMap = idx > 0 ? finalRoute[idx - 1] : finalRoute[finalRoute.length - 1];
                if (globalGateways[mapName] && globalGateways[mapName][prevMap]) {
                    startX = globalGateways[mapName][prevMap].x;
                    startY = globalGateways[mapName][prevMap].y;
                }

                let currX = startX, currY = startY;

                // Algorytm Problem Komiwojażera (Nearest Neighbor z omijaniem wyjścia)
                while (originalCoords.length > 0) {
                    if (originalCoords.length === 1) {
                        optimizedCoords.push(originalCoords[0]);
                        break;
                    }

                    let bestIdx = 0;
                    let bestScore = Infinity;

                    for (let i = 0; i < originalCoords.length; i++) {
                        let pt = originalCoords[i];
                        let distToPt = Math.abs(currX - pt[0]) + Math.abs(currY - pt[1]);
                        
                        let distToExit = 0;
                        if (exitGw) distToExit = Math.abs(pt[0] - exitGw.x) + Math.abs(pt[1] - exitGw.y);

                        // Im mniejszy dystans tym lepiej. Odpychamy punkty, które leżą blisko wyjścia (zostawiamy je na koniec)
                        let score = distToPt - (distToExit * 0.4); 

                        if (score < bestScore) {
                            bestScore = score;
                            bestIdx = i;
                        }
                    }

                    let chosenPt = originalCoords.splice(bestIdx, 1)[0];
                    optimizedCoords.push(chosenPt);
                    currX = chosenPt[0];
                    currY = chosenPt[1];
                }

                // Ostatni szlif: Wymuszenie absolutnie najbliższego punktu do wyjścia jako ostatniego
                if (exitGw && optimizedCoords.length > 1) {
                    let closestToExitIdx = 0;
                    let minDistToExit = Infinity;
                    for (let i = 0; i < optimizedCoords.length; i++) {
                        let d = Math.abs(optimizedCoords[i][0] - exitGw.x) + Math.abs(optimizedCoords[i][1] - exitGw.y);
                        if (d < minDistToExit) {
                            minDistToExit = d;
                            closestToExitIdx = i;
                        }
                    }
                    let finalPt = optimizedCoords.splice(closestToExitIdx, 1)[0];
                    optimizedCoords.push(finalPt);
                }

                heroData[hero][mapName] = optimizedCoords;
            }
        });

        heroMapOrder[hero] = finalRoute;
        saveMapOrder();
        currentRouteIndex = -1; sessionStorage.removeItem('hero_route_index'); checkedMapsThisSession.clear(); saveCheckedMaps(); updateUI();
        
        heroAlert("🧠 Zainstalowano MargoNeuro Smart-Route V2!\n\nTrasa została obliczona uwzględniając:\n1. Koszty wejścia na mapy.\n2. Optymalizację ścieżek bezpośrednio między mobami na mapach.\n3. Płynne wyprowadzenie postaci idealnie pod drzwi wyjściowe.");
    };


    // ==========================================

    // INTERFEJS UŻYTKOWNIKA (UI)

    // ==========================================

function initGUI() {
        const style = document.createElement('style');
        style.innerHTML = `
            .hero-window { position: fixed; background: #111; border: 1px solid #5a4b31; border-radius: 4px; color: #cbd5e1; font-family: Tahoma, Arial, sans-serif; z-index: 10000; box-shadow: 0 4px 15px rgba(0,0,0,0.8); display: flex; flex-direction: column; overflow: hidden; }
            #heroNavGUI { top: 50px; left: 50px; width: 340px; height: 570px; resize: both; }
            #heroSettingsGUI, #heroGatewaysGUI, #discordSettingsGUI { top: 60px; left: 400px; width: 320px; max-height: 560px; resize: both; }
            .gui-header { padding: 6px 6px; font-size: 13px; font-weight: bold; text-align: left; color: #a99a75; border-bottom: 2px solid #5a4b31; background: #222; display: flex; justify-content: space-between; align-items: center; cursor: grab; flex-shrink: 0; text-shadow: 1px 1px 1px #000; }
            .gui-content { padding: 10px; flex-grow: 1; overflow-y: auto; overflow-x: hidden; position:relative; background: #1a1d21; display: flex; flex-direction: column; }
            .gui-content::-webkit-scrollbar { width: 8px; } .gui-content::-webkit-scrollbar-track { background: #111; border-left: 1px solid #333; } .gui-content::-webkit-scrollbar-thumb { background: #5a4b31; border-radius: 4px; }
            .nav-row { margin-bottom: 8px; flex-shrink: 0; } .nav-row label { display: block; font-size: 11px; margin-bottom: 3px; color: #a99a75; }
            .nav-row select, .nav-row input[type="text"], .nav-row input[type="number"] { width: 100%; padding: 4px 6px; background: #0f0f0f; color: #e0d8c0; border: 1px solid #4a3f2b; border-radius: 2px; outline: none; font-size:11px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.8); }

            .location-wrapper { display: flex; align-items: center; justify-content: space-between; background: #141414; border: 1px solid #333; border-radius: 2px; padding: 4px 8px; margin-bottom: 8px; }
            .location-label { font-size: 10px; color: #a99a75; white-space: nowrap; margin-right: 5px; }
            #currentMapNameDisplay { color: #d4af37; font-weight: bold; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: right; flex-grow: 1; }

            .tabs-wrapper { display: flex; background: #222; border-bottom: 1px solid #4a3f2b; }
            .nav-tab { flex: 1; text-align: center; padding: 6px 0; font-size: 11px; font-weight: bold; color: #888; cursor: pointer; border-bottom: 3px solid transparent; transition: 0.3s; }
            .nav-tab:hover { color: #d4af37; background: #2a2a2a; }
            .active-tab { color: #d4af37; border-bottom-color: #d4af37; background: #1a1d21; }

            #cordsListContainer, #heroMapListContainer, #gatewaysListContainer, #e2ListContainer, #kolosyListContainer {
                margin-top: 5px; border: 1px solid #3a3020; background: #141414;
                overflow-y: auto; overflow-x: hidden; padding: 2px;
            }
            #heroMapListContainer, #cordsListContainer { height: 140px; resize: vertical; display: block; }
            #gatewaysListContainer { height: 350px; max-height: 80vh; resize: vertical; display: block; }

            #e2Container, #kolosyContainer { display: none; flex-direction: column; flex: 1; min-height: 0; }
            #e2ListContainer, #kolosyListContainer { flex: 1; min-height: 0; display: block; height: auto; }

            .list-item { display: flex; justify-content: space-between; align-items: center; background: #222; margin-bottom: 2px; padding: 4px 5px; font-size: 11px; border: 1px solid #2a2a2a; border-radius: 2px; gap: 5px; }
            .list-item:hover { border-color: #5a4b31; background: #333;}
            .list-item.active-route { border-left: 3px solid #00acc1; background: rgba(0, 172, 193, 0.1); }
            .list-item.checked { border-left: 3px solid #43a047; color: #a5d6a7; background: rgba(67, 160, 71, 0.1); }
            .btn-sepia { background: linear-gradient(to bottom, #7a6b51, #5a4b31); color: #fff; border: 1px solid #4a3f2b; padding: 2px 6px; cursor: pointer; border-radius: 2px; font-weight:bold; font-size: 10px; text-shadow: 1px 1px 0 #000; }
            .btn-sepia:hover { background: linear-gradient(to bottom, #8a7b61, #6a5b41); border-color: #5a4b31; color: #fff; }
            .btn-go-sepia { background: linear-gradient(to bottom, #5a4b31, #3a2b11); }
            .icon-btn { cursor:pointer; font-size:12px; filter: grayscale(20%); transition: 0.2s; background: none; border: none; padding: 0 2px;}
            .icon-btn:hover { filter: grayscale(0%); transform: scale(1.1); }
            .btn-del-map { color: #e53935; cursor: pointer; font-weight: bold; padding: 0 4px; font-size: 12px; text-shadow: 1px 1px 0 #000; }
            .btn { width: 100%; padding: 6px; font-weight: bold; cursor: pointer; margin-top: 5px; border-radius: 2px; border: 1px solid #4a3f2b; font-size: 11px; color: #e0d8c0; text-shadow: 1px 1px 0 #000; transition: 0.2s; }
            .header-buttons { display: flex; gap: 3px; align-items: center; }
            .header-buttons button { display: flex; align-items: center; gap: 3px; font-size: 9px; font-weight: bold; background: #333; border: 1px solid #444; border-radius: 3px; padding: 2px 4px; color: #e0d8c0; cursor: pointer; transition: 0.2s; }
            .header-buttons button:hover { background: #444; color: #fff; border-color: #a99a75; }
            .btn-close { background:transparent; border:none; color:#777; cursor:pointer; font-size:14px; font-weight:bold; } .btn-close:hover { color:#e53935; }
            #gearIcon { position: fixed; top: 50px; left: 10px; background: #111; border: 1px solid #5a4b31; border-radius: 50%; width: 40px; height: 40px; display: none; justify-content: center; align-items: center; cursor: grab; z-index: 10000; font-size: 20px; color: #d4af37; box-shadow: 0 0 10px #000; }
            .map-name-wrap { display: flex; align-items: center; flex-grow: 1; overflow: hidden; }
            .map-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 10px; line-height: 1.2; padding-right: 5px; cursor: pointer; color: #d4af37; }
            .buttons-wrapper { display: flex; gap: 4px; align-items: center; flex-shrink: 0; justify-content: flex-end; }
            .order-input { width: 25px !important; flex: 0 0 25px !important; padding: 0; font-size: 9px; text-align: center; background: #0f0f0f; color: #d4af37; border: 1px solid #4a3f2b; border-radius: 2px; outline: none; box-shadow: inset 0 1px 2px #000; font-weight: bold; height: 16px; }
            .accordion-header { background: #1a1a1a; border: 1px solid #333; padding: 4px 5px; cursor: pointer; color: #81c784; font-weight: bold; font-size: 10px; transition: background 0.2s; }
            .accordion-header:hover { background: #2a2a2a; }
        `;
        document.head.appendChild(style);

        const gearIcon = document.createElement('div'); gearIcon.id = 'gearIcon'; gearIcon.innerHTML = '⚙️'; gearIcon.title = 'Przesuń lub Kliknij'; document.body.appendChild(gearIcon);

        const mainGui = document.createElement('div'); mainGui.id = 'heroNavGUI'; mainGui.className = 'hero-window';
        mainGui.innerHTML = `
            <div class="gui-header">
                <div id="guiHeaderTitle" style="margin-right:5px; color:#00e5ff; text-shadow: 0 0 5px #00e5ff; font-weight:900;">MargoNeuro</div>
                <div class="header-buttons">
                    <button id="btnStartStop" style="color:#4caf50; border-color:#4caf50;"><span class="btn-icon">▶</span><span>START</span></button>
                    <button id="btnGoToTop" style="color:#00acc1; border-color:#00acc1;"><span class="btn-icon">➡</span><span>IDŹ DO</span></button>
                    <button id="btnOpenMaps" style="color:#2196f3; border-color:#2196f3;"><span class="btn-icon">🗺️</span><span>Mapy</span></button>
                    <button id="btnOpenSettings"><span class="btn-icon">⚙️</span><span>Opcje</span></button>
                   <button id="btnMinimizeMain" style="background:transparent; border:none; color:#777;" onclick="window.toggleMainVisibility()"><span class="btn-icon">✖</span></button>
                </div>
            </div>
           <div class="tabs-wrapper">
                <div id="heroModeToggle" class="nav-tab active-tab">🐲 HEROSI</div>
                <div id="e2ModeToggle" class="nav-tab">💀 ELITY II</div>
                <div id="kolosyModeToggle" class="nav-tab">👹 KOLOSY</div>
                <div id="expModeToggle" class="nav-tab">⚔️ EXP</div>
                <div id="teleportsModeToggle" class="nav-tab">🚀 TP/EQ/HP</div>
            </div>
            <div class="gui-content" id="mainRoutingPanel">
                <div class="location-wrapper" style="margin-bottom: 8px;">
                    <span class="location-label">Stoisz na:</span>
                    <span id="currentMapNameDisplay">Ładowanie...</span>
                </div>
                <div id="heroContainer" style="display:flex; flex-direction:column; flex-grow:1;">
                    <div id="heroConsole" style="background:#080808; border:1px solid #333; padding:4px; font-size:10px; color:#a99a75; height:55px; min-height: 55px; max-height: 150px; resize: vertical; overflow-y:auto; font-family:monospace; box-shadow:inset 0 1px 3px #000; margin-bottom:5px;">
                        <span style="color:#777;">[System]</span> Moduł Patrolu w gotowości...
                    </div>
                    <div id="radarControlsWrapper" style="margin-bottom: 8px;">
                        <div class="nav-row" style="background: rgba(183, 28, 28, 0.2); padding:5px; border-radius:2px; border:1px solid #8e0000;">
                            <label style="color: #ff5252; cursor: pointer; font-size: 11px; font-weight:bold; margin:0;"><input type="checkbox" id="chkRadar" ${botSettings.radarEnabled ? 'checked' : ''}> Wykrywacz (Radar)</label>
                        </div>
                        <div class="nav-row" style="display: none; background: rgba(76, 175, 80, 0.1); padding:5px; border-radius:2px; border:1px solid #4caf50; margin-top:2px;">
                            <label style="color: #4caf50; cursor: pointer; font-size: 11px; font-weight:bold; margin:0;"><input type="checkbox" id="chkAutoAttack" ${botSettings.autoAttack ? 'checked' : ''}> Auto-atak</label>
                        </div>
                    </div>
                    <div class="nav-row"><label>Szukany Heros:</label><select id="selHero" style="flex-grow: 1;"><option value="">-- Wybierz --</option></select></div>
                    <div class="nav-row" style="display: flex; flex-direction: column; flex-grow: 1;">
                        <label style="color:#00acc1;">Kolejność Przechodzenia Map:</label>
                        <div id="heroMapListContainer"><div style="padding:5px;text-align:center;color:#777;">Wybierz herosa</div></div>
                        <div id="inlineTransitEditor" style="display:none; padding:8px; border:1px solid #00acc1; background:rgba(0, 172, 193, 0.1); margin-top:5px; border-radius:2px;">
                            <label style="color:#00acc1; font-weight:bold; margin-bottom:4px; display:block;">Dodaj Przejście:</label>
                            <input type="text" id="newTransitMapName" placeholder="Nazwa mapy docelowej..." style="margin-bottom:4px;">
                            <input type="number" id="newTransitPos" placeholder="Pozycja na liście (puste = na koniec)" style="margin-bottom:6px;">
                            <div style="display:flex; gap:4px; margin-bottom:6px;"><input type="number" id="newTransitX" placeholder="X" style="width:40px;"><input type="number" id="newTransitY" placeholder="Y" style="width:40px;"><button class="btn-sepia" style="flex-grow:1;" onclick="document.getElementById('newTransitX').value = Engine.hero.d.x; document.getElementById('newTransitY').value = Engine.hero.d.y;">📍 Stąd</button></div>
                            <div style="display:flex; gap:4px;"><button class="btn-sepia btn-go-sepia" style="flex-grow:1;" onclick="saveNewTransit()">ZAPISZ MAPĘ</button><button class="btn-sepia" style="background:#8e0000; width:30px;" onclick="document.getElementById('inlineTransitEditor').style.display='none'">✖</button></div>
                        </div>
                        <div style="display:flex; gap:5px; margin-top:5px;">
                            <button id="btnAutoRoute" class="btn btn-go-sepia" style="flex-grow:1;" onclick="openAutoRouteModal()">🪄 KREATOR TRASY</button>
                            <button id="btnResetRoute" class="btn btn-sepia" style="background:#8e0000; width: auto;" title="Zresetuj pętlę i przywróć z bazy">🔁 ZRESETUJ BAZĘ</button>
                        </div>
                    </div>
                    <div class="nav-row" style="margin-top: 10px; display: flex; flex-direction: column;"><label style="color:#d4af37;">Koordynaty (Zasięg: 7 kratek):</label><div id="cordsListContainer"></div></div>
                </div>
                <div id="e2Container" style="display:none; flex-direction:column; flex:1; min-height:0;">
                    <div id="e2SuitableContainer" style="background:rgba(156,39,176,0.1); border:1px solid #9c27b0; padding:6px; margin-bottom:8px; border-radius:2px;"><span style="color:#777; font-size:10px;">Ładowanie podpowiedzi levelowych...</span></div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:5px;">
                        <label style="color:#9c27b0; font-weight:bold;">Baza Elit II (Spis tras):</label>
                        <input type="text" id="e2Search" placeholder="Szukaj..." style="width:100px; padding:2px; font-size:10px; background:#0f0f0f; border:1px solid #4a3f2b; color:#fff;">
                    </div>
                    <div id="e2ListContainer"></div>
                </div>
                <div id="kolosyContainer" style="display:none; flex-direction:column; flex:1; min-height:0;">
                    <div id="kolosySuitableContainer" style="background:rgba(230,74,25,0.1); border:1px solid #e64a19; padding:6px; margin-bottom:8px; border-radius:2px;"><span style="color:#777; font-size:10px;">Ładowanie podpowiedzi levelowych...</span></div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:5px;">
                        <label style="color:#e64a19; font-weight:bold;">Baza Kolosów:</label>
                        <input type="text" id="kolosySearch" placeholder="Szukaj..." style="width:100px; padding:2px; font-size:10px; background:#0f0f0f; border:1px solid #4a3f2b; color:#fff;">
                    </div>
                    <div id="kolosyListContainer"></div>
                </div>
                <div id="expContainer" style="display:none; flex-direction:column; flex:1; min-height:0; gap:4px; padding-top:4px;">
                    <div id="expConsole" style="background:#080808; border:1px solid #333; padding:4px; font-size:10px; color:#a99a75; height:55px; min-height: 55px; max-height: 250px; resize: vertical; overflow-y:auto; font-family:monospace; box-shadow:inset 0 1px 3px #000; margin-bottom:2px;">
                        <span style="color:#777;">[System]</span> Włączony moduł Smart-Roam (Dynamiczne czyszczenie)...
                    </div>
                    <div class="accordion-header" id="accBerserk" onclick="toggleSettingsAcc('accBerserk')" style="background: rgba(255, 152, 0, 0.2); border-color: #ff9800; color: #ff9800; margin-bottom: 0;">▼ KIESZONKOWY BERSERK</div>
                    <div id="accBerserkContent" style="display:none; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid #ff9800; border-top: none; margin-bottom: 5px;">
                        <label style="color:#ff9800; font-weight:bold; display:flex; align-items:center; gap:5px; margin-bottom: 8px; cursor: pointer;">
                            <input type="checkbox" id="berserkEnabled" ${botSettings.berserk?.enabled ? 'checked' : ''}> Aktywuj Berserka
                        </label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding-left: 5px; margin-bottom: 8px;">
                            <label style="color:#e0d8c0; font-size:10px; cursor: pointer;"><input type="checkbox" id="berserkCommon" ${botSettings.berserk?.common ? 'checked' : ''}> Zwykłe potwory</label>
                            <label style="color:#e0d8c0; font-size:10px; cursor: pointer;"><input type="checkbox" id="berserkE1" ${botSettings.berserk?.e1 ? 'checked' : ''}> Elity I</label>
                            <label style="color:#e0d8c0; font-size:10px; cursor: pointer;"><input type="checkbox" id="berserkE2" ${botSettings.berserk?.e2 ? 'checked' : ''}> Elity II</label>
                            <label style="color:#e0d8c0; font-size:10px; cursor: pointer;"><input type="checkbox" id="berserkHero" ${botSettings.berserk?.hero ? 'checked' : ''}> Herosi / Tytani</label>
                        </div>
                        <div style="display:flex; justify-content: space-between; gap: 5px;">
                            <label style="color:#a99a75; font-size:10px; flex:1;">Większy od nas o lvl:<br><input type="number" id="berserkMaxLvl" value="${botSettings.berserk?.maxLvlOffset ?? 100}" style="width:100%; padding:2px; font-size:10px; text-align:center;"></label>
                            <label style="color:#a99a75; font-size:10px; flex:1;">Mniejszy od nas o lvl:<br><input type="number" id="berserkMinLvl" value="${Math.abs(botSettings.berserk?.minLvlOffset ?? 20)}" style="width:100%; padding:2px; font-size:10px; text-align:center;"></label>
                        </div>
                    </div>
                    <div class="accordion-header" id="accAutoheal" onclick="toggleSettingsAcc('accAutoheal')" style="background: rgba(76, 175, 80, 0.2); border-color: #4caf50; color: #4caf50; margin-bottom: 0;">▼ AUTOHEAL I AUTO-SPRZEDAŻ</div>
                    <div id="accAutohealContent" style="display:none; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid #4caf50; border-top: none; margin-bottom: 5px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <div style="display:flex; gap:10px; align-items:center;">
                                <label style="color:#4caf50; font-weight:bold; display:flex; align-items:center; gap:5px; cursor: pointer; margin:0;"><input type="checkbox" id="autohealEnabled" ${botSettings.autoheal?.enabled ? 'checked' : ''}> Autoheal</label>
                                <div style="display:flex; align-items:center; gap:5px;">
                                    <label style="color:#e91e63; font-weight:bold; display:flex; align-items:center; gap:5px; cursor: pointer; margin:0;"><input type="checkbox" id="autopotEnabled" ${botSettings.autopot?.enabled ? 'checked' : ''}> Auto Poty</label>
                                    <span id="btnAutoPotSettings" style="cursor:pointer; font-size:12px; filter: grayscale(20%); transition: 0.2s;" title="Ustawienia Auto-Potów">⚙️</span>
                                </div>
                            </div>
                            <label style="color:#a99a75; font-size:10px; display:flex; align-items:center; gap:5px; margin:0;">Od ilu %: <input type="number" id="autohealThreshold" value="${botSettings.autoheal?.threshold ?? 80}" min="1" max="99" style="width:35px; padding:2px; font-size:10px; text-align:center; background:#000; color:#fff; border:1px solid #444;"></label>
                        </div>
                        <div id="autopotSettingsPanel" style="display:none; background:rgba(0,0,0,0.5); padding:6px; border:1px solid #e91e63; border-radius:3px; margin-bottom:8px;">
                            <label style="color:#e0d8c0; font-size:10px; display:flex; align-items:center; justify-content:space-between; margin:0;">Ilość staków do kupienia (1 stak = 15 szt): <input type="number" id="autopotStacks" value="${botSettings.autopot?.stacks ?? 14}" min="1" max="50" style="width:40px; padding:2px; font-size:10px; text-align:center; background:#000; color:#fff; border:1px solid #444;"></label>
                        </div>
                        <div style="display:flex; gap:5px;">
                            <div style="flex:1;"><label style="color:#a99a75; font-size:9px; display:block; margin-bottom:2px;">Nigdy nie używaj przedmiotów:</label><textarea id="autohealIgnore" style="width:100%; height:50px; background:#0f0f0f; color:#e0d8c0; border:1px solid #4a3f2b; font-size:9px; resize:none;">${botSettings.autoheal?.ignoreItems || ""}</textarea></div>
                            <div style="flex:1;"><label style="color:#a99a75; font-size:9px; display:block; margin-bottom:2px;">Przedmioty niezidentyfikowane:</label><textarea id="autohealUnid" style="width:100%; height:50px; background:#0f0f0f; color:#e0d8c0; border:1px solid #4a3f2b; font-size:9px; resize:none;">${botSettings.autoheal?.unidItems || ""}</textarea></div>
                        </div>
                        <div style="border-top:1px solid #333; margin-top:6px; padding-top:6px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px;">
                            <label style="color:#ffb300; font-weight:bold; display:flex; align-items:center; gap:5px; cursor: pointer; margin:0;"><input type="checkbox" id="autosellEnabled" ${botSettings.autosell?.enabled ? 'checked' : ''}> Auto-Sprzedaż</label>
                            <div style="display:flex; align-items:center; gap:5px;">
                                <span style="color:#a99a75; font-size:10px; margin:0;">Wolne miejsce: <b id="autosellCapacityDisplay" style="color:#4caf50;">?</b></span>
                                <button id="btnForceSell" class="btn-sepia" style="background:#e65100; font-weight:bold; padding:2px 6px; border-color:#bf360c;">🏃 OPRÓŻNIJ TERAZ</button>
                            </div>
                        </div>
                    </div>
                 <div class="accordion-header" id="accAdvancedExp" onclick="toggleSettingsAcc('accAdvancedExp')" style="background: rgba(33, 150, 243, 0.2); border-color: #2196f3; color: #2196f3; margin-top: 5px; margin-bottom: 0;">▼ ZAAWANSOWANE (Alarmy / Opcje walki)</div>
                    <div id="accAdvancedExpContent" style="display:none; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid #2196f3; border-top: none; margin-bottom: 5px;">
                        <label style="color:#a99a75; font-size:10px; margin-bottom:0; margin-top:2px;">Przedział poziomowy (Automatyczny +1 przy awansie):</label>
                        <div class="nav-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:5px; margin-bottom:2px;">
                            <label>Min Lvl: <input type="number" id="expMinL" value="${botSettings.exp.minLvl}" style="background:#000;"></label>
                            <label>Max Lvl: <input type="number" id="expMaxL" value="${botSettings.exp.maxLvl}" style="background:#000;"></label>
                        </div>
                        <label style="color:#a99a75; font-size:10px; margin-bottom:2px; display:block;">Atakowane potwory:</label>
                        <div class="nav-row" style="display:flex; justify-content: space-around; background: #1a1a1a; border: 1px solid #333; padding: 4px; border-radius: 2px; margin-bottom:6px;">
                            <label style="margin:0; cursor:pointer;"><input type="checkbox" id="expN" ${botSettings.exp.normal ? 'checked' : ''}> Zwykłe</label>
                            <label style="margin:0; cursor:pointer;"><input type="checkbox" id="expE" ${botSettings.exp.elite ? 'checked' : ''}> Elity I</label>
                        </div>
                        
                        <div style="border-top:1px solid #333; padding-top:6px; display:flex; flex-direction:column; gap:6px;">
                            <button id="btnOpenBrowserAlertsModule" class="btn-sepia" style="background:#ff9800; border-color:#f57c00; width:100%; margin-top:2px; padding:6px; font-weight:bold; font-size:11px;">🔔 POWIADOMIENIA PRZEGLĄDARKI</button>
                            <button id="btnOpenDiscordModule" class="btn-sepia" style="background:#5865F2; border-color:#4752C4; width:100%; margin-top:2px; padding:6px; font-weight:bold; font-size:11px;">💬 KONFIGURACJA DISCORD</button>
                        </div>
                    </div>
                    <div class="accordion-header" id="accRoute" onclick="toggleSettingsAcc('accRoute')" style="background: rgba(0, 150, 136, 0.2); border-color: #009688; color: #009688; margin-top: 5px; margin-bottom: 0;">▼ TRASA EXPOWISKA (SMART-ROAM)</div>
                    <div id="accRouteContent" style="display:none; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid #009688; border-top: none; margin-bottom: 5px;">
                        <label style="color:#00e5ff; font-size:10px; cursor:pointer; font-weight:bold; margin-bottom:6px; display:block;"><input type="checkbox" id="autoChangeExpRoute" ${botSettings.exp.autoChangeRoute ? 'checked' : ''}> 🔄 Automatyczna zmiana Expowiska</label>
                        <input type="hidden" id="expRange" value="999">
                        <label style="color:#a99a75; font-size:11px; margin-top:2px; display:flex; justify-content:space-between;">Kolejność map: <span onclick="clearExpMaps()" style="color:#e53935; cursor:pointer;" title="Wyczyść całą trasę">🗑️ Wyczyść</span></label>
                        <div id="expMapList" style="border:1px solid #3a3020; background:#000; overflow-y:auto; min-height:80px; max-height:160px; padding:2px;"></div>
                        <div style="display:flex; gap:4px; margin-top:6px;">
                            <button id="btnOpenExpBase" class="btn-sepia" style="flex:1; padding:6px; background:#00838f;">🔖 BAZA EXPOWISK</button>
                            <button id="btnOpenRecommendedExp" class="btn-sepia" style="flex:1; padding:6px; background:#4caf50;">⭐ POLECANE</button>
                        </div>
                    </div>

                    <button id="btnStartExp" class="btn btn-go-sepia" style="margin-top:auto; padding: 6px; font-size: 12px; border: 1px solid #4caf50; color: #4caf50; font-weight:bold;">▶ START</button>
                </div>
                <div id="teleportsContainer" style="display:none; flex-direction:column; flex:1; min-height:0; padding-top:4px; gap:6px;">
                    <button id="btnOpenTeleports" class="btn btn-go-sepia" style="padding:6px; background:#00838f; border-color:#00acc1; font-weight:bold; color:white;">🚀 ZARZĄDZAJ TELEPORTAMI</button>
                    <button id="btnShowRecommendedEq" class="btn-sepia" style="padding:6px; background:#4caf50; font-weight:bold;">🎒 POLECANY EKWIPUNEK</button>
                    <button id="btnShowPotions" class="btn-sepia" style="padding:6px; background:#d81b60; color:white; font-weight:bold;">🧪 MIKSTURY I LECZENIE</button>
                    <button id="btnToggleShops" class="btn-sepia" style="padding:6px; background:#e65100; font-weight:bold;">🛒 WYSZUKIWARKA SKLEPÓW</button>
                    <button id="btnStopWalk" class="btn-sepia" style="display:none; padding:6px; background:#d32f2f; color:white; font-weight:bold; border-color:#b71c1c;">🛑 ZATRZYMAJ RUCH</button>
                    <div id="heroTeleportsGUI" style="display:none; flex-direction:column; flex:1; overflow-y:auto; background:#141414; border:1px solid #3a3020; padding:4px;"></div>
                    <div id="recommendedEqList" style="display:none; flex-direction:column; flex:1; border:1px solid #3a3020; background:#141414; padding:4px; resize:vertical; overflow-y:auto; min-height:150px;"></div>
                    <div id="potionsList" style="display:none; flex-direction:column; flex:1; border:1px solid #3a3020; background:#141414; padding:4px; resize:vertical; overflow-y:auto; min-height:150px;"></div>
                    <div id="shopsSearchWrapper" style="display:none; flex-direction:column; flex:1; border:1px solid #3a3020; background:#141414; padding:4px; resize:vertical; overflow-y:auto; min-height:150px;">
                        <input type="text" id="shopSearchInput" placeholder="Szukaj NPC, mapy lub przedmiotu..." style="width:100%; padding:5px; background:#000; color:#d4af37; border:1px solid #333; margin-bottom:5px; box-sizing:border-box;">
                        <div id="shopsListOutput" style="flex:1; overflow-y:auto;">
                            <span style="color:#777; font-size:10px; text-align:center; display:block;">Wpisz minimum 2 znaki, aby wyszukać...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(mainGui);

        // --- OKNO GŁÓWNYCH USTAWIEŃ ---
        const settingsGui = document.createElement('div'); settingsGui.id = 'heroSettingsGUI'; settingsGui.className = 'hero-window'; settingsGui.style.display = 'none';
        settingsGui.innerHTML = `
            <div class="gui-header">⚙️ Opcje & Skróty <button class="btn-close" onclick="document.getElementById('heroSettingsGUI').style.display='none'">✖</button></div>
            <div class="gui-content">
                <div class="accordion-header" id="accHuman" onclick="toggleSettingsAcc('accHuman')">▼ HUMANIZACJA ATAKU & RADARU</div>
                <div id="accHumanContent" style="display:block; padding: 5px; background: rgba(0,0,0,0.2); border: 1px solid #333; margin-bottom:10px;">
                    <div class="nav-row"><label>Reakcja po wykryciu moba (Min/Max ms):</label><div style="display:flex;gap:4px;"><input type="number" id="inpReactionMin" value="${botSettings.reactionMin}"><input type="number" id="inpReactionMax" value="${botSettings.reactionMax}"></div></div>
                    <div class="nav-row"><label>Opóźnienie ataku po dotarciu (Min/Max ms):</label><div style="display:flex;gap:4px;"><input type="number" id="inpAttackDelayMin" value="${botSettings.attackDelayMin}"><input type="number" id="inpAttackDelayMax" value="${botSettings.attackDelayMax}"></div></div>
                </div>

                <div class="accordion-header" id="accMove" onclick="toggleSettingsAcc('accMove')">▶ HUMANIZACJA RUCHU</div>
                <div id="accMoveContent" style="display:none; padding: 5px; background: rgba(0,0,0,0.2); border: 1px solid #333; margin-bottom:10px;">
                    <div class="nav-row"><label>Reakcja na załadowanie mapy (Min / Max ms):</label><div style="display:flex;gap:4px;"><input type="number" id="inpLoadMin" value="${botSettings.mapLoadMin}"><input type="number" id="inpLoadMax" value="${botSettings.mapLoadMax}"></div></div>
                    <div class="nav-row"><label>Czekaj na respie (Min / Max ms):</label><div style="display:flex;gap:4px;"><input type="number" id="inpWaitMin" value="${botSettings.waitMin}"><input type="number" id="inpWaitMax" value="${botSettings.waitMax}"></div><div style="font-size:9px;color:#777;">* Czas stania w miejscu po dotarciu do respu.</div></div>
                    <div class="nav-row"><label>Szybkość kroków pingu (Min / Max ms):</label><div style="display:flex;gap:4px;"><input type="number" id="inpStepMin" value="${botSettings.stepMin}"><input type="number" id="inpStepMax" value="${botSettings.stepMax}"></div></div>
                    <div class="nav-row"><label>Anti-Lag bota EXP (Min / Max ms):</label><div style="display:flex;gap:4px;"><input type="number" id="inpExpAntiLagMin" value="${botSettings.expAntiLagMin || 1500}"><input type="number" id="inpExpAntiLagMax" value="${botSettings.expAntiLagMax || 2500}"></div><div style="font-size:9px;color:#777;">* Czas stania w miejscu zanim bot uzna, że się zaciął i kliknie ponownie.</div></div>
                </div>

                <div class="nav-row"><label>Zasięg widoczności (Domyślnie 7):</label><input type="number" id="inpVisionRange" value="${botSettings.visionRange}" min="1" max="15"></div>
                <div class="nav-row"><label>Skrót klawiszowy (Chowaj/Pokaż bota):</label><input type="text" id="inpToggleKey" value="${botSettings.toggleKey || 'Kliknij i wciśnij klawisz...'}" readonly style="cursor:pointer; text-align:center;"></div>

                <button id="btnSaveSettings" class="btn btn-go-sepia">💾 ZAPISZ USTAWIENIA</button>
            </div>
        `;
        document.body.appendChild(settingsGui);

        // --- ZUPEŁNIE NOWY MODUŁ DISCORDA ---
        const discordGui = document.createElement('div'); discordGui.id = 'discordSettingsGUI'; discordGui.className = 'hero-window'; discordGui.style.display = 'none';
        discordGui.innerHTML = `
            <div class="gui-header" style="color:#5865F2;">💬 Konfiguracja Discorda <button class="btn-close" onclick="document.getElementById('discordSettingsGUI').style.display='none'">✖</button></div>
            <div class="gui-content" style="gap:8px;">
                <div style="background:#1a1a1a; padding:6px; border:1px solid #444; border-radius:3px;">
                    <p style="margin:0 0 5px 0; font-size:10px; color:#aaa; text-align:justify;">1. Stwórz prywatny serwer na Discordzie.<br>2. Wejdź w Ustawienia kanału -> Integracje -> Tworzenie Webhooka.<br>3. Skopiuj <b>URL Webhooka</b> i wklej go poniżej. <a href="https://support.discord.com/hc/pl/articles/228383668-Wst%C4%99p-do-Webhook%C3%B3w" target="_blank" style="color:#5865F2;">[Instrukcja]</a></p>
                    <input type="text" id="discordWebhookUrl" placeholder="https://discord.com/api/webhooks/..." value="${botSettings.discord?.url || ''}" style="width:100%; padding:5px; font-size:10px; background:#0f0f0f; color:#fff; border:1px solid #5865F2; border-radius:2px; box-sizing:border-box;">
                </div>
                
                <div style="background:#1a1a1a; padding:6px; border:1px solid #444; border-radius:3px;">
                    <p style="margin:0 0 5px 0; font-size:10px; color:#aaa;">Oznaczanie na telefonie (Opcjonalne):<br>Aby dostać powiadomienie Push z dzwiękiem tak jak przy wiadomości DM, wklej tu swój <b>ID Użytkownika Discord</b>.</p>
                    <input type="text" id="discordUserId" placeholder="Np. 123456789012345678" value="${botSettings.discord?.userId || ''}" style="width:100%; padding:5px; font-size:10px; background:#0f0f0f; color:#fff; border:1px solid #333; border-radius:2px; box-sizing:border-box;">
                </div>
                
                <div style="border-top:1px solid #444; padding-top:8px;">
                    <label style="color:#e0d8c0; font-size:11px; display:flex; align-items:center; gap:5px; margin-bottom:5px; cursor:pointer;"><input type="checkbox" id="discordAlert_Hero" ${botSettings.discord?.alerts?.hero ? 'checked' : ''}> Powiadomienia z Radaru (Herosi/E2)</label>
                    <label style="color:#e0d8c0; font-size:11px; display:flex; align-items:center; gap:5px; margin-bottom:5px; cursor:pointer;"><input type="checkbox" id="discordAlert_Player" ${botSettings.discord?.alerts?.player ? 'checked' : ''}> Powiadomienia o graczach na mapie</label>
                    <label style="color:#e0d8c0; font-size:11px; display:flex; align-items:center; gap:5px; margin-bottom:5px; cursor:pointer;"><input type="checkbox" id="discordAlert_Chat" ${botSettings.discord?.alerts?.chat ? 'checked' : ''}> Prywatne wiadomości na czacie (DM)</label>
                    <label style="color:#ff5252; font-size:11px; font-weight:bold; display:flex; align-items:center; gap:5px; margin-bottom:5px; cursor:pointer;"><input type="checkbox" id="discordAlert_Captcha" ${botSettings.discord?.alerts?.captcha ? 'checked' : ''}> 🚨 ALARM ZAPADKI (BARDZO WAŻNE)</label>
                </div>
                
                <button id="btnSaveDiscord" class="btn-sepia" style="background:#5865F2; border-color:#4752C4; width:100%; padding:8px; margin-top:auto;">💾 ZAPISZ DISCORDA I WYŚLIJ TEST</button>
            </div>
        `;
        document.body.appendChild(discordGui);

        window.toggleSettingsAcc = function(id) {
            let h = document.getElementById(id);
            let c = document.getElementById(id+'Content');
            let isHidden = c.style.display === 'none';
            c.style.display = isHidden ? 'block' : 'none';
            h.innerText = (isHidden ? '▼ ' : '▶ ') + h.innerText.replace(/^[▼▶]\s*/, '').trim();
        };

        const gatewaysGui = document.createElement('div'); gatewaysGui.id = 'heroGatewaysGUI'; gatewaysGui.className = 'hero-window'; gatewaysGui.style.display = 'none';
        gatewaysGui.innerHTML = `
            <div class="gui-header">🗃️ Baza Przejść <button class="btn-close" onclick="document.getElementById('heroGatewaysGUI').style.display='none'">✖</button></div>
            <div class="gui-content"><button id="btnScanGateways" class="btn btn-sepia" style="margin-bottom:5px;">🔍 SKANUJ OBECNĄ MAPĘ</button><div id="gatewaysListContainer"></div></div>
        `;
        document.body.appendChild(gatewaysGui);

        let modalHtml = `
            <div id="heroModalOverlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:99999; justify-content:center; align-items:center; flex-direction:column;">
               <div id="heroModalBox" style="background:#111; border:1px solid #5a4b31; padding:15px; width:80%; max-width:260px; border-radius:4px; text-align:center; box-shadow: 0 0 20px #000; font-family: Tahoma, Arial, sans-serif;">
                    <div id="heroModalText" style="color:#e0d8c0; font-size:12px; margin-bottom:12px; word-wrap:break-word; white-space:pre-wrap;"></div>
                    <input type="text" id="heroModalInput" style="display:none; width:90%; margin:0 auto 12px auto; background:#0f0f0f; color:#e0d8c0; border:1px solid #4a3f2b; padding:6px; font-size:12px; text-align:center;">
                    <div style="display:flex; justify-content:space-around; gap:10px;">
                        <button id="heroModalBtnYes" style="background: linear-gradient(to bottom, #7a6b51, #5a4b31); color:#fff; border: 1px solid #4a3f2b; padding: 4px 10px; border-radius: 2px; cursor: pointer; font-weight: bold;">OK</button>
                        <button id="heroModalBtnNo" style="background: linear-gradient(to bottom, #8e0000, #5c0000); color:#fff; border: 1px solid #4a3f2b; padding: 4px 10px; border-radius: 2px; cursor: pointer; font-weight: bold; display:none;">Anuluj</button>
                    </div>
               </div>
            </div>`;
            
        const goToGui = document.createElement('div');
        goToGui.id = 'heroGoToGUI';
        goToGui.className = 'hero-window';
        goToGui.style.display = 'none';
        goToGui.style.top = '60px';
        goToGui.style.left = '400px';
        goToGui.style.width = '320px';
        goToGui.style.maxHeight = '560px';
        goToGui.style.resize = 'both';
        goToGui.innerHTML = `
            <div class="gui-header">➡ Idź do mapy <button class="btn-close" onclick="document.getElementById('heroGoToGUI').style.display='none'">✖</button></div>
            <div class="gui-content" style="display:flex; flex-direction:column; height:100%;">
                <input type="text" id="inpGoToSearch" placeholder="Szukaj mapy..." style="width:100%; padding:6px; background:#0f0f0f; color:#e0d8c0; border:1px solid #4a3f2b; border-radius:2px; outline:none; font-size:11px; margin-bottom:8px; box-sizing:border-box;">
                <div id="goToMapsListContainer" style="overflow-y:auto; flex-grow:1; display:flex; flex-direction:column; gap:2px; border:1px solid #3a3020; background:#141414; padding:2px;"></div>
            </div>
        `;
        document.body.appendChild(goToGui);
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const expBaseGui = document.createElement('div');
        expBaseGui.id = 'heroExpBaseGUI';
        expBaseGui.className = 'hero-window';
        expBaseGui.style.display = 'none';
        expBaseGui.style.top = '60px';
        expBaseGui.style.left = '400px';
        expBaseGui.style.width = '320px';
        expBaseGui.style.maxHeight = '560px';
        expBaseGui.innerHTML = `
            <div class="gui-header">🔖 Baza Expowisk <button class="btn-close" onclick="document.getElementById('heroExpBaseGUI').style.display='none'">✖</button></div>
            <div class="gui-content" style="display:flex; flex-direction:column; height:100%;">
                <div id="expProfilesList" style="flex:1; border:1px solid #3a3020; background:#000; overflow-y:auto; padding:2px;"></div>
            </div>
        `;
        document.body.appendChild(expBaseGui);

        const expRecGui = document.createElement('div');
        expRecGui.id = 'heroExpRecGUI';
        expRecGui.className = 'hero-window';
        expRecGui.style.display = 'none';
        expRecGui.style.top = '60px';
        expRecGui.style.left = '400px';
        expRecGui.style.width = '320px';
        expRecGui.style.maxHeight = '560px';
        expRecGui.innerHTML = `
            <div class="gui-header">⭐ Polecane Expowiska <button class="btn-close" onclick="document.getElementById('heroExpRecGUI').style.display='none'">✖</button></div>
            <div class="gui-content" style="display:flex; flex-direction:column; height:100%;">
                <div style="font-size:10px; color:#a99a75; margin-bottom:5px;">Wybrane dla Twojego poziomu (od -5 do +15):</div>
                <div id="expRecList" style="flex:1; border:1px solid #3a3020; background:#141414; overflow-y:auto; padding:4px; display:flex; flex-direction:column; gap:4px;"></div>
                <button id="btnAddSelectedRec" class="btn btn-go-sepia" style="margin-top:5px; padding:6px; font-weight:bold; color:#4caf50;">➕ DODAJ ZAZNACZONE DO TRASY</button>
            </div>
        `;
        document.body.appendChild(expRecGui);
        
        setupModals(); setupMultiDrag(); setupGearDrag(); setupLogic();
    }


    // ==========================================

    // SETUP & LOGIC

    // ==========================================

   window.toggleMainVisibility = function() { let gui = document.getElementById('heroNavGUI'); let gear = document.getElementById('gearIcon'); if (gui.style.display === 'none') { gui.style.display = 'flex'; gear.style.display = 'none'; } else { gui.style.display = 'none'; gear.style.display = 'flex'; } };

    function handleGlobalKeydown(e) { if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; if (botSettings.toggleKey && e.code === botSettings.toggleKey) { window.toggleMainVisibility(); } }

// --- MODUŁ: POWIADOMIENIA PRZEGLĄDARKI ---
      const browserAlertsGui = document.createElement('div'); browserAlertsGui.id = 'browserAlertsSettingsGUI'; browserAlertsGui.className = 'hero-window'; browserAlertsGui.style.display = 'none'; browserAlertsGui.style.top = '60px'; browserAlertsGui.style.left = '400px'; browserAlertsGui.style.width = '320px';
        browserAlertsGui.innerHTML = `
            <div class="gui-header" style="color:#ff9800;">🔔 Powiadomienia Przeglądarki <button class="btn-close" onclick="document.getElementById('browserAlertsSettingsGUI').style.display='none'">✖</button></div>
            <div class="gui-content" style="gap:8px;">
                <label style="color:#ff5252; font-size:11px; cursor:pointer; font-weight:bold;"><input type="checkbox" id="captchaAlert" ${botSettings.exp.captchaAlert ? 'checked' : ''}> 🚨 Wybudzanie Alarmem Captcha</label>
                <div style="border-top:1px solid #333; padding-top:6px;">
                    <label style="color:#ffb300; font-size:11px; cursor:pointer; font-weight:bold;"><input type="checkbox" id="playerAlert" ${botSettings.exp.playerAlert ? 'checked' : ''}> 👁️ Alarm na Graczy</label>
                    <label style="color:#e0d8c0; font-size:10px; cursor:pointer; padding-left:20px; margin-top:3px;"><input type="checkbox" id="playerAlertStopBot" ${botSettings.exp.playerAlertStopBot ? 'checked' : ''}> Zatrzymuj bota przy wykryciu</label>
                </div>
                <div style="border-top:1px solid #333; padding-top:6px;">
                    <label style="color:#e040fb; font-size:11px; cursor:pointer; font-weight:bold;"><input type="checkbox" id="chatAlert" ${botSettings.exp.chatAlert ? 'checked' : ''}> 📩 Alarm Czat (Prywatne)</label>
                    <label style="color:#e0d8c0; font-size:10px; cursor:pointer; padding-left:20px; margin-top:3px;"><input type="checkbox" id="chatAlertStopBot" ${botSettings.exp.chatAlertStopBot ? 'checked' : ''}> Zatrzymuj bota przy wiadomości</label>
                </div>
            </div>
        `;
        document.body.appendChild(browserAlertsGui);

        // --- MODUŁ: DISCORD WEBHOOK ---
        const discordGui = document.createElement('div'); discordGui.id = 'discordSettingsGUI'; discordGui.className = 'hero-window'; discordGui.style.display = 'none';
        discordGui.innerHTML = `
            <div class="gui-header" style="color:#5865F2;">💬 Konfiguracja Discorda <button class="btn-close" onclick="document.getElementById('discordSettingsGUI').style.display='none'">✖</button></div>
            <div class="gui-content" style="gap:8px;">
                <div style="background:#1a1a1a; padding:6px; border:1px solid #444; border-radius:3px;">
                    <p style="margin:0 0 5px 0; font-size:10px; color:#aaa; text-align:justify;">Stwórz Webhook na swoim prywatnym serwerze (Integracje kanału). <a href="https://support.discord.com/hc/pl/articles/228383668-Wst%C4%99p-do-Webhook%C3%B3w" target="_blank" style="color:#5865F2;">[Instrukcja]</a></p>
                    <input type="text" id="discordWebhookUrl" placeholder="Wklej URL Webhooka..." value="${botSettings.discord?.url || ''}" style="width:100%; padding:5px; font-size:10px; background:#0f0f0f; color:#fff; border:1px solid #5865F2; border-radius:2px; box-sizing:border-box;">
                </div>
                <div style="background:#1a1a1a; padding:6px; border:1px solid #444; border-radius:3px;">
                    <p style="margin:0 0 5px 0; font-size:10px; color:#aaa;">(Opcjonalnie) Wpisz swój <b>ID Użytkownika Discord</b>, aby bot wysyłał Ci powiadomienie Push z wibracją na telefon (Ping):</p>
                    <input type="text" id="discordUserId" placeholder="Np. 123456789012345678" value="${botSettings.discord?.userId || ''}" style="width:100%; padding:5px; font-size:10px; background:#0f0f0f; color:#fff; border:1px solid #333; border-radius:2px; box-sizing:border-box;">
                </div>
                <div style="border-top:1px solid #444; padding-top:8px;">
                    <div style="margin-bottom:6px; background:#111; border:1px solid #333; padding:4px; border-radius:3px;">
                        <label style="color:#d4af37; font-size:11px; font-weight:bold; cursor:pointer;"><input type="checkbox" id="discordAlert_Hero" ${botSettings.discord?.alerts?.hero ? 'checked' : ''}> 🐉 Radar (Herosi/E2)</label>
                        <div style="padding-left:20px; margin-top:3px;"><label style="color:#aaa; font-size:10px; cursor:pointer;"><input type="checkbox" id="discordStop_Hero" ${botSettings.discord?.stop?.hero !== false ? 'checked' : ''}> Zatrzymuj bota (Zalecane)</label></div>
                    </div>
                    <div style="margin-bottom:6px; background:#111; border:1px solid #333; padding:4px; border-radius:3px;">
                        <label style="color:#ffb300; font-size:11px; font-weight:bold; cursor:pointer;"><input type="checkbox" id="discordAlert_Player" ${botSettings.discord?.alerts?.player ? 'checked' : ''}> 👁️ Gracze na mapie</label>
                        <div style="padding-left:20px; margin-top:3px;"><label style="color:#aaa; font-size:10px; cursor:pointer;"><input type="checkbox" id="discordStop_Player" ${botSettings.discord?.stop?.player ? 'checked' : ''}> Zatrzymuj bota</label></div>
                    </div>
                    <div style="margin-bottom:6px; background:#111; border:1px solid #333; padding:4px; border-radius:3px;">
                        <label style="color:#e040fb; font-size:11px; font-weight:bold; cursor:pointer;"><input type="checkbox" id="discordAlert_Chat" ${botSettings.discord?.alerts?.chat ? 'checked' : ''}> 📩 Czat (Wiad. Prywatne)</label>
                        <div style="padding-left:20px; margin-top:3px;"><label style="color:#aaa; font-size:10px; cursor:pointer;"><input type="checkbox" id="discordStop_Chat" ${botSettings.discord?.stop?.chat ? 'checked' : ''}> Zatrzymuj bota</label></div>
                    </div>
                    <div style="margin-bottom:6px; background:#111; border:1px solid #333; padding:4px; border-radius:3px;">
                        <label style="color:#ff5252; font-size:11px; font-weight:bold; cursor:pointer;"><input type="checkbox" id="discordAlert_Captcha" ${botSettings.discord?.alerts?.captcha ? 'checked' : ''}> 🚨 Zapadka / Captcha</label>
                        <div style="padding-left:20px; margin-top:3px;"><label style="color:#aaa; font-size:10px; cursor:pointer;"><input type="checkbox" id="discordStop_Captcha" ${botSettings.discord?.stop?.captcha !== false ? 'checked' : ''}> Zatrzymuj bota (Zalecane)</label></div>
                    </div>
                </div>
                <button id="btnSaveDiscord" class="btn-sepia" style="background:#5865F2; border-color:#4752C4; width:100%; padding:8px; margin-top:auto;">💾 ZAPISZ DISCORDA I TESTUJ</button>
            </div>
        `;
        document.body.appendChild(discordGui);
    
    function setupModals() {

        window.heroModal = function(type, msg, defaultVal, callback) {

            let overlay = document.getElementById('heroModalOverlay');

            let text = document.getElementById('heroModalText');

            let input = document.getElementById('heroModalInput');

            let btnYes = document.getElementById('heroModalBtnYes');

            let btnNo = document.getElementById('heroModalBtnNo');



            text.innerHTML = msg;

            overlay.style.display = 'flex';

            btnYes.onclick = null; btnNo.onclick = null;



            if (type === 'alert') {

                input.style.display = 'none'; btnNo.style.display = 'none';

                btnYes.onclick = () => { overlay.style.display = 'none'; if(callback) callback(); };

            } else if (type === 'confirm') {

                input.style.display = 'none'; btnNo.style.display = 'inline-block';

                btnYes.onclick = () => { overlay.style.display = 'none'; if(callback) callback(true); };

                btnNo.onclick = () => { overlay.style.display = 'none'; if(callback) callback(false); };

            } else if (type === 'prompt') {

                input.style.display = 'block'; input.value = defaultVal || ""; btnNo.style.display = 'inline-block';

                input.focus();

                btnYes.onclick = () => { overlay.style.display = 'none'; if(callback) callback(input.value); };

                btnNo.onclick = () => { overlay.style.display = 'none'; if(callback) callback(null); };

            }

        };

        window.heroAlert = (msg) => heroModal('alert', msg);

        window.heroConfirm = (msg, cb) => heroModal('confirm', msg, "", cb);

        window.heroPrompt = (msg, def, cb) => heroModal('prompt', msg, def, cb);

    }



    function setupMultiDrag() { document.querySelectorAll('.hero-window').forEach(win => { let header = win.querySelector('.gui-header'); if(!header) return; let isDragging = false, startX, startY, initialX, initialY; header.onmousedown = function(e) { if(e.target.closest('button')) return; isDragging = true; startX = e.clientX; startY = e.clientY; initialX = win.offsetLeft; initialY = win.offsetTop; document.querySelectorAll('.hero-window').forEach(w => w.style.zIndex = "10000"); win.style.zIndex = "10001"; document.onmousemove = function(e) { if(isDragging) { win.style.left = (initialX + e.clientX - startX) + 'px'; win.style.top = (initialY + e.clientY - startY) + 'px'; } }; document.onmouseup = function() { isDragging = false; document.onmousemove = null; document.onmouseup = null; }; }; }); }

    function setupGearDrag() { const gearIcon = document.getElementById('gearIcon'); let isDragging = false, startX, startY, initialX, initialY, isClick = true; gearIcon.onmousedown = function(e) { isDragging = true; isClick = true; startX = e.clientX; startY = e.clientY; initialX = gearIcon.offsetLeft; initialY = gearIcon.offsetTop; document.onmousemove = function(e) { if(isDragging) { if (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3) isClick = false; gearIcon.style.left = (initialX + e.clientX - startX) + 'px'; gearIcon.style.top = (initialY + e.clientY - startY) + 'px'; } }; document.onmouseup = function() { isDragging = false; document.onmousemove = null; document.onmouseup = null; }; }; gearIcon.onclick = function() { if(isClick) window.toggleMainVisibility(); }; }

function bindChange(id, handler) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.addEventListener('change', handler);
    return true;
}

function bindInput(id, handler) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.addEventListener('input', handler);
    return true;
}

function bindClick(id, handler) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.addEventListener('click', handler);
    return true;
}

function setOnChange(id, handler) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.onchange = handler;
    return true;
}

    function setupLogic() {

     // ZAKŁADKI (TABS) - POPRAWIONE BEZPIECZNE PRZEŁĄCZANIE
       const tabs = ['hero', 'e2', 'kolosy', 'exp', 'teleports'];
       tabs.forEach(tab => {
           let toggle = document.getElementById(tab + 'ModeToggle');
           if(toggle) {
               toggle.addEventListener('click', function() {
                   document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active-tab'));
                   this.classList.add('active-tab');

                   // Bezpieczne sprawdzanie czy kontener istnieje przed jego pokazaniem
                   let heroC = document.getElementById('heroContainer'); if(heroC) heroC.style.display = tab === 'hero' ? 'flex' : 'none';
                   let e2C = document.getElementById('e2Container'); if(e2C) e2C.style.display = tab === 'e2' ? 'flex' : 'none';
                   let kolosyC = document.getElementById('kolosyContainer'); if(kolosyC) kolosyC.style.display = tab === 'kolosy' ? 'flex' : 'none';
                   let expC = document.getElementById('expContainer'); if(expC) expC.style.display = tab === 'exp' ? 'flex' : 'none';
                   let tpC = document.getElementById('teleportsContainer'); if(tpC) tpC.style.display = tab === 'teleports' ? 'flex' : 'none';

                   // Radar widoczny TYLKO w zakładce Herosi
                   let radarW = document.getElementById('radarControlsWrapper'); if(radarW) radarW.style.display = (tab === 'hero') ? 'block' : 'none';

                   activeBossTarget = null;
                   if(tab === 'exp' && typeof renderExpMaps === 'function') renderExpMaps();
               });
           }
       });



const btnExp = document.getElementById('btnStartExp');
if (btnExp) {
    btnExp.addEventListener('click', function() {
        window.isExping = !window.isExping;
        const chk = document.getElementById('berserkEnabled');

        if (window.isExping) {
            this.innerHTML = "⏹ STOP";
            this.style.borderColor = "#f44336";
            this.style.color = "#f44336";

            // BEZWZGLĘDNY RESET BLOKAD RUCHU
            window.isRushing = false;
            window.isRushingToShop = false;
            if (window.autoSellState) window.autoSellState.active = false;
            if (window.autoPotState) window.autoPotState.active = false;
            if (window.rushInterval) clearTimeout(window.rushInterval);

            expCurrentTargetId = null;
            expEmptyScans = 0;
            expAttackLockUntil = 0;
            expGatewayLockUntil = 0;
            expLastActionTime = 0;
            expMapTransitionCooldown = 0;
            expMapEnteredAt = Date.now();
            expLastMapName = "";
            expCurrentMapOrderIndex = -1;
            window.expGlobalTargetMap = null;
            if (typeof window.logExp === 'function') window.logExp("🚀 Uruchomiono tryb automatyczny!", "#4caf50");

            if (botSettings.berserk) { botSettings.berserk.userEnabled = true; if (chk) chk.checked = true; saveSettings(); }
        } else {
            this.innerHTML = "▶ START";
            this.style.borderColor = "#4caf50";
            this.style.color = "#4caf50";

            // TWARDE ZATRZYMANIE BOTA I POSTACI
            window.isRushing = false;
            if (window.rushInterval) clearTimeout(window.rushInterval);
            if (typeof stopPatrol === 'function') stopPatrol(true); // Wciska fizyczny hamulec na mapie

            if (typeof window.logExp === 'function') window.logExp("🛑 Zatrzymano tryb automatyczny.", "#f44336");

            if (botSettings.berserk) { botSettings.berserk.userEnabled = false; botSettings.berserk.enabled = false; if (chk) chk.checked = false; saveSettings(); if (typeof window.updateServerBerserk === 'function') window.updateServerBerserk(); }
        }
    });
}

        // ZAPISYWANIE USTAWIEŃ EXP I REAGOWANIE NA ZMIANY

        document.getElementById('expMinL').onchange = (e) => { botSettings.exp.minLvl = parseInt(e.target.value) || 1; saveSettings(); if(botSettings.exp.useAggro) window.toggleNativeAggroVisuals(true); };

        document.getElementById('expMaxL').onchange = (e) => { botSettings.exp.maxLvl = parseInt(e.target.value) || 300; saveSettings(); if(botSettings.exp.useAggro) window.toggleNativeAggroVisuals(true); };

        document.getElementById('expRange').onchange = (e) => { botSettings.exp.berserk = parseInt(e.target.value) || 20; saveSettings(); };

        document.getElementById('expN').onchange = (e) => { botSettings.exp.normal = e.target.checked; saveSettings(); };

        document.getElementById('expE').onchange = (e) => { botSettings.exp.elite = e.target.checked; saveSettings(); };


// Inicjalizacja braku zmiennej, jeśli to pierwszy start z nową aktualizacją
if (!botSettings.berserk) {
            botSettings.berserk = { enabled: false, userEnabled: false, common: true, e1: false, e2: false, hero: false, minLvlOffset: -20, maxLvlOffset: 100 };
            saveSettings();
        }
        if (botSettings.berserk.userEnabled === undefined) botSettings.berserk.userEnabled = botSettings.berserk.enabled;
        
        if (!botSettings.autoheal) { botSettings.autoheal = { enabled: false, threshold: 80, ignoreItems: "Zielona pietruszka\nKandyzowane wisienki w cukrze", unidItems: "Czarna perła życia" }; saveSettings(); }
        if (!botSettings.autopot) { botSettings.autopot = { enabled: false, stacks: 14 }; saveSettings(); }
        if (botSettings.exp.autoChangeRoute === undefined) { botSettings.exp.autoChangeRoute = false; saveSettings(); }
      if (botSettings.exp.captchaAlert === undefined) { botSettings.exp.captchaAlert = true; saveSettings(); }
        bindChange('captchaAlert', (e) => { botSettings.exp.captchaAlert = e.target.checked; saveSettings(); if (e.target.checked && Notification.permission !== "granted") Notification.requestPermission(); });
        
        if (botSettings.exp.playerAlert === undefined) { botSettings.exp.playerAlert = false; saveSettings(); }
        bindChange('playerAlert', (e) => { botSettings.exp.playerAlert = e.target.checked; saveSettings(); if (e.target.checked && Notification.permission !== "granted") Notification.requestPermission(); });

        if (botSettings.exp.playerAlertStopBot === undefined) { botSettings.exp.playerAlertStopBot = false; saveSettings(); }
        bindChange('playerAlertStopBot', (e) => { botSettings.exp.playerAlertStopBot = e.target.checked; saveSettings(); });
        
        if (botSettings.exp.chatAlert === undefined) { botSettings.exp.chatAlert = false; saveSettings(); }
        if (botSettings.exp.chatAlertStopBot === undefined) { botSettings.exp.chatAlertStopBot = false; saveSettings(); }
        bindChange('chatAlert', (e) => { botSettings.exp.chatAlert = e.target.checked; saveSettings(); if (e.target.checked && Notification.permission !== "granted") Notification.requestPermission(); });
        bindChange('chatAlertStopBot', (e) => { botSettings.exp.chatAlertStopBot = e.target.checked; saveSettings(); });

        // PRZYCISKI OTWIERAJĄCE MENU POWIADOMIEŃ
        bindClick('btnOpenBrowserAlertsModule', () => { 
            let p = document.getElementById('browserAlertsSettingsGUI'); 
            p.style.display = p.style.display === 'none' ? 'flex' : 'none'; 
        });
        bindClick('btnOpenDiscordModule', () => { 
            let p = document.getElementById('discordSettingsGUI'); 
            p.style.display = p.style.display === 'none' ? 'flex' : 'none'; 
        });

        // INICJALIZACJA DISCORDA Z NOWYMI BLOKADAMI
        if (!botSettings.discord) { botSettings.discord = { enabled: true, url: '', userId: '', alerts: { hero: true, player: true, chat: true, captcha: true }, stop: { hero: true, player: false, chat: false, captcha: true } }; saveSettings(); }
        if (!botSettings.discord.stop) { botSettings.discord.stop = { hero: true, player: false, chat: false, captcha: true }; saveSettings(); }
        
        bindClick('btnSaveDiscord', () => {
            botSettings.discord.url = document.getElementById('discordWebhookUrl').value.trim();
            botSettings.discord.userId = document.getElementById('discordUserId').value.trim();
            botSettings.discord.enabled = botSettings.discord.url.length > 10;
            
            botSettings.discord.alerts.hero = document.getElementById('discordAlert_Hero').checked;
            botSettings.discord.alerts.player = document.getElementById('discordAlert_Player').checked;
            botSettings.discord.alerts.chat = document.getElementById('discordAlert_Chat').checked;
            botSettings.discord.alerts.captcha = document.getElementById('discordAlert_Captcha').checked;

            botSettings.discord.stop.hero = document.getElementById('discordStop_Hero').checked;
            botSettings.discord.stop.player = document.getElementById('discordStop_Player').checked;
            botSettings.discord.stop.chat = document.getElementById('discordStop_Chat').checked;
            botSettings.discord.stop.captcha = document.getElementById('discordStop_Captcha').checked;
            
            saveSettings();
            
            if(botSettings.discord.enabled) {
                window.sendDiscordWebhook("🟢 MARGONEURO ZSYNCHRONIZOWANE", "Powiadomienia Discord zostały skonfigurowane poprawnie i działają niezależnie od przeglądarki!\nOd teraz to okno jest gotowe do odbierania sygnałów.", 5763719);
                heroAlert("Ustawienia Discord zostały zapisane.\nWysłano wiadomość testową na Twój kanał!");
            } else {
                heroAlert("Ustawienia zapisane (Webhook wyłączony ze względu na pusty link).");
            }
        });

        bindChange('autohealEnabled', (e) => { botSettings.autoheal.enabled = e.target.checked; saveSettings(); });
        bindChange('autopotEnabled', (e) => { botSettings.autopot.enabled = e.target.checked; saveSettings(); });
        bindChange('autohealThreshold', (e) => { botSettings.autoheal.threshold = parseInt(e.target.value) || 80; saveSettings(); });
        bindChange('autopotStacks', (e) => { botSettings.autopot.stacks = parseInt(e.target.value) || 14; saveSettings(); });
       // Natychmiastowa reakcja po kliknięciu "Automatyczna zmiana Expowiska"
        bindChange('autoChangeExpRoute', (e) => {
            botSettings.exp.autoChangeRoute = e.target.checked;
            saveSettings();
            if (e.target.checked) {
                if (typeof window.checkAndLoadBestExpProfile === 'function') window.checkAndLoadBestExpProfile(true);
            } else {
                // Jeśli odznaczamy - czyścimy trasę z automatu
                if (typeof window.clearExpMaps === 'function') window.clearExpMaps();
                if (window.logExp) window.logExp("🗑️ Wyłączono auto-zmianę. Trasa została wyczyszczona.", "#e53935");
            }

            // Wymuszone odświeżenie UI natychmiast po kliknięciu!
            setTimeout(() => {
                if (typeof window.renderExpMaps === 'function') window.renderExpMaps();
            }, 100);
        });

        bindClick('btnAutoPotSettings', () => {
            let p = document.getElementById('autopotSettingsPanel');
            p.style.display = p.style.display === 'none' ? 'block' : 'none';
        });

// Pętla milczącego ładownia profili (dla Auto-Expowiska)
        window.autoLoadExpProfile = function(index) {
            let p = botSettings.expProfiles[index];
            if(p) {
                botSettings.exp.activeProfileName = p.name;
                botSettings.exp.mapOrder = [...p.maps];
                localStorage.setItem('exp_map_order_v64', JSON.stringify(botSettings.exp.mapOrder));

                let lvlMatch = p.name.match(/\((\d+)\s*lvl\)/i);
                if(lvlMatch && lvlMatch[1]) {
                    let baseLvl = parseInt(lvlMatch[1]);
                    botSettings.exp.minLvl = Math.max(1, baseLvl - 5);
                    botSettings.exp.maxLvl = baseLvl + 15;
                    let mIn = document.getElementById('expMinL'); let mAx = document.getElementById('expMaxL');
                    if (mIn) mIn.value = botSettings.exp.minLvl; if (mAx) mAx.value = botSettings.exp.maxLvl;
                }

                window.mapClearTimes = {}; expCurrentTargetId = null; expMapTransitionCooldown = 0; expLastActionTime = 0; expAntiLagTime = 0;
                saveSettings();
                expNoMobScans = 0; expLastTargetMap = ""; expLastTargetPos = null; window.lastExpMap = null; window.isRushing = false; window.isRushingToShop = false;

                // Bezwarunkowe narysowanie zaktualizowanej trasy
                if (typeof window.renderExpMaps === 'function') window.renderExpMaps();
            }
        };

        // Algorytm sztucznej inteligencji: Zmienia expowisko na najlepsze możliwe
        window.checkAndLoadBestExpProfile = function(forceLoad = false) {
            if (!botSettings.exp.autoChangeRoute || !botSettings.expProfiles) return;
            if (typeof Engine === 'undefined' || !Engine.hero || !Engine.hero.d || !Engine.hero.d.lvl) return;

            let currentLvl = Engine.hero.d.lvl;
            let bestProfile = null;
            let highestValidLvl = -1;
            let profIdx = -1;

            botSettings.expProfiles.forEach((p, idx) => {
                let match = p.name.match(/\((\d+)\s*lvl\)/i);
                if (match) {
                    let pLvl = parseInt(match[1]);
                    if (pLvl <= currentLvl && pLvl > highestValidLvl) {
                        highestValidLvl = pLvl; bestProfile = p; profIdx = idx;
                    }
                }
            });

            if (bestProfile) {
                if (forceLoad || botSettings.exp.activeProfileName !== bestProfile.name || !botSettings.exp.mapOrder || botSettings.exp.mapOrder.length === 0) {

                    let logMsg = `🗺️ Ustawiam najlepsze expowisko dla ${currentLvl} lvl: ${bestProfile.name}!`;
                    if (window._lastExpLog !== logMsg || Date.now() - (window._lastExpLogTime || 0) > 2000) {
                        if (window.logExp) window.logExp(logMsg, "#00e5ff");
                        window._lastExpLog = logMsg;
                        window._lastExpLogTime = Date.now();
                    }

                    if (typeof stopPatrol === 'function') stopPatrol(true);
                    window.autoLoadExpProfile(profIdx);
                }
            }
        };

        // Natychmiastowa reakcja po kliknięciu "Automatyczna zmiana Expowiska"
        let chkAutoChange = document.getElementById('autoChangeExpRoute');
        if (chkAutoChange) {
            // Sklonowanie przycisku kasuje wszystkie stare eventy, by nie było podwójnych logów!
            let newChk = chkAutoChange.cloneNode(true);
            chkAutoChange.parentNode.replaceChild(newChk, chkAutoChange);

            newChk.addEventListener('change', function(e) {
                botSettings.exp.autoChangeRoute = e.target.checked;
                saveSettings();

                if (e.target.checked) {
                    window.checkAndLoadBestExpProfile(true);
                } else {
                    if (typeof window.clearExpMaps === 'function') window.clearExpMaps();

                    let logMsg = "🗑️ Wyłączono auto-zmianę. Trasa została wyczyszczona.";
                    if (window._lastExpLog !== logMsg || Date.now() - (window._lastExpLogTime || 0) > 2000) {
                        if (window.logExp) window.logExp(logMsg, "#e53935");
                        window._lastExpLog = logMsg;
                        window._lastExpLogTime = Date.now();
                    }
                }

                // Wymuszone odświeżenie okna od razu po akcji
                if (typeof window.renderExpMaps === 'function') window.renderExpMaps();
            });
        }
        // Nowa, ostateczna funkcja do wysyłania komend natywnego Berserka bezpośrednio do gry
        window.updateServerBerserk = function() {
            if (typeof window._g !== 'function') return;
            let b = botSettings.berserk;

            [34, 35].forEach(id => {
                window._g(`settings&action=update&id=${id}&v=${b.enabled ? 1 : 0}`);
                if (b.enabled) {
                    window._g(`settings&action=update&id=${id}&key=common&v=${b.common ? 1 : 0}`);
                    window._g(`settings&action=update&id=${id}&key=elite&v=${b.e1 ? 1 : 0}`);
                    window._g(`settings&action=update&id=${id}&key=elite2&v=${(b.e2 || b.hero) ? 1 : 0}`);
                    window._g(`settings&action=update&id=${id}&key=lvlmin&v=${b.minLvlOffset}`);
                    window._g(`settings&action=update&id=${id}&key=lvlmax&v=${b.maxLvlOffset}`);
                }
            });

            if (window._lastBerserkLogState !== b.enabled) {
                window._lastBerserkLogState = b.enabled;
                if (b.enabled && typeof window.logExp === 'function') window.logExp("⚔️ Aktywowano serwerowego Kieszonkowego Berserka!", "#ff9800");
                else if (typeof window.logExp === 'function') window.logExp("🛡️ Wyłączono Kieszonkowego Berserka.", "#ff9800");
            }

            if (!botSettings.autosell) { botSettings.autosell = { enabled: false, maxCapacity: 42 }; saveSettings(); }

            try {
                if (typeof Engine !== 'undefined' && Engine.settings && Engine.settings.d) {
                    Engine.settings.d.fight_auto_solo = b.enabled ? 1 : 0;
                    Engine.settings.d.fight_auto_elites = b.e1 ? 1 : 0;
                    Engine.settings.d.fight_auto_elites2 = (b.e2 || b.hero) ? 1 : 0;

                    let npcs = Engine.npcs.check ? Engine.npcs.check() : Engine.npcs.d;
                    for(let id in npcs) {
                        let npc = npcs[id];
                        if (npc && npc.sprite && typeof npc.sprite.updateAutoFightIndicator === 'function') npc.sprite.updateAutoFightIndicator();
                    }
                }
            } catch(e) {}
        };

        bindChange('autosellEnabled', (e) => { botSettings.autosell.enabled = e.target.checked; saveSettings(); });
        bindChange('autosellCapacity', (e) => { botSettings.autosell.maxCapacity = parseInt(e.target.value) || 42; saveSettings(); });

        bindChange('berserkEnabled', (e) => { botSettings.berserk.userEnabled = e.target.checked; botSettings.berserk.enabled = e.target.checked; saveSettings(); if (typeof window.updateServerBerserk === 'function') window.updateServerBerserk(); });
        bindChange('berserkCommon', (e) => { botSettings.berserk.common = e.target.checked; saveSettings(); if (typeof window.updateServerBerserk === 'function') window.updateServerBerserk(); });
        bindChange('berserkE1', (e) => { botSettings.berserk.e1 = e.target.checked; saveSettings(); if (typeof window.updateServerBerserk === 'function') window.updateServerBerserk(); });
        bindChange('berserkE2', (e) => { botSettings.berserk.e2 = e.target.checked; saveSettings(); if (typeof window.updateServerBerserk === 'function') window.updateServerBerserk(); });
        bindChange('berserkHero', (e) => { botSettings.berserk.hero = e.target.checked; saveSettings(); if (typeof window.updateServerBerserk === 'function') window.updateServerBerserk(); });
        bindChange('berserkMaxLvl', (e) => { botSettings.berserk.maxLvlOffset = parseInt(e.target.value, 10) || 100; saveSettings(); if (typeof window.updateServerBerserk === 'function') window.updateServerBerserk(); });
        bindChange('berserkMinLvl', (e) => { botSettings.berserk.minLvlOffset = -(parseInt(e.target.value, 10) || 20); saveSettings(); if (typeof window.updateServerBerserk === 'function') window.updateServerBerserk(); });

// ZAPISYWANIE USTAWIEŃ EXP
setOnChange('expMinL', (e) => {
    botSettings.exp.minLvl = parseInt(e.target.value, 10) || 1;
    saveSettings();
});

setOnChange('expMaxL', (e) => {
    botSettings.exp.maxLvl = parseInt(e.target.value, 10) || 300;
    saveSettings();
});

setOnChange('expRange', (e) => {
    botSettings.exp.berserk = parseInt(e.target.value, 10) || 20;
    saveSettings();
});

setOnChange('expN', (e) => {
    botSettings.exp.normal = e.target.checked;
    saveSettings();
});

setOnChange('expE', (e) => {
    botSettings.exp.elite = e.target.checked;
    saveSettings();
});

if (document.getElementById('expAggro')) {
    setOnChange('expAggro', (e) => {
        botSettings.exp.useAggro = e.target.checked;
        saveSettings();
    });

    setOnChange('aggroN', (e) => {
        botSettings.exp.aggroN = e.target.checked;
        saveSettings();
    });

    setOnChange('aggroE1', (e) => {
        botSettings.exp.aggroE1 = e.target.checked;
        saveSettings();
    });

    setOnChange('aggroE2', (e) => {
        botSettings.exp.aggroE2 = e.target.checked;
        saveSettings();
    });
}

// SZUKAJKI
bindInput('e2Search', () => renderBossList('e2ListContainer', elityIIData, 'e2Search', '#ba68c8'));
bindInput('kolosySearch', () => renderBossList('kolosyListContainer', kolosyData, 'kolosySearch', '#e64a19'));



        const selHero = document.getElementById('selHero');

        for (const hero in heroData) { let opt = document.createElement('option'); opt.value = hero; opt.innerText = heroLevels[hero] ? `${hero} (${heroLevels[hero]})` : hero; selHero.appendChild(opt); }



selHero.addEventListener('change', (e) => {

            const hero = e.target.value;

            document.getElementById('cordsListContainer').innerHTML = '';



            if (hero && heroData[hero]) {

                if (!heroMapOrder[hero] || heroMapOrder[hero].length === 0) {

                    heroMapOrder[hero] = Object.keys(heroData[hero]);

                    saveMapOrder();

                }

                currentRouteIndex = -1;

                sessionStorage.removeItem('hero_route_index');

                checkedMapsThisSession.clear();

                saveCheckedMaps();



                let currMap = (typeof Engine !== 'undefined' && Engine.map && Engine.map.d) ? Engine.map.d.name : lastMapName;

                if (heroData[hero][currMap]) {

                    currentCordsList = [...heroData[hero][currMap]];

                    checkedPoints.clear();

                    setTimeout(() => { optimizeRoute(); renderCordsList(); }, 150);

                } else {

                    currentCordsList = [];

                    checkedPoints.clear();

                    renderCordsList();

                }

                updateUI(); // Wymuszenie narysowania tras!

            } else {

                document.getElementById('heroMapListContainer').innerHTML = '<div style="padding:5px;text-align:center;color:#777;">Wybierz herosa</div>';

            }

        });

        // OKNA I PRZYCISKI POMOCNICZE

        document.getElementById('btnOpenSettings').addEventListener('click', () => { let p = document.getElementById('heroSettingsGUI'); p.style.display = p.style.display === 'flex' ? 'none' : 'flex'; });

        document.getElementById('btnOpenMaps').addEventListener('click', () => { let p = document.getElementById('heroGatewaysGUI'); p.style.display = p.style.display === 'flex' ? 'none' : 'flex'; if(p.style.display === 'flex') renderGatewaysDatabase(); });


        document.getElementById('btnScanGateways').addEventListener('click', scanCurrentMapForGateways);



        let keyBindInput = document.getElementById('inpToggleKey');

        keyBindInput.addEventListener('keydown', (e) => { e.preventDefault(); e.stopPropagation(); if (e.code === 'Escape' || e.code === 'Backspace') { keyBindInput.value = ''; botSettings.toggleKey = ''; } else { keyBindInput.value = e.code; botSettings.toggleKey = e.code; } saveSettings(); });



        document.getElementById('chkRadar').addEventListener('change', (e) => { botSettings.radarEnabled = e.target.checked; saveSettings(); });

        document.getElementById('chkAutoAttack').addEventListener('change', (e) => { botSettings.autoAttack = e.target.checked; saveSettings(); });
// --- NAPRAWA PRZEZROCZYSTOŚCI (NOWA METODA RGBA - CZYTELNY TEKST) ---
        function updateWindowsBackground(opacityValue) {
            document.querySelectorAll('.hero-window').forEach(w => {
                // Usuwamy starą metodę (na wszelki wypadek)
                w.style.opacity = '1'; 
                // Wymuszamy pełną czytelność tekstu
                w.style.color = '#ffffff'; 
                
                // Ustawiamy przezroczystość TYLKO dla tła (używamy rgba)
                // Zakładamy podstawowy kolor okna jako ciemnoszary: #202020 (czyli 32, 32, 32 w RGB)
                w.style.backgroundColor = `rgba(32, 32, 32, ${opacityValue})`;
            });
        }

        let opacitySlider = document.getElementById('sliderOpacity');
        if (opacitySlider) {
            // Wczytanie z pamięci przy starcie (domyślnie 0.95, czyli prawie pełne)
            let savedOpacity = localStorage.getItem('hero_opacity_v64') || 0.95;
            opacitySlider.value = savedOpacity;
            updateWindowsBackground(savedOpacity);
            
            // Reagowanie na poruszanie suwakiem w czasie rzeczywistym
            opacitySlider.addEventListener('input', (e) => {
                let val = e.target.value;
                updateWindowsBackground(val);
                localStorage.setItem('hero_opacity_v64', val);
            });
        }




        document.getElementById('btnSaveSettings').addEventListener('click', () => {

            botSettings.mapLoadMin = parseInt(document.getElementById('inpLoadMin').value) || 1000;

            botSettings.mapLoadMax = parseInt(document.getElementById('inpLoadMax').value) || 1500;

            botSettings.waitMin = parseInt(document.getElementById('inpWaitMin').value) || 200;

            botSettings.waitMax = parseInt(document.getElementById('inpWaitMax').value) || 500;

            botSettings.stepMin = parseInt(document.getElementById('inpStepMin').value) || 100;

            botSettings.stepMax = parseInt(document.getElementById('inpStepMax').value) || 150;

            botSettings.visionRange = parseInt(document.getElementById('inpVisionRange').value) || 7;

            botSettings.reactionMin = parseInt(document.getElementById('inpReactionMin').value) || 500;

            botSettings.reactionMax = parseInt(document.getElementById('inpReactionMax').value) || 1200;

            botSettings.attackDelayMin = parseInt(document.getElementById('inpAttackDelayMin').value) || 800;

            botSettings.attackDelayMax = parseInt(document.getElementById('inpAttackDelayMax').value) || 1500;



            // Nowa linijka zapisująca Anty-Lag!

            botSettings.expAntiLagMin = parseInt(document.getElementById('inpExpAntiLagMin').value) || 1500;

            botSettings.expAntiLagMax = parseInt(document.getElementById('inpExpAntiLagMax').value) || 2500;



            saveSettings();

            heroAlert("Ustawienia zostały zapisane.");

        });



        document.getElementById('btnResetRoute').addEventListener('click', () => { heroConfirm("Zresetować pętlę i zacząć od nowa?", (res) => { if(res) { checkedMapsThisSession.clear(); saveCheckedMaps(); currentRouteIndex = -1; sessionStorage.removeItem('hero_route_index'); autoDetectEngineData(); updateUI(); }}); });

      // --- FUNKCJE DLA PRZYCISKU "IDŹ DO" ---
        function getAllKnownMaps() {
            const set = new Set();
            // Z Herosów
            for (const hero in heroData) { Object.keys(heroData[hero] || {}).forEach(m => set.add(m)); }
            // Z Elit i Kolosów
            if (typeof elityIIData !== 'undefined') elityIIData.forEach(e => (e.path || []).forEach(m => set.add(m)));
            if (typeof kolosyData !== 'undefined') kolosyData.forEach(e => (e.path || []).forEach(m => set.add(m)));
            // Z bazy bram
            for (const src in globalGateways) {
                set.add(src);
                for (const target in globalGateways[src]) set.add(target);
            }
            return [...set].sort((a, b) => a.localeCompare(b, 'pl'));
        }

        window.renderGoToMapsList = function(filter = "") {
            const container = document.getElementById('goToMapsListContainer');
            if (!container) return;
            const allMaps = getAllKnownMaps();
            const q = filter.trim().toLowerCase();
            const filtered = q ? allMaps.filter(m => m.toLowerCase().includes(q)) : allMaps;

            if (filtered.length === 0) {
                container.innerHTML = '<div style="padding:5px; text-align:center; color:#777; font-size:10px;">Brak map w bazie spełniających kryteria.</div>';
                return;
            }

            container.innerHTML = filtered.map(mapName => `
                <div class="list-item" style="cursor:pointer; border-left: 3px solid #00acc1;" onclick="document.getElementById('heroGoToGUI').style.display='none'; rushToMap('${mapName.replace(/'/g, "\\'")}')">
                    <span style="color:#d4af37; font-weight:bold;">${mapName}</span>
                    <span style="color:#00acc1; font-size:10px; font-weight:bold;">🏃 BIEGNIJ</span>
                </div>
            `).join('');
        };

        const btnGoToTop = document.getElementById('btnGoToTop');
        if (btnGoToTop) {
            btnGoToTop.addEventListener('click', () => {
                const gui = document.getElementById('heroGoToGUI');
                if (gui.style.display === 'none') {
                    // Zamknij inne okna, żeby nie było tłoku
                    const settings = document.getElementById('heroSettingsGUI');
                    const maps = document.getElementById('heroGatewaysGUI');
                    if (settings) settings.style.display = 'none';
                    if (maps) maps.style.display = 'none';

                    gui.style.display = 'flex';
                    window.renderGoToMapsList(document.getElementById('inpGoToSearch').value);
                    setTimeout(() => document.getElementById('inpGoToSearch').focus(), 100);
                } else {
                    gui.style.display = 'none';
                }
            });
        }

        const inpGoToSearch = document.getElementById('inpGoToSearch');
        if (inpGoToSearch) {
            inpGoToSearch.addEventListener('input', (e) => {
                window.renderGoToMapsList(e.target.value);
            });
        }


        document.getElementById('btnStartStop').addEventListener('click', () => {

            if (isPatrolling || isRushing) stopPatrol(false);

            else {

                if (!document.getElementById('heroModeToggle').classList.contains('active-tab')) {

                    heroAlert("Dla E2 i Kolosów kliknij po prostu na przycisk 🏃 BIEGNIJ obok nazwy bazy.\nZaznacz je z listy, złap respa w kratkę, a jeśli boss się pojawi - najedź kursorem lub zaatakuj.");

                } else {

                    startPatrol();

                }

            }

        });



        // Event Listenery globalne

        window.openInlineEditor = function(targetMapName) { editingGatewayFor = targetMapName; updateUI(); };

        window.saveInlineGateway = function(targetMapName) { let currentMap = lastMapName; let x = parseInt(document.getElementById('gw_edit_x').value); let y = parseInt(document.getElementById('gw_edit_y').value); if (isNaN(x) || isNaN(y)) return heroAlert("Wpisz poprawne liczby w pola X i Y!"); saveGatewayToDB(currentMap, targetMapName, x, y); editingGatewayFor = null; updateUI(); };

        window.cancelInlineGateway = function() { editingGatewayFor = null; updateUI(); };

        window.changeMapOrder = function(oldIndex, newValue) { let hero = document.getElementById('selHero').value; if (!hero || !heroMapOrder[hero]) return; let newIndex = parseInt(newValue) - 1; let maxIndex = heroMapOrder[hero].length - 1; if (isNaN(newIndex) || newIndex < 0) newIndex = 0; if (newIndex > maxIndex) newIndex = maxIndex; if (oldIndex === newIndex) { updateUI(); return; } let item = heroMapOrder[hero].splice(oldIndex, 1)[0]; heroMapOrder[hero].splice(newIndex, 0, item); saveMapOrder(); updateUI(); };

        window.removeMapFromOrder = function(index) { let hero = selHero.value; if (hero && heroMapOrder[hero]) { heroConfirm(`Usunąć mapę '${heroMapOrder[hero][index]}' ze ścieżki?`, (res) => { if (res) { heroMapOrder[hero].splice(index, 1); if(currentRouteIndex >= heroMapOrder[hero].length) currentRouteIndex = heroMapOrder[hero].length - 1; saveMapOrder(); updateUI(); } }); } };

        window.setManualRouteIndex = function(index, mapName) {

        let currentSysMap = lastMapName;



        if (currentSysMap === mapName) {

            // Jeśli kliknąłeś mapę, na której stoisz - po prostu zaktualizuj index

            currentRouteIndex = index;

            sessionStorage.setItem('hero_route_index', currentRouteIndex);

            checkedMapsThisSession.clear();

            saveCheckedMaps();

            autoDetectEngineData();

            updateUI();

            console.log(`%c[HERO] Trasa pętli ustawiona od mapy: ${mapName}`, "color: #4caf50;");

        } else {

            // Jeśli kliknąłeś inną mapę - sprawdzamy, czy bot zna drogę

            let path = getShortestPath(currentSysMap, mapName);



            if (path && path.length > 1) {

                console.log(`%c[HERO] Znaleziono drogę. Biegne na wybraną mapę: ${mapName}`, "color: #00acc1; font-weight: bold;");

                // Ustawiamy nowy index na przyszłość, żeby po dobiegnięciu kontynuował pętlę stamtąd

                currentRouteIndex = index;

                sessionStorage.setItem('hero_route_index', currentRouteIndex);



                // Uruchamiamy bieg (Rush Mode)

                rushToMap(mapName);

            } else {

                console.log(`%c[HERO] Brak drogi! Stoisz na: [${currentSysMap}], a chcesz iść do [${mapName}]. Najpierw nagraj przejścia (🎥)!`, "color: #e53935; font-weight: bold;");

            }

        }

    };

        window.deleteGateway = function(sourceMap, targetMapName) { if (globalGateways[sourceMap] && globalGateways[sourceMap][targetMapName]) { heroConfirm(`Usunąć zapisane przejście z [${sourceMap}] do [${targetMapName}]?`, (res) => { if (res) { delete globalGateways[sourceMap][targetMapName]; saveGateways(); updateUI(); } }); } };

        window.goSinglePoint = function(x, y, requiredMap) { let currentMap = lastMapName; if (requiredMap && requiredMap !== currentMap) { return heroAlert(`Błąd wejścia!\n\nTo przejście znajduje się fizycznie na mapie:\n[${requiredMap}]\n\nObecnie stoisz na:\n[${currentMap}]`); } if(isPatrolling || isRushing) stopPatrol(false); safeGoTo(x, y, false); };



        // Naprawa Scrollowania (zablokowanie kradzieży scrolla przez Margonem)

        document.querySelectorAll('.hero-window').forEach(win => {

            win.addEventListener('wheel', e => e.stopPropagation(), { passive: true });

        });
// --- NOWE PRZYCISKI BAZY I POLECANYCH ---
        let btnExpBase = document.getElementById('btnOpenExpBase');
        if (btnExpBase) {
            btnExpBase.addEventListener('click', () => {
                let p = document.getElementById('heroExpBaseGUI');
                p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
                if(p.style.display === 'flex' && typeof window.renderExpProfiles === 'function') {
                    window.renderExpProfiles();
                }
            });
        }

        let btnRecExp = document.getElementById('btnOpenRecommendedExp');
        if (btnRecExp) {
            btnRecExp.addEventListener('click', () => {
                let p = document.getElementById('heroExpRecGUI');
                p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
                if(p.style.display === 'flex' && typeof window.renderRecommendedExp === 'function') {
                    window.renderRecommendedExp();
                }
            });
        }

let btnAddRec = document.getElementById('btnAddSelectedRec');
        if (btnAddRec) {
            btnAddRec.addEventListener('click', () => {
                let checkboxes = document.querySelectorAll('.chk-rec-profile:checked');
                if(checkboxes.length === 0) return heroAlert("Nie zaznaczono żadnego expowiska!");

                let addedCount = 0;
                let minL = 9999;
                let maxL = 0;

                checkboxes.forEach(chk => {
                    let idx = parseInt(chk.getAttribute('data-index'));
                    let p = botSettings.expProfiles[idx];
                    if(p) {
                        p.maps.forEach(m => {
                            if (!botSettings.exp.mapOrder.includes(m)) {
                                botSettings.exp.mapOrder.push(m);
                                addedCount++;
                            }
                        });
                        let lvlMatch = p.name.match(/\((\d+)\s*lvl\)/i);
                        if(lvlMatch && lvlMatch[1]) {
                            let baseLvl = parseInt(lvlMatch[1]);
                            minL = Math.min(minL, Math.max(1, baseLvl - 5));
                            maxL = Math.max(maxL, baseLvl + 15);
                        }
                    }
                });

                if(addedCount > 0) {
                    localStorage.setItem('exp_map_order_v64', JSON.stringify(botSettings.exp.mapOrder));

                    if(minL !== 9999) {
                        botSettings.exp.minLvl = Math.min(botSettings.exp.minLvl, minL);
                        botSettings.exp.maxLvl = Math.max(botSettings.exp.maxLvl, maxL);
                        let eMin = document.getElementById('expMinL');
                        let eMax = document.getElementById('expMaxL');
                        if (eMin) eMin.value = botSettings.exp.minLvl;
                        if (eMax) eMax.value = botSettings.exp.maxLvl;
                        saveSettings();
                        if(botSettings.exp.useAggro && typeof window.toggleNativeAggroVisuals === 'function') window.toggleNativeAggroVisuals(true);
                    }

                    if(typeof window.renderExpMaps === 'function') window.renderExpMaps();
                    heroAlert(`✅ Pomyślnie połączono i dodano ${addedCount} nowych map do trasy!\nZaktualizowano również przedział poziomowy.`);
                    document.getElementById('heroExpRecGUI').style.display = 'none';
                } else {
                    heroAlert("Wybrane mapy są już na Twojej liście Smart-Roam.");
                }
            });
        }

        // ==========================================
        // TWARDE PODPIĘCIE MODUŁÓW POWIADOMIEŃ I DISCORDA
        // ==========================================
        let btnBrowserAlerts = document.getElementById('btnOpenBrowserAlertsModule');
        if (btnBrowserAlerts) {
            btnBrowserAlerts.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                let p = document.getElementById('browserAlertsSettingsGUI');
                if (p) p.style.display = p.style.display === 'none' ? 'flex' : 'none';
            });
        }

        let btnDiscordAlerts = document.getElementById('btnOpenDiscordModule');
        if (btnDiscordAlerts) {
            btnDiscordAlerts.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                let p = document.getElementById('discordSettingsGUI');
                if (p) p.style.display = p.style.display === 'none' ? 'flex' : 'none';
            });
        }

        // Struktura bazy danych Discorda
        if (!botSettings.discord) botSettings.discord = { enabled: false, url: '', userId: '', alerts: {}, stop: {} };
        if (!botSettings.discord.alerts) botSettings.discord.alerts = { hero: true, player: true, chat: true, captcha: true };
        if (!botSettings.discord.stop) botSettings.discord.stop = { hero: true, player: false, chat: false, captcha: true };

        // Wymuszenie wczytania wpisanych linków do okienek
        let inpUrl = document.getElementById('discordWebhookUrl');
        if(inpUrl && botSettings.discord.url) inpUrl.value = botSettings.discord.url;
        
        let inpId = document.getElementById('discordUserId');
        if(inpId && botSettings.discord.userId) inpId.value = botSettings.discord.userId;

        // Podpięcie w czasie rzeczywistym
        bindInput('discordWebhookUrl', (e) => { botSettings.discord.url = e.target.value.trim(); saveSettings(); });
        bindInput('discordUserId', (e) => { botSettings.discord.userId = e.target.value.trim(); saveSettings(); });

        // Twarde zapisywanie powiadomień przeglądarki
        bindChange('captchaAlert', (e) => { botSettings.exp.captchaAlert = e.target.checked; saveSettings(); });
        bindChange('playerAlert', (e) => { botSettings.exp.playerAlert = e.target.checked; saveSettings(); });
        bindChange('playerAlertStopBot', (e) => { botSettings.exp.playerAlertStopBot = e.target.checked; saveSettings(); });
        bindChange('chatAlert', (e) => { botSettings.exp.chatAlert = e.target.checked; saveSettings(); });
        bindChange('chatAlertStopBot', (e) => { botSettings.exp.chatAlertStopBot = e.target.checked; saveSettings(); });

        // Twardy przycisk zapisujący Discorda (Klonowanie zdejmuje zepsute blokady)
        let btnSaveDiscord = document.getElementById('btnSaveDiscord');
        if (btnSaveDiscord) {
            let newBtnSaveDiscord = btnSaveDiscord.cloneNode(true);
            btnSaveDiscord.parentNode.replaceChild(newBtnSaveDiscord, btnSaveDiscord);

            newBtnSaveDiscord.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                
                botSettings.discord.url = document.getElementById('discordWebhookUrl').value.trim();
                botSettings.discord.userId = document.getElementById('discordUserId').value.trim();
                botSettings.discord.enabled = botSettings.discord.url.length > 10;
                
                botSettings.discord.alerts.hero = document.getElementById('discordAlert_Hero').checked;
                botSettings.discord.alerts.player = document.getElementById('discordAlert_Player').checked;
                botSettings.discord.alerts.chat = document.getElementById('discordAlert_Chat').checked;
                botSettings.discord.alerts.captcha = document.getElementById('discordAlert_Captcha').checked;

                botSettings.discord.stop.hero = document.getElementById('discordStop_Hero').checked;
                botSettings.discord.stop.player = document.getElementById('discordStop_Player').checked;
                botSettings.discord.stop.chat = document.getElementById('discordStop_Chat').checked;
                botSettings.discord.stop.captcha = document.getElementById('discordStop_Captcha').checked;
                
                saveSettings();
                
                if(botSettings.discord.enabled) {
                    window.sendDiscordWebhook("🟢 MARGONEURO ZSYNCHRONIZOWANE", "Powiadomienia Discord zostały skonfigurowane poprawnie i działają niezależnie od przeglądarki!", 5763719);
                    heroAlert("Ustawienia Discord zostały zapisane.\nWysłano wiadomość testową na Twój kanał!");
                } else {
                    heroAlert("Ustawienia zapisane (Webhook wyłączony ze względu na pusty link).");
                }
            });
        }
        
    } // <--- TO JEST ZAMKNIĘCIE FUNKCJI setupLogic, KTÓRE SIĘ ZEPSUŁO!

    // ==========================================

    // RENDEROWANIE BAZY I TRASY

    // ==========================================

    function renderBossList(containerId, dataArray, searchId, headerColor) {

        const container = document.getElementById(containerId);

        if (!container) return;



        let filterText = (document.getElementById(searchId).value || "").toLowerCase();

        container.innerHTML = '';



        let filtered = dataArray.filter(e => e.name.toLowerCase().includes(filterText) || e.level.toString().includes(filterText));



        if (filtered.length === 0) {

            container.innerHTML = '<div style="padding:5px;text-align:center;color:#777;">Brak wyników.</div>';

            return;

        }



        filtered.forEach(boss => {

            const rowWrapper = document.createElement('div');

            rowWrapper.style.display = "block";

            rowWrapper.style.marginBottom = "4px";



            let isTargeted = activeBossTarget === boss.name;

            let bgColor = isTargeted ? "rgba(255, 255, 255, 0.1)" : "#1a1a1a";

            let bColor = isTargeted ? headerColor : "#333";



// --- NAPRAWA BŁĘDU "[Brak Kordów]" ORAZ "BIEGU PO NITCE" ---
            let finalMap = boss.path[boss.path.length-1];
            let savedInfo = `<span style="color:#777; font-size:9px;">[Brak Kordów]</span>`;
            let targetX = null;
            let targetY = null;

            // 1. Priorytet: Nowa Baza (właściwość "resp" z pliku bossy.json)
            if (boss.resp && boss.resp[finalMap] && boss.resp[finalMap].length > 0) {
                targetX = boss.resp[finalMap][0][0];
                targetY = boss.resp[finalMap][0][1];
                savedInfo = `<span style="color:#4caf50; font-size:9px;">[Baza: ${finalMap} - X:${targetX}, Y:${targetY}]</span>`;
            }
       // 2. Fallback: Jeśli zapisałeś coś sam w grze (w localStorage)
            else if (bossSavedCoords[boss.name]) {
                targetX = bossSavedCoords[boss.name].x;
                targetY = bossSavedCoords[boss.name].y;
                finalMap = bossSavedCoords[boss.name].map;
                savedInfo = `<span style="color:#ffb300; font-size:9px;">[Zapisano: ${finalMap} - X:${targetX}, Y:${targetY}]</span>`;
            }

            let safeMapName = finalMap.replace(/'/g, "\\'");
            let pathStr = JSON.stringify(boss.path).replace(/"/g, '&quot;');
            let rushArgs = `'${safeMapName}', ${targetX}, ${targetY}, ${pathStr}`;

            const header = document.createElement('div');

            header.style.cssText = `background: ${bgColor}; border: 1px solid ${bColor}; padding: 4px 5px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;`;

            header.innerHTML = `

                <div style="display:flex; flex-direction:column; line-height:1.2;">

                    <span style="color: ${headerColor}; font-weight: bold; font-size: 11px;">${boss.name} <span style="color:#a99a75;font-weight:normal;">(${boss.level} ${boss.prof})</span></span>

                    ${savedInfo}

                </div>

                <span style="font-size:10px; color:#a99a75;">▼</span>

            `;



            const content = document.createElement('div');

            content.style.display = isTargeted ? "block" : "none";

            content.style.padding = "4px";

            content.style.borderLeft = "1px solid #333";

            content.style.background = "#141414";



            let htmlPath = "";

            boss.path.forEach((map, idx) => { let arrow = idx < boss.path.length - 1 ? " ➝ " : ""; htmlPath += `<span style="color:#a99a75;">${map}</span>${arrow}`; });



            let bStyle = "height:22px; line-height:20px; border:1px solid #111; border-radius:3px; font-size:10px; font-weight:bold; cursor:pointer; color:#fff; text-shadow:1px 1px 0 rgba(0,0,0,0.8); box-sizing:border-box; margin:0; padding:0; box-shadow:inset 0 1px 2px rgba(255,255,255,0.2);";



            content.innerHTML = `

                <div style="font-size:10px; color:#aaa; margin-bottom:3px; display:flex; justify-content:space-between;">

                    <span>Limit: <b style="color:#fff">${boss.limit === 999 ? 'Brak' : boss.limit}</b></span>

                    <span>PvP: <b style="color:#fff">${boss.pvp}</b></span>

                </div>

                <div style="font-size:9px; color:#888; margin-bottom:6px; line-height:1.3; word-wrap:break-word; white-space:normal;">

                 Trasa: <span style="color:#a99a75">${htmlPath}</span>

                </div>

                <div style="display:flex; flex-direction:column; gap:4px;">

                    <div style="display:flex; gap:4px;">

                        <button style="${bStyle} background:#00838f; width:80px;" onclick="event.stopPropagation(); saveCurrentCoordsForBoss('${boss.name}')" title="Nadpisz koordynaty z bazy">📌 ZAPISZ RĘCZNIE</button>

                        ${bossSavedCoords[boss.name] ? `

                            <button style="${bStyle} background:#e53935; width:30px;" onclick="event.stopPropagation(); deleteBossCoords('${boss.name}')" title="Usuń zapis użytkownika (przywróci domyślną bazę)">✖</button>

                        ` : ''}

                    </div>

                  <div style="display:flex; gap:4px;">
                        <button style="${bStyle} background:#4e342e; width:95px;" onclick="event.stopPropagation(); window.rushToMap(${rushArgs})">🏃 BIEG DO MAPY</button>
                        ${targetX !== null ? `
                            <button style="${bStyle} background:#4caf50; width:80px;" onclick="event.stopPropagation(); window.goSinglePoint(${targetX}, ${targetY}, '${finalMap.replace(/'/g, "\\'")}')">🎯 DO KORDU</button>
                        ` : ''}
                    </div>

                </div>

            `;



            header.onclick = () => {

                let isHidden = content.style.display === "none";



                document.querySelectorAll(`#${containerId} > div > div:nth-child(2)`).forEach(c => c.style.display = 'none');

                document.querySelectorAll(`#${containerId} > div > div:nth-child(1)`).forEach(h => { h.style.background = '#1a1a1a'; h.style.borderColor = '#333'; });



                if (isHidden) {

                    content.style.display = "block";

                    header.style.background = "rgba(255, 255, 255, 0.1)";

                    header.style.borderColor = headerColor;

                    activeBossTarget = boss.name;

                } else {

                    activeBossTarget = null;

                }

            };



            rowWrapper.appendChild(header);

            rowWrapper.appendChild(content);

            container.appendChild(rowWrapper);

        });

    }



    function renderGatewaysDatabase() {

        const container = document.getElementById('gatewaysListContainer'); if(!container) return; container.innerHTML = ''; let currentSysMap = lastMapName; let count = 0;

        let currentMapGateways = globalGateways[currentSysMap] || {};

        if (Object.keys(currentMapGateways).length > 0) {

            count++; let headerCurrent = document.createElement('div');

            headerCurrent.innerHTML = `<span style="color:#4caf50; font-weight:bold; font-size:11px;">📍 JESTEŚ TUTAJ: ${currentSysMap}</span>`;

            headerCurrent.style.padding = "4px 5px"; headerCurrent.style.background = "rgba(76, 175, 80, 0.1)"; headerCurrent.style.border = "1px solid #4caf50"; headerCurrent.style.marginBottom = "2px"; container.appendChild(headerCurrent);

            for (let target in currentMapGateways) { let coords = currentMapGateways[target]; let row = document.createElement('div'); row.className = "list-item"; row.style.borderLeft = "3px solid #4caf50"; row.innerHTML = `<div style="font-size:10px; color:#e0d8c0; display:flex; flex-direction:column; cursor:pointer; flex-grow:1;" onclick="goSinglePoint(${coords.x}, ${coords.y}, '${currentSysMap}')" title="Biegnij tam!"><span style="color:#00acc1; font-weight:bold;">DO: ${target}</span><span style="color:#a99a75;">Ostatnia klatka: X: ${coords.x}, Y: ${coords.y}</span></div><button class="icon-btn" style="padding:0 5px;" title="Usuń z bazy" onclick="deleteGateway('${currentSysMap}', '${target}')">🗑️</button>`; container.appendChild(row); }

        }

        let headerOther = document.createElement('div'); headerOther.innerHTML = `<span style="color:#d4af37; font-weight:bold; font-size:10px;">🗺️ POZOSTAŁE PRZEJŚCIA W PAMIĘCI:</span>`; headerOther.style.padding = "4px 5px"; headerOther.style.background = "#1a1a1a"; headerOther.style.marginTop = "8px"; headerOther.style.marginBottom = "4px"; container.appendChild(headerOther);

        let otherCount = 0;

        for (let sourceMap in globalGateways) {

            if (sourceMap === currentSysMap) continue;

            if (Object.keys(globalGateways[sourceMap]).length === 0) continue;

            count++; otherCount++;

            let groupWrap = document.createElement('div'); groupWrap.style.marginBottom = "2px"; let header = document.createElement('div'); header.className = "accordion-header"; header.innerHTML = `▶ Z mapy: ${sourceMap}`; let content = document.createElement('div'); content.style.display = "none"; content.style.paddingLeft = "4px"; content.style.borderLeft = "1px solid #333"; content.style.marginBottom = "4px";

            header.onclick = () => { let isHidden = content.style.display === "none"; content.style.display = isHidden ? "block" : "none"; header.innerHTML = `${isHidden ? '▼' : '▶'} Z mapy: ${sourceMap}`; };

            for (let target in globalGateways[sourceMap]) { let coords = globalGateways[sourceMap][target]; let row = document.createElement('div'); row.className = "list-item"; row.innerHTML = `<div style="font-size:10px; color:#e0d8c0; display:flex; flex-direction:column; cursor:pointer; flex-grow:1;" onclick="goSinglePoint(${coords.x}, ${coords.y}, '${sourceMap}')" title="Musisz iść na mapę: ${sourceMap}"><span style="color:#00acc1; font-weight:bold;">DO: ${target}</span><span style="color:#a99a75;">Ostatnia klatka: X: ${coords.x}, Y: ${coords.y}</span></div><button class="icon-btn" style="padding:0 5px;" title="Usuń z bazy" onclick="deleteGateway('${sourceMap}', '${target}')">🗑️</button>`; content.appendChild(row); }

            groupWrap.appendChild(header); groupWrap.appendChild(content); container.appendChild(groupWrap);

        }

        if (otherCount === 0) container.innerHTML += `<div style="padding:5px; text-align:center; color:#777; font-size:10px; font-style:italic;">Brak innych przejść.</div>`;

        if (count === 0) container.innerHTML = `<div style="padding:5px; text-align:center; color:#777; font-size:10px; font-style:italic;">Brak zapisanych przejść w całej pamięci.<br><br>Włącz Smart Memory (🎥) i graj, a same się tu pojawią!</div>`;

    }



function scanCurrentMapForGateways() {
        if (typeof Engine === 'undefined' || !Engine.map || !Engine.map.d) return heroAlert("Błąd: Silnik gry nie jest gotowy.");
        let currentMap = Engine.map.d.name;

        let gatewaysFound = HeroScannerModule.scanCurrentMap(currentMap, ZAKONNICY);
        let container = document.getElementById('gatewaysListContainer');
        if (!container) return;

        // Grupujemy wyniki, żeby nie spamować listy, gdy jedna jaskinia ma np. 5 kratek wejścia
        let grouped = {};
        gatewaysFound.forEach(gw => {
            if (!grouped[gw.targetMap]) grouped[gw.targetMap] = [];
            grouped[gw.targetMap].push({x: gw.x, y: gw.y});
        });

        // Wymuszamy autozapis wywołany ręcznie
        autoLearnGateways();

        // Czyścimy stare wyniki wyszukiwania
        let oldScans = container.querySelectorAll('.scanner-result-header, .scanner-result-item');
        oldScans.forEach(el => el.remove());

        let uniqueCount = Object.keys(grouped).length;
        if (uniqueCount === 0) {
            return heroAlert("Skaner nie wykrył żadnych nowych przejść.");
        }

        let header = document.createElement('div');
        header.className = "scanner-result-header";
        header.innerHTML = `<br><span style="color:#ffb300; font-weight:bold; font-size:10px;">🔍 ZESKANOWANO KIERUNKI (${uniqueCount}):</span>`;
        header.style.padding = "2px 5px"; header.style.background = "#1a1a1a";
        container.insertBefore(header, container.firstChild);

        for (let tMap in grouped) {
            let coordsList = grouped[tMap];
            let firstGw = coordsList[0];
            let row = document.createElement('div');
            row.className = "list-item scanner-result-item";
            row.style.borderLeft = "3px solid #ffb300";
            row.innerHTML = `
                <div style="font-size:10px; color:#e0d8c0; display:flex; flex-direction:column; cursor:pointer;" onclick="goSinglePoint(${firstGw.x}, ${firstGw.y}, '${currentMap}')">
                    <span style="color:#ffb300; font-weight:bold;">${tMap}</span>
                    <span style="color:#a99a75;">Kratek wejścia: ${coordsList.length} (Zapisano do bazy!)</span>
                </div>
                <button class="btn-sepia" onclick="this.parentElement.remove();">UKRYJ</button>
            `;
            container.insertBefore(row, header.nextSibling);
        }

        heroAlert(`Sukces!\nZeskanowano i pogrupowano wejścia.\nDodano do bazy: ${uniqueCount} kierunków (łącznie ${gatewaysFound.length} kratek wejścia do wylosowania przez bota).`);
    }

    function renderCordsList(activeIndex = -1) {

        const container = document.getElementById('cordsListContainer'); if(!container) return; container.innerHTML = ''; let currentMap = lastMapName;

        if (checkedMapsThisSession.has(currentMap)) { container.innerHTML = '<div style="padding:5px;text-align:center;color:#81c784;font-style:italic;">Mapa oznaczona jako sprawdzona (✔). Szukam drogi dalej.</div>'; return; }

        if(currentCordsList.length === 0) { container.innerHTML = '<div style="padding:5px;text-align:center;color:#777;font-style:italic;">Brak respów. Przechodzę przez mapę.</div>'; return; }

        currentCordsList.forEach((c, index) => {

            const row = document.createElement('div'); let classes = "list-item"; if (index === activeIndex) classes += " active"; else if (checkedPoints.has(index)) classes += " checked"; row.className = classes; let statusIcon = checkedPoints.has(index) ? " ✔" : "";

            row.innerHTML = `<span style="color:#d4af37;">${index + 1}. [${c[0]}, ${c[1]}]${statusIcon}</span><div class="buttons-wrapper"><button class="btn-sepia btn-go-sepia" onclick="goSinglePoint(${c[0]}, ${c[1]}, '${currentMap}')">IDŹ</button></div>`; container.appendChild(row);

        });

    }



function optimizeRoute() {
        if (typeof Engine === 'undefined' || !Engine.hero || !Engine.hero.d || currentCordsList.length === 0) return;

        let cx = Engine.hero.d.x; let cy = Engine.hero.d.y;
        let unvisited = [...currentCordsList];
        let newRoute = [];
        let finalPoint = null;

        let hero = document.getElementById('selHero') ? document.getElementById('selHero').value : null;
        let currentSysMap = lastMapName;
        let exitGw = null;

        // Poszukiwanie bramy prowadzącej do następnej mapy (TYLKO DO OBLICZEŃ, BEZ RUCHU!)
        if (hero && heroMapOrder[hero] && heroMapOrder[hero].length > 0 && currentRouteIndex !== -1) {
            let mapList = heroMapOrder[hero];
            // Ulepszenie: Następna mapa w pętli. Jeśli kończymy listę (np. indeks 3 z 4), weź indeks 0
            let nextMap = mapList[(currentRouteIndex + 1) % mapList.length];
            let path = getShortestPath(currentSysMap, nextMap);

            if (path && path.length > 1) {
                let immediateNextMap = path[1];
                if (globalGateways[currentSysMap] && globalGateways[currentSysMap][immediateNextMap]) {
                    exitGw = globalGateways[currentSysMap][immediateNextMap];
                }
            }
        }

        // Jeśli mamy wyjście i więcej niż 1 punkt, ustalamy ostatni punkt przed drzwiami
        if (exitGw && unvisited.length > 1) {
            let closestToExitIdx = 0;
            let minDistToExit = Infinity;
            for (let i = 0; i < unvisited.length; i++) {
                let dist = Math.abs(unvisited[i][0] - exitGw.x) + Math.abs(unvisited[i][1] - exitGw.y);
                if (dist < minDistToExit) {
                    minDistToExit = dist;
                    closestToExitIdx = i;
                }
            }
            finalPoint = unvisited.splice(closestToExitIdx, 1)[0];
        }

        // Standardowe zachłanne sortowanie z obecnego miejsca dla reszty punktów
        while (unvisited.length > 0) {
            let nearestIdx = 0; let minDist = Infinity;
            for (let i = 0; i < unvisited.length; i++) {
                let dist = Math.abs(unvisited[i][0] - cx) + Math.abs(unvisited[i][1] - cy);
                if (dist < minDist) { minDist = dist; nearestIdx = i; }
            }
            let nextPt = unvisited.splice(nearestIdx, 1)[0];
            newRoute.push(nextPt);
            cx = nextPt[0]; cy = nextPt[1];
        }

        // Na koniec dodajemy "finalPoint" wyliczony obok drzwi (Teraz działa zawsze na końcu każdej mapy i pętli!)
        if (finalPoint) newRoute.push(finalPoint);

        currentCordsList = newRoute;
    }


    function safeGoTo(targetX, targetY, useRandom) {

        let now = Date.now();

        if (now < nextAllowedClickTime) return;



        let x = Number(targetX); let y = Number(targetY);



        if (useRandom) {

            let radius = botSettings.randomRadius;

            if (radius > 0) {

                x += Math.floor(Math.random() * (radius * 2 + 1)) - radius;

                y += Math.floor(Math.random() * (radius * 2 + 1)) - radius;

                x = Math.max(0, x); y = Math.max(0, y);

            }

        }



        if (typeof Engine !== 'undefined' && Engine.hero) {

            Engine.hero.autoGoTo({x: x, y: y});

            let throttleDelay = Math.floor(Math.random() * (botSettings.throttleMax - botSettings.throttleMin + 1)) + botSettings.throttleMin;

            nextAllowedClickTime = Date.now() + throttleDelay;

        }

    }



function stopPatrol(hardStop = true) { 
        let wasMoving = isPatrolling || isRushing;
        isPatrolling = false;
        isRushing = false;
        window.isRushing = false;
        window.isRushingToShop = false;
        window.resumePatrolAfterRush = false; // KRYTYCZNA POPRAWKA: Blokuje auto-wznawianie po ręcznym zatrzymaniu!
        
        clearTimeout(rushInterval);
        clearTimeout(smoothPatrolInterval);

        let btn = document.getElementById('btnStartStop');
        if (btn) {
            btn.innerHTML = '<span class="btn-icon">▶</span><span>START</span>';
            btn.style.color = "#4caf50";
            btn.style.borderColor = "#4caf50";
        }
        
        // Nie czyścimy checkedPoints tutaj, żeby bot pamiętał co sprawdził, jeśli wznowisz patrol!
        renderCordsList(-1);

        if (wasMoving && window.logHero) window.logHero("🛑 Zatrzymano patrol ręcznie.", "#f44336");

        // TWARDE HAMOWANIE POSTACI W GRZE
        if (hardStop && typeof Engine !== 'undefined' && Engine.hero && Engine.hero.d) {
            try {
                if (typeof Engine.hero.stop === 'function') Engine.hero.stop();
                Engine.hero.autoGoTo({x: Engine.hero.d.x, y: Engine.hero.d.y}); // Resetuje trasę do punktu pod nogami
                if (Engine.hero.d.path) Engine.hero.d.path = [];
            } catch(e) {}
        }
    }

    function startPatrol() {
        let hero = document.getElementById('selHero').value;
        let mapList = heroMapOrder[hero];
        if (!hero) { window.logHero("Błąd: Nie wybrano herosa z listy!", "#e53935"); return; }

        if (hero && mapList) {
            let currentSysMap = lastMapName;
            if (currentRouteIndex === -1 || mapList[currentRouteIndex] !== currentSysMap) {
                currentRouteIndex = mapList.indexOf(currentSysMap);
                sessionStorage.setItem('hero_route_index', currentRouteIndex);
                updateUI();
            }
        }
        isPatrolling = true; patrolIndex = 0; checkedPoints.clear(); heroFoundAlerted = false;
        let btn = document.getElementById('btnStartStop'); btn.innerHTML = '<span class="btn-icon">⏹</span><span>STOP</span>'; btn.style.color = "#f44336"; btn.style.borderColor = "#f44336";

        window.logHero(`Rozpoczęto patrol (Heros: ${hero}).`, "#4caf50");
        executePatrolStep();
    }

function executePatrolStep() {
        if (!isPatrolling) return;

        // 1. ZABEZPIECZENIE: Czekamy, aż mapa się w pełni załaduje po odświeżeniu
        if (typeof Engine === 'undefined' || !Engine.map || Engine.map.isLoading || !Engine.map.d.name) {
            setTimeout(executePatrolStep, 500);
            return;
        }

        checkVisionRange();

        let hero = document.getElementById('selHero').value;
        let currentSysMap = Engine.map.d.name;

        // 2. Jeśli bot po odświeżeniu/wczytaniu ma pustą listę kordów, a mapa nie jest sprawdzona - odzyskujemy ją!
        if (currentCordsList.length === 0 && heroData[hero] && heroData[hero][currentSysMap]) {
             if (!checkedMapsThisSession.has(currentSysMap)) {
                 currentCordsList = [...heroData[hero][currentSysMap]];
                 if (typeof optimizeRoute === 'function') optimizeRoute();
             }
        }

        let nextUnvisitedIndex = -1;
        for (let i = 0; i < currentCordsList.length; i++) {
            if (!checkedPoints.has(i)) {
                nextUnvisitedIndex = i;
                break;
            }
        }
        patrolIndex = nextUnvisitedIndex;

        // Jeśli wszystkie punkty na mapie sprawdzone LUB mapa nie ma w ogóle punktów
        if (patrolIndex === -1 || currentCordsList.length === 0) {
            clearTimeout(smoothPatrolInterval);
            
            if (!checkedMapsThisSession.has(currentSysMap)) { 
                checkedMapsThisSession.add(currentSysMap); 
                saveCheckedMaps(); 
                if (window.logHero) window.logHero(`Odhaczono wszystkie kordy na: ${currentSysMap}`, "#8bc34a");
            }

            if(hero && heroMapOrder[hero] && heroMapOrder[hero].length > 0) {
                let mapList = heroMapOrder[hero];
                
                // --- ZAKOŃCZENIE PATROLU PO OSTATNIEJ MAPIE ---
                let nextRouteIndex = currentRouteIndex + 1;
                
                if (nextRouteIndex >= mapList.length) {
                    checkedMapsThisSession.clear(); 
                    saveCheckedMaps(); 
                    currentRouteIndex = -1; 
                    sessionStorage.removeItem('hero_route_index'); 
                    
                    stopPatrol(true);
                    if (window.logHero) window.logHero(`✅ CAŁY PATROL ZAKOŃCZONY!`, "#4caf50");
                    if (typeof heroAlert === 'function') heroAlert("✅ Trasa Herosa sprawdzona w całości! Patrol zatrzymany."); 
                    return;
                }

                let finalDestinationMap = mapList[nextRouteIndex];
                if (window.logHero) window.logHero(`Zmieniam mapę. Obieram kurs na: [${finalDestinationMap}]`, "#00acc1");
                
                // Używamy niezawodnego silnika Rush do pokonania trasy
                if (typeof window.rushToMap === 'function') {
                    window.rushToMap(finalDestinationMap, null, null, null, true);
                    return;
                }
            }

            // Awaryjny Stop
            checkedMapsThisSession.clear(); saveCheckedMaps(); currentRouteIndex = -1; sessionStorage.removeItem('hero_route_index'); 
            stopPatrol(true);
            if (window.logHero) window.logHero(`✅ Koniec trasy!`, "#4caf50");
            return;
        }

        renderCordsList(patrolIndex);
        let target = currentCordsList[patrolIndex];

        if (window.logHero) window.logHero(`Biegnę pod kord: [${target[0]}, ${target[1]}]`, "#d4af37");
        safeGoTo(target[0], target[1], true);
        stuckCount = 0; clearTimeout(smoothPatrolInterval);

        let pingDelay = Math.floor(Math.random() * (botSettings.stepMax - botSettings.stepMin + 1)) + botSettings.stepMin;
        smoothPatrolInterval = setTimeout(checkSmoothArrival, pingDelay);
    }

   function checkSmoothArrival() {
        if (!isPatrolling || typeof Engine === 'undefined' || !Engine.hero || !Engine.hero.d) return;
        checkVisionRange();

        let cx = Engine.hero.d.x; let cy = Engine.hero.d.y;

        if (checkedPoints.has(patrolIndex)) {
            clearTimeout(smoothPatrolInterval);
            if (window.logHero) window.logHero(`Kord zaliczony z zasięgu wzroku.`, "#8bc34a");
            executePatrolStep();
            return;
        }

        let target = currentCordsList[patrolIndex];
        let dist = Math.abs(cx - target[0]) + Math.abs(cy - target[1]);

        if (dist <= 1) {
            clearTimeout(smoothPatrolInterval);
            checkedPoints.add(patrolIndex);
            if (window.logHero) window.logHero(`Dotarłem do [${target[0]}, ${target[1]}]. Punkt czysty.`, "#8bc34a");

            let waitDelay = Math.floor(Math.random() * (botSettings.waitMax - botSettings.waitMin + 1)) + botSettings.waitMin;
            setTimeout(executePatrolStep, waitDelay);
        } else {
            let isMoving = Engine.hero.d.path && Engine.hero.d.path.length > 0;
            
            if (!isMoving) {
                if (cx === lastX && cy === lastY) {
                    stuckCount++;
                    
                    // Po ~1.5 sekundy stania w miejscu ponawiamy próbę kliknięcia (BEZ LOSOWOŚCI)
                    if (stuckCount === 6) {
                        if (window.logHero) window.logHero(`Ponawiam próbę dojścia do [${target[0]}, ${target[1]}]...`, "#ffb300");
                        safeGoTo(target[0], target[1], false); // false = omija losowe kratki, idzie dokładnie w punkt!
                    }
                    
                    // Dopiero po ~4.5 sekundach (15 tyknięć) uznaje, że fizycznie się nie da wejść
                    if (stuckCount > 15) {
                        clearTimeout(smoothPatrolInterval);
                        checkedPoints.add(patrolIndex);
                        if (window.logHero) window.logHero(`Zaciąłem się! Punkt [${target[0]}, ${target[1]}] jest nieosiągalny. Omijam.`, "#e53935");
                        executePatrolStep();
                        return;
                    }
                } else {
                    stuckCount = 0;
                }
            } else {
                stuckCount = 0;
            }

            let pingDelay = Math.floor(Math.random() * (botSettings.stepMax - botSettings.stepMin + 1)) + botSettings.stepMin;
            smoothPatrolInterval = setTimeout(checkSmoothArrival, pingDelay);
        }
        lastX = cx; lastY = cy;
    }
// ==========================================



    // LOGIKA EXP (Smart-Roam, Auto-Lvl, Aggro & Anty-Lag)



    // ==========================================



 window.isExping = false;

let expMapTransitionCooldown = 0;

let expLastActionTime = 0;

let expCurrentTargetId = null;



let expLastX = -1;

let expLastY = -1;

let expAntiLagTime = 0;



let expAttackLockUntil = 0;

let expGatewayLockUntil = 0;

let expMapEnteredAt = 0;

let expLastMapName = "";

let expEmptyScans = 0;

let expCurrentMapOrderIndex = -1;

let expLastTargetSwitchAt = 0;



window.lastHeroExpLevel = 0;

window.mapClearTimes = window.mapClearTimes || {};







    window.logExp = function(msg, color="#a99a75") {



        let consoleDiv = document.getElementById('expConsole');



        if (!consoleDiv) return;



        let time = new Date().toLocaleTimeString('pl-PL', {hour12: false});



        let entry = document.createElement('div');



        entry.innerHTML = `<span style="color:#555;">[${time}]</span> <span style="color:${color};">${msg}</span>`;



        consoleDiv.appendChild(entry);



        consoleDiv.scrollTop = consoleDiv.scrollHeight;



    };


window.logHero = function(msg, color="#a99a75") {
        let consoleDiv = document.getElementById('heroConsole');
        if (!consoleDiv) return;
        let time = new Date().toLocaleTimeString('pl-PL', {hour12: false});
        let entry = document.createElement('div');
        entry.innerHTML = `<span style="color:#555;">[${time}]</span> <span style="color:${color};">${msg}</span>`;
        consoleDiv.appendChild(entry);
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
    };




    // --- MAGIA: GARGONEM POCKET BERSERK (Czyste nadpisanie pamięci) ---



    window.toggleNativeAggroVisuals = function(state) {



        try {



            if (typeof Engine !== 'undefined' && Engine.settings && Engine.settings.d) {



                // Bezpośrednia modyfikacja pamięci klienta (Omija serwer = brak błędów!)



                Engine.settings.d.fight_auto_solo = state ? 1 : 0;



                Engine.settings.d.fight_auto_level_min = botSettings.exp.minLvl;



                Engine.settings.d.fight_auto_level_max = botSettings.exp.maxLvl;







                // Filtry rzadszych potworów



                Engine.settings.d.fight_auto_elites = (botSettings.exp.aggroE1 !== false) ? 1 : 0;



                Engine.settings.d.fight_auto_elites2 = (botSettings.exp.aggroE2 === true) ? 1 : 0;







                // Wymuszenie odświeżenia ikonek nad głowami mobów ("Główki Gargonema")



                let npcs = Engine.npcs.check ? Engine.npcs.check() : Engine.npcs.d;



                for(let id in npcs) {



                    let npc = npcs[id];



                    if (npc && npc.sprite && typeof npc.sprite.updateAutoFightIndicator === 'function') {



                        npc.sprite.updateAutoFightIndicator();



                    }



                }



            }



            if (state) window.logExp("⚔️ Włączono Smart-Aggro (Zintegrowane z silnikiem).", "#ff9800");



            else window.logExp("🛡️ Wyłączono Smart-Aggro.", "#ff9800");



        } catch(e) {}



    };







    // Zabezpieczenie: Silnik gry potrafi czasem resetować ustawienia, przypominamy mu o nich co 2s



    setInterval(() => {



        let aggroCheckbox = document.getElementById('expAggro');



        if(window.isExping && botSettings.exp.useAggro && aggroCheckbox && aggroCheckbox.checked) {



            window.toggleNativeAggroVisuals(true);



        }



    }, 2000);



function expGetNearbyAttackTile(hero, target) {

    const candidates = [

        { x: target.x - 1, y: target.y },

        { x: target.x + 1, y: target.y },

        { x: target.x, y: target.y - 1 },

        { x: target.x, y: target.y + 1 },

        { x: target.x - 1, y: target.y - 1 },

        { x: target.x + 1, y: target.y - 1 },

        { x: target.x - 1, y: target.y + 1 },

        { x: target.x + 1, y: target.y + 1 }

    ];



    candidates.sort((a, b) => {

        const da = Math.abs(hero.x - a.x) + Math.abs(hero.y - a.y);

        const db = Math.abs(hero.x - b.x) + Math.abs(hero.y - b.y);

        return da - db;

    });



    return candidates[0];

}



function expDetectMobKind(n) {

    const wt = parseInt(n.wt, 10);

    if (wt === 1) return "elite1";

    if (wt >= 2) return "hero_or_better";

    return "normal";

}



function getExpMobsFromDrawableList(hero, minL, maxL) {

    const arr = Engine.npcs.getDrawableList?.() || [];



    return arr

        .map(n => n.d || n)

        .filter(n => {

            if (!n) return false;

            if (typeof n.x !== 'number' || typeof n.y !== 'number') return false;



            const name = (n.nick || n.name || '').replace(/<[^>]*>?/gm, '').trim();

            if (!name) return false;



            const lvl = parseInt(n.lvl, 10);

            if (isNaN(lvl) || lvl <= 0) return false;

            if (lvl < minL || lvl > maxL) return false;



            return true;

        })

        .map(n => ({

            id: n.id,

            nazwa: (n.nick || n.name).replace(/<[^>]*>?/gm, '').replace(/\s*\(\d+m\)$/, '').trim(),

            lvl: parseInt(n.lvl, 10) || 0,

            x: n.x,

            y: n.y,

            dystans: Math.abs(hero.x - n.x) + Math.abs(hero.y - n.y),

            attackDist: Math.max(Math.abs(hero.x - n.x), Math.abs(hero.y - n.y)),

            raw: n

        }))

        .sort((a, b) => {

            if (a.attackDist !== b.attackDist) return a.attackDist - b.attackDist;

            return a.dystans - b.dystans;

        });

}



function getNearestStepToMob(hero, target) {

    const spots = [

        { x: target.x - 1, y: target.y },

        { x: target.x + 1, y: target.y },

        { x: target.x, y: target.y - 1 },

        { x: target.x, y: target.y + 1 },

        { x: target.x - 1, y: target.y - 1 },

        { x: target.x + 1, y: target.y - 1 },

        { x: target.x - 1, y: target.y + 1 },

        { x: target.x + 1, y: target.y + 1 }

    ];



    spots.sort((a, b) => {

        const da = Math.abs(hero.x - a.x) + Math.abs(hero.y - a.y);

        const db = Math.abs(hero.x - b.x) + Math.abs(hero.y - b.y);

        return da - db;

    });



    return spots[0];

}

function getAntiLagDelay() {

    const min = parseInt(botSettings?.expAntiLagMin ?? 1500, 10);

    const max = parseInt(botSettings?.expAntiLagMax ?? 2500, 10);



    const safeMin = Number.isFinite(min) ? min : 1500;

    const safeMax = Number.isFinite(max) ? max : 2500;



    if (safeMax <= safeMin) return safeMin;

    return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;

}

    function getExpNpcList() {

    try {

        const drawable = Engine?.npcs?.getDrawableList?.();

        if (Array.isArray(drawable) && drawable.length > 0) {

            return drawable;

        }

    } catch (e) {}



    try {

        const checked = typeof Engine?.npcs?.check === 'function' ? Engine.npcs.check() : null;

        if (checked && typeof checked === 'object') {

            return Object.keys(checked).map(id => {

                const raw = checked[id];

                const n = raw?.d || raw || {};

                if (n.id == null) n.id = id;

                return n;

            });

        }

    } catch (e) {}



    try {

        const direct = Engine?.npcs?.d;

        if (direct && typeof direct === 'object') {

            return Object.keys(direct).map(id => {

                const raw = direct[id];

                const n = raw?.d || raw || {};

                if (n.id == null) n.id = id;

                return n;

            });

        }

    } catch (e) {}



    return [];

}

    function isMapInSelectedExpowisko(mapName) {

    const maps = botSettings?.exp?.mapOrder || [];

    return Array.isArray(maps) && maps.includes(mapName);

}

function setExpBerserkState(shouldEnable) {

    if (!botSettings?.berserk) return;

    if (!botSettings.berserk.userEnabled) return;



    const shouldBeEnabled = !!shouldEnable;

    const currentEnabled = !!botSettings.berserk.enabled;



    if (currentEnabled === shouldBeEnabled) return;



    botSettings.berserk.enabled = shouldBeEnabled;



    const chk = document.getElementById('berserkEnabled');

    if (chk) chk.checked = shouldBeEnabled;



    saveSettings();



    if (typeof window.updateServerBerserk === 'function') {

        window.updateServerBerserk();

    }

}

    function getClosestExpMapPath(currMap) {

    const maps = botSettings?.exp?.mapOrder || [];

    if (!maps.length) return null;

    if (maps.includes(currMap)) return { path: [currMap], targetMap: currMap };



    let bestPath = null;

    let bestTarget = null;

    let bestLen = Infinity;



    for (const targetMap of maps) {

        const p = getShortestPath(currMap, targetMap);

        if (p && p.length > 0 && p.length < bestLen) {

            bestLen = p.length;

            bestPath = p;

            bestTarget = targetMap;

        }

    }



    if (!bestPath) return null;

    return { path: bestPath, targetMap: bestTarget };

}

// Deklaracje zmiennych pamięci ruchu (globalne dla okna)

window.expLastMoveTx = -1;

window.expLastMoveTy = -1;

window.expMoveLockUntil = 0;

window.expUnreachableMobs = window.expUnreachableMobs || new Set();


  function runExpLogic() {
    if (!window.isExping) return;
    if (typeof Engine === 'undefined' || !Engine.hero || !Engine.hero.d || !Engine.map || Engine.map.isLoading || !Engine.map.d.name) return;

    // --- 0. PRIORYTET: AUTO-SPRZEDAŻ I AUTO-POTY ---
    if ((window.autoSellState && window.autoSellState.active) || (window.autoPotState && window.autoPotState.active)) {
        return; // Bot stoi w miejscu, oddając kontrolę systemom miejskim
    }

    // --- 1. ZABEZPIECZENIE PRZED ZACIĘCIEM W DRZWIACH (MAP COOLDOWN) ---
    if (window.lastExpMap !== Engine.map.d.name) {
        window.lastExpMap = Engine.map.d.name;
        window.mapCooldown = Date.now() + 1500; // 1.5 sekundy przerwy po zmianie mapy
        window.isRushing = false; // Bezwzględny reset stanu biegu
        return; // Dajemy grze odetchnąć i załadować tekstury bez robienia spamu w logach
    }
    if (window.mapCooldown && Date.now() < window.mapCooldown) {
        return; // Trwa blokada, czekamy
    }

    // --- KONTROLA BERSERKA (Musi być sprawdzona PRZED komendą biegu) ---
    const currMap = Engine.map.d.name;
    const isExpMap = isMapInSelectedExpowisko(currMap);
    setExpBerserkState(isExpMap);

    // --- 2. RUCH NA EXPOWISKO ---
    let mapOrder = botSettings.exp.mapOrder || [];
    let targetExpMap = currMap;

    if (mapOrder.length > 0) {
        if (mapOrder.includes(currMap)) {
            targetExpMap = currMap;
        } else {
            let closestObj = typeof getClosestExpMapPath === 'function' ? getClosestExpMapPath(currMap) : null;
            if (closestObj && closestObj.targetMap) {
                targetExpMap = closestObj.targetMap;
            } else {
                targetExpMap = mapOrder[0];
            }
        }
    }

    if (currMap !== targetExpMap) {
        let currentlyRushing = (typeof isRushing !== 'undefined' ? isRushing : false) || window.isRushing;
        if (!currentlyRushing && (!window.mapCooldown || Date.now() > window.mapCooldown)) {
            if (typeof window.rushToMap === 'function') {
                window.rushToMap(targetExpMap);
            }
        }
        return; // Przerywa wykonywanie reszty skryptu podczas biegu (Dlatego przełącznik musi być wyżej!)
    }

    const now = Date.now();
    const hero = Engine.hero.d;
    const hx = hero.x;
    const hy = hero.y;

    if (now < expLastActionTime) return;

  // --- ODCZYT HP I ZABEZPIECZENIA (ŚMIERĆ / AUTO-RESPAWN / AUTO-HEAL) ---
    let hp = hero.hp !== undefined ? parseInt(hero.hp) : (hero.warrior_stats ? parseInt(hero.warrior_stats.hp) : 100);
    let maxhp = hero.maxhp !== undefined ? parseInt(hero.maxhp) : (hero.warrior_stats ? parseInt(hero.warrior_stats.maxhp) : 100);

   // Zmienna z Mutation Observera ma absolutne pierwszeństwo!
   let isDead = isUnconsciousNow() || window.__unconscious;
      
    if (isDead) {
        if (window._lastDeadLog !== Math.floor(now / 5000)) {
            window.logExp("💀 Jesteś nieprzytomny (Wykryto 1 HP). Pauza i powrót do miasta...", "#e53935");
            window._lastDeadLog = Math.floor(now / 5000);
            
            setTimeout(() => {
                if (typeof window._g === 'function') {
                    window._g('deadresp'); 
                } else if (typeof Engine !== 'undefined' && Engine.communication) {
                    Engine.communication.send({ "a": "deadresp" }); 
                }
                
                let reviveBtn = Array.from(document.querySelectorAll('button, .button, .btn, .dialog-button')).find(el => {
                    let txt = (el.innerText || el.textContent || "").toLowerCase();
                    return txt.includes('wróć do miasta') || txt.includes('ożyw') || txt.includes('zmartwychwstań');
                });
                if (reviveBtn) {
                    if (window.jQuery) jQuery(reviveBtn).trigger('click');
                    if (typeof reviveBtn.click === 'function') reviveBtn.click();
                }
            }, 1500);
        }
        
        expCurrentTargetId = null;
        window.expTargetLockTime = 0;
        window.expLastMoveTx = -1; 
        window.expLastMoveTy = -1;
        
        expLastActionTime = now + 2000;
        return;
    }

// --- ZABEZPIECZENIE PO RESPAWNIE ORAZ W TRAKCIE LECZENIA ---
    // Przywracamy blokadę `isRegeneratingToFull`! Bot musi poczekać, aż AutoHeal napompuje go do 100%.
    // Jeśli zacznie iść lub zaatakuje moba w trakcie picia, gra przerwie leczenie!
    if (window.isRegeneratingToFull || (hp / maxhp) * 100 < 40) {
        if (!window._waitingForHeal) {
            window.logExp(`🩸 Szybkie pompowanie mikstur... Czekam na 100% HP.`, "#e53935");
            window._waitingForHeal = true;
        }
        
        // Zatrzymujemy postać w miejscu, żeby przypadkiem nie weszła w moba i nie przerwała leczenia
        if (typeof Engine !== 'undefined' && Engine.hero && typeof Engine.hero.stop === 'function') {
            Engine.hero.stop();
        }
        
        expLastActionTime = now + 500;
        return; 
    } else {
        window._waitingForHeal = false;
    }

    try {
        if (Engine.battle && (Engine.battle.show || Engine.battle.d)) {
            expLastActionTime = now + 500;
            expCurrentTargetId = null;
            expLastTargetSwitchAt = 0;
            expEmptyScans = 0;
            expAttackLockUntil = 0;
            window.expLastMoveTx = -1; window.expLastMoveTy = -1;
            window.expWasInBattle = true; 
            
            let quitBtn = Array.from(document.querySelectorAll('button, .button, div')).find(el => el.innerText && el.innerText.includes('Opuść walkę'));
            if (quitBtn) {
                quitBtn.click();
            } else if (Engine.battle.d && Engine.battle.d.winner !== undefined) {
                if (typeof window._g === 'function') window._g('fight&a=quit');
            }
            return;
        } else if (window.expWasInBattle) {
            window.expWasInBattle = false;
            expLastActionTime = now + 1500;
            return;
        }
    } catch (e) {}

    const wantNormal = document.getElementById('expN')?.checked ?? botSettings.exp.normal;
    const wantElite = document.getElementById('expE')?.checked ?? botSettings.exp.elite;
    const minL = parseInt(document.getElementById('expMinL')?.value || botSettings.exp.minLvl, 10);
    const maxL = parseInt(document.getElementById('expMaxL')?.value || botSettings.exp.maxLvl, 10);
    const displayTarget = document.getElementById('expTargetDisplay');

    const isHeroMoving = !!(hero.path && hero.path.length > 0);

   // --- CZYSZCZENIE PAMIĘCI NA NOWEJ MAPIE ---
    if (expLastMapName !== currMap) {
        window.expLastVisitedMap = expLastMapName;
        expLastMapName = currMap;
        expMapEnteredAt = now;
        expEmptyScans = 0;
        expCurrentTargetId = null;
        expAttackLockUntil = 0;
        window.expLastMoveTx = -1; window.expLastMoveTy = -1;
        expGatewayLockUntil = now + 1200;
        window.expUnreachableMobs.clear();
        
        // KLUCZOWA POPRAWKA: Twarde formatowanie mózgu z potworów po przejściu bramy!
        if (window.expMonsterCache) window.expMonsterCache.clear();

        window.expGatewayStandTime = 0;
        window.expGatewayArrivalTime = 0;
    }

    const isOnGateway = (x, y) => {
        let gws = (Engine.map && Engine.map.gateways) ? Engine.map.gateways : ((Engine.map && Engine.map.d && Engine.map.d.gw) ? Engine.map.d.gw : {});
        for (let id in gws) {
            let gw = gws[id].d || gws[id];
            if (gw && gw.x === x && gw.y === y) return true;
        }
        return false;
    };

    if (hx !== expLastX || hy !== expLastY) {
        expLastX = hx;
        expLastY = hy;
        expAntiLagTime = now + getAntiLagDelay();
        window.expGatewayStandTime = 0;
    } else if (now > expAntiLagTime) {
        if (isOnGateway(hx, hy)) {
            if (!window.expGatewayStandTime) window.expGatewayStandTime = now;
            if (now - window.expGatewayStandTime > 12000) {
                window.logExp(`[Anti-Lag] Zacięcie na bramie. Odbiegam...`, "#ff9800");
                let stepX = Math.max(0, hx + (Math.random() > 0.5 ? 2 : -2));
                let stepY = Math.max(0, hy + (Math.random() > 0.5 ? 2 : -2));
                Engine.hero.autoGoTo({ x: stepX, y: stepY });
                expAntiLagTime = now + 2000; expMapTransitionCooldown = now + 2000; expLastActionTime = now + 500;
                expCurrentTargetId = null; window.expLastMoveTx = -1; window.expLastMoveTy = -1;
                window.expGatewayStandTime = 0;
            }
            return;
        }
        expAntiLagTime = now + getAntiLagDelay();
    }

    // --- SKANOWANIE POTWORÓW (KOSIARKA V14 - Z GRUPAMI) ---
    if (!window.expMonsterCache) window.expMonsterCache = new Map();

    let npcsData = typeof Engine.npcs.check === 'function' ? Engine.npcs.check() : Engine.npcs.d;
    let currentVisibleNpcs = [];
    for (let key in npcsData) {
        let npcObj = npcsData[key];
        let n = npcObj?.d || npcObj;
        if (n) {
            n.id = n.id || key; 
            currentVisibleNpcs.push(n);
        }
    }

    const bE2 = document.getElementById('berserkE2')?.checked || (botSettings.berserk && botSettings.berserk.e2);
    const bHero = document.getElementById('berserkHero')?.checked || (botSettings.berserk && botSettings.berserk.hero);

    currentVisibleNpcs.forEach(n => {
        if (n.type === 4 || n.type < 2) return;
        if (n.dead || n.del || n.delete) {
            window.expMonsterCache.delete(n.id);
        } else {
            window.expMonsterCache.set(n.id, {
                id: n.id, x: n.x, y: n.y, wt: n.wt, type: n.type, grp: n.grp, lvl: n.lvl,
                nick: n.nick || n.name || "Potwór"
            });
        }
    });

    window.expMonsterCache.forEach((cachedMob, id) => {
        let distToCached = Math.abs(hx - cachedMob.x) + Math.abs(hy - cachedMob.y);
        if (distToCached <= 14) {
            let isCurrentlyVisible = currentVisibleNpcs.some(v => v.id == id && !v.dead && !v.del);
            if (!isCurrentlyVisible) {
                window.expMonsterCache.delete(id);
                if (expCurrentTargetId === id) expCurrentTargetId = null;
            }
        }
    });

    const arr = Array.from(window.expMonsterCache.values());

    let dangerousSpots = [];
    arr.forEach(n => {
        let wt = parseInt(n.wt, 10);
        let ranga = "normal";
        if (n.type === 2) {
            if (wt === 11 || wt === 1) ranga = "elite1";
            else if (wt === 12 || wt === 2) ranga = "elite2";
            else if (wt >= 13 || wt >= 3) ranga = "hero";
        }
        if ((ranga === "elite2" && !bE2) || (ranga === "hero" && !bHero)) {
            dangerousSpots.push({x: n.x, y: n.y});
        }
    });

    let validMobs = [];
    arr.forEach(n => {
        let coordKey = n.x + "_" + n.y;
        if (window.expUnreachableMobs.has(coordKey)) return; 

        let lvl = parseInt(n.lvl, 10);
        if (isNaN(lvl) || lvl <= 0 || lvl < minL || lvl > maxL) return;

        let wt = parseInt(n.wt, 10);
        let ranga = "normal";
        if (n.type === 2) {
            if (wt === 11 || wt === 1) ranga = "elite1";
            else if (wt === 12 || wt === 2) ranga = "elite2";
            else if (wt >= 13 || wt >= 3) ranga = "hero";
        }

        if (ranga === "normal" && !wantNormal) return;
        if (ranga === "elite1" && !wantElite) return;
        if (ranga === "elite2" && !bE2) return;
        if (ranga === "hero" && !bHero) return;

        let isSafeToAttack = true;
        for (let spot of dangerousSpots) {
            if (Math.abs(n.x - spot.x) <= 2 && Math.abs(n.y - spot.y) <= 2) {
                isSafeToAttack = false; break;
            }
        }
        if (!isSafeToAttack) return;

        let dist = Math.abs(hx - n.x) + Math.abs(hy - n.y);
        validMobs.push({
            id: n.id, x: n.x, y: n.y, wt: wt, type: n.type, ranga: ranga, grp: n.grp,
            nick: n.nick.replace(/<[^>]*>?/gm, '').trim(),
            dist: dist,
            isLocked: false
        });
    });

   // --- DODANIE ETYKIET GRUP DO LOGÓW ORAZ FILTR DYSTANSU ---
    let groupsCount = {};
    validMobs.forEach(m => {
        let key = m.grp ? `grp_${m.grp}` : `solo_${m.id}`;
        groupsCount[key] = (groupsCount[key] || 0) + 1;
    });
    
    validMobs.forEach(m => {
        let key = m.grp ? `grp_${m.grp}` : `solo_${m.id}`;
        let size = groupsCount[key];
        m.groupSize = size;
        m.groupLabel = size > 1 ? `Grupa (${size}x) ${m.nick}` : `Solo ${m.nick}`;
    });

    // ODRZUCANIE DALEKICH PŁOTEK: Jeśli zwykły potwór jest sam i dalej niż 50 kratek -> omijamy go.
    // Dzięki temu validMobs będzie puste i bot od razu poleci na kolejną mapę!
    validMobs = validMobs.filter(m => !(m.groupSize === 1 && m.dist > 50 && m.ranga === "normal"));

    // 6. UTRZYMANIE CELU (ELASTYCZNY LOCK 3-5s - V16)
    let lockedMob = null;
    validMobs.forEach(m => {
        // Zmienna expTargetLockTime trzyma w pamięci czas, kiedy lock wygaśnie
        if (m.id === expCurrentTargetId && now < (window.expTargetLockTime || 0)) {
            m.isLocked = true;
            lockedMob = m;
        }
    });

// 7. STABILNE SORTOWANIE (Kto bliżej, ten ginie - bez priorytetu dla Elit)
    validMobs.sort((a, b) => {
        // Bezwzględny priorytet utrzymania celu (Lock na 3-5 sekund)
        if (a.isLocked && !b.isLocked) return -1;
        if (b.isLocked && !a.isLocked) return 1;

        // Główna zasada: Bije to, co jest najbliżej (niezależnie czy to Elita, czy zwykły mob)
        if (a.dist !== b.dist) return a.dist - b.dist;
        
        // Zabezpieczenie przed kręceniem się w miejscu
        return String(a.id).localeCompare(String(b.id));
    });

    let target = validMobs.length > 0 ? validMobs[0] : null;

    // --- LOGIKA CELU I KONTROLA ZATRZYMANIA ---
    if (target) {
        const targetDist = target.dist;

        if (expEmptyScans > 0) {
            window.logExp(`✨ Zauważono potwory! Wracam do pracy.`, "#8bc34a");
            expEmptyScans = 0; expLastActionTime = now + 1000; return;
        }

        if (targetDist > 1) {
            expAttackLockUntil = 0;
            let isNewDestination = (window.expLastMoveTx !== target.x || window.expLastMoveTy !== target.y);

            if (isNewDestination) {
                if (now < nextAllowedClickTime) return;

                if (expCurrentTargetId !== target.id) {
                    window.logExp(`🏃 Cel: ${target.groupLabel} (Dystans: ${targetDist})`, "#00e5ff");
                    expCurrentTargetId = target.id;
                    
                    // LOSOWY LOCK: Trzyma cel od 3 do 5 sekund. 
                    // Po tym czasie bot "przejrzy na oczy" i jeśli inny mob będzie bliżej, zmieni trasę.
                    let randomLockSeconds = Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000;
                    window.expTargetLockTime = now + randomLockSeconds; 
                }

                if (displayTarget) displayTarget.innerText = `Biegnę do: ${target.groupLabel}`;
                
                Engine.hero.autoGoTo({ x: target.x, y: target.y });
                nextAllowedClickTime = now + 350; 

                window.expLastMoveTx = target.x; window.expLastMoveTy = target.y;
                window.expPursuitLastX = hx; window.expPursuitLastY = hy;
                window.expTargetPursuitStart = now;
                window.expMoveLockUntil = now + 800; 
            } else {
                if (now > window.expMoveLockUntil) {
                    if (hx !== window.expPursuitLastX || hy !== window.expPursuitLastY) {
                        window.expPursuitLastX = hx;
                        window.expPursuitLastY = hy;
                        window.expTargetPursuitStart = now;
                    }

                    let timeStandingStill = now - window.expTargetPursuitStart;

                    // Ominięcie zablokowanego moba (Gdy zablokujemy się w drodze - przerywamy locka od razu)
                    if (timeStandingStill > 3000) {
                        window.logExp(`🚨 Zablokowałem się w drodze do: ${target.nick}. Szukam innej ofiary.`, "#ff5252");
                        let badCoordKey = target.x + "_" + target.y;
                        window.expUnreachableMobs.add(badCoordKey);
                        expCurrentTargetId = null;
                        window.expTargetLockTime = 0; // Reset locka po zacięciu
                        window.expLastMoveTx = -1; window.expLastMoveTy = -1;
                        if(typeof Engine.hero.stop === 'function') Engine.hero.stop();
                        
                        let rx = Math.max(0, hx + (Math.random() > 0.5 ? 1 : -1));
                        let ry = Math.max(0, hy + (Math.random() > 0.5 ? 1 : -1));
                        Engine.hero.autoGoTo({ x: rx, y: ry });
                        
                        expLastActionTime = now + 1000;
                        return;
                    }

                    if (timeStandingStill > 1000 && (now % 1000 < 150)) {
                        if (now >= nextAllowedClickTime) {
                            Engine.hero.autoGoTo({ x: target.x, y: target.y });
                            nextAllowedClickTime = now + 350;
                        }
                    }
                }
            }
            expLastActionTime = now + 100;
            return;
        }

        // --- WALKA ---
        if (targetDist <= 1) {
            if (displayTarget) displayTarget.innerText = `Walka: ${target.groupLabel}`;
            window.expLastMoveTx = -1; window.expLastMoveTy = -1; window.expMoveLockUntil = 0;
            if (isHeroMoving && typeof Engine.hero.stop === 'function') Engine.hero.stop();

            if (expAttackLockUntil === 0) {
                expAttackLockUntil = now + ((botSettings.berserk && botSettings.berserk.enabled) ? 2500 : 0);
            } else if (now > expAttackLockUntil) {
                let stepX = Math.max(0, hx + (Math.random() > 0.5 ? 1 : -1));
                let stepY = Math.max(0, hy + (Math.random() > 0.5 ? 1 : -1));
                Engine.hero.autoGoTo({ x: stepX, y: stepY });
                expAttackLockUntil = now + 2500; expLastActionTime = now + 800;
                return;
            }
            expLastActionTime = now + 100;
        }
        return;
    }
// --- ZAAWANSOWANY SMART ROAM: PĘTLE BRAM I TUNELI ---
    if (now - expMapEnteredAt < 1200) { expLastActionTime = now + 120; return; }

    expEmptyScans++;
    if (displayTarget) displayTarget.innerText = `Czysto. Skanowanie... (${expEmptyScans}/6)`;
    if (expEmptyScans < 6) { expLastActionTime = now + 180; return; }
    if (now < expMapTransitionCooldown) return;

    let mapsPool = botSettings.exp.mapOrder || [];
    if (!mapsPool.length) {
        expEmptyScans = 0;
        expLastActionTime = now + 1500;
        return;
    }

    window.mapClearTimes[currMap] = now;
    let uncheckedMaps = mapsPool.filter(m => !window.mapClearTimes[m] && m !== currMap);

    if (uncheckedMaps.length === 0) {
        if (Engine.map.d.pvp === 2 && mapsPool.length > 1) {
            window.logExp("🔴 Czerwona mapa! Przechodzę na kolejną, aby bezpiecznie przeczekać na resp.", "#ff5252");
            let nextIdx = (mapsPool.indexOf(currMap) + 1) % mapsPool.length;
            let safeMap = mapsPool[nextIdx];
            if (safeMap) {
                delete window.mapClearTimes[safeMap];
                expMapTransitionCooldown = now + 500;
                return;
            }
        }
        window.logExp("⏳ Wszystkie mapy w pętli wyczyszczone. Czekam 45s na resp...", "#ffb300");
        expMapTransitionCooldown = now + 45000;
        window.mapClearTimes = {};
        return;
    }

    let gateways = globalGateways[currMap] || {};
    let nextStepMap = null;
    let targetGateway = null;
    let bestGraphPathLen = Infinity;
    let bestDistToDoor = Infinity;

    let directGateways = [];
    for (let targetMap in gateways) {
        if (uncheckedMaps.includes(targetMap)) {
            directGateways.push({ map: targetMap, gw: gateways[targetMap], dist: Math.abs(gateways[targetMap].x - hx) + Math.abs(gateways[targetMap].y - hy) });
        }
    }

    if (directGateways.length > 0) {
        directGateways.sort((a, b) => a.dist - b.dist);
        nextStepMap = directGateways[0].map;
        targetGateway = directGateways[0].gw;
    } else {
        for (let targetMap in gateways) {
            let gw = gateways[targetMap];
            for (let unvisitedMap of uncheckedMaps) {
                let path = getShortestPath(targetMap, unvisitedMap);
                if (path) {
                    let dist = Math.abs(gw.x - hx) + Math.abs(gw.y - hy);
                    if (path.length < bestGraphPathLen) {
                        bestGraphPathLen = path.length;
                        bestDistToDoor = dist;
                        nextStepMap = targetMap;
                        targetGateway = gw;
                    } else if (path.length === bestGraphPathLen && dist < bestDistToDoor) {
                        bestDistToDoor = dist;
                        nextStepMap = targetMap;
                        targetGateway = gw;
                    }
                }
            }
        }
    }

    if (!nextStepMap) {
        window.logExp(`Brak dojścia do jakiejkolwiek bramy na ścieżce.`, "#e53935");
        expMapTransitionCooldown = now + 4000;
        return;
    }

    if (targetGateway) {
        let dx = targetGateway.x; let dy = targetGateway.y;
        let distToDoor = Math.max(Math.abs(dx - hx), Math.abs(dy - hy));

        let tp = ZAKONNICY[currMap];
        let isFakeDoor = tp && Math.abs(dx - tp.x) <= 2 && Math.abs(dy - tp.y) <= 2;
        let isTeleport = tp && (botSettings.unlockedTeleports[nextStepMap] || isFakeDoor);

        if (isTeleport) {
            if (displayTarget) displayTarget.innerText = `Teleport do: ${nextStepMap}`;
            if (!isHeroMoving || now >= expGatewayLockUntil) {
                window.logExp(`🚀 Teleportuję do: ${nextStepMap}`, "#00acc1");
                expGatewayLockUntil = now + 4000; expMapTransitionCooldown = now + 4000; expLastActionTime = now + 500;
                if (typeof window.handleTeleportNPC === 'function') window.handleTeleportNPC(nextStepMap);
            }
            return;
        }

        if (distToDoor > 0) {
            if (displayTarget) displayTarget.innerText = `Przejście do: ${nextStepMap}`;
            let isNewDoorDest = (window.expLastMoveTx !== dx || window.expLastMoveTy !== dy);
            
            if (isNewDoorDest) {
                window.logExp(`🚪 Idę do: ${nextStepMap}`, "#ba68c8");
                Engine.hero.autoGoTo({ x: dx, y: dy });
                window.expLastMoveTx = dx; window.expLastMoveTy = dy;
                window.expPursuitLastX = hx; window.expPursuitLastY = hy;
                window.expTargetPursuitStart = now;
                window.expMoveLockUntil = now + 1000;
            } else if (now > window.expMoveLockUntil) {
                if (hx !== window.expPursuitLastX || hy !== window.expPursuitLastY) {
                    window.expPursuitLastX = hx; window.expPursuitLastY = hy;
                    window.expTargetPursuitStart = now;
                }
                let timeStandingStill = now - window.expTargetPursuitStart;

                if (timeStandingStill > 2500) {
                    window.logExp(`🚨 Brama na [${dx}, ${dy}] (do ${nextStepMap}) jest zablokowana! Pomijam tę mapę.`, "#ff5252");
                    window.mapClearTimes[nextStepMap] = now;
                    expMapTransitionCooldown = now + 500; 
                    window.expLastMoveTx = -1; window.expLastMoveTy = -1;
                    return;
                }
                if (timeStandingStill > 1500 && (now % 1500 < 150)) Engine.hero.autoGoTo({ x: dx, y: dy });
            }
            expLastActionTime = now + 100;
            return;
        }

        // --- FIZYCZNE WEJŚCIE W BRAMĘ (STOIMY NA BRAMIE) ---
        if (now > expGatewayLockUntil) {
            if (!window.expGatewayArrivalTime) window.expGatewayArrivalTime = Date.now();

            // Czekamy 12 sekund na przejście
            if (Date.now() - window.expGatewayArrivalTime > 12000) {
                if (window.logHero) window.logHero("❌ Brama zamknięta lub uszkodzona! Blokuję wejście na 5 minut i idę dalej...", "#ff5252");
                if (window.logExp) window.logExp("❌ Brama zablokowana! Zmieniam plany...", "#ff5252");
                
                if (!window.__bannedMaps) window.__bannedMaps = {};
                window.__bannedMaps[nextStepMap] = Date.now() + 300000; 

                if (typeof window.nextExpMapIndex !== 'undefined') window.nextExpMapIndex++;
                if (typeof window.currentPatrolIndex !== 'undefined') window.currentPatrolIndex++;

                window.__movementLock = Date.now() + 2000; 
                window.lastMapChange = Date.now(); 
                window.lastGatewayAttempt = Date.now();
                window.currentPath = null; 
                window.mapClearTimes[nextStepMap] = now; // Pomijamy na teraz

                let hx = parseInt(Engine.hero.d.x);
                let hy = parseInt(Engine.hero.d.y);
                let dirs = [[0,1], [0,-1], [1,0], [-1,0], [1,1], [-1,-1]];
                for (let d of dirs) {
                    let nx = hx + d[0], ny = hy + d[1];
                    if (typeof Engine.map.checkCollision === 'function' && !Engine.map.checkCollision(nx, ny)) {
                        if (window.originalAutoWalk) window.originalAutoWalk.call(Engine.hero, nx, ny);
                        else if (typeof Engine.hero.autoWalk === 'function') Engine.hero.autoWalk(nx, ny);
                        else window._g(`walk=${nx},${ny}`);
                        break;
                    }
                }
                window.expGatewayArrivalTime = 0;
            }
        }
    }
} // KRYTYCZNE ZAMKNIĘCIE FUNKCJI (To tutaj gra pękała!)

setInterval(runExpLogic, 150);
    // --- BAZA DANYCH PROFILI EXPOWISK ---

    window.saveCurrentExpProfile = function() {

        let name = document.getElementById('inpProfileName').value.trim();

        let desc = document.getElementById('inpProfileDesc').value.trim();

        if(!name) return heroAlert("Podaj nazwę dla tego expowiska!");

        if(botSettings.exp.mapOrder.length === 0) return heroAlert("Twoja obecna trasa EXP jest pusta.");



        botSettings.expProfiles.push({ name: name, desc: desc, maps: [...botSettings.exp.mapOrder] });

        localStorage.setItem('exp_profiles_v64_4', JSON.stringify(botSettings.expProfiles));



        document.getElementById('inpProfileName').value = "";

        document.getElementById('inpProfileDesc').value = "";

        if(typeof window.renderExpProfiles === 'function') window.renderExpProfiles();

        heroAlert("✅ Expowisko zapisane pomyślnie w bazie!");

    };



    window.loadExpProfile = function(index) {

        let p = botSettings.expProfiles[index];

        if(p) {

            botSettings.exp.mapOrder = [...p.maps];

            localStorage.setItem('exp_map_order_v64', JSON.stringify(botSettings.exp.mapOrder));



            // Auto-wyliczanie min i max levela (+15 / -15)

            let lvlMatch = p.name.match(/\((\d+)\s*lvl\)/i);

            if(lvlMatch && lvlMatch[1]) {

                let baseLvl = parseInt(lvlMatch[1]);
                botSettings.exp.minLvl = Math.max(1, baseLvl - 5);
                botSettings.exp.maxLvl = baseLvl + 15;



                let minInput = document.getElementById('expMinL');

                let maxInput = document.getElementById('expMaxL');

                if (minInput) minInput.value = botSettings.exp.minLvl;

                if (maxInput) maxInput.value = botSettings.exp.maxLvl;

            }



            window.mapClearTimes = {};
            expCurrentTargetId = null;
            expMapTransitionCooldown = 0;
            expLastActionTime = 0;
            expAntiLagTime = 0;
            saveSettings();
 expNoMobScans = 0;
            expLastTargetMap = "";
            expLastTargetPos = null;

            if(typeof window.renderExpMaps === 'function') window.renderExpMaps();

            heroAlert(`✅ Załadowano i NADPISANO trasę: ${p.name}\nAutomatycznie ustawiono poziom potworów na: ${botSettings.exp.minLvl} - ${botSettings.exp.maxLvl}.`);

        }

    };



    // NOWOŚĆ: Funkcja do łączenia expowisk ze sobą!

    window.appendExpProfile = function(index) {

        let p = botSettings.expProfiles[index];

        if(p) {

            // Dodawanie map bez duplikatów

            p.maps.forEach(m => {

                if (!botSettings.exp.mapOrder.includes(m)) {

                    botSettings.exp.mapOrder.push(m);

                }

            });

            localStorage.setItem('exp_map_order_v64', JSON.stringify(botSettings.exp.mapOrder));



            // Rozszerzanie zakresu poziomów

            let lvlMatch = p.name.match(/\((\d+)\s*lvl\)/i);

            if(lvlMatch && lvlMatch[1]) {

                let baseLvl = parseInt(lvlMatch[1]);

                let newMin = Math.max(1, baseLvl - 15);

                let newMax = baseLvl + 15;



                botSettings.exp.minLvl = Math.min(botSettings.exp.minLvl, newMin);

                botSettings.exp.maxLvl = Math.max(botSettings.exp.maxLvl, newMax);



                let minInput = document.getElementById('expMinL');

                let maxInput = document.getElementById('expMaxL');

                if (minInput) minInput.value = botSettings.exp.minLvl;

                if (maxInput) maxInput.value = botSettings.exp.maxLvl;

            }



            saveSettings();
            expCurrentTargetId = null;
            expMapTransitionCooldown = 0;
            expLastActionTime = 0;
            expAntiLagTime = 0;
            window.mapClearTimes = {};
            expCurrentTargetId = null;
            expMapTransitionCooldown = 0;
            expLastActionTime = 0;
            expAntiLagTime = 0;
            expNoMobScans = 0;
            expLastTargetMap = "";
            expLastTargetPos = null;
            if(typeof window.renderExpMaps === 'function') window.renderExpMaps();

            heroAlert(`➕ DOŁĄCZONO do obecnej trasy: ${p.name}\nZakres potworów został poszerzony i wynosi teraz: ${botSettings.exp.minLvl} - ${botSettings.exp.maxLvl}.`);

        }

    };



    window.deleteExpProfile = function(index) {

        heroConfirm("Czy na pewno chcesz usunąć to zapisane expowisko?", (res) => {

            if(res) {

                botSettings.expProfiles.splice(index, 1);

                localStorage.setItem('exp_profiles_v64_4', JSON.stringify(botSettings.expProfiles));

                if(typeof window.renderExpProfiles === 'function') window.renderExpProfiles();

            }

        });

    };



    window.renderExpProfiles = function() {

        let c = document.getElementById('expProfilesList'); if(!c) return;



        // Żelazne zabezpieczenie przed pustą bazą (wymusza załadowanie 109 expowisk)

        if (!botSettings.expProfiles || botSettings.expProfiles.length === 0) {

            if (window.defaultExpProfiles && window.defaultExpProfiles.length > 0) {

                botSettings.expProfiles = [...window.defaultExpProfiles];

                localStorage.setItem('exp_profiles_v64_4', JSON.stringify(botSettings.expProfiles));

            }

        }



        c.innerHTML = '';

        if (botSettings.expProfiles.length === 0) {

             c.innerHTML = '<div style="padding:10px; text-align:center; color:#777; font-size:10px;">Brak zapisanych tras. Odśwież stronę (F5).</div>';

             return;

        }



        botSettings.expProfiles.forEach((p, i) => {

            let wrap = document.createElement('div');

            wrap.style.marginBottom = "4px";



            let header = document.createElement('div');

            header.style.cssText = "background: #1a1a1a; border: 1px solid #333; padding: 4px 5px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;";

            header.innerHTML = `

                <div style="display:flex; flex-direction:column; line-height:1.2;">

                    <span style="color: #d4af37; font-weight: bold; font-size: 11px;">${p.name}</span>

                </div>

                <span style="font-size:10px; color:#a99a75;">▼</span>

            `;



            let content = document.createElement('div');

            content.style.display = "none";

            content.style.padding = "4px";

            content.style.borderLeft = "1px solid #333";

            content.style.background = "#141414";



            let mapsHtml = p.maps.join(' <span style="color:#777;">➝</span> ');



            content.innerHTML = `

                ${p.desc ? `<div style="font-size:9px; color:#aaa; margin-bottom:4px;">Opis: ${p.desc}</div>` : ''}

                <div style="font-size:9px; color:#888; margin-bottom:6px; line-height:1.3; word-wrap:break-word; white-space:normal;">

                    Mapy: <span style="color:#a99a75">${mapsHtml}</span>

                </div>

                <div style="display:flex; gap:4px; flex-wrap: wrap;">

                    <button class="btn-sepia" style="padding:4px 4px; background:#00838f; flex:1;" onclick="loadExpProfile(${i})" title="Całkowicie podmienia listę na to expowisko">📥 NADPISZ</button>

                    <button class="btn-sepia" style="padding:4px 4px; background:#4caf50; flex:1;" onclick="appendExpProfile(${i})" title="Dopisuje mapy tego expowiska do już wczytanych">➕ DOŁĄCZ</button>

                    <button class="btn-sepia" style="padding:4px 4px; background:#e53935; width:25px;" onclick="deleteExpProfile(${i})">✖</button>

                </div>

            `;



            header.onclick = () => {

                let isHidden = content.style.display === "none";



                // Zwiń inne

                document.querySelectorAll('#expProfilesList > div > div:nth-child(2)').forEach(el => el.style.display = 'none');

                document.querySelectorAll('#expProfilesList > div > div:nth-child(1)').forEach(el => { el.style.background = '#1a1a1a'; el.style.borderColor = '#333'; });



                if (isHidden) {

                    content.style.display = "block";

                    header.style.background = "rgba(212, 175, 55, 0.1)";

                    header.style.borderColor = "#d4af37";

                }

            };



            wrap.appendChild(header);

            wrap.appendChild(content);

            c.appendChild(wrap);

        });

    };

    // --- FUNKCJE LISTY MAP EXP ---

    window.addCurrentMapToExp = () => {

        let m = Engine.map.d.name;

        if (!botSettings.exp.mapOrder.includes(m)) {

            botSettings.exp.mapOrder.push(m);

            localStorage.setItem('exp_map_order_v64', JSON.stringify(botSettings.exp.mapOrder));

            if(typeof window.renderExpMaps === 'function') window.renderExpMaps();

        }

    };



    window.addNeighborsToExp = () => {

        let currMap = Engine.map.d.name; let added = 0;

        if (!botSettings.exp.mapOrder.includes(currMap)) { botSettings.exp.mapOrder.push(currMap); added++; }

        if (globalGateways[currMap]) {

            for (let targetMap in globalGateways[currMap]) {

                if (!botSettings.exp.mapOrder.includes(targetMap)) { botSettings.exp.mapOrder.push(targetMap); added++; }

            }

        }

        let gws = (Engine.map && Engine.map.gateways) ? Engine.map.gateways : ((Engine.map && Engine.map.d && Engine.map.d.gw) ? Engine.map.d.gw : {});

        for (let id in gws) {

            let gw = gws[id].d || gws[id]; let tName = gw.name || gw.targetName || "";

            if (tName && typeof tName === 'string') {

                let cleanName = tName.split(" .")[0].trim();

                if (cleanName && cleanName !== currMap && !botSettings.exp.mapOrder.includes(cleanName)) {

                    botSettings.exp.mapOrder.push(cleanName);

                    if (gw.x !== undefined && gw.y !== undefined && typeof window.saveGatewayToDB === 'function') window.saveGatewayToDB(currMap, cleanName, gw.x, gw.y);

                    added++;

                }

            }

        }

        if (added > 0) { localStorage.setItem('exp_map_order_v64', JSON.stringify(botSettings.exp.mapOrder)); if (typeof window.renderExpMaps === 'function') window.renderExpMaps(); window.logExp(`Dodano ${added} map!`, "#4caf50"); }

    };



    window.removeExpMap = (index) => {

        heroConfirm(`Usunąć mapę ze ścieżki expowiska?`, (res) => {

            if (res) { botSettings.exp.mapOrder.splice(index, 1); localStorage.setItem('exp_map_order_v64', JSON.stringify(botSettings.exp.mapOrder)); window.renderExpMaps(); }

        });

    };


window.clearExpMaps = () => {
        botSettings.exp.mapOrder = [];
        localStorage.setItem('exp_map_order_v64', '[]');
        if(typeof window.renderExpMaps === 'function') window.renderExpMaps();
    };

    window.renderMapOrderList = () => {
        let c = document.getElementById('heroMapListContainer');
        if (!c) return;

        let hero = document.getElementById('selHero').value;
        if (!hero || !heroMapOrder[hero] || heroMapOrder[hero].length === 0) {
            c.innerHTML = '<div style="padding:5px;text-align:center;color:#777;">Wybierz herosa, by zobaczyć trasę</div>';
            return;
        }

        let currentMap = lastMapName;
        c.innerHTML = heroMapOrder[hero].map((mapName, index) => {
            let safeMapName = mapName.replace(/'/g, "\\'");

            if (editingGatewayFor === mapName) {
                let defaultX = "", defaultY = "";
                let refDoor = globalGateways[currentMap] && globalGateways[currentMap][mapName];
                if (refDoor) { defaultX = refDoor.x; defaultY = refDoor.y; }
                return `<div class="list-item active-route" style="flex-direction:column; align-items:stretch;"><div style="display:flex; flex-direction:column; gap:4px; padding:2px;"><span style="color:#d4af37; font-weight:bold; font-size:11px;">🚪 Bramo-Zapis: ${mapName}</span><div style="display:flex; justify-content:space-between; align-items:center; gap:4px;"><label style="color:#a99a75; font-size:10px; margin:0;">X: <input type="number" id="gw_edit_x" value="${defaultX}" style="width:35px; padding:2px; font-size:10px; text-align:center;"></label><label style="color:#a99a75; font-size:10px; margin:0;">Y: <input type="number" id="gw_edit_y" value="${defaultY}" style="width:35px; padding:2px; font-size:10px; text-align:center;"></label><button class="btn-sepia" style="flex-grow:1;" onclick="document.getElementById('gw_edit_x').value = Engine.hero.d.x; document.getElementById('gw_edit_y').value = Engine.hero.d.y;" title="Pobiera koordynaty z obecnej postaci">📍 Stąd</button></div><div style="display:flex; gap: 4px; margin-top: 4px;"><button class="btn-sepia btn-go-sepia" style="flex-grow:1;" onclick="window.saveInlineGateway('${safeMapName}')">ZAPISZ</button><button class="btn-sepia" style="background:#8e0000; width:30px;" onclick="window.cancelInlineGateway()">✖</button></div></div></div>`;
            } else {
                let isPathPossible = false;
                for(let fromMap in globalGateways) { if(globalGateways[fromMap][mapName]) isPathPossible = true; }
                let gatewayIndicator = isPathPossible ? "<span style='color:#4caf50;' title='Zapisano przejście w bazie'>[🚪✔]</span>" : "<span style='color:#777;' title='Brak powiązań do tej mapy!'>[➕🚪]</span>";

                let activeClass = (currentRouteIndex === index) ? "active-route" : "";
                let checkClass = checkedMapsThisSession.has(mapName) ? "checked" : "";
                let nameColor = (currentRouteIndex === index) ? "#00acc1" : "#d4af37";

                return `<div class="list-item ${activeClass} ${checkClass}"><div class="map-name-wrap"><span class="btn-del-map" onclick="window.removeMapFromOrder(${index})">✖</span><span class="map-name" style="color:${nameColor}; font-weight:bold;" onclick="window.setManualRouteIndex(${index}, '${safeMapName}')">${index + 1}. ${gatewayIndicator} ${mapName}</span></div><div class="buttons-wrapper"><input type="number" class="order-input" value="${index + 1}" onchange="window.changeMapOrder(${index}, this.value)" title="Zmień pozycję na liście (1-10)"><button class="icon-btn" onclick="window.openInlineEditor('${safeMapName}')" title="Edytuj kordy przejścia">🚪</button></div></div>`;
            }
        }).join('');
    };

   window.renderExpMaps = () => {
        let c = document.getElementById('expMapList'); if (!c) return;
        let currentMap = lastMapName;

        c.innerHTML = botSettings.exp.mapOrder.map((mapName, index) => {
            let safeMapName = mapName.replace(/'/g, "\\'");

            if (editingGatewayFor === mapName) {
                let defaultX = "", defaultY = ""; let refDoor = globalGateways[currentMap] && globalGateways[currentMap][mapName];
                if (refDoor) { defaultX = refDoor.x; defaultY = refDoor.y; }
                return `<div class="list-item active-route" style="flex-direction:column; align-items:stretch;"><div style="display:flex; flex-direction:column; gap:4px; padding:2px;"><span style="color:#d4af37; font-weight:bold; font-size:11px;">🚪 Bramo-Zapis: ${mapName}</span><div style="display:flex; justify-content:space-between; align-items:center; gap:4px;"><label style="color:#a99a75; font-size:10px; margin:0;">X: <input type="number" id="gw_edit_x" value="${defaultX}" style="width:35px; padding:2px; font-size:10px; text-align:center;"></label><label style="color:#a99a75; font-size:10px; margin:0;">Y: <input type="number" id="gw_edit_y" value="${defaultY}" style="width:35px; padding:2px; font-size:10px; text-align:center;"></label><button class="btn-sepia" style="flex-grow:1;" onclick="document.getElementById('gw_edit_x').value = Engine.hero.d.x; document.getElementById('gw_edit_y').value = Engine.hero.d.y;" title="Pobiera koordynaty z obecnej postaci">📍 Stąd</button></div><div style="display:flex; gap: 4px; margin-top: 4px;"><button class="btn-sepia btn-go-sepia" style="flex-grow:1;" onclick="window.saveInlineGateway('${safeMapName}')">ZAPISZ</button><button class="btn-sepia" style="background:#8e0000; width:30px;" onclick="window.cancelInlineGateway()">✖</button></div></div></div>`;
            } else {
                // Czyściutka lista, BEZ NUMERACJI
                return `<div class="list-item"><div class="map-name-wrap"><span class="btn-del-map" onclick="window.removeExpMap(${index})">✖</span><span class="map-name" style="color:#81c784; font-weight:bold;">${mapName}</span></div><div class="buttons-wrapper"><button class="icon-btn" onclick="window.openInlineEditor('${safeMapName}')" title="Ręczna edycja kordów (opcjonalne)">🚪</button></div></div>`;
            }
        }).join('');
    };

window.toggleTeleportLock = function(city, isChecked) {
        if (!botSettings.unlockedTeleports) botSettings.unlockedTeleports = {};
        botSettings.unlockedTeleports[city] = isChecked;

        // Zapisujemy przypisując do nicku
        if (typeof Engine !== 'undefined' && Engine.hero && Engine.hero.d && Engine.hero.d.nick) {
            let nick = Engine.hero.d.nick;
            let allTps = JSON.parse(localStorage.getItem('hero_teleports_by_nick_v64') || '{}');
            allTps[nick] = botSettings.unlockedTeleports;
            localStorage.setItem('hero_teleports_by_nick_v64', JSON.stringify(allTps));
        }

        if (typeof window.renderTeleportOptions === 'function') window.renderTeleportOptions();
    };

    window.renderTeleportOptions = function() {
        let container = document.getElementById('tpCheckboxes');
        if (!container) return;
        container.innerHTML = '';
        for (let city in botSettings.unlockedTeleports) {
            let checked = botSettings.unlockedTeleports[city] ? 'checked' : '';
            container.innerHTML += `
                <label style="color:#d4af37; font-size:11px; cursor:pointer; background:#1a1a1a; padding:5px; border:1px solid #333; display:flex; align-items:center; gap:6px;">
                    <input type="checkbox" onchange="window.toggleTeleportLock('${city}', this.checked)" ${checked}>
                    ${city}
                </label>
            `;
        }
    };
// --- NOWA LOGIKA BAZY I POLECANYCH EXPOWISK ---
    window.renderRecommendedExp = function() {
        let c = document.getElementById('expRecList');
        if(!c) return;

        let playerLvl = (typeof Engine !== 'undefined' && Engine.hero && Engine.hero.d && Engine.hero.d.lvl) ? Engine.hero.d.lvl : 1;
        // Rozszerzony zakres dla lepszej widoczności bazy (-10 do +25 lvl)
        let minTarget = playerLvl - 10;
        let maxTarget = playerLvl + 25;

        let html = '';

        // Zabezpieczenie: korzystamy bezpośrednio z odświeżonych botSettings
        let safeProfiles = (botSettings && botSettings.expProfiles) ? botSettings.expProfiles : window.defaultExpProfiles;

        safeProfiles.forEach((p, index) => {
            let lvlMatch = p.name.match(/\((\d+)\s*lvl\)/i);
            if(lvlMatch && lvlMatch[1]) {
                let baseLvl = parseInt(lvlMatch[1]);
                if(baseLvl >= minTarget && baseLvl <= maxTarget) {
                    // Dodano wyświetlanie p.desc (Opis zawierający ilość potworów)
                    html += `
                        <label style="display:flex; align-items:flex-start; gap:5px; background:#1a1a1a; padding:5px; border:1px solid #333; cursor:pointer; color:#d4af37; font-size:11px; margin-bottom: 2px;">
                            <input type="checkbox" class="chk-rec-profile" data-index="${index}" style="margin-top:2px;">
                            <div style="display:flex; flex-direction:column;">
                                <b style="color:#00acc1;">${p.name}</b>
                                ${p.desc ? `<span style="color:#8bc34a; font-size:9px;">${p.desc}</span>` : ''}
                                <span style="color:#888; font-size:9px;">Mapy: ${p.maps.join(', ')}</span>
                            </div>
                        </label>
                    `;
                }
            }
        });

        if(html === '') {
            c.innerHTML = '<div style="text-align:center; color:#777; padding:10px; font-size:10px;">Brak gotowych expowisk w bazie dla Twojego przedziału poziomowego.</div>';
        } else {
            c.innerHTML = html;
        }
    };

    let btnOpenTp = document.getElementById('btnOpenTeleports');
    if (btnOpenTp) {
        btnOpenTp.addEventListener('click', () => {
            let p = document.getElementById('heroTeleportsGUI');
            p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
            if(p.style.display === 'flex' && typeof window.renderTeleportOptions === 'function') {
                window.renderTeleportOptions();
            }
        });
    }
// --- SYSTEM RYSOWANIA TELEPORTÓW ---
    window.renderTeleportList = function() {
        let container = document.getElementById('heroTeleportsGUI');
        if (!container) return;

        let tpList = typeof ZAKONNICY !== 'undefined' ? Object.keys(ZAKONNICY).sort() : [
            "Ithan", "Torneg", "Karka-han", "Werbin", "Eder", "Mythar", "Tuzmer",
            "Port Tuzmer", "Wioska Pszczelarzy", "Nithal", "Podgrodzie Nithal",
            "Thuzal", "Gildia Kupców - część zachodnia", "Brama Północy",
            "Zniszczone Opactwo", "Kwieciste Przejście", "Wzgórze Płaczek", "Nizinne Sady"
        ];

        let myNick = (typeof Engine !== 'undefined' && Engine.hero && Engine.hero.d && Engine.hero.d.nick) ? Engine.hero.d.nick : "Nieznany";
        let html = `<div style="color:#a99a75; font-size:10px; margin-bottom:5px; text-align:center;">Zaznacz odblokowane teleporty dla: <b style="color:#00acc1;">${myNick}</b></div>`;

        tpList.forEach(map => {
            let isChecked = (botSettings.unlockedTeleports && botSettings.unlockedTeleports[map]) ? 'checked' : '';
            html += `
                <label style="display:flex; align-items:center; background:#1a1a1a; padding:4px; border:1px solid #333; cursor:pointer; color:#d4af37; font-size:11px; margin-bottom: 2px; border-left: 2px solid #00838f;">
                    <input type="checkbox" class="chk-teleport" data-map="${map}" ${isChecked} style="margin-right:8px; cursor:pointer;">
                    <b>${map}</b>
                </label>
            `;
        });

        html += `<button id="btnSaveTeleportsManual" class="btn btn-go-sepia" style="margin-top:6px; color:#4caf50; font-weight:bold; border-color:#4caf50; width:100%; padding:6px;">💾 ZAPISZ TELEPORTY</button>`;
        container.innerHTML = html;
    };

    // Obsługa klikania teleportów w pamięci tymczasowej
    document.addEventListener('change', (e) => {
        if (e.target && e.target.classList.contains('chk-teleport')) {
            let mapName = e.target.getAttribute('data-map');
            if (!botSettings.unlockedTeleports) botSettings.unlockedTeleports = {};
            botSettings.unlockedTeleports[mapName] = e.target.checked;
        }
        if (e.target && e.target.id === 'eqTypeFilter') {
            if (typeof window.renderEqItems === 'function') window.renderEqItems(e.target.value);
        }
    });

    // --- GŁÓWNY SYSTEM NASŁUCHIWANIA PRZYCISKÓW ---
    document.addEventListener('click', (e) => {
        let tpGui = document.getElementById('heroTeleportsGUI');
        let eqList = document.getElementById('recommendedEqList');
        let potList = document.getElementById('potionsList');
        let shopsWrap = document.getElementById('shopsSearchWrapper');
        let btnStop = document.getElementById('btnStopWalk');

        let hideAllTabs = () => { if(tpGui) tpGui.style.display='none'; if(eqList) eqList.style.display='none'; if(potList) potList.style.display='none'; if(shopsWrap) shopsWrap.style.display='none'; };

        // 0. ZAPISYWANIE TELEPORTÓW DLA NICKU
        if (e.target && e.target.id === 'btnSaveTeleportsManual') {
            if (typeof Engine !== 'undefined' && Engine.hero && Engine.hero.d && Engine.hero.d.nick) {
                let nick = Engine.hero.d.nick;
                let allTps = JSON.parse(localStorage.getItem('hero_teleports_by_nick_v64') || '{}');
                allTps[nick] = botSettings.unlockedTeleports;
                localStorage.setItem('hero_teleports_by_nick_v64', JSON.stringify(allTps));
                saveSettings();
                if (window.logHero) window.logHero(`✅ Zapisano ustawienia teleportów dla: ${nick}!`, "#4caf50");
                e.target.innerText = "✅ ZAPISANO!";
                setTimeout(() => { if(e.target) e.target.innerText = "💾 ZAPISZ TELEPORTY"; }, 1500);
            } else {
                heroAlert("Błąd: Silnik gry jeszcze nie wczytał nazwy Twojej postaci.");
            }
        }

        // 1. ZARZĄDZAJ TELEPORTAMI
        if (e.target && e.target.closest('#btnOpenTeleports')) { hideAllTabs(); if (tpGui) { tpGui.style.display = 'flex'; if (typeof renderTeleportList === 'function') renderTeleportList(); } }
        // --- NAPRAWA PRZYCISKÓW BAZY EXP ---
        if (e.target && e.target.closest('#btnOpenExpBase')) {
            let p = document.getElementById('heroExpBaseGUI');
            if (p) {
                p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
                if (p.style.display === 'flex' && typeof window.renderExpProfiles === 'function') window.renderExpProfiles();
            }
        }
        if (e.target && e.target.closest('#btnOpenRecommendedExp')) {
            let p = document.getElementById('heroExpRecGUI');
            if (p) {
                p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
                if (p.style.display === 'flex' && typeof window.renderRecommendedExp === 'function') window.renderRecommendedExp();
            }
        }
        // -----------------------------------
// WYMUSZENIE RĘCZNEJ SPRZEDAŻY
        if (e.target && e.target.closest('#btnForceSell')) {
            if (!window.autoSellState) window.autoSellState = { active: false };

            if (window.autoSellState.active) {
                if (window.logHero) window.logHero("⚠️ Zlecenie sprzedaży jest już w toku!", "#ffb300");
                if (window.logExp) window.logExp("⚠️ Zlecenie sprzedaży jest już w toku!", "#ffb300");
                return;
            }
            if (typeof stopPatrol === 'function') stopPatrol(true); // Zatrzymuje szukanie herosów i ruch expa

            if (window.logHero) window.logHero("🏃 Ręcznie wymuszono opróżnienie plecaka! Zatrzymuję akcje i wyruszam...", "#ff5252");
            if (window.logExp) window.logExp("🏃 Ręcznie wymuszono opróżnienie plecaka! Zatrzymuję akcje i wyruszam...", "#ff5252");

            window.autoSellState.active = true;
            window.autoSellState.step = 1;
            window.autoSellState.nextActionTime = 0;
            window.isRushingToShop = false;
            window.isRushing = true;

            // --- NAPRAWA: Wyłączenie Berserka przy ręcznym uruchomieniu ---
            window.autoSellState.wasBerserkOn = botSettings.berserk && botSettings.berserk.enabled;
            if (window.autoSellState.wasBerserkOn) {
                botSettings.berserk.enabled = false;
                let chkBerserk = document.getElementById('berserkEnabled');
                if (chkBerserk) chkBerserk.checked = false;
                if (typeof window.updateServerBerserk === 'function') window.updateServerBerserk();
                if (window.logExp) window.logExp("🛡️ Wyłączam Berserka na czas powrotu do sklepu.", "#ff9800");
            }
        }
// 2. POKAŻ POLECANE EQ (Z filtrowaniem, Porównywaniem i Podwójnym Tooltipem)
        if (e.target && e.target.closest('#btnShowRecommendedEq')) {
            hideAllTabs(); if (eqList) eqList.style.display = 'flex';
            if (!window.DatabaseModule || window.DatabaseModule.ekwipunek.length === 0) { eqList.innerHTML = `<span style="color:#e53935; font-size:10px; text-align:center;">Baza danych ładuje się...</span>`; return; }

            // --- INICJALIZACJA PODWÓJNEGO TOOLTIPA ---
            if (!document.getElementById('radarDualTooltip')) {
                let tt = document.createElement('div');
                tt.id = 'radarDualTooltip';
                tt.style.cssText = 'position:fixed; z-index:999999; display:none; pointer-events:none; flex-direction:row; gap:5px; background:transparent; font-family: Tahoma, sans-serif;';
                tt.innerHTML = `
                    <div id="rdt-left" style="background:rgba(15,15,15,0.95); border:1px solid #ffb300; border-radius:3px; padding:8px; color:#e0d8c0; font-size:11px; min-width:180px; max-width:260px; box-shadow:2px 2px 8px rgba(0,0,0,0.8); line-height: 1.4;"></div>
                    <div id="rdt-right" style="background:rgba(15,15,15,0.95); border:1px solid #4caf50; border-radius:3px; padding:8px; color:#e0d8c0; font-size:11px; min-width:180px; max-width:260px; box-shadow:2px 2px 8px rgba(0,0,0,0.8); line-height: 1.4;"></div>
                `;
                document.body.appendChild(tt);

                window.showDualTooltip = function(e, dbStats, eqStatsRaw) {
                    let tt = document.getElementById('radarDualTooltip');
                    tt.style.display = 'flex';
                    document.getElementById('rdt-left').innerHTML = decodeURIComponent(dbStats);
                    document.getElementById('rdt-right').innerHTML = decodeURIComponent(eqStatsRaw);
                    window.moveDualTooltip(e);
                };
                window.moveDualTooltip = function(e) {
                    let tt = document.getElementById('radarDualTooltip');
                    if (tt.style.display !== 'none') {
                        let x = e.clientX + 15;
                        let y = e.clientY + 15;
                        let w = tt.offsetWidth || 400;
                        let h = tt.offsetHeight || 200;
                        if (x + w > window.innerWidth) x = window.innerWidth - w - 10;
                        if (y + h > window.innerHeight) y = window.innerHeight - h - 10;
                        tt.style.left = x + 'px';
                        tt.style.top = y + 'px';
                    }
                };
                window.hideDualTooltip = function() {
                    document.getElementById('radarDualTooltip').style.display = 'none';
                };
            }

            // --- MODUŁ MATEMATYCZNY I FULL-FORMATTER ---
            if (!window.EquipmentScorer) {
                window.EquipmentScorer = {
                    WEIGHTS_WEAPON_EXP: { dmg: 5.0, fire: 4.5, frost: 4.5, light: 4.5, poison: 4.5, sa: 3.0, pierce: 2.2, crit: 1.8, evade: 1.2, hp: 0.5, ac: 0.3 },
                    WEIGHTS_ARMOR_EXP: { sa: 3.0, ac: 2.0, absorb: 1.8, absorbm: 1.5, evade: 2.0, hp: 1.3, da: 1.5, act: 0.8, resfire: 0.6, resfrost: 0.6, reslight: 0.6, heal: 0.5 },
                    WEIGHTS_JEWELRY_EXP: { sa: 3.0, crit: 2.2, da: 2.0, dz: 1.8, hp: 1.4, evade: 1.5, heal: 1.0, slow: 0.8, resfire: 0.4, resfrost: 0.4, reslight: 0.4 },
                    WEIGHTS_AMMO_EXP: { pdmg: 4.0, acdmg: 2.0, evade: 1.0, crit: 1.0, sa: 1.0 },

                    parseStats: function(itemData) {
                        const out = {};
                        let rawStat = itemData.stat || itemData.rawStat || itemData.stats;

                        // 1. ODCZYT RAW (Założone EQ lub NI Sklep) - Naprawa błędu sa=19 zamiast 0.19!
                        if (rawStat && typeof rawStat === "string" && rawStat.includes("=")) {
                            rawStat.split(";").forEach(part => {
                                const [k, v] = part.split("=");
                                if (k) {
                                    let key = k.trim();
                                    let val = v ?? true;
                                    // Margonem zapisuje szybkość ataku i spowolnienie bez przecinka w statach!
                                    if (key === 'sa' || key === 'slow') {
                                        if (val) val = (Number(val) / 100).toString();
                                    }
                                    out[key] = val;
                                }
                            });
                            return out;
                        }

                        // 2. ODCZYT HTML (Baza / Czysty tekst) - Zamiana polskiego tekstu na zmienne matematyczne
                        let htmlStr = itemData.stats || itemData.tooltip_text || itemData.name || "";
                        let str = htmlStr.replace(/<[^>]*>?/gm, ' ').toLowerCase();

                        // Unikalne tokeny (zabezpieczają przed nakładaniem się słów)
                        str = str.replace(/obniża szybkość ataku przeciwnika o/g, "slow_val");
                        str = str.replace(/szybkość ataku/g, "sa_val");
                        str = str.replace(/moc ciosu krytycznego(?: magicznego)?/g, "critm_val");
                        str = str.replace(/cios krytyczny/g, "crit_val");
                        str = str.replace(/obrażenia fizyczne/g, "pdmg_val");
                        str = str.replace(/obrażenia dystansowe/g, "acdmg_val");
                        str = str.replace(/obrażenia magiczne/g, "mdmg_val");
                        str = str.replace(/obrażenia/g, "dmg_val");
                        str = str.replace(/atak/g, "dmg_val");
                        str = str.replace(/przebicie pancerza/g, "pierce_val");
                        str = str.replace(/niszczenie pancerza/g, "dz_val");
                        str = str.replace(/wszystkie cechy/g, "all_val");
                        str = str.replace(/siła/g, "str_val");
                        str = str.replace(/zręczność/g, "agi_val");
                        str = str.replace(/intelekt/g, "int_val");
                        str = str.replace(/odporność na ogień/g, "resfire_val");
                        str = str.replace(/odporność na zimno/g, "resfrost_val");
                        str = str.replace(/odporność na błyskawice/g, "reslight_val");
                        str = str.replace(/odporność na truciznę/g, "respoison_val");
                        str = str.replace(/od ognia/g, "fire_val");
                        str = str.replace(/od zimna/g, "frost_val");
                        str = str.replace(/od błyskawic/g, "light_val");
                        str = str.replace(/od trucizny/g, "poison_val");
                        str = str.replace(/pancerz/g, "ac_val");
                        str = str.replace(/punktów życia/g, "hp_val");
                        str = str.replace(/życie/g, "hp_val");
                        str = str.replace(/punktów many/g, "mana_val");
                        str = str.replace(/mana/g, "mana_val");
                        str = str.replace(/aktywny unik/g, "act_val");
                        str = str.replace(/unik/g, "evade_val");
                        str = str.replace(/podwójny atak/g, "da_val");
                        str = str.replace(/leczenie turowe/g, "heal_val");
                        str = str.replace(/leczenie zbroją/g, "heal_val");
                        str = str.replace(/przywraca/g, "heal_val");
                        str = str.replace(/blok/g, "block_val");
                        str = str.replace(/absorbuje/g, "absorb_val");

                        // Bezpieczne Regexy wyłapujące liczby z minusem lub bez
                        let extract = (name) => { let regex = new RegExp(name + "[^0-9\\-]*(-?[0-9]+(?:[.,][0-9]+)?)"); let m = str.match(regex); return m ? m[1].replace(',', '.') : null; };
                        let extractRange = (name) => { let regex = new RegExp(name + "[^0-9\\-]*(-?[0-9]+(?:[.,][0-9]+)?)(?:\\s*-\\s*(-?[0-9]+(?:[.,][0-9]+)?))?"); let m = str.match(regex); if (!m) return null; if (m[2]) return `${m[1].replace(',','.')},${m[2].replace(',','.')}`; return m[1].replace(',','.'); };

                        out.dmg = extractRange("dmg_val");
                        out.pdmg = extract("pdmg_val");
                        out.acdmg = extract("acdmg_val");
                        out.mdmg = extract("mdmg_val");
                        out.ac = extract("ac_val");
                        out.sa = extract("sa_val");
                        out.hp = extract("hp_val");
                        out.mana = extract("mana_val");
                        out.all = extract("all_val");
                        out.str = extract("str_val");
                        out.agi = extract("agi_val");
                        out.int = extract("int_val");
                        out.fire = extractRange("fire_val");
                        out.frost = extractRange("frost_val");
                        out.light = extractRange("light_val");
                        out.poison = extractRange("poison_val");
                        out.resfire = extract("resfire_val");
                        out.resfrost = extract("resfrost_val");
                        out.reslight = extract("reslight_val");
                        out.respoison = extract("respoison_val");
                        out.crit = extract("crit_val");
                        out.critm = extract("critm_val");
                        out.evade = extract("evade_val");
                        out.act = extract("act_val");
                        out.da = extract("da_val");
                        out.dz = extract("dz_val");
                        out.pierce = extract("pierce_val");
                        out.slow = extract("slow_val");
                        out.block = extract("block_val");
                        out.heal = extract("heal_val");

                        let abs1 = str.match(/absorb_val[^0-9\-]*([0-9.,]+)[^d]*dmg_val/); if(abs1) out.absorb = abs1[1].replace(',', '.');
                        let abs2 = str.match(/absorb_val[^0-9\-]*([0-9.,]+)[^m]*mdmg_val/); if(abs2) out.absorbm = abs2[1].replace(',', '.');

                        return out;
                    },

                    statToNumber: function(v) {
                        if (v == null) return 0;
                        if (typeof v === "number") return v;
                        if (typeof v !== "string") return 0;
                        if (v.includes(",")) { const parts = v.split(",").map(x => parseFloat(x)).filter(x => !isNaN(x)); if (!parts.length) return 0; return parts.reduce((a, b) => a + b, 0) / parts.length; }
                        const n = parseFloat(v); return isNaN(n) ? 0 : n;
                    },

                    getWeightsForItem: function(cl) {
                        cl = Number(cl);
                        if (cl === 4) return this.WEIGHTS_WEAPON_EXP;
                        if ([8, 9, 10, 11, 15].includes(cl)) return this.WEIGHTS_ARMOR_EXP;
                        if ([12, 13, 22].includes(cl)) return this.WEIGHTS_JEWELRY_EXP;
                        if (cl === 29) return this.WEIGHTS_AMMO_EXP;
                        return {};
                    },

                    getEquippedItemByCl: function(cl) {
                        if (typeof Engine === 'undefined' || !Engine.heroEquipment) return null;
                        let hItems = typeof Engine.heroEquipment.getHItems === 'function' ? Engine.heroEquipment.getHItems() : {};
                        let eqItems = Object.values(hItems).filter(i => Number(i?.st) > 0 && Number(i?.cl) !== 24);
                        return eqItems.find(i => Number(i.cl) === Number(cl));
                    },

                    getClFromDbItem: function(item, displayType) {
                        if (item.cl) return Number(item.cl);
                        let parsed = this.parseStats(item);
                        if (parsed.cl) return Number(parsed.cl);

                        let type = displayType.toLowerCase();
                        if (type.includes("bro") || type.includes("dystans") || type.includes("łuk")) return 4;
                        if (type.includes("zbro") || type.includes("kaftan") || type.includes("szat")) return 8;
                        if (type.includes("hełm") || type.includes("czapk") || type.includes("kaptur")) return 9;
                        if (type.includes("but")) return 10;
                        if (type.includes("rękaw") || type.includes("bransol")) return 11;
                        if (type.includes("pierś")) return 12;
                        if (type.includes("naszyj") || type.includes("ozdob")) return 13;
                        if (type.includes("tarcz")) return 15;
                        if (type.includes("talizman")) return 22;
                        if (type.includes("amunicja") || type.includes("strzał")) return 29;
                        return 0;
                    },

                    compareWithEquipped: function(dbItem, displayType) {
                        let cl = this.getClFromDbItem(dbItem, displayType);
                        if (!cl) return { val: null, reason: 'no_cl' };
                        let eqItem = this.getEquippedItemByCl(cl);
                        if (!eqItem) return { val: null, reason: 'no_eq' };

                        let dbStats = this.parseStats(dbItem);
                        let eqStats = this.parseStats({ stat: eqItem.stat || eqItem._cachedStats?.stat });

                        const weights = this.getWeightsForItem(cl);
                        let eqScore = 0; let dbScore = 0;

                        for (const [key, weight] of Object.entries(weights)) {
                            eqScore += this.statToNumber(eqStats[key]) * weight;
                            dbScore += this.statToNumber(dbStats[key]) * weight;
                        }

                        if (eqScore <= 0 && dbScore > 0) return { val: 999, reason: 'ok' };
                        if (eqScore <= 0) return { val: null, reason: 'zero_score' };

                        let percent = ((dbScore / eqScore) - 1) * 100;
                        return { val: Number(percent.toFixed(2)), reason: 'ok' };
                    },

                    formatItemHTML: function(itemObj, displayType, isDb) {
                        if (!itemObj && !isDb) return `<div style="text-align:center; padding:10px;"><span style="color:#00e5ff; font-weight:bold; font-size:12px;">[PUSTY SLOT]</span><br><br><span style="color:#aaa;">Brak założonego przedmiotu<br>w tym miejscu.</span></div>`;

                        let stats = this.parseStats(isDb ? itemObj : { stat: itemObj.stat || itemObj._cachedStats?.stat });
                        let name = isDb ? itemObj.name : (itemObj._cachedStats?.name || itemObj.name || "Nieznany");

                        let lvl = isDb ? itemObj.level : "";
                        let prof = isDb ? (itemObj.prof && itemObj.prof.length > 0 ? itemObj.prof.join(', ') : "Zwykły") : "";

                        if (!isDb && itemObj) {
                            let sStr = itemObj.stat || itemObj._cachedStats?.stat || "";
                            let mLvl = sStr.match(/lvl=(\d+)/); if (mLvl) lvl = mLvl[1];
                            let mReqp = sStr.match(/reqp=([a-z]+)/);
                            if (mReqp) {
                                let pMap = {"w":"Wojownik", "m":"Mag", "t":"Tropiciel", "p":"Paladyn", "h":"Łowca", "b":"Tancerz ostrzy"};
                                prof = mReqp[1].split('').map(x => pMap[x] || x).join(', ');
                            } else { prof = "Zwykły"; }
                        }

                        let titleColor = isDb ? "#ffb300" : "#4caf50";
                        let titleText = isDb ? "[Ze Sklepu / Bazy]" : "[Obecnie Założony]";

                        let html = `<div style="text-align:center; border-bottom:1px solid #333; padding-bottom:4px; margin-bottom:6px;"><b style="color:${titleColor}; font-size:12px;">${titleText}</b><br><b style="color:#d4af37; font-size:12px;">${name}</b><br><span style="color:#aaa; font-size:9px;">Typ: ${displayType}</span></div>`;

                        // Lista WSZYSTKICH statystyk (Pancerze, Cechy, Resy, Kryty itd.)
                        const statOrder = [
                            {k:'dmg', l:'Obrażenia', c:'#fff'}, {k:'pdmg', l:'Obrażenia fizyczne', c:'#fff'}, {k:'acdmg', l:'Obrażenia dystansowe', c:'#fff'}, {k:'mdmg', l:'Obrażenia magiczne', c:'#fff'},
                            {k:'ac', l:'Pancerz', c:'#fff', p:true}, {k:'block', l:'Blok', c:'#fff', p:true},
                            {k:'all', l:'Wszystkie cechy', c:'#fff', p:true}, {k:'str', l:'Siła', c:'#fff', p:true}, {k:'agi', l:'Zręczność', c:'#fff', p:true}, {k:'int', l:'Intelekt', c:'#fff', p:true},
                            {k:'hp', l:'Życie', c:'#4caf50', p:true}, {k:'mana', l:'Mana', c:'#2196f3', p:true},
                            {k:'fire', l:'Od ognia', c:'#ff9800'}, {k:'frost', l:'Od zimna', c:'#00e5ff'}, {k:'light', l:'Od błyskawic', c:'#e040fb'}, {k:'poison', l:'Od trucizny', c:'#64dd17'},
                            {k:'resfire', l:'Odporność na ogień', c:'#ff9800', p:true, pct:true}, {k:'resfrost', l:'Odporność na zimno', c:'#00e5ff', p:true, pct:true}, {k:'reslight', l:'Odporność na błyskawice', c:'#e040fb', p:true, pct:true}, {k:'respoison', l:'Odporność na truciznę', c:'#64dd17', p:true, pct:true},
                            {k:'sa', l:'Szybkość ataku', c:'#fff', p:true}, {k:'crit', l:'Cios krytyczny', c:'#fff', p:true, pct:true}, {k:'critm', l:'Moc ciosu krytycznego', c:'#fff', p:true, pct:true},
                            {k:'evade', l:'Unik', c:'#fff', p:true}, {k:'act', l:'Aktywny unik', c:'#fff', p:true}, {k:'da', l:'Podwójny atak', c:'#fff', p:true},
                            {k:'pierce', l:'Przebicie pancerza', c:'#fff', p:true}, {k:'dz', l:'Niszczenie pancerza', c:'#fff', p:true}, {k:'slow', l:'Obniża SA przeciwnika', c:'#fff'},
                            {k:'absorb', l:'Absorbuje fizyczne', c:'#fff'}, {k:'absorbm', l:'Absorbuje magiczne', c:'#fff'}, {k:'heal', l:'Leczenie turowe', c:'#4caf50', p:true}
                        ];

                        statOrder.forEach(st => {
                            let val = stats[st.k];
                            if (val) {
                                // Dodajemy plusa (+) tylko jeśli p:true i liczba jest na plusie (dla ujemnego SA nie damy +)
                                let pre = (st.p && Number(val) > 0) ? '+' : '';
                                let post = st.pct ? '%' : '';
                                html += `<span style="color:${st.c}">${st.l}: <b>${pre}${String(val).replace(',', ' - ')}${post}</b></span><br>`;
                            }
                        });

                        html += `<div style="margin-top:6px; padding-top:4px; border-top:1px solid #333; font-size:9px; color:#888;">`;
                        if (prof) html += `Profesja: <span style="color:#aaa">${prof}</span><br>`;
                        if (lvl) html += `Poziom: <span style="color:#aaa">${lvl}</span>`;
                        html += `</div>`;

                        return html;
                    }
                };
            }

            if (!document.getElementById('eqTypeFilter')) {
                eqList.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; background:#1a1a1a; padding:4px; border:1px solid #333;">
                        <span style="color:#a99a75; font-size:10px; font-weight:bold;">Filtruj typ:</span>
                        <select id="eqTypeFilter" style="background:#000; color:#d4af37; border:1px solid #333; font-size:10px; padding:2px; font-weight:bold; cursor:pointer;">
                            <option value="Wszystkie">Wszystkie (-5 do aktualnego)</option>
                            <option value="bro">Broń (Biała/Złoto)</option>
                            <option value="dystansowe">Dystansowe / Łuki</option>
                            <option value="zbroj">Zbroje</option>
                            <option value="hełm">Hełmy</option>
                            <option value="but">Buty</option>
                            <option value="rękaw">Rękawice</option>
                            <option value="pierś">Pierścienie</option>
                            <option value="naszyj">Naszyjniki</option>
                            <option value="tarcz">Tarcze</option>
                            <option value="pomocnicze">Pomocnicze</option>
                        </select>
                    </div>
                    <div id="eqListContent" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:3px;"></div>
                `;
            }

window.renderEqItems = function(filterType = 'Wszystkie') {
            try {
                let container = document.getElementById('eqListContent');
                if (!container) return;

                if (typeof window.DatabaseModule === 'undefined' || !window.DatabaseModule.ekwipunek || !Array.isArray(window.DatabaseModule.ekwipunek)) {
                    container.innerHTML = '<div style="padding:10px; text-align:center; color:#ff5252;">Baza danych ekwipunku ładuje się... Odczekaj chwilę.</div>';
                    return;
                }

                let currentLvl = (typeof Engine !== 'undefined' && Engine.hero && Engine.hero.d && Engine.hero.d.lvl) ? parseInt(Engine.hero.d.lvl) : 1;
                let currentProf = (typeof Engine !== 'undefined' && Engine.hero && Engine.hero.d && Engine.hero.d.prof) ? Engine.hero.d.prof : 'w';

                let profMap = { 'w': 'wojownik', 'm': 'mag', 'p': 'paladyn', 'h': 'łowca', 't': 'tropiciel', 'b': 'tancerz ostrzy' };
                let profName = profMap[currentProf] || 'wszystkie';
                let safeFilterType = String(filterType || 'Wszystkie').toLowerCase();

                let filtered = window.DatabaseModule.ekwipunek.filter(item => {
                    if (!item) return false;

                    let itemLvl = parseInt(item.level) || 1;
                    let lvlMatch = itemLvl <= currentLvl && itemLvl >= (currentLvl - 5);

                    let profMatch = true;
                    if (item.prof && Array.isArray(item.prof) && item.prof.length > 0) {
                        let profArray = item.prof.map(p => String(p).toLowerCase());
                        profMatch = profArray.some(p => p.includes(profName) || p.includes('wszystkie') || p.includes('każda'));
                    }

                    let itemTypeLower = String(item.type).toLowerCase();
                    let typeMatch = false;

                    if (safeFilterType === 'wszystkie') {
                        typeMatch = true;
                    } else if (safeFilterType === 'bro') {
                        typeMatch = itemTypeLower.includes('ręczne') && !itemTypeLower.includes('dystansowe');
                    } else if (safeFilterType === 'dystansowe') {
                        typeMatch = itemTypeLower.includes('dystans') || itemTypeLower.includes('łuk');
                    } else {
                        typeMatch = itemTypeLower.includes(safeFilterType);
                    }

                    return lvlMatch && profMatch && typeMatch;
                });

                filtered.sort((a, b) => (parseInt(b.level) || 0) - (parseInt(a.level) || 0));

                let html = '';
                filtered.forEach((item, index) => {
                    let safeName = String(item.name || 'Nieznany przedmiot');
                    let safeType = String(item.type || 'Inne');
                    let safeLvl = item.level || 1;
                    let safeReqp = (item.prof && item.prof.length > 0) ? item.prof.join(', ') : 'Wszystkie';

                    let safeStatsEscaped = String(item.stats || "").replace(/"/g, '&quot;');
                    let safeNameEscaped = safeName.replace(/"/g, '&quot;');

                    html += `
                        <div class="list-item" style="flex-direction:column; align-items:stretch; border-left:3px solid #ffb300; padding:6px; background:#1a1a1a;">
                            <div class="margo-tooltip-trigger toggle-seller-btn" data-name="${safeNameEscaped}" data-stats="${safeStatsEscaped}" data-index="eq_${index}" style="cursor:pointer;">
                                <div style="display:flex; justify-content:space-between; align-items:center; pointer-events:none;">
                                    <div style="color:#ffb300; font-weight:bold; font-size:11px; text-decoration:underline;">${safeName}</div>
                                    <div style="color:#aaa; font-size:10px;">Lvl: <b style="color:#fff;">${safeLvl}</b></div>
                                </div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; pointer-events:none;">
                                    <div style="color:#888; font-size:9px;">Typ: ${safeType}</div>
                                    <div style="color:#00acc1; font-size:9px;">${safeReqp}</div>
                                </div>
                            </div>
                            <div id="seller_info_eq_${index}" style="display:none; margin-top:5px; border-top:1px solid #333; padding-top:4px;"></div>
                        </div>
                    `;
                });

                container.innerHTML = html || '<div style="padding:10px; color:#aaa; text-align:center;">Brak przedmiotów w tym przedziale poziomowym.</div>';
            } catch (e) {
                console.error("Błąd rysowania Ekwipunku (Radar):", e);
                let container = document.getElementById('eqListContent');
                if (container) container.innerHTML = '<div style="padding:10px; color:#ff5252; text-align:center;">Wystąpił błąd ładowania przedmiotów. Zerknij do konsoli (F12).</div>';
            }
        };

        if (document.getElementById('eqTypeFilter')) {
            window.renderEqItems(document.getElementById('eqTypeFilter').value);
        }

        // Funkcje pomocnicze dla plecaka (Matematyczny kalkulator)
        window.getBagInfo = function() {
            if (typeof Engine === 'undefined' || !Engine.heroEquipment) return { free: 0, occupied: 0, total: 42 };

            let hItems = typeof Engine.heroEquipment.getHItems === 'function' ? Engine.heroEquipment.getHItems() : {};
            let itemsArr = Object.values(hItems).filter(i => i);

            // 1. Ręczne zliczanie pojemności (Baza 42 kratek + założone torby cl=24)
            let total = 42;
            itemsArr.forEach(i => {
                if (Number(i.st) > 0 && Number(i.cl) === 24) {
                    let statStr = i._cachedStats?.stat || i.stat || "";
                    let match = statStr.match(/pojemnosc=(\d+)/) || statStr.match(/capacity=(\d+)/);
                    if (match) total += parseInt(match[1]);
                }
            });

            // 2. Liczenie zajętych kratek (st === 0 to przedmioty w plecaku)
            let occupied = itemsArr.filter(i => Number(i.st) === 0).length;
            let free = Math.max(0, total - occupied);

            return { free, occupied, total };
        };
    }

        // 3. WYSZUKIWARKA SKLEPÓW
        if (e.target && e.target.closest('#btnToggleShops')) { hideAllTabs(); if (shopsWrap) shopsWrap.style.display = 'flex'; }

     // 4. MIKSTURY I LECZENIE (Lista Uzdrowicieli ze wskaźnikiem leczenia)
        if (e.target && e.target.closest('#btnShowPotions')) {
            hideAllTabs(); if (potList) potList.style.display = 'flex';
            if (!window.DatabaseModule || window.DatabaseModule.kupcy.length === 0) {
                potList.innerHTML = `<span style="color:#e53935; font-size:10px; text-align:center;">Baza danych ładuje się...</span>`; return;
            }

            let healers = window.DatabaseModule.kupcy.filter(k => k.npc_name && k.npc_name.toLowerCase().includes('uzdrow'));

            let html = `<div style="color:#d81b60; font-size:10px; margin-bottom:5px; font-weight:bold;">Uzdrowiciele (${healers.length} postaci):</div>`;

            healers.forEach((k, index) => {
                let itemCount = k.items ? k.items.length : 0;
                let itemsHtml = '';

                if (itemCount > 0) {
                    itemsHtml = k.items.map((i, sIdx) => {
                        let cleanName = i.name.split('Typ:')[0].trim();
                        let price = i.price_or_value ? `${(i.price_or_value).toLocaleString()} zł` : '?';
                        let fullStats = i.tooltip_text || i.raw_detected_text || i.name;

                        let healMatch = fullStats.match(/Leczy\s+([0-9\s]+)\s+punkt/i);
                        let healAmount = healMatch ? healMatch[1].trim() : "??";

                        return `
                            <div style="display:flex; justify-content:space-between; align-items:center; color:#d4af37; font-size:9px; margin-bottom:4px; border-bottom:1px solid #222; padding-bottom:2px;">
                                <div style="width:60%; padding-right:5px;">
                                    <div style="margin-bottom:2px;">- <span class="margo-tooltip-trigger" data-stats="${fullStats.replace(/"/g, '&quot;')}" data-name="${cleanName.replace(/"/g, '&quot;')}" style="cursor:help; text-decoration:underline; color:#f48fb1; font-weight:bold;">${cleanName}</span> <span style="color:#4caf50;">(${price})</span></div>
                                    <div style="color:#8bc34a; font-size:8px; margin-left:6px;">❤️ Leczy: ${healAmount} HP</div>
                                </div>
                                <div style="display:flex; align-items:center;">
                                    <input type="number" id="buy_amt_heal_${index}_${sIdx}" value="10" min="1" max="1000" style="width:35px; height:16px; font-size:10px; background:#000; color:#fff; border:1px solid #444; text-align:center; margin-right:4px;">
                                    <button class="btn-go-npc"
                                        data-mode="potion"
                                        data-buy-input="buy_amt_heal_${index}_${sIdx}"
                                        data-item="${cleanName}"
                                        data-npc="${k.npc_name}"
                                        data-map="${k.map_name}"
                                        data-x="${k.x}"
                                        data-y="${k.y}"
                                        style="background:#d81b60; color:white; border:none; padding:2px 6px; border-radius:3px; cursor:pointer; font-size:9px; font-weight:bold;">
                                        🏃 KUP
                                    </button>
                                </div>
                            </div>`;
                    }).join('');
                } else {
                    itemsHtml = `<div style="color:#777; font-size:9px;">Brak danych o asortymencie.</div>`;
                }

                html += `
                    <div style="background:#1a1a1a; padding:5px; margin-bottom:4px; border-left:3px solid #d81b60;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <b style="color:#f48fb1; font-size:11px;">${k.npc_name}</b>
                        </div>
                        <div style="color:#888; font-size:9px; margin-top:2px; display:flex; justify-content:space-between; align-items:center;">
                            <span>🌍 ${k.map_name} [${k.x}, ${k.y}]</span>
                            <button class="btn-go-npc" data-map="${k.map_name}" data-x="${k.x}" data-y="${k.y}" style="background:#4caf50; color:white; border:none; padding:2px 6px; border-radius:3px; cursor:pointer; font-size:9px; font-weight:bold;">🏃 IDŹ DO NPC</button>
                        </div>

                        <div class="toggle-items-btn" data-index="heal_${index}" style="color:#00acc1; font-size:9px; margin-top:4px; cursor:pointer; font-weight:bold; background:#222; padding:2px 4px; text-align:center; border-radius:2px;">
                            Pokaż asortyment (${itemCount} szt.) ▼
                        </div>

                        <div id="shop_items_heal_${index}" style="display:none; margin-top:5px; border-top:1px solid #333; padding-top:4px; background:#0a0a0a; padding-left:4px;">
                            ${itemsHtml}
                        </div>
                    </div>`;
            });
            potList.innerHTML = html;
        }

        // 5. ROZWIJANIE KUPCA Z AUTO-KUPNEM
        if (e.target && e.target.classList.contains('toggle-seller-btn')) {
            let itemName = e.target.getAttribute('data-name');
            let index = e.target.getAttribute('data-index');
            let sellerDiv = document.getElementById(`seller_info_${index}`);

            if (sellerDiv) {
                if (sellerDiv.style.display === 'block') { sellerDiv.style.display = 'none'; return; }
                let sellers = window.DatabaseModule.kupcy.filter(k => k.items && k.items.some(i => i.name && i.name.includes(itemName)));

               if (sellers.length > 0) {
                    let sHtml = '';
                    sellers.forEach((s, sIdx) => {
                        let isPotion = index.startsWith('pot_');
                        sHtml += `
                            <div style="background:#0a0a0a; padding:4px; margin-bottom:4px; border-left:2px solid ${isPotion ? '#d81b60' : '#4caf50'};">
                                <b style="color:#e65100; font-size:10px;">${s.npc_name}</b><br>
                                <span style="color:#888; font-size:9px;">🌍 ${s.map_name} [${s.x}, ${s.y}]</span>

                                <div style="display:flex; justify-content:flex-end; align-items:center; margin-top:4px; gap:6px;">
                                    ${isPotion ?
                                        `<input type="number" id="buy_amt_${index}_${sIdx}" value="10" min="1" max="1000" style="width:35px; height:16px; font-size:10px; background:#000; color:#fff; border:1px solid #444; text-align:center;">`
                                        :
                                        `<label style="color:#aaa; font-size:9px; cursor:pointer; display:flex; align-items:center; gap:2px;">
                                            <input type="checkbox" id="buy_eq_chk_${index}_${sIdx}" style="margin:0; width:12px; height:12px;"> kup
                                         </label>`
                                    }
                                    <button class="btn-go-npc"
                                        data-mode="${isPotion ? 'potion' : 'eq'}"
                                        data-buy-input="${isPotion ? `buy_amt_${index}_${sIdx}` : `buy_eq_chk_${index}_${sIdx}`}"
                                        data-item="${itemName}"
                                        data-npc="${s.npc_name}"
                                        data-map="${s.map_name}"
                                        data-x="${s.x}"
                                        data-y="${s.y}"
                                        style="background:${isPotion ? '#d81b60' : '#4caf50'}; color:white; border:none; padding:2px 6px; border-radius:3px; cursor:pointer; font-size:9px; font-weight:bold;">
                                        🏃 IDŹ
                                    </button>
                                </div>
                            </div>`;
                    });
                    sellerDiv.innerHTML = sHtml;
                } else {
                    sellerDiv.innerHTML = `<span style="color:#777; font-size:9px;">Przedmiot nie występuje w sklepach (Drop z potworów).</span>`;
                }
                sellerDiv.style.display = 'block';
            }
        }
        // 6. ROZWIJANIE ASORTYMENTU WYSZUKIWARKI
        if (e.target && e.target.classList.contains('toggle-items-btn')) {
            let index = e.target.getAttribute('data-index');
            let itemsDiv = document.getElementById(`shop_items_${index}`);
            if (itemsDiv) {
                let isHidden = itemsDiv.style.display === 'none';
                itemsDiv.style.display = isHidden ? 'block' : 'none';
                e.target.innerHTML = isHidden ? 'Ukryj asortyment ▲' : `Pokaż asortyment ▼`;
            }
        }

// 7. SMART WALK (Z AUTO-KUPNEM I RUSH-TO-MAP)
        if (e.target && e.target.classList.contains('btn-go-npc')) {
            let mapName = e.target.getAttribute('data-map');
            let targetX = parseInt(e.target.getAttribute('data-x'));
            let targetY = parseInt(e.target.getAttribute('data-y'));

            let mode = e.target.getAttribute('data-mode');
            let inputId = e.target.getAttribute('data-buy-input');
            let buyAmount = 0;

            if (mode === 'potion') {
                let el = document.getElementById(inputId);
                buyAmount = el ? parseInt(el.value) || 0 : 0;
            } else if (mode === 'eq') {
                let el = document.getElementById(inputId);
                if (el && el.checked) buyAmount = 1;
            }

            if (buyAmount > 0) {
                window.autoBuyTask = { npc: e.target.getAttribute('data-npc'), item: e.target.getAttribute('data-item'), amount: buyAmount, mode: mode };
                let logMsg = mode === 'potion' ? `🛒 Zlecenie: Kupić ${buyAmount} staków (po 15 szt.) ${window.autoBuyTask.item} od ${window.autoBuyTask.npc}. Wyruszam!` : `🛒 Zlecenie: Kupić ${buyAmount}x ${window.autoBuyTask.item} od ${window.autoBuyTask.npc}. Wyruszam!`;
                if (window.logHero) window.logHero(logMsg, "#d81b60");
            } else {
                window.autoBuyTask = null;
                if (window.logHero) window.logHero(`🏃 Obieram kurs na: [${mapName}] (${targetX}, ${targetY})`, "#00e5ff");
            }

            if (btnStop) btnStop.style.display = 'block';

            // Używamy zintegrowanego silnika Rush, który sam teleportuje się Zakonnikami!
            if (typeof window.rushToMap === 'function') {
                window.rushToMap(mapName, targetX, targetY);
            } else {
                // Fallback dla tej samej mapy
                if (typeof Engine.hero.autoGoTo === 'function') Engine.hero.autoGoTo({x: targetX, y: targetY});
            }

            if (window.npcWalkInterval) clearInterval(window.npcWalkInterval);

            // Lekki nasłuchiwacz czekający aż bot zakończy bieg w innym mieście
            window.npcWalkInterval = setInterval(() => {
                if (!window.autoBuyTask) {
                    clearInterval(window.npcWalkInterval);
                    if (btnStop) btnStop.style.display = 'none';
                    return;
                }

                if (typeof Engine !== 'undefined' && Engine.map && Engine.hero) {
                    if (Engine.map.d.name === mapName) {
                        let dist = Math.abs(Engine.hero.d.x - targetX) + Math.abs(Engine.hero.d.y - targetY);
                        // Czekamy aż skończy biec (isRushing jest flagą z algorytmu dróg)
                        if (dist <= 2 && !isRushing) {
                            if (window.logHero) window.logHero(`💬 Zaczepiam NPC ${window.autoBuyTask.npc}...`, "#ffeb3b");
                            clearInterval(window.npcWalkInterval);
                            if (btnStop) btnStop.style.display = 'none';

                            let npcs = typeof Engine.npcs.check === 'function' ? Engine.npcs.check() : Engine.npcs.d;
                            for (let i in npcs) {
                                let n = npcs[i];
                                let nData = n.d || n;
                                if (nData.nick === window.autoBuyTask.npc && Math.abs(nData.x - Engine.hero.d.x) <= 2 && Math.abs(nData.y - Engine.hero.d.y) <= 2) {
                                    if (typeof Engine.npcs.interact === 'function') {
                                        Engine.npcs.interact(nData.id);
                                    } else if (typeof window._g === 'function') {
                                        window._g(`talk&id=${nData.id}`);
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
            }, 500);
        }
    }); // <--- TO TA BRAKUJĄCA KLAMERKA NR 2!

      // 8. ZATRZYMYWANIE RUCHU (Niezależny, bezpieczny blok)
        document.addEventListener('click', (e) => {
            if (e.target && e.target.closest('#btnStopWalk')) {
                if (window.npcWalkInterval) clearInterval(window.npcWalkInterval);
                window.autoBuyTask = null;
                if (window.logHero) window.logHero(`🛑 Zatrzymano akcję manualnie.`, "#d32f2f");
                if (typeof Engine !== 'undefined' && Engine.hero && Engine.hero.d) {
                    Engine.hero.autoGoTo({x: Engine.hero.d.x, y: Engine.hero.d.y});
                }
                let btnStop = document.getElementById('btnStopWalk') || e.target.closest('#btnStopWalk');
                if (btnStop) btnStop.style.display = 'none';
            }
        });

    // --- SILNIK WYSZUKIWANIA SKLEPÓW NA ŻYWO ---
    document.addEventListener('input', (e) => {
        if (e.target && e.target.id === 'shopSearchInput') {
            let term = e.target.value.toLowerCase();
            let container = document.getElementById('shopsListOutput');

            if (!window.DatabaseModule || window.DatabaseModule.kupcy.length === 0) return;
            if (term.length < 2) { container.innerHTML = `<span style="color:#777; font-size:10px;">Wpisz minimum 2 znaki...</span>`; return; }

            let filtered = window.DatabaseModule.kupcy.filter(k =>
                (k.npc_name && k.npc_name.toLowerCase().includes(term)) ||
                (k.map_name && k.map_name.toLowerCase().includes(term)) ||
                (k.category && k.category.toLowerCase().includes(term)) ||
                (k.items && k.items.some(i => i.name && i.name.toLowerCase().includes(term)))
            ).slice(0, 30);

            if (filtered.length === 0) { container.innerHTML = `<span style="color:#777; font-size:10px;">Brak wyników dla: "${term}".</span>`; return; }

            let html = '';
            filtered.forEach((k, index) => {
                let itemCount = k.items ? k.items.length : 0;
                let itemsHtml = '';

               if (itemCount > 0) {
                    itemsHtml = k.items.map(i => {
                        let cleanName = i.name.split('Typ:')[0].trim();
                        let price = i.price_or_value ? `${(i.price_or_value).toLocaleString()} zł` : '?';
                        let typeMatch = i.name.match(/Typ:\s*([A-Za-zżźćńółęąśŻŹĆŃÓŁĘĄŚ]+)/);
                        let itemType = typeMatch ? typeMatch[1] : (i.slot_type || "Inne");
                        let lvlMatch = i.name.match(/Wymagany poziom:\s*(\d+)/);
                        let lvl = lvlMatch ? lvlMatch[1] : (i.required_level || "Brak");
                        let profMatch = i.name.match(/Wymagana profesja:\s*([A-Za-zżźćńółęąśŻŹĆŃÓŁĘĄŚ,\s]+?)(?=\sWymagany|\sWartość|$)/);
                        let prof = profMatch ? profMatch[1].trim() : (i.allowed_professions && i.allowed_professions.length > 0 ? i.allowed_professions.join(', ') : "Każda");

                        // Pełne statystyki dla tooltipa w wyszukiwarce
                        let fullStats = i.tooltip_text || i.raw_detected_text || i.name;

                        return `
                            <div style="color:#d4af37; font-size:9px; margin-bottom:4px; border-bottom:1px solid #222; padding-bottom:2px;">
                                <div>- <span class="margo-tooltip-trigger" data-stats="${fullStats.replace(/"/g, '&quot;')}" data-name="${cleanName.replace(/"/g, '&quot;')}" style="cursor:help; text-decoration:underline;">${cleanName}</span> <span style="color:#4caf50;">(${price})</span></div>
                                <div style="color:#777; font-size:8px; margin-left:8px;">
                                    Typ: <span style="color:#fff;">${itemType}</span> | Lvl: <span style="color:#fff;">${lvl}</span> | Prof: <span style="color:#fff;">${prof}</span>
                                </div>
                            </div>`;
                    }).join('');
                } else {
                    itemsHtml = `<div style="color:#777; font-size:9px;">Brak danych o asortymencie.</div>`;
                }

        html += `
                    <div style="background:#1a1a1a; padding:5px; margin-bottom:4px; border-left:3px solid #e65100;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <b style="color:#e65100; font-size:11px;">${k.npc_name}</b>
                        </div>
                        <div style="color:#888; font-size:9px; margin-top:2px; display:flex; justify-content:space-between; align-items:center;">
                            <span>🌍 ${k.map_name} [${k.x}, ${k.y}]</span>
                            <button class="btn-go-npc" data-map="${k.map_name}" data-x="${k.x}" data-y="${k.y}" style="background:#4caf50; color:white; border:none; padding:2px 6px; border-radius:3px; cursor:pointer; font-size:9px; font-weight:bold;">🏃 IDŹ</button>
                        </div>

                        <div class="toggle-items-btn" data-index="${index}" style="color:#00acc1; font-size:9px; margin-top:4px; cursor:pointer; font-weight:bold;">
                            Pokaż asortyment (${itemCount} szt.) ▼
                        </div>

                        <div id="shop_items_${index}" style="display:none; margin-top:5px; border-top:1px solid #333; padding-top:4px; background:#0a0a0a; padding-left:4px;">
                            ${itemsHtml}
                        </div>
                    </div>`;
            });
            container.innerHTML = html;
        }
    });
 // --- SILNIK GRAFICZNY CUSTOMOWYCH TOOLTIPÓW (Styl Margonem) ---

    if (!document.getElementById('customMargoTooltip')) {
        let tt = document.createElement('div');
        tt.id = 'customMargoTooltip';
        tt.style.cssText = 'display:none; position:absolute; z-index:999999; background:rgba(15,15,15,0.95); border:1px solid #a99a75; padding:6px 8px; border-radius:3px; box-shadow:0px 0px 10px rgba(0,0,0,0.9); pointer-events:none; font-family:Tahoma, sans-serif; min-width:180px; max-width:280px;';
        document.body.appendChild(tt);
    }

 // Wyświetlanie tooltipa
    document.addEventListener('mouseover', (e) => {
        if (e.target && e.target.classList.contains('margo-tooltip-trigger')) {
            let tt = document.getElementById('customMargoTooltip');
            let name = e.target.getAttribute('data-name');
            let rawStats = e.target.getAttribute('data-stats');

            if (tt && rawStats) {
                let desc = rawStats.replace(name, '').trim();

                // Rzadkości w różnych odmianach (od teraz podświetli i "Unikat", i "Unikatowy")
                desc = desc.replace(/(?<![a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ])(Pospolity)(?![a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ])/gi, '<br><span style="color:#b0bec5; font-weight:bold;">$1</span><br>');
                desc = desc.replace(/(?<![a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ])(Unikat|Unikatowy)(?![a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ])/gi, '<br><span style="color:#fbc02d; font-weight:bold;">$1</span><br>');
                desc = desc.replace(/(?<![a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ])(Heroik|Heroiczny)(?![a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ])/gi, '<br><span style="color:#29b6f6; font-weight:bold;">$1</span><br>');
                desc = desc.replace(/(?<![a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ])(Legendarny)(?![a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ])/gi, '<br><span style="color:#ef5350; font-weight:bold;">$1</span><br>');

                const statKeywords = [
                    "Typ:", "Obrażenia", "Cios krytyczny", "Siła", "Zręczność", "Intelekt", "Energia", "Mana",
                    "Pancerz", "Blok", "Unik", "Życie", "Odporność na", "Wiąże", "Spowalnia", "Zmniejsza", "Przebicie",
                    "Pojemność", "Ilość:", "Teleportuje", "Leczy", "Przywraca", "Niszczy", "Szansa na",
                    "Podczas ataku", "Dodatkowe", "Absorbuje", "Wymagany poziom:", "Wymagana profesja:",
                    "Wartość:", "Zadaje", "Obniża", "Związany"
                ];

                statKeywords.forEach(key => {
                    let regex = new RegExp(`(?<!>\\s*)(${key})`, 'g');
                    desc = desc.replace(regex, '<br>$1');
                });

                desc = desc.replace(/^(<br>\s*)+/, '');
                desc = desc.replace(/(Wymagany poziom:|Wymagana profesja:|Typ:|Wartość:)/g, '<span style="color:#888;">$1</span>');
                desc = desc.replace(/(\+[0-9]+(?:.[0-9]+)?%?)/g, '<span style="color:#66bb6a; font-weight:bold;">$1</span>');
                desc = desc.replace(/(Wartość:\s*<\/span>)([0-9\.\s]+k?)/g, '$1<span style="color:#ffca28;">$2</span>');
                desc = desc.replace(/(<br>\s*){2,}/g, '<br>');

                let html = `<div style="color:#ffca28; font-weight:bold; font-size:12px; border-bottom:1px solid #443c2c; padding-bottom:4px; margin-bottom:4px; text-align:center; text-shadow:1px 1px 0 #000;">${name}</div>`;
                html += `<div style="color:#ddd; font-size:10px; line-height:1.6;">${desc}</div>`;

                tt.innerHTML = html;
                tt.style.display = 'block';
            }
        }
    });

    document.addEventListener('mousemove', (e) => {
        let tt = document.getElementById('customMargoTooltip');
        if (tt && tt.style.display === 'block') {
            tt.style.left = (e.pageX + 15) + 'px';
            tt.style.top = (e.pageY + 15) + 'px';
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target && e.target.classList.contains('margo-tooltip-trigger')) {
            let tt = document.getElementById('customMargoTooltip');
            if (tt) tt.style.display = 'none';
        }
    });
// --- DAEMON: AUTOMATYCZNE KUPNO PRZEDMIOTU W SKLEPIE I DIALOGI ---
    if (!window.autoBuyDaemonInstalled) {
        window.autoBuyDaemonInstalled = true;
        setInterval(() => {
            if (window.autoBuyTask && typeof Engine !== 'undefined') {
                let dialogOptions = Array.from(document.querySelectorAll('.dialog-item, .dialog-choice, .option, .answer, .dialog-answer, #dialog li, .dialog-options li, .dialog-texts li, [data-option]'));
                if (dialogOptions.length > 0) {
                    let shopOpt = dialogOptions.find(el => {
                        let txt = (el.innerText || el.textContent).toLowerCase();
                        return txt.includes('sklep') || txt.includes('handl') || txt.includes('wywar') || txt.includes('lecznicz') || txt.includes('towar') || txt.includes('sprzedaj') || txt.includes('pokaż');
                    });
                    if (shopOpt) {
                        let humanDelay = Math.floor(Math.random() * 401) + 400;
                        setTimeout(() => {
                            if (typeof shopOpt.click === 'function') shopOpt.click();
                            else if (typeof MouseEvent !== 'undefined') {
                                shopOpt.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
                                shopOpt.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
                            }
                        }, humanDelay);
                        return;
                    }
                }
                if (Engine.shop && Engine.shop.items && Engine.shop.basket) {
                    let shopWrapper = document.getElementById('shop-wrapper') || document.querySelector('.shop-wrapper') || document.querySelector('.shop-window') || document.querySelector('.shop-container');
                    if (shopWrapper && shopWrapper.style.display !== 'none') {
                        let shopItems = Object.values(Engine.shop.items);
                        let itemToBuy = shopItems.find(i => {
                            let realName = (i._cachedStats && i._cachedStats.name) ? i._cachedStats.name : i.name;
                            return realName === window.autoBuyTask.item;
                        });
                        if (itemToBuy) {
                            if (window.logHero) window.logHero(`🛒 Dodaję do koszyka: ${window.autoBuyTask.item}...`, "#8bc34a");
                            let finalAmount = window.autoBuyTask.amount;
                            let mode = window.autoBuyTask.mode;
                            let finalItemName = window.autoBuyTask.item;
                            window.autoBuyTask = null;
                            let buyDelay = Math.floor(Math.random() * 301) + 500;
                            setTimeout(() => {
                                if (typeof Engine.shop.basket.buyItem === 'function') {
                                    let clicksNeeded = (mode === 'potion') ? (finalAmount * 3) : 1;
                                    for (let i = 0; i < clicksNeeded; i++) Engine.shop.basket.buyItem(itemToBuy);
                                }
                                let finalizeDelay = Math.floor(Math.random() * 301) + 300;
                                setTimeout(() => {
                                    if (typeof Engine.shop.basket.finalize === 'function') {
                                        Engine.shop.basket.finalize();
                                        let msg = mode === 'potion' ? `✅ Zakupiono ${finalAmount} staków (po 15 szt.)!` : `✅ Zakupiono 1 sztukę ekwipunku!`;
                                        if (window.logHero) window.logHero(msg, "#4caf50");
                                        if (mode === 'eq') {
                                            setTimeout(() => {
                                                if (typeof Engine.heroEquipment === 'undefined' || typeof Engine.heroEquipment.getHItems !== 'function') return;
                                                let hItems = Engine.heroEquipment.getHItems();
                                                let bagItems = Object.values(hItems);
                                                let boughtItem = bagItems.find(i => {
                                                    let n = i._cachedStats?.name || i.name || "";
                                                    let inBag = Number(i.st) === 0 || i.loc === "g" || Number(i.st) > 8 || Number(i.slot) > 29;
                                                    return n === finalItemName && inBag;
                                                });
                                                if (boughtItem && typeof Engine.heroEquipment.sendUseRequest === 'function') {
                                                    Engine.heroEquipment.sendUseRequest(boughtItem);
                                                    if (window.logHero) window.logHero(`🛡️ Automatycznie założono: ${finalItemName}!`, "#00acc1");
                                                }
                                            }, 1500);
                                        }
                                    }
                                    let closeDelay = Math.floor(Math.random() * 501) + 500;
                                    setTimeout(() => {
                                        if (typeof Engine.shop.close === 'function') Engine.shop.close();
                                        let closeBtn = document.querySelector('.shop-close-btn, .close-button, #shop-close, .window-close, .close-cross');
                                        if (closeBtn) closeBtn.click();
                                    }, closeDelay);
                                }, finalizeDelay);
                            }, buyDelay);
                        } else {
                            if (window.logHero) window.logHero(`❌ Sprzedawca nie posiada obecnie [${window.autoBuyTask.item}]!`, "#e53935");
                            window.autoBuyTask = null;
                        }
                    }
                }
            }
        }, 800);
    }
// --- DAEMON: AUTO LEAVE FIGHT (Zoptymalizowany pod wydajność + Randomizacja) ---
    if (!window.__autoLeaveFightDaemon) {
        window.__autoLeaveFightDaemon = true;
        window.__lastFightQuitLog = 0; // Blokada spamu w logach

        setInterval(() => {
            // SZALENIE WAŻNA OPTYMALIZACJA:
            // Skanowanie wszystkich <div> i <span> zmuszało przeglądarkę do gigantycznych obliczeń.
            // Teraz szukamy tylko konkretnych klas przycisków, co odciąża procesor o 99%!
            const battleButtons = document.querySelectorAll("button, .button, .btn, .battle-window a, .loots-button");
            
            let btn = null;
            for (let i = 0; i < battleButtons.length; i++) {
                let el = battleButtons[i];
                // Odczyt surowego tekstu jest dużo "lżejszy" dla gry niż przeliczanie innerText
                let txt = (el.textContent || "").toLowerCase();
                
                // Najpierw sprawdzamy lekki tekst, dopiero potem zasobożerne offsetParent!
                if (txt.includes("opuść walkę") || txt.includes("zakończ walkę") || txt.includes("zamknij")) {
                    if (el.offsetParent !== null) {
                        btn = el;
                        break;
                    }
                }
            }
            
            if (btn) {
                // ZABEZPIECZENIE: Nie spamujemy kliknięć (odczekujemy minimum 2.5s)
                if (Date.now() - window.__lastFightQuitLog > 2500) {
                    window.__lastFightQuitLog = Date.now();
                    
                    // RANDOMIZACJA: Czekamy od 150ms do 450ms, zamiast klikać natychmiast jak robot.
                    // Daje to serwerowi czas na odblokowanie interfejsu (brak lagów)!
                    let randomReaction = Math.floor(Math.random() * (450 - 150 + 1)) + 150; 
                    
                    setTimeout(() => {
                        if (btn && typeof btn.click === 'function') {
                            btn.click();
                            if (window.logExp) window.logExp("⚔️ Zamykam podsumowanie walki...", "#9e9e9e");
                        }
                    }, randomReaction);
                }
            } else if (typeof Engine !== 'undefined' && Engine.battle && Engine.battle.d && Engine.battle.d.winner !== undefined) {
                // LIMIT ZAPYTAŃ: Czekamy minimum 3.5 sekundy między próbami wysłania awaryjnego pakietu sieciowego
                if (Date.now() - window.__lastFightQuitLog > 3500) {
                    window.__lastFightQuitLog = Date.now();
                    
                    // Randomizacja pakietu ratunkowego (daje serwerowi wytchnienie)
                    let randomDelay = Math.floor(Math.random() * (600 - 300 + 1)) + 300;
                    setTimeout(() => {
                        if (Engine.communication) {
                            Engine.communication.send({ a: "fight", action: "quit" }); 
                        } else if (typeof window._g === 'function') {
                            window._g("fight&a=quit"); 
                        }
                    }, randomDelay);
                }
            }
        }, 400); // Wydłużono czas sprawdzania (z 250 na 400ms), aby zdjąć obciążenie z gry
    }
    function isUnconsciousNow() {
    const deathSelectors = [
        '.dead-window',
        '.death-window',
        '[data-wnd="dead"]',
        '.dead-overlay',
        '.dead-overlay.map-overlay',
        '.dead-overlay .inner-text',
        '.death-overlay',
        '.alert-window'
    ].join(', ');

    const visibleDeathEls = Array.from(document.querySelectorAll(deathSelectors))
        .filter(el => el && el.offsetParent !== null);

    const hasDeathText = visibleDeathEls.some(el => {
        const txt = (el.textContent || "").toLowerCase();
        return (
            txt.includes("jesteś nieprzytomny") ||
            txt.includes("zostałeś zabity") ||
            txt.includes("ockniesz się") ||
            txt.includes("wrócą ci siły")
        );
    });

    const hero = (typeof Engine !== 'undefined' && Engine.hero && Engine.hero.d) ? Engine.hero.d : null;
    const hp = hero ? parseInt(hero.hp ?? hero.warrior_stats?.hp ?? 0) : 0;
    const maxhp = hero ? parseInt(hero.maxhp ?? hero.warrior_stats?.maxhp ?? 0) : 0;

    const engineDead = !!(
        (typeof Engine !== 'undefined' && Engine.dead) ||
        (hero && (hero.dead === true || hero.dead === 1 || hero.dead === "1"))
    );

    const hpSuggestsDeath = maxhp > 1 && hp <= 1;

    return hasDeathText || engineDead || hpSuggestsDeath;
}
   setInterval(() => {
    const deathCandidates = Array.from(document.querySelectorAll(
        '.dead-window, .death-window, [data-wnd="dead"], .dead-overlay, .dead-overlay.map-overlay, .alert-window, .dialog-window'
    )).filter(el => {
        if (!el || el.offsetParent === null) return false;
        const txt = (el.textContent || "").toLowerCase();
        return (
            txt.includes("jesteś nieprzytomny") ||
            txt.includes("zostałeś zabity") ||
            txt.includes("ockniesz się") ||
            txt.includes("wrócą ci siły")
        );
    });

    const isDead = isUnconsciousNow();

    if (isDead && !window.__unconscious) {
        window.__unconscious = true;
        if (window.logExp) window.logExp("💀 [STRAŻNIK] Wykryto zgon! Zatrzymuję bota...", "#e53935");
        if (typeof Engine !== 'undefined' && Engine.hero && typeof Engine.hero.stop === 'function') {
            Engine.hero.stop();
        }
    }

    if (!isDead && window.__unconscious) {
        // lekkie opóźnienie, żeby nie zrobić fałszywego 'ożyłeś'
        setTimeout(() => {
            if (window.__unconscious && !isUnconsciousNow()) {
                window.__unconscious = false;
                window.__stuckTimerCount = 0;
                window.__lastParsedSeconds = null;
                if (window.logExp) window.logExp("✅ [STRAŻNIK] Ożyłeś. Wracamy do akcji!", "#4caf50");
            }
        }, 1200);
    }

    if (window.__unconscious && deathCandidates.length > 0) {
        const text = deathCandidates[0].textContent || "";
        const match = text.match(/(?:(\d+)\s*min\s*)?(\d+)\s*s/);
        let seconds = null;

        if (match) {
            const m = parseInt(match[1]) || 0;
            const s = parseInt(match[2]) || 0;
            seconds = m * 60 + s;
        }

        if (seconds !== null) {
            if (window.__lastParsedSeconds === seconds) {
                window.__stuckTimerCount++;
            } else {
                window.__lastParsedSeconds = seconds;
                window.__stuckTimerCount = 0;
            }

            if (window.__stuckTimerCount >= 6) {
                if (window.logExp) {
                    window.logExp(`🔄 Zegar śmierci zamarzł na ${seconds}s! Miękkie odświeżanie interfejsu...`, "#ffb300");
                }
                window.__stuckTimerCount = -999;

                if (typeof Engine !== 'undefined' && Engine.communication) {
                    Engine.communication.send({ a: "deadresp" });
                } else if (typeof window._g === 'function') {
                    window._g('deadresp');
                }

                setTimeout(() => {
                    if (window.__unconscious) {
                        if (window.isExping || window.isPatrolling) {
                            sessionStorage.setItem('margoBotAutoResume', 'true');
                        }

                        if (typeof Engine !== 'undefined' && typeof Engine.reload === 'function') {
                            Engine.reload();
                        } else {
                            window.location.reload();
                        }
                    }
                }, 3000);
            }
        }
    }
}, 1000);
// --- DAEMON: AUTOHEAL (Logika: Start poniżej progu -> Koniec przy 100%) ---
    if (!window.autoHealDaemonInstalled) {
        window.autoHealDaemonInstalled = true;
        window.lastHealTime = 0;
        window.isHealLocked = false;
        window.isRegeneratingToFull = false;

        function extractHeal(itemData) {
            if (typeof itemData.getLeczyStat === 'function') {
                let v = itemData.getLeczyStat();
                if (v) return v;
            }
            let statStr = String(itemData.stat || itemData.stats || "").toLowerCase();
            if (statStr.includes('fullheal') || statStr.includes('całe życie') || statStr.includes('całą energię')) return 999999;
            if (statStr.includes('hot=')) return 0; 
            statStr = statStr.replace(/(\d)\s+(\d)/g, '$1$2');
            let match = statStr.match(/(?:leczy|przywraca)[^\d]*(\d+)/);
            if (match) return parseInt(match[1]);
            let matchPct = statStr.match(/leczy\s*p[=:](\d+)/);
            if (matchPct) {
                let pct = parseInt(matchPct[1]);
                let maxhp = parseInt(Engine.hero.d.maxhp) || 1000;
                return Math.floor(maxhp * (pct / 100));
            }
            return 0;
        }

        setInterval(() => {
            if (typeof Engine === 'undefined' || !Engine.hero || !Engine.hero.d) return;

            // Awaryjne zdjęcie locka (jeśli internet zlaguje)
            if (window.isHealLocked && Date.now() > window.lastHealTime + 3000) {
                window.isHealLocked = false;
            }
            if (window.isHealLocked) return;
            
            if (!botSettings.autoheal || !botSettings.autoheal.enabled) {
                window.isRegeneratingToFull = false;
                return;
            }
            
            if (Engine.battle && Engine.battle.show) return;
            
      let isDead = isUnconsciousNow() || window.__unconscious;
if (isDead) {
    window.isRegeneratingToFull = false;
    return;
}

            let hp = Engine.hero.d.hp !== undefined ? parseInt(Engine.hero.d.hp) : (Engine.hero.d.warrior_stats ? parseInt(Engine.hero.d.warrior_stats.hp) : 0);
            let maxhp = Engine.hero.d.maxhp !== undefined ? parseInt(Engine.hero.d.maxhp) : (Engine.hero.d.warrior_stats ? parseInt(Engine.hero.d.warrior_stats.maxhp) : 0);
            if (!maxhp) return;

            let hpPercent = (hp / maxhp) * 100;
            let threshold = parseInt(botSettings.autoheal.threshold) || 80;

            // Start leczenia
            if (hpPercent < threshold && !window.isRegeneratingToFull) {
                window.isRegeneratingToFull = true;
                let msg = `🩸 Niski poziom HP (${hpPercent.toFixed(0)}%). Rozpoczynam leczenie do pełna...`;
                if (window.isExping && window.logExp) window.logExp(msg, "#ff5252");
                else if (window.logHero) window.logHero(msg, "#ff5252");
            }

            // TWARDE LECZENIE DO 100% (Czekamy na potwierdzenie od serwera)
            if (window.isRegeneratingToFull && hp >= maxhp) {
                window.isRegeneratingToFull = false;
                let msg = `💚 Zregenerowano siły (100%). Wracam do akcji.`;
                if (window.isExping && window.logExp) window.logExp(msg, "#4caf50");
                else if (window.logHero) window.logHero(msg, "#4caf50");
                return;
            }

            // Cykl konsumpcji
            if (window.isRegeneratingToFull && Date.now() > window.lastHealTime) {
                let items = [];
                if (Engine.items && Engine.items.d) items = Object.values(Engine.items.d);
                else if (Engine.heroEquipment && typeof Engine.heroEquipment.getHItems === 'function') items = Object.values(Engine.heroEquipment.getHItems());
                
                let ignoreList = (botSettings.autoheal.ignoreItems || "").toLowerCase().split('\n').map(s => s.trim()).filter(s => s.length > 0);
                let unidList = (botSettings.autoheal.unidItems || "").toLowerCase().split('\n').map(s => s.trim()).filter(s => s.length > 0);

                let validPotions = [];
                let heroLvl = parseInt(Engine.hero.d.lvl) || 1;

                items.forEach(i => {
                    let itemData = i.d || i;
                    if (!itemData || itemData.del || itemData.dead) return;
                    if (parseInt(itemData.cl) !== 16) return; // Tylko mikstury

                    let potName = String(itemData.name || i._cachedStats?.name || "").toLowerCase();
                    let statStr = String(itemData.stat || i._cachedStats?.stat || "").toLowerCase();
                    
                    if (ignoreList.some(ig => potName.includes(ig))) return;
                    if (unidList.some(un => potName.includes(un))) return;
                    if (statStr.includes('unid')) return; 

                    let reqLvlMatch = statStr.match(/reqlvl[=:](\d+)/) || statStr.match(/wymagany poziom:\s*(\d+)/);
                    if (reqLvlMatch) {
                        let reqLvl = parseInt(reqLvlMatch[1]);
                        if (heroLvl < reqLvl) return;
                    }

                    let heal = extractHeal(itemData);
                    if (heal > 0) validPotions.push({ pot: i, heal: heal, id: itemData.id });
                });
                if (validPotions.length > 0) {
                    window.isHealLocked = true;
                    let missingHp = maxhp - hp;
                    
                    // Wybór najlepszej mikstury do wyleczenia braku
                    validPotions.sort((a, b) => Math.abs(a.heal - missingHp) - Math.abs(b.heal - missingHp));
                    let bestPot = validPotions[0];
                    
                    // Wypicie potki
                    if (typeof Engine.heroEquipment !== 'undefined' && typeof Engine.heroEquipment.sendUseRequest === 'function') {
                        Engine.heroEquipment.sendUseRequest(bestPot.pot);
                    } else if (typeof Engine.items !== 'undefined' && typeof Engine.items.useItem === 'function') {
                        Engine.items.useItem(bestPot.id);
                    } else {
                        window._g(`moveitem&st=1&id=${bestPot.id}`);
                    }
                    
                    // KLUCZOWA ŁATKA: Symulujemy zjedzenie potki lokalnie.
                    // Dzięki temu bot od razu widzi, że ma 100% HP i nie spamuje potkami w oczekiwaniu na serwer!
                    if (Engine.hero.d.hp !== undefined) Engine.hero.d.hp = Math.min(maxhp, hp + bestPot.heal);
                    if (Engine.hero.d.warrior_stats) Engine.hero.d.warrior_stats.hp = Math.min(maxhp, hp + bestPot.heal);
                    
                    // Szybkie leczenie z odpowiednim marginesem błędu
                    window.lastHealTime = Date.now() + 350; 
                    setTimeout(() => { window.isHealLocked = false; }, 300);
                } else {
                    window.isRegeneratingToFull = false;
                    if (window.logHero) window.logHero(`⚠️ Skończyło Ci się jedzenie w plecaku! (Zbyt wysoki lvl / Lista ignorowanych)`, "#ffb300");
                }
            }
        }, 350);
    }
// --- DAEMON: AUTO-POTY (Kupowanie mikstur z humanizacją) ---
    if (!window.autoPotDaemonInstalled) {
        window.autoPotDaemonInstalled = true;
        window.autoPotState = { active: false, step: 0, nextActionTime: 0, targetNpc: null, targetItem: null };
        setInterval(() => {
            if (typeof Engine === 'undefined' || !Engine.hero || !Engine.heroEquipment) return;
            if (Engine.battle && Engine.battle.show) return;
            if (window.autoSellState && window.autoSellState.active) return;
            
            if (!window.autoPotState.active && botSettings.autopot && botSettings.autopot.enabled) {
                let potCount = Object.values(Engine.heroEquipment.getHItems?.() || {}).filter(i => Number(i?.st) === 0 && Number(i?.cl) === 16 && i?.getLeczyStat?.() != null).reduce((sum, i) => sum + (Number(i?.getAmount?.()) || 1), 0);
                if (potCount <= 0) {
                    if (typeof stopPatrol === 'function') stopPatrol(true);
                    window.autoPotState.active = true;
                    window.autoPotState.wasBerserkOn = botSettings.berserk && botSettings.berserk.enabled;
                    if (window.autoPotState.wasBerserkOn) {
                        botSettings.berserk.enabled = false;
                        let chkBerserk = document.getElementById('berserkEnabled');
                        if (chkBerserk) chkBerserk.checked = false;
                        if (typeof window.updateServerBerserk === 'function') window.updateServerBerserk();
                        if (window.logExp) window.logExp("🛡️ Wyłączam Berserka na czas powrotu do miasta.", "#ff9800");
                    }
                    let maxhp = parseInt(Engine.hero.d.maxhp) || (Engine.hero.d.warrior_stats ? parseInt(Engine.hero.d.warrior_stats.maxhp) : 0);
                    if (!maxhp) {
                        let hpEl = document.querySelector('.health-val') || document.querySelector('.hp-values');
                        if (hpEl && hpEl.innerText) {
                            let match = hpEl.innerText.match(/\/\s*(\d+)/);
                            if (match) maxhp = parseInt(match[1]);
                        }
                    }
                    maxhp = maxhp || 5000;
                    let currentLvl = Engine.hero.d.lvl || 1;
                    let targetHeal = Math.floor(maxhp * 0.30);
                    let minAcceptableHeal = targetHeal * 0.15; // Potka musi leczyć chociaż 15% tego co chcemy
                    
                    let currMap = Engine.map.d.name;
                    let availablePotions = [];
                    let healers = (window.DatabaseModule.kupcy || []).filter(k => k.npc_name && k.npc_name.toLowerCase().includes('uzdrow'));
                    
                    healers.forEach(k => {
                        let dist = Infinity;
                        if (k.map_name === currMap) {
                            dist = 0;
                        } else {
                            let path = typeof getShortestPath === 'function' ? getShortestPath(currMap, k.map_name) : null;
                            if (path && path.length > 0) dist = path.length;
                        }
                        
                        if (dist !== Infinity && k.items) {
                            k.items.forEach(i => {
                                let statString = (i.stat || i.stats || i.tooltip_text || i.raw_detected_text || i.name || "").toLowerCase();
                                let itemLvl = i.lvl || 1;
                                let lvlMatch = statString.match(/reqlvl[=:](\d+)/) || statString.match(/poziom:\s*(\d+)/);
                                if (lvlMatch) itemLvl = parseInt(lvlMatch[1]);
                                if (itemLvl > currentLvl) return;
                                
                                let healAmount = 0;
                                let healMatch = statString.match(/leczy[=:](\d+)/) || statString.match(/leczy\s+([0-9\s]+)\s+punkt/);
                                if (healMatch) healAmount = parseInt(healMatch[1].replace(/\s/g, ''));
                                
                                if (healAmount > 0) {
                                    availablePotions.push({ npc: k, itemName: i.name.split('Typ:')[0].trim(), heal: healAmount, distance: dist });
                                }
                            });
                        }
                    });

                    if (availablePotions.length > 0) {
                        // SORTOWANIE (Priorytet nr 1: Dystans, Priorytet nr 2: Najlepsza potka u TEGO SAMEGO npc)
                        availablePotions.sort((a, b) => {
                            let aAcceptable = a.heal >= minAcceptableHeal;
                            let bAcceptable = b.heal >= minAcceptableHeal;
                            
                            // Odrzucamy śmieci, chyba że nie mamy wyjścia
                            if (aAcceptable && !bAcceptable) return -1;
                            if (!aAcceptable && bAcceptable) return 1;
                            
                            // Najważniejszy warunek: kto jest bliżej?
                            if (a.distance !== b.distance) return a.distance - b.distance;
                            
                            // Jeśli dystans ten sam, bierzemy potkę, która lepiej pasuje
                            return Math.abs(a.heal - targetHeal) - Math.abs(b.heal - targetHeal);
                        });

                        let bestChoice = availablePotions[0];
                        window.autoPotState.targetNpc = bestChoice.npc;
                        window.autoPotState.targetItem = bestChoice.itemName;
                        window.autoPotState.step = 1;
                        window.autoPotState.nextActionTime = Date.now() + 500;
                        window.isRushing = true;
                        
                        let msg = `🧪 Analiza... Szukam potki na ~${targetHeal} HP. Wybrano: ${bestChoice.itemName} (${bestChoice.heal} HP) od ${bestChoice.npc.npc_name} (Dystans: ${bestChoice.distance} map).`;
                        if (window.logHero) window.logHero(msg, "#e91e63");
                        if (window.logExp) window.logExp(msg, "#e91e63");
                    } else {
                        window.autoPotState.active = false;
                        if (window.logHero) window.logHero(`🚨 Brak mikstur! Handlarze w Twoim zasięgu nie mają nic na Twój level!`, "#e53935");
                        if (window.logExp) window.logExp(`🚨 Brak mikstur! Handlarze w Twoim zasięgu nie mają nic na Twój level!`, "#e53935");
                    }
                }
            }
            if (window.autoPotState.active) {
                if (Date.now() < window.autoPotState.nextActionTime) return;
                window.isExpSuspended = true;
                if (window.autoPotState.step === 1) {
                    let bestNpc = window.autoPotState.targetNpc;
                    if (Engine.map.d.name !== bestNpc.map_name) {
                        if (!window.isRushingToShop) {
                            window.isRushingToShop = true;
                            if (typeof window.rushToMap === 'function') window.rushToMap(bestNpc.map_name, bestNpc.x, bestNpc.y);
                        }
                    } else {
                        let dist = Math.abs(Engine.hero.d.x - bestNpc.x) + Math.abs(Engine.hero.d.y - bestNpc.y);
                        if (dist <= 2) {
                            window.isRushingToShop = false;
                            let npcs = Engine.npcs.check ? Engine.npcs.check() : Engine.npcs.d;
                            for (let i in npcs) {
                                let n = npcs[i].d || npcs[i];
                                if (n.nick === bestNpc.npc_name) {
                                    if (Engine.npcs.interact) Engine.npcs.interact(n.id);
                                    else window._g(`talk&id=${n.id}`);
                                    window.autoPotState.step = 2;
                                    window.autoPotState.nextActionTime = Date.now() + 800;
                                    break;
                                }
                            }
                        } else if (!window.isRushingToShop) {
                            let isMoving = Engine.hero.d.path && Engine.hero.d.path.length > 0;
                            if (!isMoving) { Engine.hero.autoGoTo({x: bestNpc.x, y: bestNpc.y}); window.autoPotState.nextActionTime = Date.now() + 1000; }
                            else { window.autoPotState.nextActionTime = Date.now() + 300; }
                        }
                    }
                } else if (window.autoPotState.step === 2) {
                    let shopWrapper = document.getElementById('shop-wrapper') || document.querySelector('.shop-wrapper, .shop-window');
                    if (shopWrapper && shopWrapper.style.display !== 'none') {
                        window.autoPotState.step = 3;
                        window.autoPotState.nextActionTime = Date.now() + 500;
                    } else {
                        let dialogOptions = Array.from(document.querySelectorAll('.dialog-item, .dialog-choice, .option, .answer, .dialog-answer, [data-option]'));
                        if (dialogOptions.length > 0) {
                            let shopOpt = dialogOptions.find(el => {
                                let txt = (el.innerText || el.textContent).toLowerCase();
                                return txt.includes('sklep') || txt.includes('handl') || txt.includes('wywar') || txt.includes('lecznicz') || txt.includes('towar');
                            });
                            if (shopOpt) {
                                let humanDelay = Math.floor(Math.random() * 401) + 400;
                                window.autoPotState.nextActionTime = Date.now() + humanDelay + 500;
                                setTimeout(() => {
                                    if (window.jQuery) jQuery(shopOpt).trigger("click");
                                    if (typeof shopOpt.click === 'function') shopOpt.click();
                                    shopOpt.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
                                    shopOpt.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
                                }, humanDelay);
                            }
                        }
                    }
                } else if (window.autoPotState.step === 3) {
                    let shopItems = Object.values(Engine.shop.items || {});
                    let itemToBuy = shopItems.find(i => {
                        let realName = (i._cachedStats && i._cachedStats.name) ? i._cachedStats.name : i.name;
                        return realName && realName.includes(window.autoPotState.targetItem);
                    });
                    if (itemToBuy && typeof Engine.shop.basket?.buyItem === 'function') {
                        let stacksToBuy = botSettings.autopot.stacks || 14;
                        let clicksNeeded = stacksToBuy * 3;
                        let msg = `🛒 Wrzucam ${stacksToBuy} staków do koszyka...`;
                        if (window.logHero) window.logHero(msg, "#8bc34a");
                        if (window.logExp) window.logExp(msg, "#8bc34a");
                        for (let i = 0; i < clicksNeeded; i++) Engine.shop.basket.buyItem(itemToBuy);
                        window.autoPotState.step = 4;
                        window.autoPotState.nextActionTime = Date.now() + Math.floor(Math.random() * 300) + 500;
                    } else {
                        window.autoPotState.active = false;
                        window.isExpSuspended = false;
                        window.isRushing = false;
                        window.lastExpMap = null;
                    }
                } else if (window.autoPotState.step === 4) {
                    const root = Engine.shop?.wnd?.$?.[0] || document;
                    if (typeof Engine.shop.basket?.finalize === 'function') Engine.shop.basket.finalize();
                    const acceptBtn = [...root.querySelectorAll("button, div, a, span")].find(el => /akceptuj|kup/i.test((el.textContent || "").trim()) && el.offsetParent);
                    if (acceptBtn) {
                        if (window.jQuery) jQuery(acceptBtn).trigger("click");
                        acceptBtn.click();
                        acceptBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
                    }
                    let msg = `✅ Otrzymano mikstury. Zamykam i wracam do pracy.`;
                    if (window.logHero) window.logHero(msg, "#4caf50");
                    if (window.logExp) window.logExp(msg, "#4caf50");
                    window.autoPotState.active = false;
                    window.isExpSuspended = false;
                    window.isRushing = false;
                    window.isRushingToShop = false;
                    if (typeof Engine.shop.close === 'function') Engine.shop.close();
                    let closeBtn = document.querySelector('.shop-close-btn, .close-button, .window-close, .close-cross');
                    if (closeBtn) closeBtn.click();
                    window.lastExpMap = null;
                }
            }
        }, 500);
    }

   // --- DAEMON: AUTO-SPRZEDAŻ Z LUDZKĄ MECHANIKĄ SPRZEDAŻY TOREB ---
    if (!window.autoSellDaemonInstalled) {
        window.autoSellDaemonInstalled = true;
        window.autoSellState = { active: false, step: 0, oldGold: 0, bagToSell: 1, nextActionTime: 0, lastFreeSlots: 0, failedNPCs: [], shopWaitStartTime: 0, targetNpc: null };
        window.runSuperSellerBagAndAccept = function(bagNo, delay = 250) {
            const root = typeof Engine !== 'undefined' && Engine.shop && Engine.shop.wnd && Engine.shop.wnd.$ ? Engine.shop.wnd.$[0] : document;
            const btn = root.querySelector(`.btn-num.grab-bag-${bagNo}`);
            if (!btn) return false;
            if (window.jQuery) jQuery(btn).trigger("click");
            btn.click();
            btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
            btn.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
            btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
            setTimeout(() => {
                if (typeof Engine !== 'undefined' && Engine.shop && Engine.shop.basket && typeof Engine.shop.basket.finalize === 'function') {
                    Engine.shop.basket.finalize();
                }
                const acceptBtn = [...root.querySelectorAll("button, div, a, span")].find(el => /akceptuj|sprzedaj/i.test((el.textContent || "").trim()) && el.offsetParent);
                if (acceptBtn) {
                    if (window.jQuery) jQuery(acceptBtn).trigger("click");
                    acceptBtn.click();
                    acceptBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
                }
                if (window.logHero) window.logHero(`✅ Zaakceptowano sprzedaż torby ${bagNo}.`, "#8bc34a");
                if (window.logExp) window.logExp(`✅ Zaakceptowano sprzedaż torby ${bagNo}.`, "#8bc34a");
            }, delay);
            return true;
        };

        setInterval(() => {
            if (typeof Engine === 'undefined' || !Engine.hero || !Engine.heroEquipment) return;
            if (Engine.battle && Engine.battle.show) return;
            
            if (!window.autoSellState.active && botSettings.autosell && botSettings.autosell.enabled) {
                const s = typeof window.getBagStats === 'function' ? window.getBagStats() : { freeSlots: 99, totalCapacity: 0 };
                if (s.freeSlots <= 0 && s.totalCapacity > 0) {
                    if (typeof stopPatrol === 'function') stopPatrol(true);
                    window.autoSellState.active = true;
                    window.autoSellState.step = 1;
                    window.autoSellState.nextActionTime = 0;
                    window.autoSellState.failedNPCs = []; // Reset blacklisty przy nowej sesji
                    window.autoSellState.shopWaitStartTime = 0;
                    window.isRushingToShop = false;
                    window.isRushing = true;
                    window.autoSellState.wasBerserkOn = botSettings.berserk && botSettings.berserk.enabled;
                    if (window.autoSellState.wasBerserkOn) {
                        botSettings.berserk.enabled = false;
                        let chkBerserk = document.getElementById('berserkEnabled');
                        if (chkBerserk) chkBerserk.checked = false;
                        if (typeof window.updateServerBerserk === 'function') window.updateServerBerserk();
                        if (window.logExp) window.logExp("🛡️ Wyłączam Berserka na czas powrotu do sklepu.", "#ff9800");
                    }
                    let msg = `🎒 TORBA PEŁNA → przerywam inne akcje i idę sprzedać!`;
                    if (window.logHero) window.logHero(msg, "#ffb300");
                    if (window.logExp) window.logExp(msg, "#ffb300");
                }
            }
            
            if (window.autoSellState.active) {
                if (Date.now() < window.autoSellState.nextActionTime) return;
                window.isExpSuspended = true;
                
// --- DEFINICJA TWOICH ASYNCHRONICZNYCH FUNKCJI ---
                if (!window.__asyncShopHelpersInstalled) {
                    window.__asyncShopHelpersInstalled = true;
                    
                    window.sleep = ms => new Promise(r => setTimeout(r, ms));
                    
                    window.waitFor = async (cond, timeout = 5000, interval = 100) => {
                        let start = Date.now();
                        while (Date.now() - start < timeout) {
                            try { if (cond()) return true; } catch(e) {}
                            await window.sleep(interval);
                        }
                        return false;
                    };
                    
                    window.getOpenDialogue = () => document.querySelector(".dialogue-window.is-open, #dialog");
                    
                    window.findShopDialogueOption = () => {
                        const byClass = document.querySelector(".dialogue-window.is-open .dialogue-window-answer.line_shop");
                        if (byClass) return byClass;
                        const answers = [...document.querySelectorAll(".dialogue-window.is-open .dialogue-window-answer, .dialog-custom-scroll .answer, .dialog-window .answer")];
                        return answers.find(el => {
                            const txt = (el.innerText || el.textContent || "").toLowerCase();
                            return txt.includes("pokaż mi, co masz na sprzedaż") || txt.includes("co masz na sprzedaż") || txt.includes("sprzedaż") || txt.includes("sprzedaz") || txt.includes("handel") || txt.includes("kup");
                        }) || null;
                    };
                    
window.openShopAsync = async (namePart) => {
                        const sleep = ms => new Promise(r => setTimeout(r, ms));
                        const targetName = (namePart || "").toLowerCase();

                        // 1. ZABEZPIECZENIE: Czekamy, aż zniknie ekran ładowania mapy
                        while (Engine.map?.isLoading) {
                            await sleep(100);
                        }
                        await sleep(500); // Twardy oddech po załadowaniu mapy (żeby zespawniło NPC)

                        // 2. SZUKAMY NPC (Wg Twojego schematu)
                        let npc = null;
                        for (let k = 0; k < 50; k++) {
                            npc = Object.values(Engine.npcs?.check?.() || {})
                                .map(n => n?.d || n)
                                .find(n => (n.nick || "").toLowerCase().includes(targetName));
                            
                            if (npc) break;
                            await sleep(100);
                        }

                        if (!npc) {
                            console.warn("❌ brak NPC:", namePart);
                            return false;
                        }

                        console.log(`🚶 Idę do ${npc.nick}...`);

                        // 🔑 poprawne wywołanie
                        try { Engine.hero.autoGoTo({x: npc.x, y: npc.y}); } catch(e){}

                        // ⏳ czekaj aż podejdzie
                        for (let i = 0; i < 40; i++) {
                            const h = Engine.hero?.d || Engine.hero;
                            if (!h) continue;
                            const dist = Math.max(Math.abs(h.x - npc.x), Math.abs(h.y - npc.y));

                            if (dist <= 1) break;
                            
                            // Ponawiamy komendę co 1 sekundę na wypadek zgubienia ścieżki
                            if (i > 0 && i % 10 === 0 && dist > 1) { 
                                try { Engine.hero.autoGoTo({x: npc.x, y: npc.y}); } catch(e){}
                            }
                            
                            await sleep(100);
                        }

                        console.log("🛑 Odblokowuję stop...");
                        if (Engine.hero) Engine.hero.stop = false;

                        await sleep(300);

                        // Jeżeli cel to Elita (nie sprzedawca), kończymy tu pracę, zaraz zacznie się walka
                        if (npc.type === 2 || npc.type === 3) return true;

                        console.log("💬 Rozmowa...");

                        try { Engine.npcs?.clickNpc?.(npc.id); } catch(e) {}
                        await sleep(200);

                        try { Engine.hero?.sendRequestToTalk?.(npc.id); } catch(e) {}
                        
                        // Zapas awaryjny (do wstecznej kompatybilności)
                        try { if (typeof window._g === 'function') window._g(`talk&id=${npc.id}`); } catch(e) {}

                        await sleep(500);

                        // 🛒 SZUKAMY PRZYCISKU SKLEPU
                        let shopBtn = null;
                        for (let i = 0; i < 20; i++) {
                            shopBtn = [...document.querySelectorAll(".dialogue-window-answer, .dialog-custom-scroll .answer, .dialog-window .answer, #dialog li")]
                                .find(el => {
                                    let txt = (el.innerText || el.textContent || "").toLowerCase();
                                    return txt.includes("co masz") || txt.includes("sprzeda") || txt.includes("handel") || txt.includes("kup");
                                });
                            if (shopBtn) break;
                            await sleep(150);
                        }

                        if (!shopBtn) {
                            console.warn("❌ brak opcji sklepu u:", npc.nick);
                            return false;
                        }

                        console.log("🛒 Otwieram sklep...");
                        try { shopBtn.click(); } catch(e){}

                        // ⏳ Czekamy na załadowanie interfejsu sklepu
                        for (let i = 0; i < 30; i++) {
                            let shopOpened = !!(
                                Engine?.shop?.wnd || Engine?.shop?.getData?.() ||
                                document.querySelector(".shop-window, .shop, .trade-window, .merchant-window")
                            );
                            if (shopOpened) break;
                            await sleep(100);
                        }

                        await sleep(400); // Ostatni margines czasu na zsynchronizowanie plecaka
                        return true;
                    };
} // <--- TEN JEDEN NAWIAS NAPRAWIA CAŁY SKRYPT!

                // --- GŁÓWNA LOGIKA KROKU 1 ---
                if (window.autoSellState.step === 1) {
                    if (!window.autoSellState.failedNPCs) {
                        window.autoSellState.failedNPCs = [];
                        window.autoSellState.targetNpc = null;
                        window.autoSellState.isAsyncRunning = false;
                    }

                    if (!window.autoSellState.targetNpc) {
                        let kupcy = window.DatabaseModule.kupcy || [];
                        let validMerchants = kupcy.filter(k => ['Flineks', 'Makin', 'Rozen', 'Tuni', 'Unil', 'Aukcjoner', 'Syntia', 'Jemen'].some(n => k.npc_name.includes(n)));
                        if (validMerchants.length === 0) validMerchants = kupcy;

                        if (window.autoSellState.failedNPCs.length > 0) {
                            validMerchants = validMerchants.filter(k => !window.autoSellState.failedNPCs.includes(k.npc_name));
                        }

                        if (validMerchants.length === 0) {
                            if (window.logHero) window.logHero("❌ Brak dostępnych kupców do sprzedaży!", "#e53935");
                            window.autoSellState.active = false;
                            window.autoSellState.failedNPCs = null;
                            window.isExpSuspended = false;
                            window.isRushing = false;
                            return;
                        }

                        let currMap = Engine.map.d.name;
                        let bestNpc = validMerchants.find(m => m.map_name === currMap);

                        if (!bestNpc) {
                            let bestDist = Infinity;
                            validMerchants.forEach(m => {
                                let path = typeof getShortestPath === 'function' ? getShortestPath(currMap, m.map_name) : null;
                                if (path && path.length < bestDist) { bestDist = path.length; bestNpc = m; }
                            });
                        }

                        if (!bestNpc) {
                            window.autoSellState.active = false;
                            return;
                        }
                        window.autoSellState.targetNpc = bestNpc;
                    }

                    let bestNpc = window.autoSellState.targetNpc;

                    if (Engine.map.d.name !== bestNpc.map_name) {
                        if (!window.isRushingToShop) {
                            window.isRushingToShop = true;
                            if (typeof window.rushToMap === 'function') window.rushToMap(bestNpc.map_name, bestNpc.x, bestNpc.y);
                        }
                    } else {
                        window.isRushingToShop = false;

                        // WYWOŁANIE TWOJEJ FUNKCJI ASYNCHRONICZNEJ
                        // Używamy blokady, żeby nie odpalić jej 100 razy naraz
                        if (!window.autoSellState.isAsyncRunning) {
                            window.autoSellState.isAsyncRunning = true;

                            window.openShopAsync(bestNpc.npc_name).then(success => {
                                if (success) {
                                    if (window.logExp) window.logExp(`✅ Otwieram sklep u: ${bestNpc.npc_name}`, "#ffb300");
                                    window.autoSellState.step = 3; // Sukces - przechodzimy do sprzedaży!
                                    window.autoSellState.nextActionTime = Date.now() + 1000;
                                } else {
                                    if (window.logHero) window.logHero(`⚠️ Problem z otwarciem sklepu u: ${bestNpc.npc_name}. Szukam innego...`, "#ff9800");
                                    let closeBtn = document.querySelector('.dialogue-window.is-open .close-button, #dialog .close-button, .dialog-window .close-button');
                                    if (closeBtn) closeBtn.click();
                                    window.autoSellState.failedNPCs.push(bestNpc.npc_name);
                                    window.autoSellState.targetNpc = null;
                                }
                                window.autoSellState.isAsyncRunning = false; // Zdejmujemy blokadę
                            });
                        }
                    }
                } else if (window.autoSellState.step === 3) {
                    let s = typeof window.getBagStats === 'function' ? window.getBagStats() : { bagsCount: 4 };
                    if (window.autoSellState.bagToSell <= s.bagsCount) {
                        window.runSuperSellerBagAndAccept(window.autoSellState.bagToSell, 300);
                        window.autoSellState.bagToSell++;
                        window.autoSellState.nextActionTime = Date.now() + 1500;
                    } else {
                        window.autoSellState.step = 4;
                        window.autoSellState.nextActionTime = Date.now() + 1000;
                    }
                } else if (window.autoSellState.step === 4) {
                    let stats = typeof window.getBagStats === 'function'
                        ? window.getBagStats()
                        : { freeSlots: 99 };

                    if (stats.freeSlots > window.autoSellState.lastFreeSlots) {
                        window.autoSellState.lastFreeSlots = stats.freeSlots;
                        window.autoSellState.bagToSell = 1;
                        window.autoSellState.step = 3;
                        window.autoSellState.nextActionTime = Date.now() + 500;
                    } else {
                        let profit = Engine.hero.d.gold - window.autoSellState.oldGold;

                        if (profit > 0) {
                            let msg = `✅ Opróżnianie zakończone! Zarobek: ${profit.toLocaleString()} zł. Wracam do pracy.`;
                            if (window.logHero) window.logHero(msg, "#4caf50");
                            if (window.logExp) window.logExp(msg, "#4caf50");
                        }

                        // Pełny Reset po zakończeniu
                        window.autoSellState.active = false;
                        window.autoSellState.failedNPCs = [];
                        window.autoSellState.targetNpc = null;
                        window.autoSellState.isAsyncRunning = false;
                        window.isExpSuspended = false;
                        window.isRushing = false;
                        window.isRushingToShop = false;

                        if (typeof Engine.shop?.close === 'function') Engine.shop.close();

                        let closeBtn = document.querySelector('.shop-close-btn, .close-button, .window-close, .close-cross');
                        if (closeBtn) closeBtn.click();

                        window.lastExpMap = null;
                    }
                }
            } // Tutaj zamykamy warunki czasu i active
        }, 1000); // POPRAWIONE ZAMKNIĘCIE PĘTLI Z PRZECINKIEM! Zmieniłem na 1000ms zgodnie z oryginałem.
    }
// --- DAEMON: DETEKCJA ZAPADKI (ALARM + HUMAN STOP) ---
    if (!window.captchaDaemonInstalled) {
        window.captchaDaemonInstalled = true;
        window.playerAlertTriggered = false;
        window.lastChatLength = 0;

        // Zmienne stanu
        window.__captchaPhase = "none"; 
        window.__captchaLock = false; 
        window.__wasExpingBeforeCaptcha = false;
        window.__wasPatrollingBeforeCaptcha = false;

        // --- FUNKCJE HUMANIZUJĄCE ---
        function randomDelay(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
        function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

        // --- DETEKCJA OKIEN ---
        function getPreCaptcha() {
            const preEl = document.querySelector('.pre-captcha, .zapadka-window, #captcha-alert, .zapadka-icon');
            if (preEl && preEl.offsetParent !== null) {
                const text = (preEl.innerText || preEl.textContent || "").trim();
                if (text.includes("Rozwiąż") || text.includes("Zagadka") || preEl.classList.contains('show')) {
                    return preEl; 
                }
            }
            return null;
        }

        function getCaptchaWindow() {
            const win = document.querySelector('.captcha, .c-window.border-window.captcha-window, .margo-window[data-wnd="zapadka"]');
            if (win && win.offsetParent !== null) {
                const text = (win.innerText || win.textContent || "").trim();
                if (text.includes("Zagadka") || text.includes("Potwierdzam") || text.includes("pozostałych prób")) {
                    return win;
                }
            }
            return null;
        }

// --- ZSYNCHRONIZOWANA PĘTLA STRAŻNIKA (Z AUTO-WZNOWIENIEM) ---
        setInterval(async () => {
            if (window.__captchaLock) return;

            let fullWin = getCaptchaWindow();
            let preWin = getPreCaptcha();

            // Sytuacja 1: Zapadki brak (Czysto lub właśnie ją rozwiązałeś)
            if (!fullWin && !preWin) {
                if (window.__captchaPhase === "manual_waiting") {
                    window.__captchaPhase = "resuming"; // Blokujemy wielokrotne wznowienie
                    
                    let delay = randomDelay(500, 2000); // Losujemy czas od 0.5s do 2s
                    if (window.logExp) window.logExp(`✅ Zapadka zniknęła. Wznawiam pracę za ${(delay/1000).toFixed(1)}s...`, "#4caf50");
                    if (window.logHero) window.logHero(`✅ Zapadka zniknęła. Wznawiam pracę za ${(delay/1000).toFixed(1)}s...`, "#4caf50");
                    
                    setTimeout(() => {
                        // Wznawianie Expienia
                        if (window.__wasExpingBeforeCaptcha && !window.isExping) {
                            let btn = document.getElementById('btnStartExp');
                            if (btn) btn.click();
                        }
                        
                        // Wznawianie Patrolu za Herosem (Działa nawet jeśli bot był w trakcie zmiany mapy!)
                        if (window.__wasPatrollingBeforeCaptcha && !window.isPatrolling) {
                            if (typeof startPatrol === 'function') startPatrol();
                        }
                        
                        window.__captchaPhase = "none";
                    }, delay);
                }
                return;
            }

          // Sytuacja 2: Zapadka pojawiła się pierwszy raz
            if (window.__captchaPhase === "none") {
                // Ignorujemy, jeśli bot stoi w miejscu wyłączony
                if (!window.isExping && !window.isPatrolling && !window.isRushing) return;

                window.__captchaLock = true; // ZAKŁADAMY KŁÓDKĘ
                window.__captchaPhase = "manual_waiting";
                
                // KRYTYCZNA POPRAWKA: Bot zapisuje, czy patrolował LUB czy akurat zmieniał mapę (Rushing)
                window.__wasExpingBeforeCaptcha = window.isExping;
                window.__wasPatrollingBeforeCaptcha = window.isPatrolling || window.isRushing;

                // Alarm dźwiękowy i powiadomienie (Z BLOKADĄ PRZED DUBLOWANIEM SPAMU)
                if (botSettings.exp && botSettings.exp.captchaAlert) {
                    if (!window.__lastCaptchaNotif || Date.now() - window.__lastCaptchaNotif > 15000) {
                        window.__lastCaptchaNotif = Date.now();

                        // PUSH DISCORD O ZAPADCE
                        if (botSettings.discord?.alerts?.captcha) {
                            window.sendDiscordWebhook("🚨 [ZAPADKA] Wykryto Captcha!", "Gra wymaga Twojej uwagi! Zatrzymano bota.", 16711680);
                        }
                        
                        try { 
                            let audio = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg'); 
                            audio.play(); 
                            setTimeout(() => { try{audio.pause(); audio.currentTime=0;}catch(e){} }, 2000); 
                        } catch(e) {}
                        
                        window.focus();
                        if (Notification.permission === "granted") {
                            let notif = new Notification("🚨 ALARM: ZAPADKA!", { body: "Ktoś Cię sprawdza! Kliknij, aby otworzyć grę.", requireInteraction: true });
                            notif.onclick = function() { window.focus(); this.close(); };
                        }
                    }
                }
                
                if (window.logExp) window.logExp("🚨 [Zapadka] Wyskoczyła zapadka! Odtwarzam alarm...", "#ff5252");
                if (window.logHero) window.logHero("🚨 Wyskoczyła zapadka! Zatrzymuję bota na czas rozwiązania.", "#ff5252");

                // Hamulec awaryjny
                if (window.isExping) {
                    let btn = document.getElementById('btnStartExp');
                    if (btn) btn.click();
                }
                if (typeof stopPatrol === 'function') stopPatrol(true);
                
                window.__captchaLock = false; // ŚCIĄGAMY KŁÓDKĘ
            }

        }, 500);

  // --- CZĘŚĆ 2: DETEKCJA GRACZY (Smart Player Radar - Zbiorczy) ---
        window.alertedPlayersList = window.alertedPlayersList || new Set();

        setInterval(() => {
            let isBotActive = window.isExping || (typeof isPatrolling !== 'undefined' && isPatrolling);
            
let checkBrowser = botSettings.exp?.playerAlert;
            let checkDiscord = botSettings.discord?.alerts?.player;

            if ((checkBrowser || checkDiscord) && isBotActive) {
                if (typeof Engine === 'undefined' || !Engine.others || !Engine.hero) return;

                let others = typeof Engine.others.check === 'function' ? Engine.others.check() : Engine.others.d;
                if (!others) return;

                let myNick = (Engine.hero.d && Engine.hero.d.nick) ? Engine.hero.d.nick : "";
                const players = Object.values(others).filter(o => o?.isPlayer && o?.d?.nick && o.d.nick !== myNick).map(o => ({ id: o.d.id || o.id, nick: o.d.nick, lvl: o.d.lvl, x: o.d.x, y: o.d.y }));

                let currentIds = new Set(players.map(p => p.id));
                for (let id of window.alertedPlayersList) { if (!currentIds.has(id)) window.alertedPlayersList.delete(id); }

                let newPlayers = [];
                players.forEach(p => { if (!window.alertedPlayersList.has(p.id)) { window.alertedPlayersList.add(p.id); newPlayers.push(p); } });

                if (newPlayers.length > 0) {
                    let msgTitle = newPlayers.length === 1 ? `👁️ Wykryto Gracza!` : `👁️ Wykryto Graczy (${newPlayers.length})!`;
                    let msgBody = newPlayers.map(p => `- ${p.nick} (${p.lvl} lvl)`).join('\n');
                    let logBody = newPlayers.map(p => `${p.nick} (${p.lvl} lvl)`).join('<br> &nbsp;&nbsp;&nbsp; ↳ ');
                    
                    // Niezależna Przeglądarka
                    if (checkBrowser) {
                        if (window.logExp) window.logExp(`👁️ Wykryto obcych:<br> &nbsp;&nbsp;&nbsp; ↳ ${logBody}`, "#ffb300");
                        if (Notification.permission === "granted") new Notification(msgTitle, { body: msgBody });
                    }

                    // Niezależny Discord
                    if (checkDiscord) {
                        let mapName = typeof Engine !== 'undefined' ? Engine.map.d.name : "Nieznana Mapa";
                        window.sendDiscordWebhook(msgTitle, `${msgBody}\n**Mapa:** ${mapName}`, 16711680);
                    }

                    // Niezależne zablokowanie bota (wystarczy, że jedno z nich jest zaznaczone)
                    if (botSettings.exp.playerAlertStopBot || botSettings.discord?.stop?.player) {
                        if (typeof stopPatrol === 'function') stopPatrol(true); 
                        if (window.isExping) { let btn = document.getElementById('btnStartExp'); if (btn) btn.click(); }
                        if (window.logExp) window.logExp(`🛑 Zatrzymano bota, ponieważ wykryto intruzów!`, "#f44336");
                    }
                }
            } else if (!isBotActive) {
                window.alertedPlayersList.clear();
            }
        }, 1000);
    }
    // --- CZĘŚĆ 3: OBSERWATOR CZATU PRYWATNEGO (MutationObserver) ---
        window.__chatDomObserver?.disconnect?.();
        window.__seenPrivs = window.__seenPrivs || new Set();

        function getPrivateChatLines() {
            return [...document.querySelectorAll("div, span, p")]
                .map(el => (el.innerText || "").trim())
                .filter(t => {
                    if (!t || !t.includes("[Prywatny]") || !t.includes("->") || !t.includes(":")) return false;
                    if (t.length >= 200) return false;
                    const parts = t.split(":");
                    return parts.slice(1).join(":").trim().length > 0;
                });
        }

        function getMyNick() {
            return (typeof Engine !== 'undefined' && Engine.hero && Engine.hero.d) ? Engine.hero.d.nick : null;
        }

        // Zainicjuj listę widzianych wiadomości przy starcie, aby nie spamować starymi privami
        for (const line of getPrivateChatLines()) {
            window.__seenPrivs.add(line);
        }

        window.__chatDomObserver = new MutationObserver(() => {
            // Działa tylko gdy bot pracuje (Exp lub Patrol) i opcja jest ON
            let isBotActive = window.isExping || (typeof isPatrolling !== 'undefined' && isPatrolling);
           let checkBrowser = botSettings.exp?.chatAlert;
            let checkDiscord = botSettings.discord?.alerts?.chat;
            if (!(checkBrowser || checkDiscord) || !isBotActive) return;

            const myNick = getMyNick();
            if (!myNick) return;

            for (const line of getPrivateChatLines()) {
                if (window.__seenPrivs.has(line)) continue;
                window.__seenPrivs.add(line);

                // Sprawdzamy czy wiadomość jest DO NAS (nadawca -> Ja:)
                if (line.includes(`-> ${myNick}:`)) {
                    // Wyciąganie nadawcy i treści
                    // Format: [Prywatny] Nadawca -> Ja: Treść wiadomości
                    const senderMatch = line.match(/\[Prywatny\]\s+(.*?)\s+->/);
                    const sender = senderMatch ? senderMatch[1] : "Ktoś";
                    const message = line.split(`${myNick}:`)[1]?.trim() || "...";

                  // Niezależna Przeglądarka
                    if (checkBrowser) {
                        if (window.logExp) window.logExp(`📩 PRIV od ${sender}: ${message}`, "#e040fb");
                        if (Notification.permission === "granted") new Notification(`📩 Nowa wiadomość (Margo)`, { body: `${sender}: ${message}`, icon: 'https://www.margonem.pl/favicon.ico' });
                    }

                    // Niezależny Discord
                    if (checkDiscord) {
                        window.sendDiscordWebhook("📩 Otrzymano Wiadomość Prywatną", `**Od:** ${sender}\n**Treść:** ${message}`, 14828287);
                    }

                    // Niezależny Stop
                    if (botSettings.exp.chatAlertStopBot || botSettings.discord?.stop?.chat) {
                        if (typeof stopPatrol === 'function') stopPatrol(true);
                        if (window.isExping) { let btn = document.getElementById('btnStartExp'); if (btn) btn.click(); }
                        if (window.logExp) window.logExp(`🛑 Zatrzymano bota z powodu wiadomości prywatnej!`, "#f44336");
                    }
                    // 3. Opcjonalne zatrzymanie bota
                    if (botSettings.exp.chatAlertStopBot) {
                        if (typeof stopPatrol === 'function') stopPatrol(true);
                        if (window.isExping) {
                            let btn = document.getElementById('btnStartExp');
                            if (btn) btn.click();
                        }
                        if (window.logExp) window.logExp(`🛑 Zatrzymano bota z powodu wiadomości prywatnej!`, "#f44336");
                    }
                }
            }
        });

        // Podpięcie pod okno czatu
        const chatContainer = document.querySelector(".new-chat-window") || document.querySelector(".chat-layer") || document.body;
        window.__chatDomObserver.observe(chatContainer, { childList: true, subtree: true });

        // Czyść listę widzianych wiadomości przy wyłączaniu bota, żeby przy starcie znów był świeży
        setInterval(() => {
            let isBotActive = window.isExping || (typeof isPatrolling !== 'undefined' && isPatrolling);
            if (!isBotActive) window.__seenPrivs.clear();
        }, 5000);
  // --- DAEMON: ANTI-STUCK (Odwieszacz bota na bramach i zacinkach) ---
    if (!window.antiStuckDaemonInstalled) {
        window.antiStuckDaemonInstalled = true;
        window.lastStuckCheckPos = { x: -1, y: -1, map: "" };
        window.stuckIdleCount = 0;

        setInterval(() => {
            let isBotActive = window.isExping || (typeof isPatrolling !== 'undefined' && isPatrolling) || window.isRushing;
            if (!isBotActive) {
                window.stuckIdleCount = 0;
                return;
            }

            // Podstawowe zabezpieczenia przed błędnymi interwencjami (Nie przerywa gdy ładuje się mapa!)
            if (typeof Engine === 'undefined' || !Engine.hero || !Engine.hero.d || Engine.map.isLoading) {
                window.stuckIdleCount = 0;
                return;
            }
            if (Engine.battle && Engine.battle.show) return; 
            if (Engine.dead || Engine.hero.d.dead) return; 
            if (window.isHealLocked || window.isRegeneratingToFull) return; 
            if (window.__captchaPhase && window.__captchaPhase !== "none") return; 
            // ZABEZPIECZENIE: Nie wykonuj mikroruchów, jeśli celowo czekamy na respawn (45 sekund)
            if (window.isExping && window.expMapTransitionCooldown && Date.now() < window.expMapTransitionCooldown) {
                window.stuckIdleCount = 0;
                return;
            }

            let currentMap = Engine.map.d.name;
            let currentX = Engine.hero.d.x;
            let currentY = Engine.hero.d.y;
            let isMoving = Engine.hero.d.path && Engine.hero.d.path.length > 0;

            if (!isMoving) {
                if (window.lastStuckCheckPos.x === currentX && 
                    window.lastStuckCheckPos.y === currentY && 
                    window.lastStuckCheckPos.map === currentMap) {
                    
                    window.stuckIdleCount++;
                    
                    // ZMNIEJSZONY CZAS: Interweniuje po 5 sekundach zamiast 8!
                    if (window.stuckIdleCount >= 5) {
                        if (window.logHero) window.logHero("🔄 [Anti-Stuck] Wykryto zacięcie! Lekko odskakuję...", "#00e5ff");
                        
                        // ZAMIAST klikać pod siebie (co nic nie daje w drzwiach), robi realny krok w bok
                        let stepX = Math.max(0, currentX + (Math.random() > 0.5 ? 1 : -1));
                        let stepY = Math.max(0, currentY + (Math.random() > 0.5 ? 1 : -1));
                        Engine.hero.autoGoTo({x: stepX, y: stepY});

                        if (typeof isPatrolling !== 'undefined' && isPatrolling && typeof window.executePatrolStep === 'function') {
                            setTimeout(() => window.executePatrolStep(), 1500);
                        } else if (window.isRushing && typeof window.executeRushStep === 'function') {
                            setTimeout(() => window.executeRushStep(), 1500);
                        } else if (window.isExping && typeof window.expMainLoop === 'function') {
                            setTimeout(() => window.expMainLoop(), 1500);
                        }
                        
                        window.stuckIdleCount = 0; 
                    }
                } else {
                    window.stuckIdleCount = 1;
                    window.lastStuckCheckPos = { x: currentX, y: currentY, map: currentMap };
                }
            } else {
                window.stuckIdleCount = 0;
                window.lastStuckCheckPos = { x: currentX, y: currentY, map: currentMap };
            }
        }, 1000);
    }
  // --- DAEMON: ZABEZPIECZENIE PRZED WYBIEGNIĘCIEM POZA LISTĘ (UNDEFINED FIX) ---
        if (!window.undefinedMapFixInstalled) {
            window.undefinedMapFixInstalled = true;
            
            // Zapisujemy w pamięci oryginalną funkcję biegania
            const originalRushToMap = window.rushToMap;
            
            if (typeof originalRushToMap === 'function') {
                // Nadpisujemy ją naszą mądrzejszą wersją - TERAZ PRZYJMUJE WSZYSTKIE ARGUMENTY
                window.rushToMap = function(targetMap, tgtX, tgtY, fullPath, resumePatrol) {
                    
                    // Jeśli bot zgłupieje i spróbuje wziąć cel spoza listy
                    if (!targetMap || String(targetMap).trim() === 'undefined' || String(targetMap).trim() === 'null') {
                        
                        if (window.logHero) window.logHero("🔄 Zakończono pętlę. Wracam na pierwszą mapę z trasy!", "#00e5ff");
                        
                        // Awaryjne resetowanie liczników, niezależnie jakiej zmiennej używa reszta skryptu
                        if (typeof window.patrolIndex !== 'undefined') window.patrolIndex = 0;
                        if (typeof window.currentPatrolIndex !== 'undefined') window.currentPatrolIndex = 0;
                        if (typeof window.rushIndex !== 'undefined') window.rushIndex = 0;
                        
                        // Pobranie pierwszej mapy z pamięci bota
                        let firstMap = null;
                        if (window.rushFullPath && window.rushFullPath.length > 0) firstMap = window.rushFullPath[0];
                        else if (window.patrolPath && window.patrolPath.length > 0) firstMap = window.patrolPath[0];
                        else if (window.patrolMaps && window.patrolMaps.length > 0) firstMap = window.patrolMaps[0];
                        
                        if (firstMap) {
                            targetMap = firstMap; // Zastępujemy 'undefined' poprawną mapą!
                        } else {
                            // Twardy stop, jeśli tablice są całkowicie puste
                            if (window.logHero) window.logHero("❌ Brak map do patrolowania! Zatrzymuję bota.", "#f44336");
                            if (typeof stopPatrol === 'function') stopPatrol(true);
                            return; 
                        }
                    }
                    
                    // KLUCZOWE: Odpalamy prawdziwy bieg z już NAPRAWIONYM celem i PRZEKAZUJEMY FLAGĘ WZNOWIENIA PATROLU!
                    return originalRushToMap(targetMap, tgtX, tgtY, fullPath, resumePatrol);
                };
            }
        }
    // --- ŁATKA: EGZORCYZMY NA SKLONOWANYCH OKNACH I NAPRAWA PRZYCISKÓW ---
        setTimeout(() => {
            // 1. Usuwanie "duchów" - sklonowanych interfejsów, które blokowały przyciski
            const windowsToClean = ['heroNavGUI', 'heroSettingsGUI', 'heroGatewaysGUI', 'heroGoToGUI', 'heroExpBaseGUI', 'heroExpRecGUI', 'heroTeleportsGUI'];
            windowsToClean.forEach(id => {
                let copies = document.querySelectorAll('#' + id);
                if (copies.length > 1) {
                    // Usuwamy wszystkie OPRÓCZ ostatniego (bo to ostatnie jest widoczne)
                    for (let i = 0; i < copies.length - 1; i++) {
                        copies[i].remove();
                    }
                }
            });
        }, 3000);

        // 2. Kuloodporne podpięcie kliknięć (Nadpisuje stare, zepsute eventy)
        document.addEventListener('click', (e) => {
            if (e.target && e.target.closest('#btnOpenBrowserAlertsModule')) {
                e.stopPropagation(); 
                let p = document.getElementById('browserAlertsSettingsGUI');
                if (p) p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
            }
            if (e.target && e.target.closest('#btnOpenDiscordModule')) {
                e.stopPropagation();
                let p = document.getElementById('discordSettingsGUI');
                if (p) p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
            }
            if (e.target && e.target.closest('#btnOpenExpBase')) {
                e.stopPropagation(); // Blokuje stare zepsute komendy
                let p = document.getElementById('heroExpBaseGUI');
                if (p) {
                    p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
                    if (p.style.display === 'flex' && typeof window.renderExpProfiles === 'function') window.renderExpProfiles();
                }
            }
            if (e.target && e.target.closest('#btnOpenRecommendedExp')) {
                e.stopPropagation();
                let p = document.getElementById('heroExpRecGUI');
                if (p) {
                    p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
                    if (p.style.display === 'flex' && typeof window.renderRecommendedExp === 'function') window.renderRecommendedExp();
                }
            }
        }, true);
    // --- OSTATECZNA ŁATKA UI (TELEPORTY + PRZEŹROCZYSTOŚĆ) ---
        setTimeout(() => {
            // 1. Kasujemy "Duchy" - usuwamy okna z klasą 'hero-window' które wiszą luzem
            document.querySelectorAll('body > .hero-window#heroTeleportsGUI').forEach(el => el.remove());
            
            const windowsToClean = ['heroNavGUI', 'heroSettingsGUI', 'heroGatewaysGUI', 'heroGoToGUI', 'heroExpBaseGUI', 'heroExpRecGUI', 'browserAlertsSettingsGUI', 'discordSettingsGUI', 'heroTeleportsGUI'];
            windowsToClean.forEach(id => {
                let copies = document.querySelectorAll('#' + id);
                if (copies.length > 1) {
                    for (let i = 0; i < copies.length - 1; i++) copies[i].remove();
                }
            });
            
            // 2. Naprawiamy przycisk Teleportów (Wyświetlanie w dobrej zakładce)
            let properTpContainer = document.querySelector('#teleportsContainer #heroTeleportsGUI');
            let btnTp = document.getElementById('btnOpenTeleports');
            
            if (btnTp && properTpContainer) {
                // Nadpisujemy oryginalną funkcję rysującą, by na pewno trafiała do dobrego diva
                window.renderTeleportList = function() {
                    let tpList = typeof ZAKONNICY !== 'undefined' ? Object.keys(ZAKONNICY).sort() : ["Ithan", "Torneg", "Karka-han", "Werbin", "Eder", "Mythar", "Tuzmer", "Port Tuzmer", "Wioska Pszczelarzy", "Nithal", "Podgrodzie Nithal", "Thuzal", "Gildia Kupców - część zachodnia", "Brama Północy", "Zniszczone Opactwo", "Kwieciste Przejście", "Wzgórze Płaczek", "Nizinne Sady"];
                    let myNick = (typeof Engine !== 'undefined' && Engine.hero && Engine.hero.d && Engine.hero.d.nick) ? Engine.hero.d.nick : "Nieznany";
                    let html = `<div style="color:#a99a75; font-size:10px; margin-bottom:5px; text-align:center;">Zaznacz odblokowane teleporty dla: <b style="color:#00acc1;">${myNick}</b></div><div id="tpCheckboxes" style="display:flex; flex-direction:column; gap:6px; overflow-y:auto; max-height: 250px;">`;
                    
                    tpList.forEach(map => {
                        let isChecked = (botSettings.unlockedTeleports && botSettings.unlockedTeleports[map]) ? 'checked' : '';
                        html += `<label style="display:flex; align-items:center; background:#1a1a1a; padding:4px; border:1px solid #333; cursor:pointer; color:#d4af37; font-size:11px; margin-bottom: 2px; border-left: 2px solid #00838f;"><input type="checkbox" class="chk-teleport" data-map="${map}" ${isChecked} style="margin-right:8px; cursor:pointer;"><b>${map}</b></label>`;
                    });
                    html += `</div><button id="btnSaveTeleportsManual" class="btn btn-go-sepia" style="margin-top:6px; color:#4caf50; font-weight:bold; border-color:#4caf50; width:100%; padding:6px;">💾 ZAPISZ TELEPORTY</button>`;
                    properTpContainer.innerHTML = html;
                };

                // Usuwamy stare eventy i dodajemy mocny listener
                let newBtnTp = btnTp.cloneNode(true);
                btnTp.parentNode.replaceChild(newBtnTp, btnTp);
                
                newBtnTp.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    // Ukrywamy inne listy
                    ['recommendedEqList', 'potionsList', 'shopsSearchWrapper'].forEach(id => {
                        let el = document.getElementById(id);
                        if (el) el.style.display = 'none';
                    });
                    
                    properTpContainer.style.display = properTpContainer.style.display === 'flex' ? 'none' : 'flex';
                    if (properTpContainer.style.display === 'flex') window.renderTeleportList();
                });
            }

            // 3. Włączamy Przeźroczystość tła w czasie rzeczywistym
            function setWindowOpacity(val) {
                let style = document.getElementById('dynamic-bg-opacity');
                if (!style) {
                    style = document.createElement('style');
                    style.id = 'dynamic-bg-opacity';
                    document.head.appendChild(style);
                }
                
                document.querySelectorAll('.hero-window').forEach(w => w.style.opacity = '1'); // Tekst zawsze w 100% widoczny!

                style.innerHTML = `
                    .hero-window { background: rgba(17, 17, 17, ${val}) !important; }
                    .gui-header { background: rgba(34, 34, 34, ${val}) !important; }
                    .gui-content { background: rgba(26, 29, 33, ${val}) !important; }
                    .tabs-wrapper { background: rgba(34, 34, 34, ${val}) !important; }
                    .list-item { background: rgba(34, 34, 34, ${val}) !important; }
                    #cordsListContainer, #heroMapListContainer, #gatewaysListContainer, #e2ListContainer, #kolosyListContainer, #expMapList, #recommendedEqList, #potionsList, #shopsSearchWrapper { background: rgba(20, 20, 20, ${val}) !important; }
                    .accordion-header { background: rgba(26, 26, 26, ${val}) !important; }
                `;
                localStorage.setItem('hero_opacity_v64', val);
            }

            let opacitySlider = document.getElementById('sliderOpacity');
            if (opacitySlider) {
                let savedOpacity = localStorage.getItem('hero_opacity_v64') || 0.95;
                opacitySlider.value = savedOpacity;
                setWindowOpacity(savedOpacity);
                opacitySlider.addEventListener('input', (e) => setWindowOpacity(e.target.value));
            }
        }, 1500);
    // --- OSTATECZNA ŁATKA TELEPORTÓW ---
        setTimeout(() => {
            // 1. Brutalne zniszczenie pływającego okna TP
            document.querySelectorAll('.hero-window#heroTeleportsGUI').forEach(el => {
                if (el.parentElement === document.body) {
                    el.remove(); // Niszczy okno doczepione do głównego ekranu gry
                }
            });

            // 2. Naprawa funkcji rysującej (Używamy ścisłego querySelector zamiast getElementById)
            window.renderTeleportList = function() {
                let container = document.querySelector('#teleportsContainer #heroTeleportsGUI');
                if (!container) return;

                let tpList = typeof ZAKONNICY !== 'undefined' ? Object.keys(ZAKONNICY).sort() : ["Ithan", "Torneg", "Karka-han", "Werbin", "Eder", "Mythar", "Tuzmer", "Port Tuzmer", "Wioska Pszczelarzy", "Nithal", "Podgrodzie Nithal", "Thuzal", "Gildia Kupców - część zachodnia", "Brama Północy", "Zniszczone Opactwo", "Kwieciste Przejście", "Wzgórze Płaczek", "Nizinne Sady"];
                let myNick = (typeof Engine !== 'undefined' && Engine.hero && Engine.hero.d && Engine.hero.d.nick) ? Engine.hero.d.nick : "Nieznany";
                let html = `<div style="color:#a99a75; font-size:10px; margin-bottom:5px; text-align:center;">Zaznacz odblokowane teleporty dla: <b style="color:#00acc1;">${myNick}</b></div><div style="display:flex; flex-direction:column; gap:6px; overflow-y:auto; max-height:250px;">`;

                tpList.forEach(map => {
                    let isChecked = (botSettings.unlockedTeleports && botSettings.unlockedTeleports[map]) ? 'checked' : '';
                    html += `<label style="display:flex; align-items:center; background:#1a1a1a; padding:4px; border:1px solid #333; cursor:pointer; color:#d4af37; font-size:11px; margin-bottom: 2px; border-left: 2px solid #00838f;"><input type="checkbox" class="chk-teleport" data-map="${map}" ${isChecked} style="margin-right:8px; cursor:pointer;"><b>${map}</b></label>`;
                });

                html += `</div><button id="btnSaveTeleportsManual" class="btn btn-go-sepia" style="margin-top:6px; color:#4caf50; font-weight:bold; border-color:#4caf50; width:100%; padding:6px;">💾 ZAPISZ TELEPORTY</button>`;
                container.innerHTML = html;
            };

            // 3. Naprawa przycisku (działa jak włącz/wyłącz)
            let btnTp = document.getElementById('btnOpenTeleports');
            if (btnTp) {
                // Klonujemy przycisk, żeby usunąć z niego stare, zepsute eventy (kradnące kliknięcia)
                let newBtn = btnTp.cloneNode(true);
                btnTp.parentNode.replaceChild(newBtn, btnTp);
                
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    
                    // Ukryj resztę zakładek (Eq, Potki, Sklepy), jeśli są włączone
                    ['recommendedEqList', 'potionsList', 'shopsSearchWrapper'].forEach(id => {
                        let el = document.getElementById(id);
                        if (el) el.style.display = 'none';
                    });
                    
                    // Znajdź i przełącz właściwy, wewnętrzny kontener
                    let innerContainer = document.querySelector('#teleportsContainer #heroTeleportsGUI');
                    if (innerContainer) {
                        if (innerContainer.style.display === 'flex') {
                            innerContainer.style.display = 'none';
                        } else {
                            innerContainer.style.display = 'flex';
                            if (typeof window.renderTeleportList === 'function') window.renderTeleportList();
                        }
                    }
                });
            }
        }, 2000);

    // --- STRAŻNIK RUCHU (Ochrona przed paraliżem na bramach) ---
    setTimeout(() => {
        if (!window.__movementGuardInstalled && typeof Engine !== 'undefined' && Engine.hero) {
            window.__movementGuardInstalled = true;
            window.originalAutoWalk = Engine.hero.autoWalk;
            Engine.hero.autoWalk = function(x, y, ...args) {
                if (window.__movementLock && Date.now() < window.__movementLock) return false; 
                return window.originalAutoWalk.call(this, x, y, ...args);
            };
        }
    }, 3000);
  // ==========================================
        // GWARANTOWANY ZAPIS I PODPIĘCIE MODUŁÓW (AUTO-ZAPIS)
        // ==========================================
        setTimeout(() => {
            // Wymuszona struktura pamięci
            if (!botSettings.discord) botSettings.discord = { enabled: false, url: '', userId: '', alerts: {}, stop: {} };
            if (!botSettings.discord.alerts) botSettings.discord.alerts = { hero: true, player: true, chat: true, captcha: true };
            if (!botSettings.discord.stop) botSettings.discord.stop = { hero: true, player: false, chat: false, captcha: true };

            // 1. Zabezpieczone Przyciski (Otwarcia Okienek)
            const openBrowserAlerts = document.getElementById('btnOpenBrowserAlertsModule');
            if (openBrowserAlerts) {
                let freshBtn = openBrowserAlerts.cloneNode(true);
                openBrowserAlerts.parentNode.replaceChild(freshBtn, openBrowserAlerts);
                freshBtn.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    let p = document.getElementById('browserAlertsSettingsGUI');
                    if (p) p.style.display = p.style.display === 'none' ? 'flex' : 'none';
                });
            }

            const openDiscordAlerts = document.getElementById('btnOpenDiscordModule');
            if (openDiscordAlerts) {
                let freshBtn = openDiscordAlerts.cloneNode(true);
                openDiscordAlerts.parentNode.replaceChild(freshBtn, openDiscordAlerts);
                freshBtn.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    let p = document.getElementById('discordSettingsGUI');
                    if (p) p.style.display = p.style.display === 'none' ? 'flex' : 'none';
                });
            }

            // 2. Automatyczne Wstrzykiwanie Zapisanych Danych (Na start)
            let urlInput = document.getElementById('discordWebhookUrl');
            if (urlInput) urlInput.value = botSettings.discord.url || '';

            let idInput = document.getElementById('discordUserId');
            if (idInput) idInput.value = botSettings.discord.userId || '';

            // Aktualizujemy Checkboxy w kodzie z bazy danych
            let checks = [
                {id: 'discordAlert_Hero', val: botSettings.discord.alerts.hero},
                {id: 'discordStop_Hero', val: botSettings.discord.stop.hero},
                {id: 'discordAlert_Player', val: botSettings.discord.alerts.player},
                {id: 'discordStop_Player', val: botSettings.discord.stop.player},
                {id: 'discordAlert_Chat', val: botSettings.discord.alerts.chat},
                {id: 'discordStop_Chat', val: botSettings.discord.stop.chat},
                {id: 'discordAlert_Captcha', val: botSettings.discord.alerts.captcha},
                {id: 'discordStop_Captcha', val: botSettings.discord.stop.captcha},
                
                {id: 'captchaAlert', val: botSettings.exp.captchaAlert},
                {id: 'playerAlert', val: botSettings.exp.playerAlert},
                {id: 'playerAlertStopBot', val: botSettings.exp.playerAlertStopBot},
                {id: 'chatAlert', val: botSettings.exp.chatAlert},
                {id: 'chatAlertStopBot', val: botSettings.exp.chatAlertStopBot}
            ];
            checks.forEach(c => {
                let el = document.getElementById(c.id);
                if (el) el.checked = c.val;
            });

            // 3. TWARDE AUTO-ZAPISYWANIE PRZEGLĄDARKI 
            document.querySelectorAll('#browserAlertsSettingsGUI input[type="checkbox"]').forEach(chk => {
                chk.addEventListener('change', (e) => {
                    let id = e.target.id;
                    if (id === 'captchaAlert') botSettings.exp.captchaAlert = e.target.checked;
                    if (id === 'playerAlert') { botSettings.exp.playerAlert = e.target.checked; if (e.target.checked && Notification.permission !== "granted") Notification.requestPermission(); }
                    if (id === 'playerAlertStopBot') botSettings.exp.playerAlertStopBot = e.target.checked;
                    if (id === 'chatAlert') { botSettings.exp.chatAlert = e.target.checked; if (e.target.checked && Notification.permission !== "granted") Notification.requestPermission(); }
                    if (id === 'chatAlertStopBot') botSettings.exp.chatAlertStopBot = e.target.checked;
                    saveSettings(); // Wpychamy do pamięci przy każdym kliknięciu!
                });
            });

            // 4. TWARDE AUTO-ZAPISYWANIE DISCORDA
            const discordMap = [
                { id: 'discordAlert_Hero', type: 'alerts', key: 'hero' },
                { id: 'discordStop_Hero', type: 'stop', key: 'hero' },
                { id: 'discordAlert_Player', type: 'alerts', key: 'player' },
                { id: 'discordStop_Player', type: 'stop', key: 'player' },
                { id: 'discordAlert_Chat', type: 'alerts', key: 'chat' },
                { id: 'discordStop_Chat', type: 'stop', key: 'chat' },
                { id: 'discordAlert_Captcha', type: 'alerts', key: 'captcha' },
                { id: 'discordStop_Captcha', type: 'stop', key: 'captcha' }
            ];
            
            discordMap.forEach(cfg => {
                let el = document.getElementById(cfg.id);
                if (el) {
                    el.addEventListener('change', (e) => {
                        botSettings.discord[cfg.type][cfg.key] = e.target.checked;
                        saveSettings(); // Zapisuje dokładnie w chwili kliknięcia!
                    });
                }
            });

            // Reagowanie na tekst (link / ID) w czasie rzeczywistym
            if (urlInput) {
                urlInput.addEventListener('input', (e) => { 
                    botSettings.discord.url = e.target.value.trim(); 
                    botSettings.discord.enabled = botSettings.discord.url.length > 10;
                    saveSettings(); 
                });
            }
            if (idInput) {
                idInput.addEventListener('input', (e) => { 
                    botSettings.discord.userId = e.target.value.trim(); 
                    saveSettings(); 
                });
            }

            // 5. Osobisty Strażnik - od teraz służy tylko do testów
            let btnSaveDiscord = document.getElementById('btnSaveDiscord');
            if (btnSaveDiscord) {
                let freshSaveBtn = btnSaveDiscord.cloneNode(true);
                btnSaveDiscord.parentNode.replaceChild(freshSaveBtn, btnSaveDiscord);
                
                freshSaveBtn.innerText = "🚀 WYŚLIJ WIADOMOŚĆ TESTOWĄ";

                freshSaveBtn.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    if(botSettings.discord.enabled) {
                        window.sendDiscordWebhook("🟢 TEST POWIADOMIEŃ", "Wszystko działa! Twoje ustawienia są automatycznie zapisywane.", 5763719);
                        heroAlert("Wysłano wiadomość testową na Twój kanał Discord!");
                    } else {
                        heroAlert("Błąd: Uzupełnij URL Webhooka, by testować wysyłanie.");
                    }
                });
            }
        }, 1500);
    // --- STRAŻNIK RUCHU (Ochrona przed paraliżem na bramach) ---
    setTimeout(() => {
        if (!window.__movementGuardInstalled && typeof Engine !== 'undefined' && Engine.hero) {
            window.__movementGuardInstalled = true;
            window.originalAutoWalk = Engine.hero.autoWalk;
            Engine.hero.autoWalk = function(x, y, ...args) {
                if (window.__movementLock && Date.now() < window.__movementLock) return false; 
                return window.originalAutoWalk.call(this, x, y, ...args);
            };
        }
    }, 3000);
})(); // Koniec kodu
