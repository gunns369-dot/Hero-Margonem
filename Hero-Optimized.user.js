
// ==UserScript==
// @name         MargoNeuro - Optimized Edition
// @version      64.6
// @description  Automatyczne wykrywanie, inteligentny zasięg, natywny auto-atak, poprawne limity poziomowe, naprawiony scroll.
// @author       Ty & Gemini
// @match        https://*.margonem.pl/
// @grant        none
// @updateURL    https://raw.githubusercontent.com/gunns369-dot/Hero-Margonem/main/Hero-Optimized.user.js
// @downloadURL  https://raw.githubusercontent.com/gunns369-dot/Hero-Margonem/main/Hero-Optimized.user.js
// ==/UserScript==

(function() {
    'use strict';

    const HERO_LOG = {
        info(message, details) {
            if (details !== undefined) console.log(`ℹ️ [HERO] ${message}`, details);
            else console.log(`ℹ️ [HERO] ${message}`);
        },
        success(message, details) {
            if (details !== undefined) console.log(`✅ [HERO] ${message}`, details);
            else console.log(`✅ [HERO] ${message}`);
        },
        warn(message, details) {
            if (details !== undefined) console.warn(`⚠️ [HERO] ${message}`, details);
            else console.warn(`⚠️ [HERO] ${message}`);
        },
        error(message, details) {
            if (details !== undefined) console.error(`❌ [HERO] ${message}`, details);
            else console.error(`❌ [HERO] ${message}`);
        }
    };

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

            HERO_LOG.success("Anti-Throttle V3 aktywny. Karta nie będzie usypiana.");
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
                    HERO_LOG.warn("Skaner NI zawiódł — przełączam na tryb zapasowy.");
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

                HERO_LOG.info("Rozpoczęto pobieranie zewnętrznych baz danych.");
                let [resShops, resEq] = await Promise.all([fetch(urlShops), fetch(urlTooltips)]);
                let rawShops = await resShops.json();
                let rawEq = await resEq.json();

                this.parseShops(rawShops);
                this.parseEq(rawEq);
                HERO_LOG.success(`Załadowano bazy: ${this.kupcy.length} kupców i ${this.ekwipunek.length} przedmiotów.`);
            } catch (e) {
                HERO_LOG.error("Błąd pobierania plików JSON. Sprawdź linki.", e);
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

        {"name": "Krab pustelnik", "level": 124, "prof": "Tancerz Ostrzy", "limit": 137, "pvp": "włączone", "path": ["Tuzmer", "Port Tuzmer", "Wyspa Rem", "Opuszczony statek - pokład pod rufą"], "resp": {"Opuszczony statek - pokład pod rufą": [[7, 7]], "Wyspa Rem": [[63, 33]]}},

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
        HERO_LOG.success("Baza expowisk została zaktualizowana z kodu.");
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

    const normalizeDialogText = (txt) => String(txt || "")
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const SPECIAL_TRANSPORT_ROUTES = [
        {
            from: ["Port Tuzmer"],
            to: ["Archipelag Bremus An", "Wyspa Ingotia", "Wyspa Rem", "Wyspa Caneum", "Magradit", "Wyspa Wraków", "Agia Triada"],
            npcNickIncludes: ["kapitan fork la rush"],
            optionPatterns: {
                boardShip: [
                    "toc ja nie szukam pracy, tylko ja oferuje",
                    "toc ja nie szukam pracy tylko ja oferuje",
                    "mozna zakupic u ciebie pewien bilet",
                    "zakupic u ciebie pewien bilet",
                    "mam chyba mdlosci od tego chybotliwego pokladu"
                ],
                mapSelect: ["poplynac na", "chcialabym poplynac na", "chcialbym poplynac na"],
                confirm: ["no to w droge", "troche drogo", "skoro musze", "cale szczescie"]
            }
        },
        {
            from: ["Wyspa Ingotia"],
            to: ["Port Tuzmer", "Tuzmer"],
            npcNickIncludes: ["lodka"],
            preferGateway: true,
            optionPatterns: {
                boardShip: ["udaje sie na poklad", "na poklad poslańca", "na poklad poslanca"],
                confirm: ["cale szczescie", "w droge", "powrot"]
            }
        },
        {
            from: ["Posłaniec Śmierci", "Posłaniec Śmierci - Pokład", "Poslaniec Smierci", "Poslaniec Smierci - Poklad"],
            to: ["Port Tuzmer", "Tuzmer"],
            npcNickIncludes: ["oficer statku"],
            optionPatterns: {
                mapSelect: ["wrocic do portu tuzmer", "wrocic do portu"],
                confirm: ["cale szczescie", "w droge", "wracamy do portu tuzmer"]
            }
        }
    ];



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
        logging: { level: 'INFO', dedupeWindowMs: 6000 },

        expProfiles: loadedProfiles

    };

    let checkedPoints = new Set();

    let positionHistory = [];

    let lastMapName = "";
    const getCurrentMapName = () => {
        if (typeof Engine !== 'undefined' && Engine.map && Engine.map.d && Engine.map.d.name) {
            return Engine.map.d.name;
        }
        return lastMapName;
    };



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

// --- POCZĄTEK BRAKUJĄCYCH FUNKCJI ---
function getMobRank(n) {
    if (!n) return "normal";
    let wt = parseInt(n.wt, 10) || 0;
    if (n.type === 2) {
        if (wt === 11 || wt === 1) return "elite1";
        if (wt === 12 || wt === 2) return "elite2";
        if (wt >= 13 || wt >= 3) return "hero";
    }
    return "normal";
}

function getRankValue(r) {
    if (r === 'hero') return 4;
    if (r === 'elite2') return 3;
    if (r === 'elite1') return 2;
    return 1;
}

function buildDistanceMapFromHero() {
    if (typeof Engine === 'undefined' || !Engine.map || !Engine.hero) return new Map();
    const currentMapName = Engine?.map?.d?.name || "";

    if (!(window.margoWalkableMask instanceof Set)) {
        window.margoWalkableMask = new Set();
    }

    if (window._walkMaskMapName !== currentMapName) {
        window.margoWalkableMask.clear();
        if (typeof updateWalkableArea === 'function') {
            HERO_LOG.info(`Odświeżam maskę przejścia dla mapy: ${currentMapName}`);
            updateWalkableArea();
        }
    }

    if (window.margoWalkableMask.size === 0 && typeof updateWalkableArea === 'function') {
        updateWalkableArea();
    }

    const w = Engine.map.d.x;
    const h = Engine.map.d.y;
    const getKey = (x, y) => `${x}_${y}`;
    const distMap = new Map();

    const startX = Engine.hero.d.x;
    const startY = Engine.hero.d.y;

    const startKey = getKey(startX, startY);
    const q = [[startX, startY]];
    distMap.set(startKey, 0);

    const dirs = [
        [0,1],[0,-1],[1,0],[-1,0],
        [1,1],[-1,-1],[-1,1],[1,-1]
    ];

    while (q.length > 0) {
        const [cx, cy] = q.shift();
        const baseDist = distMap.get(getKey(cx, cy));

        for (const [dx, dy] of dirs) {
            const nx = cx + dx;
            const ny = cy + dy;

            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const nk = getKey(nx, ny);

            if (!(window.margoWalkableMask instanceof Set)) continue;
            if (!window.margoWalkableMask.has(nk)) continue;
            if (distMap.has(nk)) continue;

            if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
                if (Engine.map.col.check(cx + dx, cy) && Engine.map.col.check(cx, cy + dy)) {
                    continue;
                }
            }

            distMap.set(nk, baseDist + 1);
            q.push([nx, ny]);
        }
    }

    return distMap;
}


function buildServerMobGroups(validMobs, distMap) {
    let groups = [];
    let processed = new Set();
    const isLinked = (a, b) => {
        if (!a || !b || a.id === b.id) return false;
        if (a.grp && b.grp && a.grp === b.grp) return true;
        return Math.abs(a.x - b.x) <= 2 && Math.abs(a.y - b.y) <= 2;
    };

    validMobs.forEach(seedMob => {
        if (processed.has(seedMob.id)) return;

        const queue = [seedMob];
        const cluster = [];
        processed.add(seedMob.id);

        while (queue.length) {
            const current = queue.shift();
            cluster.push(current);

            validMobs.forEach(otherMob => {
                if (processed.has(otherMob.id)) return;
                if (isLinked(current, otherMob)) {
                    processed.add(otherMob.id);
                    queue.push(otherMob);
                }
            });
        }

        let group = {
            key: seedMob.grp || cluster.map(m => m.id).sort((a, b) => a - b).join("_"),
            mobs: cluster,
            mainRanga: cluster[0]?.ranga || seedMob.ranga,
            bestTargetMob: seedMob,
            bestPathDistance: 9999,
            bestStand: null
        };

        cluster.forEach(otherMob => {
            if (getRankValue(otherMob.ranga) > getRankValue(group.mainRanga)) group.mainRanga = otherMob.ranga;
        });

        let bestDist = Infinity; let bestStand = null; let bestMob = null;
        group.mobs.forEach(m => {
            let dirs = [[0,1],[0,-1],[1,0],[-1,0],[-1,-1],[1,-1],[-1,1],[1,1]];
            for (let d of dirs) {
                let nx = m.x + d[0]; let ny = m.y + d[1]; let key = `${nx}_${ny}`;
                if (distMap && distMap.has(key)) {
                    let dVal = distMap.get(key);
                    if (dVal < bestDist) { bestDist = dVal; bestStand = {x: nx, y: ny}; bestMob = m; }
                }
            }
        });
        group.bestPathDistance = bestDist; group.bestStand = bestStand; group.bestTargetMob = bestMob || group.mobs[0];
        group.label = `${group.mobs.length}x ${group.mainRanga}`;
        groups.push(group);
    });
    return groups;
}

function getCurrentMapGatewaysForRadar(distMap) {
    let found = [];
    if (typeof Engine === 'undefined' || !Engine.map) return found;
    let gws = (Engine.map.gateways) ? Engine.map.gateways : ((Engine.map.d && Engine.map.d.gw) ? Engine.map.d.gw : {});
    let gwsList = [];
    try { if (typeof gws.values === 'function') gwsList = Array.from(gws.values()); else gwsList = Object.values(gws); }
    catch(e) { for (let key in gws) { if (gws.hasOwnProperty(key)) gwsList.push(gws[key]); } }

    gwsList.forEach(gw => {
        let data = gw.d || gw;
        if (!data || data.x === undefined || data.y === undefined) return;
        let isReachable = false; let bestStand = null; let minDist = Infinity;
        let dirs = [[0,0], [0,1], [0,-1], [1,0], [-1,0], [1,1], [-1,-1], [-1,1], [1,-1]];
        for(let d of dirs) {
            let nx = data.x + d[0]; let ny = data.y + d[1]; let k = `${nx}_${ny}`;
            if(distMap && distMap.has(k)) {
                isReachable = true; let dist = distMap.get(k);
                if(dist < minDist) { minDist = dist; bestStand = {x: nx, y: ny}; }
            }
        }
        let cleanName = (data.name || data.targetName || data.title || data.tooltip || "").toString().replace(/<[^>]*>?/gm, '').split('\n')[0].replace("Przejście do:", "").trim();
        found.push({ x: data.x, y: data.y, targetMap: cleanName, reachable: isReachable, stand: bestStand, pathDistance: minDist });
    });
    return found;
}

function getBestReachableGatewayToMap(targetMap) {
    let distMap = typeof buildDistanceMapFromHero === 'function' ? buildDistanceMapFromHero() : new Map();
    let all = getCurrentMapGatewaysForRadar(distMap);
    let valid = all.filter(g => g.targetMap.toLowerCase() === targetMap.toLowerCase() && g.reachable);
    if(valid.length === 0) return null;
    valid.sort((a,b) => a.pathDistance - b.pathDistance);
    return valid[0];
}

function pickBestReachableGatewayCoordFromBaseDoor(baseDoor, distMap) {
    if (!baseDoor || !distMap) return null;
    const candidates = Array.isArray(baseDoor.allCoords) && baseDoor.allCoords.length
        ? baseDoor.allCoords
        : [[baseDoor.x, baseDoor.y]];

    let best = null;
    for (const coord of candidates) {
        if (!Array.isArray(coord) || coord.length < 2) continue;
        const x = parseInt(coord[0], 10);
        const y = parseInt(coord[1], 10);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

        let bestLocal = Infinity;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const k = `${x + dx}_${y + dy}`;
                if (distMap.has(k)) bestLocal = Math.min(bestLocal, distMap.get(k));
            }
        }

        if (!Number.isFinite(bestLocal)) continue;
        if (!best || bestLocal < best.pathDistance) {
            best = { x, y, pathDistance: bestLocal };
        }
    }

    return best;
}

window.__bannedEdges = window.__bannedEdges || {};

function cleanupExpiredEdgeBans(now = Date.now()) {
    window.__bannedEdges = window.__bannedEdges || {};
    for (let from in window.__bannedEdges) {
        if (!window.__bannedEdges[from] || typeof window.__bannedEdges[from] !== 'object') {
            delete window.__bannedEdges[from];
            continue;
        }
        for (let to in window.__bannedEdges[from]) {
            const until = window.__bannedEdges[from][to];
            if (!until || now >= until) delete window.__bannedEdges[from][to];
        }
        if (Object.keys(window.__bannedEdges[from]).length === 0) delete window.__bannedEdges[from];
    }
}

function banEdge(from, to, durationMs = 30000) {
    if (!from || !to) return;
    window.__bannedEdges = window.__bannedEdges || {};
    if (!window.__bannedEdges[from]) window.__bannedEdges[from] = {};
    const expiresAt = Date.now() + Math.max(1000, durationMs || 0);
    window.__bannedEdges[from][to] = expiresAt;
    if (window.logHero) window.logHero(`⛔ Blokuję przejście: [${from}] → [${to}] na ${Math.round((expiresAt - Date.now()) / 1000)}s`, '#ff9800');
}

function isEdgeBanned(from, to, now = Date.now()) {
    if (!from || !to) return false;
    window.__bannedEdges = window.__bannedEdges || {};
    const until = window.__bannedEdges[from] ? window.__bannedEdges[from][to] : 0;
    if (!until) return false;
    if (now >= until) {
        delete window.__bannedEdges[from][to];
        if (Object.keys(window.__bannedEdges[from]).length === 0) delete window.__bannedEdges[from];
        return false;
    }
    return true;
}

function markGatewayAsBlocked(currentSysMap, nextMap, duration) {
    cleanupExpiredEdgeBans();
    banEdge(currentSysMap, nextMap, duration || 30000);
}

function pickDoorToNextHop(currentSysMap, nextHop, distMap, reachableDoors) {
    if (!currentSysMap || !nextHop) return null;

    const normalizedNextHop = normMapName(nextHop);
    let door = (reachableDoors || []).find(g => normMapName(g.targetMap || '') === normalizedNextHop) || null;
    if (door) return door;

    if (typeof globalGateways === 'undefined' || !globalGateways || !globalGateways[currentSysMap] || !globalGateways[currentSysMap][nextHop]) return null;

    const baseDoor = globalGateways[currentSysMap][nextHop];
    const bestBaseCoord = typeof pickBestReachableGatewayCoordFromBaseDoor === 'function'
        ? pickBestReachableGatewayCoordFromBaseDoor(baseDoor, distMap)
        : null;

    if (!bestBaseCoord) return null;
    return {
        x: bestBaseCoord.x,
        y: bestBaseCoord.y,
        targetMap: nextHop,
        pathDistance: bestBaseCoord.pathDistance
    };
}

function pickNextReachableMapFromRoute(currentSysMap, allowedMaps) {
    let hero = document.getElementById('selHero') ? document.getElementById('selHero').value : null;
    let mapList = Array.isArray(allowedMaps) && allowedMaps.length ? [...allowedMaps] : [];
    if (!mapList.length) {
        mapList = (typeof botSettings !== 'undefined' && botSettings.exp) ? botSettings.exp.mapOrder : [];
    }
    if ((!mapList || mapList.length === 0) && typeof heroMapOrder !== 'undefined') { if (hero && heroMapOrder[hero]) mapList = heroMapOrder[hero]; }
    if (!mapList || mapList.length === 0) return null;

    const distMap = typeof buildDistanceMapFromHero === 'function' ? buildDistanceMapFromHero() : new Map();
    const reachableDoors = getCurrentMapGatewaysForRadar(distMap).filter(g => g.reachable && g?.targetMap);
    const currNorm = normMapName(currentSysMap);
    const currIdx = mapList.findIndex(m => normMapName(m) === currNorm);
    if (currIdx === -1) return null;

    for (let i = 1; i < mapList.length; i++) {
        const checkIdx = (currIdx + i) % mapList.length;
        const checkMap = mapList[checkIdx];
        if (!checkMap || normMapName(checkMap) === currNorm) continue;
        if (window.__bannedMaps && window.__bannedMaps[checkMap] && Date.now() < window.__bannedMaps[checkMap]) continue;

        const path = typeof getShortestPath === 'function' ? getShortestPath(currentSysMap, checkMap, { allowIndoorTransit: true }) : null;
        if (!path || path.length < 2) continue;

        const nextHop = path[1];
        const door = pickDoorToNextHop(currentSysMap, nextHop, distMap, reachableDoors);
        if (!door) continue;

        return { nextMap: checkMap, nextHop, door, path };
    }
    return null;
}

function getExpGroupNameForMap(mapName) {
    if (!mapName) return null;
    let source = (typeof botSettings !== 'undefined' && Array.isArray(botSettings.expProfiles) && botSettings.expProfiles.length > 0)
        ? botSettings.expProfiles
        : (Array.isArray(window.defaultExpProfiles) ? window.defaultExpProfiles : []);
    let mapLower = mapName.toLowerCase();
    let profile = source.find(p => Array.isArray(p.maps) && p.maps.some(m => (m || "").toLowerCase() === mapLower));
    return profile ? profile.name : null;
}

function isMapKnownInGatewayBase(mapName) {
    if (typeof globalGateways === 'undefined' || !globalGateways) return false;
    for (let source in globalGateways) {
        if (globalGateways[source][mapName]) return true;
    }
    return false;
}
// --- KONIEC BRAKUJĄCYCH FUNKCJI ---
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

                // --- AUTO-WZNAWIANIE BOTA PO REFRESHU (F5 / RELOAD) ---
                window.addEventListener('beforeunload', () => {
                    // Zapisujemy, czy bot był włączony tuż przed zniknięciem strony
                    if (window.isExping) sessionStorage.setItem('hero_resume_exp', 'true');
                    else sessionStorage.removeItem('hero_resume_exp');

                    if (typeof isPatrolling !== 'undefined' && isPatrolling) sessionStorage.setItem('hero_resume_patrol', 'true');
                    else sessionStorage.removeItem('hero_resume_patrol');
                });

                setTimeout(() => {
                    if (sessionStorage.getItem('hero_resume_exp') === 'true') {
                        let btn = document.getElementById('btnStartExp');
                        if (btn && !window.isExping) btn.click();
                        if (window.logExp) window.logExp("🔄 Automatycznie wznowiono Expa po odświeżeniu gry!", "#4caf50");
                    } else if (sessionStorage.getItem('hero_resume_patrol') === 'true') {
                        let btn = document.getElementById('btnStartStop');
                        if (btn && typeof isPatrolling !== 'undefined' && !isPatrolling) btn.click();
                        if (window.logHero) window.logHero("🔄 Automatycznie wznowiono Patrol po odświeżeniu gry!", "#4caf50");
                    }
                }, 1500); // 1.5 sekundy opóźnienia, żeby gra "odetchnęła" po wczytaniu
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
    window.globalGateways = globalGateways;
window.heroMapOrder = heroMapOrder;
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
        }).catch(e => HERO_LOG.error("Błąd wysyłania na Discorda.", e));
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
        if (window.RouteCombatFSM && !window.RouteCombatFSM.canAutoAttack()) return;

        if (attackInterval) clearInterval(attackInterval);
        let lastManualAttackAt = 0;
        let manualAttackIssued = false;



        let targetId = parseInt(npcId, 10);

        HERO_LOG.info(`Cel namierzony (ID: ${targetId}). Włączam Kieszonkowego Berserka...`);



        // METODA GARGONEMA - Włącza natywnego auto-ataka prosto na serwerze gry

        if (typeof window._g === 'function') {
            window._g(`settings&action=update&id=34&v=1`); // Włącz Berserka
            window._g(`settings&action=update&id=34&key=elite&v=1`); // Bij Elity
            window._g(`settings&action=update&id=34&key=elite2&v=1`); // Bij Elity 2 i Herosów
            if (!window.RouteCombatFSM || window.RouteCombatFSM.canAutoAttack()) window._g(`fight&a=attack&id=${targetId}`); // Wymuś start
        }

        attackInterval = setInterval(() => {

            if (typeof Engine === 'undefined' || !Engine.hero || !Engine.hero.d) return;



            // 1. Jeśli walka trwa - wyłączamy Berserka (żeby nie biegał dalej) i kończymy pętlę

            if (Engine.battle && (Engine.battle.show || Engine.battle.d)) {

                clearInterval(attackInterval);

                if (typeof window._g === 'function') window._g(`settings&action=update&id=34&v=0`);

                HERO_LOG.success("Walka rozpoczęta. Berserk wyłączony.");

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
                manualAttackIssued = false;

                let now = Date.now();

                if (now - lastGoToTime > 600) {

                    if (typeof Engine.hero.autoGoTo === 'function') Engine.hero.autoGoTo({x: tx, y: ty});

                    lastGoToTime = now;

                }

            } else {

                let now = Date.now();
                if (!manualAttackIssued || now - lastManualAttackAt > 1200) {
                    if (!window.RouteCombatFSM || window.RouteCombatFSM.canAutoAttack()) {
                        if (Engine.npcs && typeof Engine.npcs.interact === 'function') Engine.npcs.interact(targetId);
                        if (Engine.npcs && typeof Engine.npcs.clickNpc === 'function') Engine.npcs.clickNpc(targetId);
                        if (typeof window._g === 'function') window._g(`fight&a=attack&id=${targetId}`);
                    }

                    let confirmBtn = document.querySelector(".green.button, .podejdz-btn, .zaatakuj-btn");
                    if (confirmBtn && confirmBtn.innerText.toLowerCase().includes("zaatakuj")) confirmBtn.click();

                    manualAttackIssued = true;
                    lastManualAttackAt = now;
                }

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

            const defaultTeleports = {"Thuzal":false, "Tuzmer":false, "Karka-han":false, "Werbin":false, "Torneg":false, "Ithan":false, "Eder":false};
            if (allTps[window.lastLoadedNick] && typeof allTps[window.lastLoadedNick] === 'object') {
                botSettings.unlockedTeleports = { ...defaultTeleports, ...allTps[window.lastLoadedNick] };
            } else {
                botSettings.unlockedTeleports = { ...defaultTeleports };
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
        let currentSysMap = getCurrentMapName();
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
        let groupName = typeof getExpGroupNameForMap === 'function' ? getExpGroupNameForMap(targetMapName) : null;
        let msg = groupName
            ? `🏃 Obieram kurs na: [${targetMapName}] • Grupa: [${groupName}]`
            : `🏃 Obieram kurs na: [${targetMapName}]`;
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

            const itemStat = String(item.stat || item._cachedStats?.stat || "");
            const stats = window.parseStatString(itemStat);
            if (!stats.teleport) continue;

            // Wyciągamy [mapId, x, y, mapName]
            const [mapId, x, y, mapName] = stats.teleport.split(",");
            if (!mapName) continue;

            // Sprawdzenie wymaganego levela
            let reqLvl = parseInt(stats.reqLvl || stats.reqlvl || stats.lvl || 0);
            if (reqLvl && heroLvl < reqLvl) continue;

            // Wyrównanie wielkości liter do bazy pathfindera
            let exactMapName = allMapNames.find(k => k.toLowerCase() === mapName.trim().toLowerCase()) || mapName.trim();
            if (!allMapNames.includes(exactMapName)) exactMapName = exactMapName.replace(/\b\w/g, c => c.toUpperCase());

            const itemId = item.id || item._cachedStats?.id;
            if (!itemId) continue;
            tps.push({ id: itemId, map: exactMapName, item: item });
        }
        return tps;
    };

    window.useItemById = function(itemId) {
        try {
            let itemObj = null;
            if (typeof Engine !== 'undefined' && Engine.heroEquipment && typeof Engine.heroEquipment.getHItems === 'function') {
                let itemsList = Engine.heroEquipment.getHItems() || {};
                itemObj = Object.values(itemsList).find(i => (i?.d || i)?.id == itemId) || null;
            }

            if (itemObj && typeof Engine !== 'undefined' && Engine.heroEquipment && typeof Engine.heroEquipment.sendUseRequest === 'function') {
                Engine.heroEquipment.sendUseRequest(itemObj);
            } else if (typeof Engine !== 'undefined' && Engine.items && typeof Engine.items.useItem === 'function') {
                Engine.items.useItem(itemId);
            } else {
                window._g(`moveitem&st=1&id=${itemId}`);
            }
        } catch (e) {
            HERO_LOG.error("Błąd użycia teleportu.", e);
        }
    };

window.executeRushStep = function() {
    // Blokada spamu silnika Rush (max raz na 400ms)
        let nowRush = Date.now();
        if (window._lastRushTick && nowRush - window._lastRushTick < 400) return;
        window._lastRushTick = nowRush;
        if (!isRushing && !window.isRushing) return;
        // Samonaprawa synchronizacji flag rusha (część modułów ustawia tylko window.isRushing).
        if (!isRushing && window.isRushing && rushTarget) {
            isRushing = true;
        }
        if (!rushTarget) {
            isRushing = false;
            window.isRushing = false;
            return;
        }
        let currentSysMap = getCurrentMapName();

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

        if (!path) {
            if (window.logExp) window.logExp(`🧩 Brak trasy [${currentSysMap}] → [${rushTarget}], odświeżam bazę przejść...`, '#ffb74d');
            if (typeof refreshGatewayBaseFromStorage === 'function') refreshGatewayBaseFromStorage();
            if (typeof autoLearnGateways === 'function') autoLearnGateways();
            if (typeof requestGatewayRefresh === 'function') requestGatewayRefresh('rush-no-path', true);
            path = typeof getShortestPath === 'function' ? getShortestPath(currentSysMap, rushTarget) : null;
            currentDistance = path ? path.length : 999;

            // Awaryjnie: jeśli jedyne znane przejścia są tymczasowo zbanowane, spróbuj zignorować bany krawędzi.
            if (!path && typeof getShortestPath === 'function') {
                const emergencyPath = getShortestPath(currentSysMap, rushTarget, { ignoreEdgeBans: true });
                if (emergencyPath && emergencyPath.length > 1) {
                    path = emergencyPath;
                    currentDistance = path.length;
                    const firstHop = path[1];
                    if (window.__bannedEdges && window.__bannedEdges[currentSysMap] && firstHop) {
                        delete window.__bannedEdges[currentSysMap][firstHop];
                        if (Object.keys(window.__bannedEdges[currentSysMap]).length === 0) delete window.__bannedEdges[currentSysMap];
                    }
                    if (window.logExp) window.logExp(`🧭 Awaryjny powrót na trasę: [${currentSysMap}] → [${firstHop}] (pomijam chwilowe bany).`, '#66bb6a');
                    if (window.logHero) window.logHero(`🧭 Awaryjny powrót na trasę: [${currentSysMap}] → [${firstHop}] (pomijam chwilowe bany).`, '#66bb6a');
                }
            }
        }

        // --- ZWOJE TELEPORTACJI (Tylko EXP + histereza) ---
        const canTryEqTeleport = !!(path && (window.isExping || window.autoSellState?.active) && botSettings.exp.useTeleportsEq);
        let tps = canTryEqTeleport ? window.getAvailableTeleports() : [];
        let bestTp = null;
        const minSavedMaps = 3;
        let bestDist = currentDistance;

        for (let tp of tps) {
            if (tp.map === currentSysMap) continue;
            let tpPath = typeof getShortestPath === 'function' ? getShortestPath(tp.map, rushTarget) : null;
            if (tpPath && tpPath.length < bestDist) {
                bestDist = tpPath.length;
                bestTp = tp;
            } else if (tp.map.toLowerCase() === rushTarget.toLowerCase() && 0 < bestDist) {
                bestDist = 0;
                bestTp = tp;
            }
        }

        const lastEqTpAt = window.__lastEqTeleportAt || 0;
        const eqTpCooldown = 30000;
        const eqTeleportReady = Date.now() - lastEqTpAt >= eqTpCooldown;
        const savesEnough = bestTp && (bestDist <= currentDistance - minSavedMaps);

        if (bestTp && eqTeleportReady && savesEnough) {
            if (window._lastRushNextMap !== bestTp.map) {
                let msg = `📜 Używam zwoju: ${bestTp.map}! (Trasa skraca się z ${currentDistance} do ${bestDist} map)`;
                if (window.logExp) window.logExp(msg, "#e040fb");
                if (window.logHero) window.logHero(msg, "#e040fb");
                window._lastRushNextMap = bestTp.map;
            }
            clearTimeout(rushInterval);
            window.__lastEqTeleportAt = Date.now();
            window.expMapHistory = [];
            window.useItemById(bestTp.id);
            rushInterval = setTimeout(window.executeRushStep, 2500);
            return;
        }

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
        const hasSpecialTransport = typeof getSpecialTransportRoute === 'function' && !!getSpecialTransportRoute(currentSysMap, nextMap);
        if (hasSpecialTransport) {
            if (window._lastRushNextMap !== nextMap) {
                if (window.logExp) window.logExp(`⛴️ Używam transportu NPC: [${currentSysMap}] → [${nextMap}]`, "#26c6da");
                if (window.logHero) window.logHero(`⛴️ Używam transportu NPC: [${currentSysMap}] → [${nextMap}]`, "#26c6da");
                window._lastRushNextMap = nextMap;
            }
            clearTimeout(rushInterval);
            rushInterval = setTimeout(() => window.handleSpecialTransport(nextMap), 180);
            return;
        }

        let tp = typeof ZAKONNICY !== 'undefined' ? ZAKONNICY[currentSysMap] : null;
        let baseDoor = globalGateways[currentSysMap] && globalGateways[currentSysMap][nextMap];
        let isFakeDoor = baseDoor && tp && Math.abs(baseDoor.x - tp.x) <= 2 && Math.abs(baseDoor.y - tp.y) <= 2;
        let sourceUnlocked = !!(botSettings.unlockedTeleports && botSettings.unlockedTeleports[currentSysMap]);
        let destinationUnlocked = !!(botSettings.unlockedTeleports && botSettings.unlockedTeleports[nextMap]);
        let isTeleportRoute = tp && sourceUnlocked && (destinationUnlocked || isFakeDoor);

        if (isTeleportRoute) {
            if (window._lastRushNextMap !== nextMap) {
                if (window.logExp) window.logExp(`🚀 Teleportuję (Zakonnik) do: ${nextMap}`, "#9c27b0");
                if (window.logHero) window.logHero(`🚀 Teleportuję (Zakonnik) do: ${nextMap}`, "#9c27b0");
                window._lastRushNextMap = nextMap;
            }
            clearTimeout(rushInterval);
            rushInterval = setTimeout(() => window.handleTeleportNPC(nextMap), 200);
        } else {
            // --- SPRAWDZANIE BRAM (Z RADAREM ŚCIAN) ---
            let targetX = null, targetY = null;
            let doorInfo = "";
            let liveDoor = typeof getBestReachableGatewayToMap === 'function' ? getBestReachableGatewayToMap(nextMap) : null;

            if (liveDoor && liveDoor.reachable) {
                targetX = liveDoor.x;
                targetY = liveDoor.y;
                doorInfo = "(Zasięg radaru)";
            } else if (baseDoor) {
                let distMap = typeof buildDistanceMapFromHero === 'function' ? buildDistanceMapFromHero() : new Map();
                let bestBaseCoord = typeof pickBestReachableGatewayCoordFromBaseDoor === 'function'
                    ? pickBestReachableGatewayCoordFromBaseDoor(baseDoor, distMap)
                    : null;

                if (bestBaseCoord) {
                    targetX = bestBaseCoord.x;
                    targetY = bestBaseCoord.y;
                    doorInfo = `(Z pamięci bazy, d=${bestBaseCoord.pathDistance})`;
                }
            }

            if (targetX === null || targetY === null) {
                if (typeof markGatewayAsBlocked === 'function') markGatewayAsBlocked(currentSysMap, nextMap, 30000);
                
                let fallback = null;
                // Tylko jak biega rutynowo w Expie, szukamy następnej mapy z listy
                if (window.isExping && botSettings.exp && botSettings.exp.mapOrder) {
                    fallback = typeof pickNextReachableMapFromRoute === 'function' ? pickNextReachableMapFromRoute(currentSysMap, window.isExping ? getCurrentExpHuntMaps() : null) : null;
                }

                if (fallback && fallback.nextMap && fallback.door) {
                    window.rushNextMap = fallback.nextMap;
                    if (window._lastRushNextMap !== fallback.nextMap) {
                        let suffix = fallback.finalTarget ? ` → cel trasy: ${fallback.finalTarget}` : "";
                        if (window.logExp) window.logExp(`🚪 Biegnę do: ${fallback.nextMap}${suffix} (pominięto martwe przejście)`, "#ba68c8");
                        if (window.logHero) window.logHero(`🚪 Biegnę do: ${fallback.nextMap}${suffix} (pominięto martwe przejście)`, "#ba68c8");
                        window._lastRushNextMap = fallback.nextMap;
                    }
                    safeGoTo(fallback.door.x, fallback.door.y, false);
                    clearTimeout(rushInterval);
                    rushInterval = setTimeout(window.checkRushArrival, 500);
                    return;
                }

                // Odpali się po wykluczeniu zablokowanej bramy - obliczy nową drogę wokół!
                window.rushNextMap = null;
                clearTimeout(rushInterval);
                rushInterval = setTimeout(window.executeRushStep, 250);
                return;
            }

            if (window._lastRushNextMap !== nextMap) {
                if (window.logExp) window.logExp(`🚪 Biegnę do przejścia na: ${nextMap} ${doorInfo}`, "#ba68c8");
                if (window.logHero) window.logHero(`🚪 Biegnę do przejścia na: ${nextMap} ${doorInfo}`, "#ba68c8");
                window._lastRushNextMap = nextMap;
            }

            window.rushLastX = Engine.hero.d.x;
            window.rushLastY = Engine.hero.d.y;
            stuckCount = 0;
            window.rushGatewayArrivalTime = 0;
            window.rushGateLastClickAt = 0;

            safeGoTo(targetX, targetY, false);
            clearTimeout(rushInterval);
            rushInterval = setTimeout(window.checkRushArrival, 500);
        }
    };

    window.checkRushArrival = function() {
        if (!isRushing || typeof Engine === 'undefined' || !Engine.hero) return;

        let currentSysMap = getCurrentMapName();
        if (currentSysMap === rushTarget) {
            window.executeRushStep();
            return;
        }

        let nextMap = window.rushNextMap;
        if (!nextMap) return;

        let exactX = null, exactY = null;
        let baseDoor = globalGateways[currentSysMap] && globalGateways[currentSysMap][nextMap];
        let liveDoor = typeof getBestReachableGatewayToMap === 'function' ? getBestReachableGatewayToMap(nextMap) : null;

        if (liveDoor && liveDoor.reachable) {
            exactX = liveDoor.x;
            exactY = liveDoor.y;
        } else if (baseDoor) {
            let distMap = typeof buildDistanceMapFromHero === 'function' ? buildDistanceMapFromHero() : new Map();
            let bestBaseCoord = typeof pickBestReachableGatewayCoordFromBaseDoor === 'function'
                ? pickBestReachableGatewayCoordFromBaseDoor(baseDoor, distMap)
                : null;
            if (bestBaseCoord) {
                exactX = bestBaseCoord.x;
                exactY = bestBaseCoord.y;
            }
        }

        if (exactX === null || exactY === null) {
            if (typeof markGatewayAsBlocked === 'function') markGatewayAsBlocked(currentSysMap, nextMap, 30000);
            window.executeRushStep();
            return;
        }

        let cx = parseInt(Engine.hero.d.x, 10);
        let cy = parseInt(Engine.hero.d.y, 10);
        let dist = Math.abs(cx - exactX) + Math.abs(cy - exactY);

        if (dist > 1) {
            let isMoving = Engine.hero.d.path && Engine.hero.d.path.length > 0;
            window.rushGatewayArrivalTime = 0;

            if (!isMoving) {
                if (cx === window.rushLastX && cy === window.rushLastY) {
                    stuckCount++;
                    if (stuckCount === 6) {
                        safeGoTo(exactX, exactY, false);
                    }
                    if (stuckCount > 15) {
                        if (window.logHero) window.logHero("⚠️ Brama nieosiągalna! Szukam innej drogi...", "#ffb300");
                        if (window.logExp) window.logExp("⚠️ Brama nieosiągalna! Szukam innej drogi...", "#ffb300");
                        if (typeof markGatewayAsBlocked === 'function') markGatewayAsBlocked(currentSysMap, nextMap, 30000);
                        window.executeRushStep();
                        return;
                    }
                } else {
                    window.rushLastX = cx;
                    window.rushLastY = cy;
                    stuckCount = 0;
                }
            } else {
                stuckCount = 0;
            }
            
            clearTimeout(rushInterval);
            rushInterval = setTimeout(window.checkRushArrival, 500);
            return;
        }

        if (!window.rushGatewayArrivalTime) {
            window.rushGatewayArrivalTime = Date.now();
        }

        if (!window.rushGateLastClickAt) window.rushGateLastClickAt = 0;
        const gateRetryMs = 2800;
        if ((dist === 1 || dist === 0) && (Date.now() - window.rushGateLastClickAt > gateRetryMs)) {
            ActionExecutor.runWithRetry('PASS_GATE', { x: exactX, y: exactY, targetMap: nextMap }, () => safeGoTo(exactX, exactY, false), { retries: 2, baseDelay: 220 });
            window.rushGateLastClickAt = Date.now();
        }

        if (Date.now() - window.rushGatewayArrivalTime > 3500) {
            const stateKey = `${currentSysMap}->${nextMap}@${exactX},${exactY}`;
            if (GateRecovery.state.key !== stateKey) GateRecovery.state = { key: stateKey, attempts: 0, blockedUntil: 0 };
            GateRecovery.state.attempts++;
            HeroLogger.emit('WARN', 'GATE_BLOCKED', `Brama zajęta (${GateRecovery.state.attempts})`, "#ffb300", { dedupeMs: 2800 });

            window.__movementLock = Date.now() + 1500;
            const attempts = GateRecovery.state.attempts;
            let moved = false;
            if (attempts === 1) {
                // krótki wait + retry kliknięcia
            } else if (attempts === 2) {
                moved = GateRecovery.tryStep(cx, cy, [[0,1], [0,-1]]);
                HeroLogger.emit('INFO', 'RECOVERY_STEP', `GateRecovery: krok w tył`, "#ffcc80");
            } else if (attempts === 3) {
                moved = GateRecovery.tryStep(cx, cy, [[1,0], [-1,0], [1,1], [-1,-1]]);
                HeroLogger.emit('INFO', 'RECOVERY_STEP', `GateRecovery: krok w bok`, "#ffcc80");
            } else if (attempts === 4) {
                moved = GateRecovery.tryStep(cx, cy, [[1,-1], [-1,1], [0,1], [0,-1]]);
                HeroLogger.emit('INFO', 'RECOVERY_STEP', `GateRecovery: krok alternatywny`, "#ffcc80");
            } else {
                moved = GateRecovery.tryStep(cx, cy, [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]);
                if (typeof markGatewayAsBlocked === 'function' && attempts >= 6) {
                    markGatewayAsBlocked(currentSysMap, nextMap, 30000);
                    HeroLogger.emit('WARN', 'RECOVERY_STEP', `GateRecovery: oznaczam bramę jako czasowo zablokowaną`, "#ff8a65");
                    GateRecovery.state.attempts = 0;
                    window.executeRushStep();
                    return;
                }
            }
            if (!moved && attempts > 2) HeroLogger.emit('DEBUG', 'RECOVERY_STEP', `Brak wolnego pola dla recovery.`);
            window.rushGatewayArrivalTime = Date.now() + 1200 + Math.floor(Math.random() * 500);
        }
        
        clearTimeout(rushInterval);
        rushInterval = setTimeout(window.checkRushArrival, 500);
    };

// ==========================================
    // ALGORYTM DIJKSTRY (Z CZARNĄ LISTĄ BRAM I WAGAMI)
    // ==========================================
    function refreshGatewayBaseFromStorage() {
        try {
            const raw = localStorage.getItem('hero_global_gateways_v20');
            if (!raw) return false;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return false;
            if (Object.keys(parsed).length === 0) return false;
            globalGateways = parsed;
            window.globalGateways = globalGateways;
            return true;
        } catch (e) {
            return false;
        }
    }

    function getShortestPath(start, end, options = {}) {
        if (start === end) return [start];
        const ignoreEdgeBans = !!(options && options.ignoreEdgeBans);
        const allowIndoorTransit = !!(options && options.allowIndoorTransit);

        if (!globalGateways || Object.keys(globalGateways).length === 0 || !globalGateways[start]) {
            refreshGatewayBaseFromStorage();
        }

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
                    cleanupExpiredEdgeBans();
                    const nowBan = Date.now();
                    if (!ignoreEdgeBans && typeof isEdgeBanned === 'function' && isEdgeBanned(u, v, nowBan)) {
                        continue;
                    }
                    // Map-level bany (np. PvP flee), ale nie blokuj finalnego celu ścieżki.
                    if (v !== end && window.__bannedMaps && window.__bannedMaps[v] && nowBan < window.__bannedMaps[v]) {
                        continue;
                    }

                    let penalty = 1;
                    const vLower = v.toLowerCase();
                    const looksIndoor = (vLower.includes(" p.") || vLower.includes(" s.") || vLower.includes(" - ") || vLower.includes("dom ") || vLower.includes("młyn") || vLower.includes("jaskinia") || vLower.includes("grota") || vLower.includes("kopalnia"));
                    if (v !== end && looksIndoor) {
                        penalty = allowIndoorTransit ? 3 : 50;
                    }

                    let alt = distances[u] + penalty;
                    if (distances[v] === undefined || alt < distances[v]) {
                        distances[v] = alt; previous[v] = u; queue.push({node: v, dist: alt});
                    }
                }
            }

            const unlockedFromMap = !!(botSettings.unlockedTeleports && botSettings.unlockedTeleports[u]);
            if (botSettings.useTeleports && ZAKONNICY[u] && unlockedFromMap) {
                for (let tpMap in botSettings.unlockedTeleports) {
                    if (botSettings.unlockedTeleports[tpMap] && tpMap !== u) {
                        let alt = distances[u] + 2;
                        if (distances[tpMap] === undefined || alt < distances[tpMap]) {
                            distances[tpMap] = alt; previous[tpMap] = u; queue.push({node: tpMap, dist: alt});
                        }
                    }
                }
            }

            const specialDestinations = (typeof getSpecialTransportDestinations === 'function')
                ? getSpecialTransportDestinations(u)
                : [];
            for (const spMap of specialDestinations) {
                if (!spMap || spMap === u) continue;
                let alt = distances[u] + 3;
                if (distances[spMap] === undefined || alt < distances[spMap]) {
                    distances[spMap] = alt;
                    previous[spMap] = u;
                    queue.push({ node: spMap, dist: alt });
                }
            }
        }
        return null;
    }
window.handleTeleportNPC = function(targetMap) {
        if (!isRushing && !isPatrolling && !window.isExping) return;
        let currentSysMap = getCurrentMapName();
        let tp = ZAKONNICY[currentSysMap];
        if (!tp) return;

        let cx = Engine.hero.d.x; let cy = Engine.hero.d.y;
        let dist = Math.max(Math.abs(cx - tp.x), Math.abs(cy - tp.y));

        if (dist > 1) {
            if (!Engine.hero.d.path || Engine.hero.d.path.length === 0) {
                HERO_LOG.info(`Podbiegam do Zakonnika na [${tp.x}, ${tp.y}]...`);
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

    function mapMatchesAlias(currentMap, aliases) {
        const currNorm = normalizeDialogText(currentMap);
        return (aliases || []).some(alias => {
            const a = normalizeDialogText(alias);
            if (!a) return false;
            // Celowo bez "a.includes(currNorm)" – powodowało fałszywe dopasowanie
            // "Tuzmer" => "Port Tuzmer" i uruchamianie transportu na złej mapie.
            return currNorm === a || currNorm.includes(a);
        });
    }

    function getSpecialTransportRoute(currentMap, targetMap) {
        if (!currentMap || !targetMap) return null;
        return SPECIAL_TRANSPORT_ROUTES.find(route =>
            mapMatchesAlias(currentMap, route.from) &&
            mapMatchesAlias(targetMap, route.to)
        ) || null;
    }

    function getSpecialTransportDestinations(currentMap) {
        if (!currentMap) return [];
        const dest = [];
        for (const route of SPECIAL_TRANSPORT_ROUTES) {
            if (!mapMatchesAlias(currentMap, route.from)) continue;
            for (const to of (route.to || [])) {
                if (to && !dest.includes(to)) dest.push(to);
            }
        }
        return dest;
    }

    function findNpcByNickIncludes(patterns) {
        const npcs = (typeof Engine !== 'undefined' && Engine.npcs)
            ? (typeof Engine.npcs.check === 'function' ? Engine.npcs.check() : Engine.npcs.d)
            : {};
        if (!npcs) return null;
        const normPatterns = (patterns || []).map(normalizeDialogText).filter(Boolean);
        for (let id in npcs) {
            const n = npcs[id]?.d || npcs[id];
            if (!n || !n.nick) continue;
            const nickNorm = normalizeDialogText(n.nick.replace(/<[^>]*>?/gm, ''));
            if (normPatterns.some(p => nickNorm.includes(p))) {
                return { id: Number(id), x: Number(n.x), y: Number(n.y), nick: n.nick };
            }
        }
        return null;
    }

    function normalizeTransportMapName(name) {
        const stopWords = new Set(["wyspa", "archipelag", "na", "do", "od", "z", "ze"]);
        const simplifyWord = (word) => {
            if (!word) return "";
            const endings = ["owie", "owiec", "owie", "owej", "owego", "owym", "ami", "ach", "owie", "owi", "ie", "ia", "iu", "a", "e", "u", "y", "ą", "ę"]; 
            for (const end of endings) {
                if (word.length > end.length + 2 && word.endsWith(end)) {
                    return word.slice(0, -end.length);
                }
            }
            return word;
        };

        return normalizeDialogText(name)
            .replace(/[^a-z0-9 ]/g, " ")
            .split(" ")
            .map(w => w.trim())
            .filter(Boolean)
            .filter(w => !stopWords.has(w))
            .map(simplifyWord)
            .join(" ")
            .trim();
    }

    function levenshteinDistance(a, b) {
        if (a === b) return 0;
        if (!a) return b.length;
        if (!b) return a.length;

        const rows = a.length + 1;
        const cols = b.length + 1;
        const matrix = Array.from({ length: rows }, () => new Array(cols).fill(0));

        for (let i = 0; i < rows; i++) matrix[i][0] = i;
        for (let j = 0; j < cols; j++) matrix[0][j] = j;

        for (let i = 1; i < rows; i++) {
            for (let j = 1; j < cols; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }

        return matrix[rows - 1][cols - 1];
    }

    function scoreTransportDestination(optionText, targetMap) {
        const optionNorm = normalizeTransportMapName(optionText);
        const targetNorm = normalizeTransportMapName(targetMap);
        if (!optionNorm || !targetNorm) return 0;

        if (optionNorm === targetNorm) return 1;
        if (optionNorm.includes(targetNorm) || targetNorm.includes(optionNorm)) return 0.95;

        const dist = levenshteinDistance(optionNorm, targetNorm);
        const maxLen = Math.max(optionNorm.length, targetNorm.length);
        const editScore = maxLen > 0 ? (1 - (dist / maxLen)) : 0;

        const optionTokens = new Set(optionNorm.split(" ").filter(Boolean));
        const targetTokens = new Set(targetNorm.split(" ").filter(Boolean));
        const common = [...targetTokens].filter(t => optionTokens.has(t)).length;
        const tokenScore = targetTokens.size ? (common / targetTokens.size) : 0;

        return (editScore * 0.65) + (tokenScore * 0.35);
    }

    function clickDialogOptionByPatterns(patterns, preferredDestination = null) {
        const options = Array.from(document.querySelectorAll(
            '.dialogue-window-answer, .dialog-item, .dialog-choice, .option, .answer, .dialog-answer, #dialog li, .dialog-options li, .dialog-texts li, [data-option]'
        ));
        if (!options.length) return false;

        const normPatterns = (patterns || []).map(normalizeDialogText).filter(Boolean);
        const matched = normPatterns.length
            ? options.filter(opt => {
                const txt = normalizeDialogText(opt.innerText || opt.textContent || '');
                return normPatterns.some(p => txt.includes(p));
            })
            : [];

        const candidates = matched.length ? matched : options;
        if (!candidates.length) return false;

        let targetOpt = candidates[0];

        if (preferredDestination) {
            let best = null;
            for (const opt of candidates) {
                const txtRaw = (opt.innerText || opt.textContent || '');
                const score = scoreTransportDestination(txtRaw, preferredDestination);
                if (!best || score > best.score) best = { opt, score };
            }

            if (best && best.score >= 0.5) {
                targetOpt = best.opt;
            } else if (!matched.length) {
                return false;
            }
        } else if (!matched.length) {
            return false;
        }

        targetOpt.click();
        return true;
    }

    function resolveSpecialTransportGateway(currentMap, targetMap) {
        let exactX = null, exactY = null;
        const liveDoor = typeof getBestReachableGatewayToMap === 'function' ? getBestReachableGatewayToMap(targetMap) : null;
        if (liveDoor && liveDoor.reachable) {
            exactX = liveDoor.x;
            exactY = liveDoor.y;
        } else {
            const baseDoor = globalGateways[currentMap] && globalGateways[currentMap][targetMap];
            if (baseDoor) {
                const distMap = typeof buildDistanceMapFromHero === 'function' ? buildDistanceMapFromHero() : new Map();
                const bestBaseCoord = typeof pickBestReachableGatewayCoordFromBaseDoor === 'function'
                    ? pickBestReachableGatewayCoordFromBaseDoor(baseDoor, distMap)
                    : null;
                if (bestBaseCoord) {
                    exactX = bestBaseCoord.x;
                    exactY = bestBaseCoord.y;
                }
            }
        }

        if (exactX === null || exactY === null) return null;
        return { x: exactX, y: exactY };
    }

    window.handleSpecialTransport = function(targetMap) {
        if (!isRushing && !isPatrolling && !window.isExping) return false;
        const currentMap = getCurrentMapName();
        const route = getSpecialTransportRoute(currentMap, targetMap);
        if (!route) return false;

        const routeKey = `${normalizeDialogText(currentMap)}=>${normalizeDialogText(targetMap)}`;
        if (!window.specialTransportState || window.specialTransportState.key !== routeKey) {
            window.specialTransportState = { key: routeKey, startedAt: Date.now() };
        }

        if (route.preferGateway) {
            const gate = resolveSpecialTransportGateway(currentMap, targetMap);
            if (gate) {
                const hx = Number(Engine?.hero?.d?.x);
                const hy = Number(Engine?.hero?.d?.y);
                const dist = Math.max(Math.abs(hx - gate.x), Math.abs(hy - gate.y));
                if (dist > 1) {
                    safeGoTo(gate.x, gate.y, false);
                } else {
                    ActionExecutor.runWithRetry('PASS_GATE', { x: gate.x, y: gate.y, targetMap }, () => safeGoTo(gate.x, gate.y, false), { retries: 2, baseDelay: 220 });
                }
                rescheduleSpecialTransport(targetMap);
                return true;
            }
        }

        const tryPatterns = [
            [targetMap],
            route.optionPatterns?.boardShip || [],
            route.optionPatterns?.mapSelect || [],
            route.optionPatterns?.confirm || []
        ];
        for (const patterns of tryPatterns) {
            if (clickDialogOptionByPatterns(patterns, targetMap)) {
                if (window.logExp) window.logExp(`⛴️ Transport: wybieram opcję dla [${targetMap}]`, "#26c6da");
                rescheduleSpecialTransport(targetMap);
                return true;
            }
        }

        const npc = findNpcByNickIncludes(route.npcNickIncludes);
        if (npc) {
            const hx = Number(Engine?.hero?.d?.x);
            const hy = Number(Engine?.hero?.d?.y);
            const dist = Math.max(Math.abs(hx - npc.x), Math.abs(hy - npc.y));
            if (dist > 1) {
                safeGoTo(npc.x, npc.y, false);
            } else if (typeof Engine?.npcs?.interact === 'function') {
                Engine.npcs.interact(npc.id);
            } else if (typeof window._g === 'function') {
                window._g(`talk&id=${npc.id}`);
            }
            rescheduleSpecialTransport(targetMap);
            return true;
        }

        rescheduleSpecialTransport(targetMap);
        return true;
    };

    function rescheduleSpecialTransport(targetMap) {
        if (isRushing) {
            clearTimeout(rushInterval);
            rushInterval = setTimeout(() => window.handleSpecialTransport(targetMap), 700);
        } else if (isPatrolling) {
            clearTimeout(smoothPatrolInterval);
            smoothPatrolInterval = setTimeout(() => window.handleSpecialTransport(targetMap), 700);
        } else if (window.isExping) {
            setTimeout(() => window.handleSpecialTransport(targetMap), 700);
        }
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
                    <button id="btnToggleRadar" style="color:#9c27b0; border-color:#9c27b0;"><span class="btn-icon">📡</span><span>Radar</span></button>
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
                                <label style="color:#e0d8c0; font-size:10px; display:flex; align-items:center; gap:3px; cursor:pointer; margin:0 4px;" title="Zmusza bota do sprzedawania wyłącznie u Tunii">
                                    <input type="checkbox" id="autosellOnlyTunia" ${botSettings.autosell?.onlyTunia ? 'checked' : ''}> Tunia
                                </label>
                                <button id="btnForceSell" class="btn-sepia" style="background:#e65100; font-weight:bold; padding:2px 6px; border-color:#bf360c;">🏃 OPRÓŻNIJ TERAZ</button>
                            </div>
                        </div>
                    </div>
                 <div class="accordion-header" id="accAlerts" onclick="toggleSettingsAcc('accAlerts')" style="background: rgba(33, 150, 243, 0.2); border-color: #2196f3; color: #2196f3; margin-top: 5px; margin-bottom: 0;">▼ ALARMY I POWIADOMIENIA</div>
                    <div id="accAlertsContent" style="display:none; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid #2196f3; border-top: none; margin-bottom: 5px;">
                        <div style="display:flex; flex-direction:column; gap:6px;">
                            <button id="btnOpenBrowserAlertsModule" class="btn-sepia" style="background:#ff9800; border-color:#f57c00; width:100%; padding:6px; font-weight:bold; font-size:11px;">🔔 POWIADOMIENIA PRZEGLĄDARKI</button>
                            <button id="btnOpenDiscordModule" class="btn-sepia" style="background:#5865F2; border-color:#4752C4; width:100%; padding:6px; font-weight:bold; font-size:11px;">💬 KONFIGURACJA DISCORD</button>
                        </div>
                    </div>

                    <div class="accordion-header" id="accExpRules" onclick="toggleSettingsAcc('accExpRules')" style="background: rgba(156, 39, 176, 0.2); border-color: #9c27b0; color: #ba68c8; margin-top: 5px; margin-bottom: 0;">▼ ZASADY WALKI I BEZPIECZEŃSTWO</div>
                    <div id="accExpRulesContent" style="display:none; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid #9c27b0; border-top: none; margin-bottom: 5px;">
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
                        <div style="border-top:1px solid #333; padding-top:6px; margin-top:4px;">
                            <label style="color:#ff5252; font-size:10px; cursor:pointer; display:block; margin-bottom:4px;" title="Ucieka na 10 minut z czerwonej mapy, gdy gracz jest bliżej niż 6 kratek"><input type="checkbox" id="pvpFlee" ${botSettings.exp.pvpFlee ? 'checked' : ''}> 🏃 Uciekaj z map PvP</label>
                            <label style="color:#e040fb; font-size:10px; cursor:pointer; display:block; margin-top:4px;" title="Zezwala na używanie zwojów teleportacji z ekwipunku podczas expienia."><input type="checkbox" id="useTeleportsEq" ${botSettings.exp.useTeleportsEq ? 'checked' : ''}> 📜 Używaj teleportów z EQ (tylko w EXP)</label>
                        </div>
                    </div>
                    <div class="accordion-header" id="accRoute" onclick="toggleSettingsAcc('accRoute')" style="background: rgba(0, 150, 136, 0.2); border-color: #009688; color: #009688; margin-top: 5px; margin-bottom: 0;">▼ TRASA EXPOWISKA (SMART-ROAM)</div>
                    <div id="accRouteContent" style="display:none; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid #009688; border-top: none; margin-bottom: 5px;">
                        <label style="color:#00e5ff; font-size:10px; cursor:pointer; font-weight:bold; margin-bottom:6px; display:block;"><input type="checkbox" id="autoChangeExpRoute" ${botSettings.exp.autoChangeRoute ? 'checked' : ''}> 🔄 Automatyczna zmiana Expowiska</label>
                        <input type="hidden" id="expRange" value="999">
                       <label style="color:#a99a75; font-size:11px; margin-top:2px; display:flex; justify-content:space-between; align-items:center;">Kolejność map: <div style="display:flex; gap:8px;"><span onclick="window.optimizeExpRoute()" style="color:#00e5ff; cursor:pointer; font-weight:bold;" title="Automatycznie ułóż i połącz mapy w pętlę">🔀 Optymalizuj</span><span onclick="window.clearExpMaps()" style="color:#e53935; cursor:pointer; font-weight:bold;" title="Wyczyść całą trasę">🗑️ Wyczyść</span></div></label>
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

              <div style="display:flex; gap:4px;">
                    <button id="btnSaveSettings" class="btn btn-go-sepia" style="flex:1; padding:6px 2px; font-size:9px;">💾 ZAPISZ OPCJE</button>
                    <button id="btnExportFile" class="btn btn-sepia" style="flex:1; padding:6px 2px; font-size:9px; background:#00838f; border-color:#00acc1;" title="Zapisuje bazę do pliku na dysk">📥 POBIERZ PLIK</button>
                    <button id="btnImportFile" class="btn btn-sepia" style="flex:1; padding:6px 2px; font-size:9px; background:#e65100; border-color:#ef6c00;" title="Wczytuje bazę z pliku">📂 WGRAJ PLIK</button>
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
            window.expRunId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
            window.expCycleId = 0;
            this.innerHTML = "⏹ STOP";
            this.style.borderColor = "#f44336";
            this.style.color = "#f44336";

            // BEZWZGLĘDNY RESET BLOKAD RUCHU

            // BEZWZGLĘDNY RESET BLOKAD RUCHU
            window.isRushing = false;
            window.isRushingToShop = false;
            if (window.autoSellState) window.autoSellState.active = false;
            if (window.autoPotState) window.autoPotState.active = false;
            if (window.rushInterval) clearTimeout(window.rushInterval);

           expCurrentTargetId = null;
window.expCurrentTargetGroupKey = null;
            window.expFocusTarget = null;
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
            HeroLogger.emit('INFO', 'ROUTE_START', 'START ekspienia/trasy', "#4caf50", { category: 'ROUTE' });

            if (botSettings.berserk) {
                const prevUserEnabled = !!botSettings.berserk.userEnabled;
                const chkState = chk ? !!chk.checked : prevUserEnabled;
                botSettings.berserk.userEnabled = chkState;
                saveSettings();
                if (window.RouteCombatFSM) window.RouteCombatFSM.syncFromSettings();
                if (window.BerserkController) window.BerserkController.onBotStart('route_start');
            }
        } else {
            window.expRunId = null;
            this.innerHTML = "▶ START";
            this.style.borderColor = "#4caf50";
            this.style.color = "#4caf50";
            // TWARDE ZATRZYMANIE BOTA I POSTACI
            window.isRushing = false;
            if (window.rushInterval) clearTimeout(window.rushInterval);
            if (typeof stopPatrol === 'function') stopPatrol(true); // Wciska fizyczny hamulec na mapie

            if (typeof window.logExp === 'function') window.logExp("🛑 Zatrzymano tryb automatyczny.", "#f44336");
            HeroLogger.emit('INFO', 'ROUTE_STOP', 'STOP ekspienia/trasy', "#f44336", { category: 'ROUTE' });

            if (window.BerserkController) window.BerserkController.onBotStop('route_stop');
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
            botSettings.berserk = { enabled: false, userEnabled: false, common: true, e1: false, e2: false, hero: false, minLvlOffset: -20, maxLvlOffset: 100, disableBerserkOnStop: false };
            saveSettings();
        }
        if (botSettings.berserk.userEnabled === undefined) botSettings.berserk.userEnabled = botSettings.berserk.enabled;
        if (botSettings.berserk.disableBerserkOnStop === undefined) botSettings.berserk.disableBerserkOnStop = false;
        if (window.RouteCombatFSM) window.RouteCombatFSM.syncFromSettings();

        if (!botSettings.autoheal) { botSettings.autoheal = { enabled: false, threshold: 80, ignoreItems: "Zielona pietruszka\nKandyzowane wisienki w cukrze", unidItems: "Czarna perła życia" }; saveSettings(); }
        if (!botSettings.autopot) { botSettings.autopot = { enabled: false, stacks: 14 }; saveSettings(); }
        if (botSettings.exp.autoChangeRoute === undefined) { botSettings.exp.autoChangeRoute = false; saveSettings(); }
      if (botSettings.exp.captchaAlert === undefined) { botSettings.exp.captchaAlert = true; saveSettings(); }
        bindChange('captchaAlert', (e) => { botSettings.exp.captchaAlert = e.target.checked; saveSettings(); if (e.target.checked && Notification.permission !== "granted") Notification.requestPermission(); });

        if (botSettings.exp.playerAlert === undefined) { botSettings.exp.playerAlert = false; saveSettings(); }
        bindChange('playerAlert', (e) => { botSettings.exp.playerAlert = e.target.checked; saveSettings(); if (e.target.checked && Notification.permission !== "granted") Notification.requestPermission(); });

        if (botSettings.exp.playerAlertStopBot === undefined) { botSettings.exp.playerAlertStopBot = false; saveSettings(); }
        bindChange('playerAlertStopBot', (e) => { botSettings.exp.playerAlertStopBot = e.target.checked; saveSettings(); });

        if (botSettings.exp.pvpFlee === undefined) { botSettings.exp.pvpFlee = false; saveSettings(); }
        bindChange('pvpFlee', (e) => { botSettings.exp.pvpFlee = e.target.checked; saveSettings(); });

        if (botSettings.exp.chatAlert === undefined) { botSettings.exp.chatAlert = false; saveSettings(); }
        if (botSettings.exp.chatAlertStopBot === undefined) { botSettings.exp.chatAlertStopBot = false; saveSettings(); }
        if (botSettings.exp.useTeleportsEq === undefined) { botSettings.exp.useTeleportsEq = true; saveSettings(); }
bindChange('useTeleportsEq', (e) => { botSettings.exp.useTeleportsEq = e.target.checked; saveSettings(); });
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

                // AUTOMATYCZNA OPTYMALIZACJA PO ZAŁADOWANIU NOWEJ BAZY
                if (typeof window.optimizeExpRoute === 'function') window.optimizeExpRoute(true);

                localStorage.setItem('exp_map_order_v64', JSON.stringify(botSettings.exp.mapOrder));
                let lvlMatch = p.name.match(/\((\d+)\s*lvl\)/i);
                if(lvlMatch && lvlMatch[1]) {
                    let baseLvl = parseInt(lvlMatch[1]);
                    botSettings.exp.minLvl = Math.max(1, baseLvl - 5);
                    botSettings.exp.maxLvl = baseLvl + 15;
                    let mIn = document.getElementById('expMinL'); let mAx = document.getElementById('expMaxL');
                    if (mIn) mIn.value = botSettings.exp.minLvl; if (mAx) mAx.value = botSettings.exp.maxLvl;
                }

                window.mapClearTimes = {}; expCurrentTargetId = null; window.expCurrentTargetGroupKey = null; expMapTransitionCooldown = 0; expLastActionTime = 0; expAntiLagTime = 0;
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
        function syncBerserkToggleVisual() {
            const chk = document.getElementById('berserkEnabled');
            if (!chk) return;
            const desiredAuto = !!botSettings?.berserk?.userEnabled;
            const activeNow = !!(botSettings?.berserk?.enabled || Engine?.settings?.d?.fight_auto_solo);
            chk.checked = desiredAuto;
            chk.title = desiredAuto
                ? (activeNow ? 'Berserk aktywny' : 'Berserk auto-aktywny (chwilowo OFF poza EXP/trasą)')
                : 'Berserk wyłączony';
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
            syncBerserkToggleVisual();
        };

        if (botSettings.autosell && typeof botSettings.autosell.onlyTunia === 'undefined') { botSettings.autosell.onlyTunia = false; saveSettings(); }
        bindChange('autosellEnabled', (e) => { botSettings.autosell.enabled = e.target.checked; saveSettings(); });
        bindChange('autosellCapacity', (e) => { botSettings.autosell.maxCapacity = parseInt(e.target.value) || 42; saveSettings(); });
        bindChange('autosellOnlyTunia', (e) => { botSettings.autosell.onlyTunia = e.target.checked; saveSettings(); });

        bindChange('berserkEnabled', (e) => {
            botSettings.berserk.userEnabled = e.target.checked;
            saveSettings();
            if (window.RouteCombatFSM) {
                window.RouteCombatFSM.update({ berserkCheckbox: !!e.target.checked }, 'checkbox_change');
                window.RouteCombatFSM.syncRuntimeContext('checkbox_runtime_sync');
            }
        });
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



      // --- MODUŁ EXPORTU / IMPORTU DO PLIKU ---
        let keysToSave = ['hero_global_gateways_v20', 'hero_map_order_v20', 'hero_settings_db_v64', 'exp_profiles_v64_4', 'hero_boss_coords_v64', 'hero_teleports_by_nick_v64'];

        let btnExport = document.getElementById('btnExportFile');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                let backup = {};
                keysToSave.forEach(k => { if(localStorage.getItem(k)) backup[k] = localStorage.getItem(k); });

                // Tworzenie wirtualnego pliku JSON
                let blob = new Blob([JSON.stringify(backup, null, 2)], {type: "application/json"});
                let url = URL.createObjectURL(blob);

                // Wymuszenie pobrania
                let a = document.createElement('a');
                a.href = url;
                a.download = `MargoNeuro_Baza_${new Date().toISOString().slice(0,10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                heroAlert("✅ Plik z zapisaną pamięcią bota został pomyślnie wygenerowany i pobrany na Twój komputer!");
            });
        }

        let btnImport = document.getElementById('btnImportFile');
        if (btnImport) {
            btnImport.addEventListener('click', () => {
                // Wywołanie systemowego okna wyboru pliku
                let input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = e => {
                    let file = e.target.files[0];
                    if (!file) return;

                    let reader = new FileReader();
                    reader.onload = function(ev) {
                        try {
                            let parsed = JSON.parse(ev.target.result);
                            for(let k in parsed) { localStorage.setItem(k, parsed[k]); }
                            heroAlert("✅ Sukces! Odczytano plik i zainstalowano nową bazę!\nZaraz nastąpi automatyczne odświeżenie gry...");
                            setTimeout(() => window.location.reload(), 2500);
                        } catch(err) {
                            heroAlert("❌ Błąd: Wybrany plik jest uszkodzony lub nie należy do bota MargoNeuro!");
                        }
                    };
                    reader.readAsText(file);
                };
                input.click();
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

            HERO_LOG.success(`Trasa pętli ustawiona od mapy: ${mapName}`);

        } else {

            // Jeśli kliknąłeś inną mapę - sprawdzamy, czy bot zna drogę

            let path = getShortestPath(currentSysMap, mapName);



            if (path && path.length > 1) {

                HERO_LOG.info(`Znaleziono drogę. Biegnę na wybraną mapę: ${mapName}`);

                // Ustawiamy nowy index na przyszłość, żeby po dobiegnięciu kontynuował pętlę stamtąd

                currentRouteIndex = index;

                sessionStorage.setItem('hero_route_index', currentRouteIndex);



                // Uruchamiamy bieg (Rush Mode)

                rushToMap(mapName);

            } else {

                HERO_LOG.warn(`Brak drogi: jesteś na [${currentSysMap}], cel to [${mapName}]. Najpierw nagraj przejścia (🎥).`);

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
                    // Wyrzucenie duplikatów i automatyczne zoptymalizowanie nowej grupy map
                    botSettings.exp.mapOrder = [...new Set(botSettings.exp.mapOrder)];
                    if (typeof window.optimizeExpRoute === 'function') window.optimizeExpRoute(true);

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

            if (!(window.margoWalkableMask instanceof Set)) {
                window.margoWalkableMask = new Set();
            }
            if (window.margoWalkableMask.size === 0 && typeof updateWalkableArea === 'function') {
                updateWalkableArea();
            }

            let dbDistMap = buildDistanceMapFromHero();
            
            for (let target in currentMapGateways) {
                let coords = currentMapGateways[target];

                // FIZYCZNE SPRAWDZENIE KRATKI ZAMIAST PO NAZWIE
                let isReachable = false;
                if (dbDistMap && dbDistMap.size > 0) {
                    for(let dx = -1; dx <= 1; dx++) {
                        for(let dy = -1; dy <= 1; dy++) {
                            if(dbDistMap.has(`${coords.x + dx}_${coords.y + dy}`)) {
                                isReachable = true; break;
                            }
                        }
                        if(isReachable) break;
                    }
                }

                let borderColor = isReachable ? "#4caf50" : "#9e9e9e";
                let targetColor = isReachable ? "#00acc1" : "#b0bec5";
                let statusText = isReachable ? "✅ dostępne" : "⛔ brak dojścia";
                let titleText = isReachable ? "Biegnij tam!" : "To przejście jest w bazie, ale ściana lub odległość blokuje dostęp.";

                let clickAction = isReachable ? `onclick="goSinglePoint(${coords.x}, ${coords.y}, '${currentSysMap}')"` : "";

                let row = document.createElement('div');
                row.className = "list-item";
                row.style.borderLeft = `3px solid ${borderColor}`;

                row.innerHTML = `
                    <div style="font-size:10px; color:#e0d8c0; display:flex; flex-direction:column; ${isReachable ? 'cursor:pointer;' : 'opacity:0.75;'} flex-grow:1;"
                         ${clickAction} title="${titleText}">
                        <span style="color:${targetColor}; font-weight:bold;">DO: ${target}</span>
                        <span style="color:#a99a75;">Ostatnia klatka: X: ${coords.x}, Y: ${coords.y}</span>
                        <span style="color:${isReachable ? '#81c784' : '#ef9a9a'};">${statusText}</span>
                    </div>
                    <button class="icon-btn" style="padding:0 5px;" title="Usuń z bazy" onclick="deleteGateway('${currentSysMap}', '${target}')">🗑️</button>
                `;

                container.appendChild(row);
            }
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


   window.safeGoTo = function(targetX, targetY, useRandom) {
        let now = Date.now();
        if (now < nextAllowedClickTime) return;

        let x = Number(targetX); 
        let y = Number(targetY);
        if (isNaN(x) || isNaN(y)) return;

        if (useRandom) {
            let radius = botSettings.randomRadius;
            if (radius > 0) {
                x += Math.floor(Math.random() * (radius * 2 + 1)) - radius;
                y += Math.floor(Math.random() * (radius * 2 + 1)) - radius;
                x = Math.max(0, x); y = Math.max(0, y);
            }
        }

        if (typeof Engine !== 'undefined' && Engine.hero) {
            if (typeof Engine.hero.autoGoTo === 'function') {
                Engine.hero.autoGoTo({x: x, y: y});
            } else if (typeof window.originalAutoWalk === 'function') {
                window.originalAutoWalk.call(Engine.hero, x, y);
            } else if (typeof Engine.hero.autoWalk === 'function') {
                Engine.hero.autoWalk(x, y);
            } else if (typeof window._g === 'function') {
                window._g(`walk=${x},${y}`);
            }

            let throttleDelay = Math.floor(Math.random() * (botSettings.throttleMax - botSettings.throttleMin + 1)) + botSettings.throttleMin;
            nextAllowedClickTime = Date.now() + throttleDelay;
        }
    };

    // Kompatybilność wsteczna w razie wywołania bez "window."
    function safeGoTo(targetX, targetY, useRandom) {
        window.safeGoTo(targetX, targetY, useRandom);
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

        if (window.isExping) {
            window.isExping = false;
            window.expRunId = null;
            const expBtn = document.getElementById('btnStartExp');
            if (expBtn) {
                expBtn.innerHTML = "▶ START";
                expBtn.style.borderColor = "#4caf50";
                expBtn.style.color = "#4caf50";
            }
            if (window.logExp) window.logExp("🛑 Zatrzymano tryb automatyczny.", "#f44336");
            HeroLogger.emit('INFO', 'ROUTE_STOP', 'STOP ekspienia/trasy (stopPatrol)', "#f44336", { category: 'ROUTE' });
        }

        if (window.BerserkController?.onBotStop) window.BerserkController.onBotStop('stop_patrol');
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
    let expPinnedMap = "";
let expPinnedMapUntil = 0;

let expLastY = -1;

let expAntiLagTime = 0;



let expAttackLockUntil = 0;

let expGatewayLockUntil = 0;

let expMapEnteredAt = 0;

let expLastMapName = "";

let expEmptyScans = 0;
let expLastLoggedTargetId = null;
let expLastLoggedTransitMap = null;
let expLastMissingTargetId = null;
let expRetargetEarliestAt = 0;

let expCurrentMapOrderIndex = -1;

let expLastTargetSwitchAt = 0;
const EXP_TARGET_FOCUS_LOCK_MS = 5600;



window.lastHeroExpLevel = 0;

window.mapClearTimes = window.mapClearTimes || {};

window.expRunId = null;
window.expCycleId = 0;

const HeroLogger = {
    levels: { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 },
    counters: new Map(),
    getLevel() {
        return ((botSettings?.logging?.level || 'INFO') + '').toUpperCase();
    },
    shouldLog(level) {
        return (this.levels[level] || 20) >= (this.levels[this.getLevel()] || 20);
    },
    emit(level, event, msg, color = "#a99a75", opts = {}) {
        if (!this.shouldLog(level)) return;
        const now = Date.now();
        const dedupeMs = opts.dedupeMs ?? (botSettings?.logging?.dedupeWindowMs ?? 6000);
        const key = `${level}:${event}:${msg}`;
        const bucket = this.counters.get(key) || { at: 0, count: 0 };
        bucket.count++;
        if (now - bucket.at < dedupeMs && level === "WARN") {
            this.counters.set(key, bucket);
            return;
        }
        const suffix = (bucket.count > 1 && now - bucket.at < dedupeMs * 2) ? ` (x${bucket.count})` : "";
        this.counters.set(key, { at: now, count: 0 });
        const category = (opts.category || 'GENERAL').toUpperCase();
        const prefix = `[${level}][${category}][${event}]${window.expRunId ? `[run:${window.expRunId}]` : ''}[cycle:${window.expCycleId || 0}]`;
        if (window.logExp) window.logExp(`${prefix} ${msg}${suffix}`, color);
    }
};

const RouteCombatFSM = {
    state: {
        running: false,
        currentTask: 'IDLE',
        inRouteMap: false,
        berserkCheckbox: false,
        berserkActive: false
    },
    syncFromSettings() {
        this.state.berserkCheckbox = !!(botSettings?.berserk?.userEnabled);
        this.state.berserkActive = !!(botSettings?.berserk?.enabled || Engine?.settings?.d?.fight_auto_solo);
    },
    syncRuntimeContext(reason = 'runtime_sync') {
        const currMap = Engine?.map?.d?.name || '';
        const running = !!window.isExping;
        const task = (window.autoSellState?.active ? 'AUTOSELL' : (window.autoPotState?.active ? 'AUTOPOT' : (running ? 'EXP' : 'IDLE')));
        const inRouteMap = !!(running && currMap && isMapInSelectedExpowisko(currMap) && !window.isRushing);
        this.update({ running, currentTask: task, inRouteMap }, reason);
    },
    update(partial = {}, reason = 'sync', opts = {}) {
        const prev = this.state;
        this.state = { ...this.state, ...partial };
        if (prev.currentTask !== this.state.currentTask) {
            HeroLogger.emit('INFO', 'TASK_CHANGE', `Task: ${prev.currentTask} -> ${this.state.currentTask} (reason=${reason})`, "#ce93d8", { category: 'TASK' });
        }
        if (opts.skipEvaluate) return;
        this.evaluate(reason);
    },
    shouldBerserkBeOn(ctx = this.state) {
        return !!(ctx.running && ctx.currentTask === 'EXP' && ctx.inRouteMap && ctx.berserkCheckbox);
    },
    evaluate(reason = 'sync') {
        const shouldEnable = this.shouldBerserkBeOn();
        const currentlyActive = !!(botSettings?.berserk?.enabled || Engine?.settings?.d?.fight_auto_solo);
        this.state.berserkActive = currentlyActive;

        if (shouldEnable) {
            this._disableRequestedAt = 0;
            if (!currentlyActive && window.BerserkController?.setBotBerserkState) {
                window.BerserkController.setBotBerserkState(true, reason);
            }
            return;
        }

        if (currentlyActive) {
            const now = Date.now();
            if (!this._disableRequestedAt) {
                this._disableRequestedAt = now;
                if (reason !== 'poll') {
                    HeroLogger.emit('DEBUG', 'BERSERK_HOLD_OFF', `Wstrzymuję wyłączenie berserka przez 1800ms (reason=${reason}).`, "#a99a75", { category: 'BERSERK', dedupeMs: 4000 });
                }
                return;
            }
            if (now - this._disableRequestedAt < 1800) return;
            this._disableRequestedAt = 0;
            if (window.BerserkController?.setBotBerserkState) window.BerserkController.setBotBerserkState(false, reason);
            return;
        }

        this._disableRequestedAt = 0;
        if (reason !== 'poll') {
            HeroLogger.emit('DEBUG', 'BERSERK_EVAL', `Noop reason=${reason} shouldEnable=${shouldEnable} active=${currentlyActive}`, "#a99a75", { category: 'BERSERK', dedupeMs: 20000 });
        }
    },
    canAutoAttack() {
        const berserkOn = !!(botSettings?.berserk?.enabled || Engine?.settings?.d?.fight_auto_solo);
        if (!berserkOn) {
            HeroLogger.emit('DEBUG', 'ATTACK_SUPPRESSED', 'Zablokowano auto-atak, bo berserk jest OFF.', "#ffb74d", { category: 'COMBAT' });
            return false;
        }
        return true;
    }
};
window.RouteCombatFSM = RouteCombatFSM;

const ActionExecutor = {
    recent: new Map(),
    throttles: { MOVE: 380, ATTACK: 850, PASS_GATE: 1200, TOGGLE_BERSERK: 1800 },
    makeKey(type, payload) {
        if (type === 'ATTACK') return `ATTACK:${payload?.targetId}`;
        if (type === 'MOVE') return `MOVE:${payload?.x}:${payload?.y}`;
        if (type === 'PASS_GATE') return `PASS_GATE:${payload?.x}:${payload?.y}:${payload?.targetMap || ''}`;
        if (type === 'TOGGLE_BERSERK') return `TOGGLE_BERSERK:${payload?.state ? 1 : 0}`;
        return `${type}:${JSON.stringify(payload || {})}`;
    },
    run(type, payload, fn, opt = {}) {
        if (type === 'ATTACK' && window.RouteCombatFSM && !window.RouteCombatFSM.canAutoAttack()) return false;
        const now = Date.now();
        const key = opt.idempotencyKey || this.makeKey(type, payload);
        const last = this.recent.get(key) || 0;
        const throttle = opt.throttleMs ?? this.throttles[type] ?? 500;
        if (now - last < throttle) {
            HeroLogger.emit('DEBUG', 'ACTION_SKIPPED_BY_THROTTLE', `${type} ${key}`);
            return false;
        }
        this.recent.set(key, now);
        fn();
        const level = (type === 'MOVE' || type === 'ATTACK') ? 'DEBUG' : 'INFO';
        HeroLogger.emit(level, 'ACTION_SENT', `${type} ${key}`, "#90caf9", { category: 'NET' });
        return true;
    },
    runWithRetry(type, payload, fn, opt = {}) {
        const retries = opt.retries ?? 3;
        const baseDelay = opt.baseDelay ?? 250;
        for (let i = 0; i <= retries; i++) {
            const ok = this.run(type, payload, fn, opt);
            if (ok) return true;
            const backoff = baseDelay * Math.pow(2, i) + Math.floor(Math.random() * 120);
            if (i < retries) {
                setTimeout(() => this.run(type, payload, fn, opt), backoff);
            }
        }
        return false;
    }
};

const BerserkController = {
    setBotBerserkState(nextState, reason = 'fsm') {
        const active = !!(Engine?.settings?.d?.fight_auto_solo || botSettings?.berserk?.enabled);
        if (!!nextState === active) return false;
        const action = nextState ? 'BERSERK_ON' : 'BERSERK_OFF';
        return ActionExecutor.runWithRetry('TOGGLE_BERSERK', { state: !!nextState }, () => {
            botSettings.berserk.enabled = !!nextState;
            saveSettings();
            if (window.updateServerBerserk) window.updateServerBerserk();
            HeroLogger.emit('INFO', action, `${nextState ? 'Włączono' : 'Wyłączono'} berserka (reason=${reason})`, "#ff9800", { category: 'BERSERK' });
        }, { retries: 2, baseDelay: 350 });
    },
    syncObservedState(reason = 'observe') {
        const observedActive = !!Engine?.settings?.d?.fight_auto_solo;
        const expectedByBot = !!botSettings?.berserk?.enabled;
        const observedChanged = (this._lastObservedActive !== undefined) && (this._lastObservedActive !== observedActive);
        this._lastObservedActive = observedActive;
        if (!window.RouteCombatFSM) return;
        const effectiveActive = !!(observedActive || expectedByBot);
        window.RouteCombatFSM.update({ berserkActive: effectiveActive }, `${reason}_detected`, { skipEvaluate: true });
        if (observedChanged && observedActive !== expectedByBot) {
            HeroLogger.emit('INFO', observedActive ? 'BERSERK_DETECTED' : 'BERSERK_DETECTED_OFF', `Wykryto ${observedActive ? 'ręcznie włączonego' : 'ręcznie wyłączonego'} berserka w grze.`, '#ffcc80', { category: 'BERSERK' });
        }
        window.RouteCombatFSM.evaluate(reason);
    },
    onBotStart(reason = 'route_start') {
        if (window.RouteCombatFSM) window.RouteCombatFSM.syncRuntimeContext(reason);
    },
    onBotStop(reason = 'route_stop') {
        if (window.RouteCombatFSM) window.RouteCombatFSM.update({ running: false, currentTask: 'IDLE', inRouteMap: false }, reason, { skipEvaluate: true });
        this.setBotBerserkState(false, reason);
    }
};
window.BerserkController = BerserkController;
setInterval(() => {
    if (window.BerserkController?.syncObservedState) window.BerserkController.syncObservedState('poll');
}, 900);

const MonsterMemory = {
    items: new Map(),
    keyFor(mapId, n) {
        const fallback = `${(n.nick || n.name || 'mob').toLowerCase()}:${n.x}:${n.y}`;
        return `${mapId}|${n.id || fallback}`;
    },
    upsertVisible(mapId, n, priorityClass = 'normal') {
        const k = this.keyFor(mapId, n);
        const prev = this.items.get(k) || { seenCount: 0, failCount: 0, aliveScore: 0 };
        this.items.set(k, { ...prev, id: n.id, nick: n.nick || n.name, x: n.x, y: n.y, mapId, lastSeenAt: Date.now(), seenCount: prev.seenCount + 1, failCount: 0, aliveScore: 1, priorityClass, cooldownUntil: 0 });
        return this.items.get(k);
    },
    decay(mapId, isRedMap) {
        const now = Date.now();
        const ttl = isRedMap ? 120000 : 45000;
        for (const [k, m] of this.items.entries()) {
            if (!k.startsWith(`${mapId}|`)) continue;
            const age = now - (m.lastSeenAt || 0);
            if (age > ttl || m.failCount >= 4) { this.items.delete(k); continue; }
            m.aliveScore = Math.max(0, m.aliveScore - (isRedMap ? 0.03 : 0.08));
        }
    },
    onTargetNotFound(mapId, targetId) {
        const key = [...this.items.keys()].find(k => k.startsWith(`${mapId}|`) && this.items.get(k)?.id == targetId);
        if (!key) return null;
        const m = this.items.get(key);
        m.failCount = (m.failCount || 0) + 1;
        m.aliveScore = Math.max(0, (m.aliveScore || 1) - 0.35);
        m.cooldownUntil = Date.now() + 2600 + (m.failCount * 700);
        if (m.failCount >= 4) this.items.delete(key);
        return m;
    },
    getLikelyAliveForMap(mapId, opt = {}) {
        const now = Date.now();
        const maxAgeMs = Number(opt.maxAgeMs) || 90000;
        const minAliveScore = Number(opt.minAliveScore ?? 0.2);
        const out = [];
        for (const [k, m] of this.items.entries()) {
            if (!k.startsWith(`${mapId}|`)) continue;
            if (!m) continue;
            if (m.cooldownUntil && now < m.cooldownUntil) continue;
            const age = now - (m.lastSeenAt || 0);
            if (age > maxAgeMs) continue;
            if ((m.aliveScore || 0) < minAliveScore) continue;
            out.push({ ...m, ageMs: age });
        }
        return out;
    }
};

const GateRecovery = {
    state: { key: '', attempts: 0, blockedUntil: 0 },
    tryStep(cx, cy, dirs) {
        for (const [dx, dy] of dirs) {
            const nx = cx + dx, ny = cy + dy;
            if (typeof Engine.map.checkCollision === 'function' && Engine.map.checkCollision(nx, ny)) continue;
            ActionExecutor.run('MOVE', { x: nx, y: ny }, () => {
                if (window.originalAutoWalk) window.originalAutoWalk.call(Engine.hero, nx, ny);
                else if (Engine?.hero?.autoWalk) Engine.hero.autoWalk(nx, ny);
                else if (window._g) window._g(`walk=${nx},${ny}`);
            }, { throttleMs: 320 });
            return true;
        }
        return false;
    }
};

window.expDryRunSimulation = function(type = 'gate-stuck-x5') {
    const out = [];
    const push = (m) => { out.push(m); HeroLogger.emit('DEBUG', 'SIM', m, '#b39ddb'); };
    if (type === 'gate-stuck-x5') {
        GateRecovery.state = { key: 'sim', attempts: 0, blockedUntil: 0 };
        for (let i = 0; i < 5; i++) {
            GateRecovery.state.attempts++;
            push(`attempt=${GateRecovery.state.attempts}`);
        }
    } else if (type === 'target-missing') {
        MonsterMemory.items.clear();
        MonsterMemory.upsertVisible('sim-map', { id: 1, x: 5, y: 5, nick: 'Mob' }, 'normal');
        for (let i = 0; i < 4; i++) {
            const st = MonsterMemory.onTargetNotFound('sim-map', 1);
            push(`fail=${st?.failCount || 'deleted'}`);
        }
    } else if (type === 'berserk-start-stop') {
        if (window.RouteCombatFSM) {
            window.RouteCombatFSM.update({ running: true, currentTask: 'EXP', inRouteMap: true, berserkCheckbox: true }, 'sim_start');
            window.RouteCombatFSM.update({ inRouteMap: false }, 'sim_map_change');
            push(`berserkEnabled=${!!botSettings?.berserk?.enabled}`);
        }
    }
    return out;
};






    function normalizeConsoleMessage(msg) {
        let text = (msg ?? '').toString().trim();
        text = text.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D\s]+/gu, '').trim();
        text = text.replace(/\s+/g, ' ');
        if (!text) return '(pusty komunikat)';

        const lower = text.toLowerCase();
        if (lower.includes('włączono') && lower.includes('berserk')) return 'Berserk: ON';
        if (lower.includes('wyłączono') && lower.includes('berserk')) return 'Berserk: OFF';
        if (lower.includes('uruchomiono tryb automatyczny')) return 'Bot: START';
        if (lower.includes('zatrzymano tryb automatyczny')) return 'Bot: STOP';

        // Czyści techniczne prefiksy loggera typu [INFO][GENERAL][EVENT][run:x][cycle:y]
        text = text
            .replace(/^\[(DEBUG|INFO|WARN|ERROR)\](\[[A-Z_]+\]){1,5}\s*/i, '')
            .replace(/\[run:[^\]]+\]/gi, '')
            .replace(/\[cycle:[^\]]+\]/gi, '')
            .trim();

        const cleanLower = text.toLowerCase();
        if (cleanLower.includes('brama zajęta')) return 'Brama zajęta, ponawiam...';
        if (cleanLower.includes('gaterecovery') && cleanLower.includes('krok')) return 'Próbuję obejść zajętą bramę.';
        if (cleanLower.includes('gaterecovery') && cleanLower.includes('zablokowan')) return 'Brama chwilowo zablokowana.';
        if (cleanLower.startsWith('task:')) {
            const m = text.match(/task:\s*([a-z_]+)\s*->\s*([a-z_]+)/i);
            if (m) return `Tryb: ${m[1].toUpperCase()} → ${m[2].toUpperCase()}`;
        }

        return text;
    }

    window.logExp = function(msg, color="#a99a75") {
        let consoleDiv = document.getElementById('expConsole');
        if (!consoleDiv) return;
        const normalizedMsg = normalizeConsoleMessage(msg);
        let time = new Date().toLocaleTimeString('pl-PL', {hour12: false});
        let entry = document.createElement('div');
        entry.innerHTML = `<span style="color:#555;">[${time}]</span> <span style="color:${color};">${normalizedMsg}</span>`;
        consoleDiv.appendChild(entry);
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
        if (normalizedMsg.toLowerCase().includes('nie znaleziono przeciwnika')) {
            window.expLastTargetNotFoundAt = Date.now();
        }
    };


window.logHero = function(msg, color="#a99a75") {
        let consoleDiv = document.getElementById('heroConsole');
        if (!consoleDiv) return;
        const normalizedMsg = normalizeConsoleMessage(msg);
        let time = new Date().toLocaleTimeString('pl-PL', {hour12: false});
        let entry = document.createElement('div');
        entry.innerHTML = `<span style="color:#555;">[${time}]</span> <span style="color:${color};">${normalizedMsg}</span>`;
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

            // --- INTEGRACJA Z RADAREM (Omijanie szarych kropek) ---
            if (window.margoWalkableMask && window.margoWalkableMask.size > 0) {
                let isReachable = false;
                for(let dx = -1; dx <= 1; dx++) {
                    for(let dy = -1; dy <= 1; dy++) {
                        if(window.margoWalkableMask.has(`${n.x + dx}_${n.y + dy}`)) {
                            isReachable = true; break;
                        }
                    }
                    if(isReachable) break;
                }
                // Jeśli potwór nie dotyka dostępnego terenu - zignoruj go!
                if (!isReachable) return false;
            }
            // ------------------------------------------------------

            const name = (n.nick || n.name || '').replace(/<[^>]*>?/gm, '').trim();
            if (!name) return false;
            const lvl = parseInt(n.lvl, 10);
            if (isNaN(lvl) || lvl <= 0) return false;
            if (n.dead || n.del || n.delete) return false;
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
            // Optymalizacja ścieżki - atakujemy to co mamy najbliżej w linii ataku
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

    const mapNorm = normMapName(mapName);
    return Array.isArray(maps) && maps.some(m => normMapName(m) === mapNorm);

}

function normMapName(s) {
    return String(s || "").normalize("NFC").trim().toLowerCase();
}

function setExpBerserkState(shouldEnable) {
    if (!botSettings?.berserk || !window.RouteCombatFSM) return;
    window.RouteCombatFSM.update({ inRouteMap: !!shouldEnable }, shouldEnable ? 'exp_map_enter' : 'exp_map_leave');
}

    function getClosestExpMapPath(currMap, mapsPool = null) {

    const maps = Array.isArray(mapsPool) && mapsPool.length ? mapsPool : (botSettings?.exp?.mapOrder || []);

    if (!maps.length) return null;
    const currNorm = normMapName(currMap);
    const exactCurrInPool = maps.find(m => normMapName(m) === currNorm) || currMap;
    if (maps.some(m => normMapName(m) === currNorm)) return { path: [exactCurrInPool], targetMap: exactCurrInPool };



    let bestPath = null;

    let bestTarget = null;

    let bestLen = Infinity;



    for (const targetMap of maps) {

        const p = getShortestPath(currMap, targetMap, { allowIndoorTransit: true });

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
window.expLastMoveCommandAt = 0;
window.expTransitTempFightLogKey = null;
window.expModeDebugLogKey = null;

window.expMoveLockUntil = 0;

window.expUnreachableMobs = window.expUnreachableMobs || new Set();
window.expIgnoredTargetsByMap = window.expIgnoredTargetsByMap || {};

function getExpTargetIgnoreKey(mob) {
    if (!mob) return null;
    const nick = String(mob.nick || mob.name || '').replace(/<[^>]*>?/gm, '').trim().toLowerCase();
    const lvl = Number.parseInt(mob.lvl, 10) || 0;
    const rank = String(mob.ranga || mob.priorityClass || '').trim().toLowerCase();
    const x = Number.parseInt(mob.x, 10);
    const y = Number.parseInt(mob.y, 10);
    const hasPos = Number.isFinite(x) && Number.isFinite(y);
    if (!nick && lvl <= 0 && !hasPos) return null;
    const posKey = hasPos ? `${x}:${y}` : 'anywhere';
    return `${nick}|${lvl}|${rank}|${posKey}`;
}

function isTargetIgnoredOnMap(mapName, mob) {
    if (!mapName || !mob) return false;
    const mapKey = getMapClearKey(mapName);
    const targetKey = getExpTargetIgnoreKey(mob);
    if (!mapKey || !targetKey) return false;
    const ignoredMap = window.expIgnoredTargetsByMap?.[mapKey];
    if (!(ignoredMap instanceof Map)) return false;
    const expiresAt = ignoredMap.get(targetKey) || 0;
    if (!expiresAt) return false;
    if (Date.now() > expiresAt) {
        ignoredMap.delete(targetKey);
        if (ignoredMap.size === 0) delete window.expIgnoredTargetsByMap[mapKey];
        return false;
    }
    return true;
}

function markTargetIgnoredOnMap(mapName, mob, reason = 'too_hard') {
    if (!mapName || !mob) return false;
    const mapKey = getMapClearKey(mapName);
    const targetKey = getExpTargetIgnoreKey(mob);
    if (!mapKey || !targetKey) return false;
    if (!(window.expIgnoredTargetsByMap[mapKey] instanceof Map)) window.expIgnoredTargetsByMap[mapKey] = new Map();
    const ttlMs = reason === 'anti_stuck' ? 35000 : 90000;
    window.expIgnoredTargetsByMap[mapKey].set(targetKey, Date.now() + ttlMs);
    HeroLogger.emit('INFO', 'TARGET_HARD_IGNORED_ON_MAP', `Ignoruję cel ${mob.nick || mob.id || '?'} na mapie [${mapName}] (powód: ${reason}).`, "#ff8a65", { category: 'COMBAT', dedupeMs: 2500 });
    return true;
}

function getMapClearKey(mapName) {
    if (!mapName) return "";
    if (typeof normMapName === 'function') return normMapName(mapName);
    return String(mapName).trim().toLowerCase();
}

function isMapTemporarilyCleared(mapName) {
    if (!mapName) return false;
    if (!window.mapClearTimes) window.mapClearTimes = {};

    const mapKey = getMapClearKey(mapName);
    const ts = window.mapClearTimes[mapKey] || window.mapClearTimes[mapName];
    if (!ts) return false;
    const clearTtlMs = 70 * 1000;
    if (Date.now() - ts > clearTtlMs) {
        delete window.mapClearTimes[mapKey];
        delete window.mapClearTimes[mapName];
        return false;
    }
    return true;
}

function markMapTemporarilyCleared(mapName) {
    if (!mapName) return;
    if (!window.mapClearTimes) window.mapClearTimes = {};
    const now = Date.now();
    const mapKey = getMapClearKey(mapName);
    window.mapClearTimes[mapKey] = now;
    // Backward compatibility ze starszym formatem klucza.
    window.mapClearTimes[mapName] = now;
}

function getAllCandidateExpMaps() {
    const maps = botSettings?.exp?.mapOrder || [];
    return Array.isArray(maps) ? [...maps] : [];
}

function getCurrentExpHuntMaps() {
    const routeMaps = getAllCandidateExpMaps();
    const activeProfileName = botSettings?.exp?.activeProfileName;
    const profiles = Array.isArray(botSettings?.expProfiles) ? botSettings.expProfiles : [];
    const activeProfile = profiles.find(p => p?.name === activeProfileName);

    // Priorytet: aktualna trasa użytkownika (mapOrder).
    if (Array.isArray(routeMaps) && routeMaps.length > 0) {
        return [...new Set(routeMaps.filter(Boolean))];
    }

    // Fallback: mapy aktywnego profilu.
    if (activeProfile && Array.isArray(activeProfile.maps) && activeProfile.maps.length > 0) {
        const clean = [...new Set(activeProfile.maps.filter(Boolean))];
        if (clean.length > 0) return clean;
    }

    return [];
}

function pickNextUnclearedExpMap(currMap, mapsPool) {
    if (!Array.isArray(mapsPool) || mapsPool.length === 0) return null;

    const distMap = typeof buildDistanceMapFromHero === 'function' ? buildDistanceMapFromHero() : new Map();
    const reachableDoors = getCurrentMapGatewaysForRadar(distMap).filter(g => g.reachable && g?.targetMap);
    const now = Date.now();
    const orderedCandidates = [];
    const currNorm = normMapName(currMap);
    const currIdx = mapsPool.findIndex(m => normMapName(m) === currNorm);

    if (currIdx !== -1) {
        for (let i = 1; i <= mapsPool.length; i++) {
            const idx = (currIdx + i) % mapsPool.length;
            orderedCandidates.push(mapsPool[idx]);
        }
    } else {
        orderedCandidates.push(...mapsPool);
    }

    for (let i = 0; i < orderedCandidates.length; i++) {
        const candidate = orderedCandidates[i];
        if (!candidate || normMapName(candidate) === currNorm) continue;
        if (isMapTemporarilyCleared(candidate)) continue;
        if (window.__bannedMaps && window.__bannedMaps[candidate] && now < window.__bannedMaps[candidate]) continue;

        const path = typeof getShortestPath === 'function' ? getShortestPath(currMap, candidate, { allowIndoorTransit: true }) : null;
        if (!path || path.length < 2) continue;

        const nextHop = path[1];
        const door = pickDoorToNextHop(currMap, nextHop, distMap, reachableDoors);
        if (!door) continue;

        return {
            targetMap: candidate,
            nextHop,
            door,
            path,
            score: i + 1 + ((path.length - 2) * 0.25)
        };
    }

    return null;
}

function areAllExpMapsTemporarilyCleared(mapsPool) {
    if (!Array.isArray(mapsPool) || mapsPool.length === 0) return false;
    return mapsPool.every(m => m && isMapTemporarilyCleared(m));
}

function getNearestKnownSafeExpMap(currMap, mapsPool) {
    if (!Array.isArray(mapsPool) || mapsPool.length === 0) return null;
    window.expMapPvpCache = window.expMapPvpCache || {};

    const safeCandidates = mapsPool.filter(m => m && window.expMapPvpCache[m] !== 2);
    if (safeCandidates.length === 0) return null;

    let best = null;
    for (const mapName of safeCandidates) {
        const p = typeof getShortestPath === 'function' ? getShortestPath(currMap, mapName) : null;
        if (!p || p.length === 0) continue;
        const score = p.length;
        if (!best || score < best.score) best = { map: mapName, score };
    }
    return best ? best.map : null;
}
function getPathToAdjacentTile(targetX, targetY, distMap) {
    if (!(window.margoWalkableMask instanceof Set)) return null;
    if (!distMap) distMap = buildDistanceMapFromHero();

    const heroX = Engine?.hero?.d?.x;
    const heroY = Engine?.hero?.d?.y;
    const candidates = [];

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const nx = targetX + dx;
            const ny = targetY + dy;
            const key = `${nx}_${ny}`;
            if (!distMap.has(key)) continue;
            const dist = distMap.get(key);
            const cheb = (heroX == null || heroY == null) ? dist : Math.max(Math.abs(heroX - nx), Math.abs(heroY - ny));
            candidates.push({ x: nx, y: ny, dist, cheb });
        }
    }

    if (!candidates.length) return null;
    candidates.sort((a, b) => (a.dist - b.dist) || (a.cheb - b.cheb));

    const dest = candidates[0];

    const path = [];
    let cx = dest.x, cy = dest.y;
    let safety = 0;
    const dirs = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1],[-1,1],[1,-1]];
    while (safety++ < 2000) {
        path.push([cx, cy]);
        const ck = `${cx}_${cy}`;
        const cd = distMap.get(ck);
        if (cd === 0) break;
        let next = null;
        for (const [dx,dy] of dirs) {
            const nx = cx + dx, ny = cy + dy;
            const nk = `${nx}_${ny}`;
            if (!distMap.has(nk)) continue;
            const nd = distMap.get(nk);
            if (nd < cd && (!next || nd < next.d)) next = {x:nx,y:ny,d:nd};
        }
        if (!next) break;
        cx = next.x; cy = next.y;
    }
    path.reverse();
    return { path, stand: dest };
}

function pickBestExpTarget(validMobs, distMap) {
    if (!validMobs || !validMobs.length) return null;
    const mapName = Engine?.map?.d?.name || '';
    const filteredMobs = validMobs.filter(m => !isTargetIgnoredOnMap(mapName, m));
    if (!filteredMobs.length) return null;
    const groups = buildServerMobGroups(filteredMobs, distMap) || [];
    if (!groups.length) {
        filteredMobs.sort((a,b)=>a.dist-b.dist);
        return { mob: filteredMobs[0], groupKey: null };
    }

    const rankBonus = { normal: 0, elite1: 4, elite2: 10, hero: 16 };
    for (const g of groups) {
        const gSize = g.mobs?.length || 1;
        const d = g.bestPathDistance ?? 9999;
        const bonus = rankBonus[g.mainRanga] || 0;
        g.score = d - (gSize * 2.2) - bonus;
    }

    groups.sort((a,b)=>a.score-b.score);
    let best = groups[0];
    if (window.expCurrentTargetId != null) {
        const currentGroup = groups.find(g => (g.bestTargetMob?.id || g.mobs?.[0]?.id) == window.expCurrentTargetId);
        if (currentGroup && best && (currentGroup.score <= best.score + 1.8)) {
            best = currentGroup; // histereza przełączania celu
        }
    }
    return { mob: best.bestTargetMob || best.mobs[0], groupKey: best.key, group: best };
}

function maybeStepOutFromGatewayAfterEntry() {
    const now = Date.now();
    if (!window.expMapEnteredAt || now - window.expMapEnteredAt > 4500) return;
    if (window.expDidStepOutAfterEntry) return;
    if (!Engine || !Engine.hero || !Engine.map) return;

    const hx = Engine.hero.d.x, hy = Engine.hero.d.y;
    let gws = [];
    if (typeof Engine.map.getGateways === 'function') {
        try { gws = Engine.map.getGateways().getList().map(g=>g.d||g); } catch(e) {}
    }
    if (!gws.length && Engine.map.gateways) {
        try { gws = Array.from(Engine.map.gateways.values()).map(g=>g.d||g); } catch(e) { gws = Object.values(Engine.map.gateways).map(g=>g.d||g); }
    }

    const nearGw = gws.find(g => g && Math.abs((g.x ?? g.rx) - hx) <= 1 && Math.abs((g.y ?? g.ry) - hy) <= 1);
    if (!nearGw) { window.expDidStepOutAfterEntry = true; return; }

    const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
    for (const [dx,dy] of dirs) {
        const nx = hx + dx, ny = hy + dy;
        if (typeof Engine.map.checkCollision === 'function' && Engine.map.checkCollision(nx, ny)) continue;
        if (typeof window.safeGoTo === 'function') window.safeGoTo(nx, ny, false);
        else if (typeof Engine.hero.autoGoTo === 'function') Engine.hero.autoGoTo({x:nx, y:ny});
        window.expDidStepOutAfterEntry = true;
        window.expStepOutTs = now;
        return;
    }
}
function hasNearbyReachableMobsForExp(maxDistance = 12) {
    if (typeof Engine === 'undefined' || !Engine.hero || !Engine.map || !Engine.npcs) return false;

    let distMap = buildDistanceMapFromHero();
    let npcs = typeof Engine.npcs.check === 'function' ? Engine.npcs.check() : Engine.npcs.d;

    for (let id in npcs) {
        let n = npcs[id].d || npcs[id];
        if (!n || n.dead || n.del || n.delete) continue;

        // tylko normal / elite / hero
        if (n.type !== 2 && n.type !== 3 && n.type !== 11) continue;
        const lvl = parseInt(n.lvl, 10) || 0;
        if (lvl < botSettings.exp.minLvl || lvl > botSettings.exp.maxLvl) continue;
        const ranga = getMobRank(n);
        if (ranga === "normal" && !botSettings.exp.normal) continue;
        if (ranga === "elite1" && !botSettings.exp.elite) continue;
        if (ranga === "elite2" && !botSettings.berserk.e2) continue;
        if (ranga === "hero" && !botSettings.berserk.hero) continue;

        // szukamy pola dojścia obok moba
        let bestDist = Infinity;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const key = `${n.x + dx}_${n.y + dy}`;
                if (distMap.has(key)) {
                    bestDist = Math.min(bestDist, distMap.get(key));
                }
            }
        }

        if (bestDist <= maxDistance) {
            return true;
        }
    }

    return false;
}
function getGatewayRefreshState() {
    if (!window.expGatewayRefreshState) {
        window.expGatewayRefreshState = {
            mapName: '',
            lastScanAt: 0,
            pendingRescan: false,
            retryUntil: 0,
            cache: []
        };
    }
    return window.expGatewayRefreshState;
}

function requestGatewayRefresh(reason = 'loop', forceNow = false) {
    const state = getGatewayRefreshState();
    const currentMap = Engine?.map?.d?.name || '';
    if (!currentMap || typeof HeroScannerModule === 'undefined' || typeof HeroScannerModule.scanCurrentMap !== 'function') return state.cache || [];

    const now = Date.now();
    if (state.mapName !== currentMap) {
        state.mapName = currentMap;
        state.lastScanAt = 0;
        state.pendingRescan = false;
        state.retryUntil = now + 2500;
        state.cache = [];
    }

    const minGap = forceNow ? 0 : 500;
    if (now - state.lastScanAt < minGap) return state.cache || [];

    state.lastScanAt = now;
    let scanned = [];
    try {
        scanned = HeroScannerModule.scanCurrentMap(currentMap, typeof ZAKONNICY !== 'undefined' ? ZAKONNICY : null) || [];
    } catch (e) {
        scanned = [];
    }

    if (scanned.length) {
        state.cache = scanned;
        state.pendingRescan = false;
        state.retryUntil = 0;
    } else {
        if (state.retryUntil === 0) state.retryUntil = now + 2500;
        if (now < state.retryUntil) {
            state.pendingRescan = true;
            setTimeout(() => {
                if (!window.isExping && !window.isRushing) return;
                requestGatewayRefresh('retry', true);
            }, 220);
        } else {
            state.pendingRescan = false;
        }
    }

    return state.cache || [];
}

function getExpAllowedMapSet() {
    const maps = getCurrentExpHuntMaps();
    return new Set((maps || []).map(m => normMapName(m)));
}

function runExpLogic() {
    if (!window.isExping) return;
    if (typeof Engine === 'undefined' || !Engine.hero || !Engine.hero.d || !Engine.map || Engine.map.isLoading || !Engine.map.d.name) return;
    const currMapEarly = Engine.map.d.name;
    const mapsPoolEarly = getCurrentExpHuntMaps();
    const poolSetEarly = new Set((mapsPoolEarly || []).map(normMapName));
    const isExpMapEarly = poolSetEarly.has(normMapName(currMapEarly));
    if (window.RouteCombatFSM) {
        window.RouteCombatFSM.update({
            running: !!window.isExping,
            currentTask: (window.autoSellState?.active ? 'AUTOSELL' : (window.autoPotState?.active ? 'AUTOPOT' : 'EXP')),
            inRouteMap: !!isExpMapEarly
        }, isExpMapEarly ? 'exp_tick_in_route' : 'exp_tick_out_of_route');
    }

    if (Engine.hero.d.path && Engine.hero.d.path.length > 0) return;
    if (Engine.battle && Engine.battle.show) return;

    if ((window.autoSellState && window.autoSellState.active) || (window.autoPotState && window.autoPotState.active)) return;

    const now = Date.now();
    window.expCycleId = (window.expCycleId || 0) + 1;
    const currMap = Engine.map.d.name;
    let mapsPool = getCurrentExpHuntMaps();
    const poolSet = new Set((mapsPool || []).map(normMapName));
    const isExpMap = poolSet.has(normMapName(currMap));
    let temporaryExpMode = false;
    window.expDecisionInfo = `Mapa: ${currMap} | tryb: ${isExpMap ? "EXP" : "TRANZYT"}`;
    requestGatewayRefresh("run-exp");
    window.expMapPvpCache = window.expMapPvpCache || {};
    window.expMapPvpCache[currMap] = Engine.map?.d?.pvp;

    // Zarządzanie historią map i cooldownami
    if (window.lastExpMap !== currMap) {
        if (!window.expMapHistory) window.expMapHistory = [];
        if (window.lastExpMap) {
            if (window.expMapHistory.length === 0 || window.expMapHistory[window.expMapHistory.length - 1] !== window.lastExpMap) {
                window.expMapHistory.push(window.lastExpMap);
                if (window.expMapHistory.length > 10) window.expMapHistory.shift();
            }
        }
        window.lastExpMap = currMap;
        window.mapCooldown = now + (isExpMap ? 3200 : 800);
        window.expMapEnteredAt = now;
        window.expDidStepOutAfterEntry = false;
        window.expCurrentTargetGroupKey = null;
        window.expLastMoveTx = null;
        window.expLastMoveTy = null;
        window.expLastMoveAt = 0;
        window.expLastMoveCommandAt = 0;
        window.expLastMoveHeroX = null;
        window.expLastMoveHeroY = null;
        window.expMeleeFailByTarget = {};
        window.expFocusTarget = null;
        expLastMissingTargetId = null;
        expRetargetEarliestAt = 0;
        window.isRushing = false;
        expEmptyScans = 0;
        expCurrentTargetId = null;
        expLastLoggedTargetId = null;
        expLastLoggedTransitMap = null;
        if (window.expMonsterCache) window.expMonsterCache.clear();
        HeroLogger.emit('INFO', 'MAP_CHANGE', isExpMap ? `Wszedłem na expowisko [${currMap}]` : `Tranzyt przez [${currMap}]`, "#90caf9", { category: 'ROUTE' });
        if (window.RouteCombatFSM) {
            window.RouteCombatFSM.update({
                running: !!window.isExping,
                currentTask: 'EXP',
                inRouteMap: !!isExpMap
            }, isExpMap ? 'map_change_exp' : 'map_change_out_of_route');
        }
        return;
    }

    if (window.mapCooldown && now < window.mapCooldown) return;
    if (now < expLastActionTime) return;

    let hx = Engine.hero.d.x;
    let hy = Engine.hero.d.y;
    const isRedMapNow = Engine?.map?.d?.pvp === 2;
    const mapW = Number(Engine?.map?.d?.x) || 0;
    const mapH = Number(Engine?.map?.d?.y) || 0;
    const isOutsideCurrentMap = (x, y) => x < 0 || y < 0 || x >= mapW || y >= mapH;

    // --- PAMIĘĆ POTWORÓW I FILTR RADARU ---
    if (!window.expMonsterCache) window.expMonsterCache = new Map();
    let npcsData = typeof Engine.npcs.check === 'function' ? Engine.npcs.check() : Engine.npcs.d;
    let currentlyVisibleIds = new Set();
    
    // Skanowanie tego co widać
    for (let key in npcsData) {
        let n = npcsData[key]?.d || npcsData[key];
        if (!n || n.type === 4 || n.type < 2 || n.dead || n.del || n.delete) continue;
        if (parseInt(n.lvl) < botSettings.exp.minLvl || parseInt(n.lvl) > botSettings.exp.maxLvl) continue;
        if (isOutsideCurrentMap(n.x, n.y)) continue;

        let ranga = getMobRank(n);
        if (ranga === "normal" && !botSettings.exp.normal) continue;
        if (ranga === "elite1" && !botSettings.exp.elite) continue;
        if (ranga === "elite2" && !botSettings.berserk.e2) continue;
        if (ranga === "hero" && !botSettings.berserk.hero) continue;

        const mobCacheKey = String(n.id ?? key);
        currentlyVisibleIds.add(mobCacheKey);
        const memoryEntry = MonsterMemory.upsertVisible(currMap, n, ranga);
        window.expMonsterCache.set(mobCacheKey, { id: n.id ?? key, cacheKey: mobCacheKey, x: n.x, y: n.y, nick: n.nick || n.name, ranga, lvl: parseInt(n.lvl, 10) || 0, lastSeenAt: Date.now(), mmKey: memoryEntry?.key });
    }

    MonsterMemory.decay(currMap, Engine?.map?.d?.pvp === 2);
    // Usuwanie z pamięci mobów, które powinny być blisko, a ich nie ma (ktoś ubił)
    const staleDeleteRadius = isRedMapNow ? 5 : 10;
    const staleDeleteGraceMs = isRedMapNow ? 7000 : 2200;
    for (let [id, mob] of window.expMonsterCache.entries()) {
        const mobAgeMs = now - (mob.lastSeenAt || 0);
        if (Math.max(Math.abs(hx - mob.x), Math.abs(hy - mob.y)) <= staleDeleteRadius && !currentlyVisibleIds.has(id) && mobAgeMs > staleDeleteGraceMs) {
            window.expMonsterCache.delete(id);
        }
    }

    // Gdy chwilowo nic nie widać, dosiewamy pamięć widzianych mobów (szczególnie ważne na czerwonych mapach).
    if (window.expMonsterCache.size === 0) {
        const rememberedMobs = MonsterMemory.getLikelyAliveForMap(currMap, {
            maxAgeMs: isRedMapNow ? 120000 : 65000,
            minAliveScore: isRedMapNow ? 0.1 : 0.25
        });
        for (const remembered of rememberedMobs) {
            const cacheKey = String(remembered.id ?? remembered.nick ?? `${remembered.x}_${remembered.y}`);
            window.expMonsterCache.set(cacheKey, {
                id: remembered.id ?? cacheKey,
                cacheKey,
                x: remembered.x,
                y: remembered.y,
                nick: remembered.nick || 'Potwór',
                ranga: remembered.priorityClass || 'normal',
                lvl: remembered.lvl || 0,
                lastSeenAt: remembered.lastSeenAt || now,
                mmKey: remembered.key
            });
        }
    }

    // Wybór celu na podstawie Radaru (omijanie ścian)
    let distMap = buildDistanceMapFromHero();
    let validMobs = [];
    for (let [id, mob] of window.expMonsterCache.entries()) {
        let bestDist = Infinity;
        let reachable = false;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const sk = `${mob.x + dx}_${mob.y + dy}`;
                if (distMap.has(sk)) { reachable = true; bestDist = Math.min(bestDist, distMap.get(sk)); }
            }
        }
        if (reachable) validMobs.push({ ...mob, dist: bestDist });
    }
    const bestChoice = pickBestExpTarget(validMobs, distMap);
    let target = bestChoice ? bestChoice.mob : null;
    let selectedGroupKey = bestChoice ? bestChoice.groupKey : null;
    if (!window.expFocusTarget || window.expFocusTarget.map !== currMap) window.expFocusTarget = null;

    if (window.expFocusTarget && window.expFocusTarget.id != null) {
        const locked = validMobs.find(m => String(m.id) === String(window.expFocusTarget.id));
        if (locked) {
            target = locked;
            const lockAge = now - (window.expFocusTarget.acquiredAt || now);
            selectedGroupKey = bestChoice?.groupKey || window.expFocusTarget.groupKey || null;
            if (window.expFocusTarget.lockedUntil && now < window.expFocusTarget.lockedUntil) {
                HeroLogger.emit('DEBUG', 'TARGET_FOCUS_LOCK', `Focus aktywny: ${locked.nick || locked.id} (${Math.max(0, Math.ceil((window.expFocusTarget.lockedUntil - now) / 1000))}s)`, "#ffcc80", { category: 'COMBAT', dedupeMs: 1700 });
            } else if (lockAge > EXP_TARGET_FOCUS_LOCK_MS) {
                HeroLogger.emit('DEBUG', 'TARGET_FOCUS_STICKY', `Trzymam focus: ${locked.nick || locked.id} aż do zabicia.`, "#ffe082", { category: 'COMBAT', dedupeMs: 2600 });
            }
        } else {
            window.expFocusTarget = null;
        }
    }

    if (!window.expFocusTarget && target?.id != null) {
        window.expFocusTarget = {
            id: target.id,
            map: currMap,
            groupKey: selectedGroupKey || null,
            acquiredAt: now,
            lockedUntil: now + EXP_TARGET_FOCUS_LOCK_MS
        };
    }

    if (
        target &&
        expLastMissingTargetId != null &&
        String(target.id) === String(expLastMissingTargetId) &&
        window.expLastTargetNotFoundAt &&
        now - window.expLastTargetNotFoundAt < 450
    ) {
        HeroLogger.emit('DEBUG', 'TARGET_NOT_FOUND_RECENT', `Pomijam świeżo zniknięty cel ${target.nick || target.id}.`, "#ffb74d", { dedupeMs: 700 });
        if (window.expFocusTarget && String(window.expFocusTarget.id) === String(target.id)) window.expFocusTarget = null;
        target = null;
        selectedGroupKey = null;
    }
    const targetGroupSize = Math.max(1, Number(bestChoice?.group?.mobs?.length) || 1);
    window.expCurrentTargetGroupKey = selectedGroupKey;
    expCurrentTargetId = target ? (target.id || null) : null;

    const berserkEnabledNow = !!(botSettings?.berserk?.enabled || Engine?.settings?.d?.fight_auto_solo);
    // Domyślnie walczymy WYŁĄCZNIE na mapach z trasy expowiska.
    // Opcja allowTransitFight jest ukrytym przełącznikiem awaryjnym (OFF by default),
    // aby nie bić losowych mobów na mapach tranzytowych po teleportach.
    const allowTransitFight = !!(botSettings?.exp?.allowTransitFight && botSettings?.berserk?.userEnabled && berserkEnabledNow);
    if (!isExpMap && allowTransitFight) {
        temporaryExpMode = hasNearbyReachableMobsForExp(10);
        if (temporaryExpMode) {
            const tmpKey = `${currMap}|tmp-on`;
            if (window.expTransitTempFightLogKey !== tmpKey) {
                HeroLogger.emit('INFO', 'TRANSIT_TEMP_EXP_ON', `Tranzyt: wykryto moby w zasięgu na mapie [${currMap}] — tymczasowo walczę.`, "#ffd54f", { category: 'ROUTE', dedupeMs: 2000 });
                window.expTransitTempFightLogKey = tmpKey;
            }
        }
    } else if (!isExpMap && !allowTransitFight) {
        temporaryExpMode = false;
    }
    const modeKey = `${currMap}|exp:${isExpMap}|tmp:${temporaryExpMode}`;
    if (window.expModeDebugLogKey !== modeKey) {
        const modeLabel = isExpMap ? 'EXP' : 'TRANZYT';
        const transitLabel = allowTransitFight ? 'ON' : 'OFF';
        HeroLogger.emit('DEBUG', 'EXP_MODE', `Mapa=[${currMap}] tryb=${modeLabel} temporaryExpMode=${temporaryExpMode} transitFight=${transitLabel}`, "#a99a75", { category: 'ROUTE', dedupeMs: 1500 });
        window.expModeDebugLogKey = modeKey;
    }
    const shouldFightHere = isExpMap || temporaryExpMode;
    const shouldKeepBerserkInRoute = !!(isExpMap && !window.isRushing && !isMapTemporarilyCleared(currMap));
    setExpBerserkState(shouldKeepBerserkInRoute);
    if (window.RouteCombatFSM) {
        window.RouteCombatFSM.update({
            running: !!window.isExping,
            currentTask: (window.autoSellState?.active ? 'AUTOSELL' : (window.autoPotState?.active ? 'AUTOPOT' : 'EXP')),
            inRouteMap: !!(isExpMap && !window.isRushing)
        }, isExpMap ? 'in_route' : 'out_of_route');
    }

    // --- LOGIKA RUCHU I WALKI ---
    maybeStepOutFromGatewayAfterEntry();
    const getStableExpTargetKey = (mob) => {
        if (!mob) return null;
        if (mob.cacheKey != null) return String(mob.cacheKey);
        if (mob.id != null) return String(mob.id);
        return `${mob.x}_${mob.y}_${mob.nick || 'mob'}`;
    };

    if (shouldFightHere && target) {
        const liveNpcs = typeof Engine.npcs.check === 'function' ? Engine.npcs.check() : Engine.npcs.d;
        const liveTargetRaw = liveNpcs && (liveNpcs[target.id]?.d || liveNpcs[target.id]);
        const liveTargetMissing = !liveTargetRaw || liveTargetRaw.dead || liveTargetRaw.del || liveTargetRaw.delete;
        const liveTargetInCollision = !!liveTargetRaw && isOutsideCurrentMap(liveTargetRaw.x, liveTargetRaw.y);
        const targetPathData = getPathToAdjacentTile(target.x, target.y, distMap);

        // Twardy bezpiecznik: jeżeli celu nie ma albo nie ma legalnego pola podejścia (np. mob w ścianie), pomijamy.
        if (liveTargetMissing || liveTargetInCollision || !targetPathData?.stand) {
            const mm = MonsterMemory.onTargetNotFound(currMap, target.id);
            if (window.expMonsterCache) window.expMonsterCache.delete(String(target.cacheKey ?? target.id));
            if (window.expFocusTarget && String(window.expFocusTarget.id) === String(target.id)) window.expFocusTarget = null;
            window.expLastTargetNotFoundAt = Date.now();
            expLastMissingTargetId = target.id ?? target.cacheKey ?? null;
            expRetargetEarliestAt = window.expLastTargetNotFoundAt + Math.floor(Math.random() * 301);
            const skipReason = liveTargetMissing
                ? 'nie istnieje'
                : (liveTargetInCollision ? 'poza mapą/kolizja' : 'nieosiągalny/ściana');
            HeroLogger.emit('DEBUG', 'TARGET_UNREACHABLE_SKIP', `Pomijam cel ${target.nick || target.id} (powód: ${skipReason}, cooldown=${mm?.cooldownUntil ? 'ON' : 'OFF'}).`, "#ff8a65", { category: 'COMBAT', dedupeMs: 2200 });
            return;
        }

        window.expDecisionInfo = `Cel mob: ${(target.nick || "Potwór")} [${target.x},${target.y}]`;
        const targetLogKey = getStableExpTargetKey(target) || `${target.nick || "Potwór"}|${target.ranga || ""}`;
        if (window.logExp && expLastLoggedTargetId !== targetLogKey) {
            const rankLabel = target.ranga ? ` (${target.ranga})` : "";
            window.logExp(`🎯 Podchodzę: ${target.nick || "Potwór"}${rankLabel}`, "#ffd54f");
            expLastLoggedTargetId = targetLogKey;
            expLastLoggedTransitMap = null;
        }
        let exactDist = Math.max(Math.abs(hx - target.x), Math.abs(hy - target.y));

        if (exactDist <= 1) { // Jesteśmy przy celu
            const targetKey = getStableExpTargetKey(target);
            if (window.expStandStillTargetKey !== targetKey) {
                window.expStandStillTargetKey = targetKey;
                window.expStandStillStart = now;
            }
            if (!window.expStandStillStart) window.expStandStillStart = now;
            if (now - window.expStandStillStart > 2000) { // Berserk zaciął się
                window.expMeleeFailByTarget = window.expMeleeFailByTarget || {};
                window.expMeleeFailByTarget[targetKey] = (window.expMeleeFailByTarget[targetKey] || 0) + 1;
                HeroLogger.emit('DEBUG', 'ATTACK_WAIT_FOR_BERSERK', `Jestem przy celu ${target.nick || target.id} — czekam na autoatak berserka (próba=${window.expMeleeFailByTarget[targetKey]}).`, "#ffcc80", { category: 'COMBAT', dedupeMs: 1500 });

                if (window.expMeleeFailByTarget[targetKey] >= 3) {
                    const mm = MonsterMemory.onTargetNotFound(currMap, target.id);
                    markTargetIgnoredOnMap(currMap, target, 'melee_fail_x3');
                    if (window.expMonsterCache) window.expMonsterCache.delete(String(target.cacheKey ?? target.id));
                    if (window.expFocusTarget && String(window.expFocusTarget.id) === String(target.id)) window.expFocusTarget = null;
                    window.expLastTargetNotFoundAt = Date.now();
                    expLastMissingTargetId = target.id ?? target.cacheKey ?? null;
                    expRetargetEarliestAt = window.expLastTargetNotFoundAt + Math.floor(Math.random() * 301);
                    HeroLogger.emit('DEBUG', 'ATTACK_STUCK_TARGET_SKIP', `Pomijam cel ${target.nick || target.id} po ${window.expMeleeFailByTarget[targetKey]} nieudanych próbach (cooldown=${mm?.cooldownUntil ? 'ON' : 'OFF'}).`, "#ff8a65", { category: 'COMBAT', dedupeMs: 2400 });
                    window.expStandStillStart = null;
                    window.expStandStillTargetKey = null;
                    return;
                }

                window.expStandStillStart = now;
            }
            if (typeof Engine.hero.stop === 'function') Engine.hero.stop();
            return;
        }

        window.expStandStillStart = null;
        window.expStandStillTargetKey = null;
        if (window.expMeleeFailByTarget) {
            const targetKey = getStableExpTargetKey(target);
            if (window.expMeleeFailByTarget[targetKey]) delete window.expMeleeFailByTarget[targetKey];
        }
        const approachTargetKey = getStableExpTargetKey(target);
        const approachState = window.expApproachStuckState || (window.expApproachStuckState = {});
        const sameTarget = approachState.targetKey === approachTargetKey;
        if (!sameTarget) {
            approachState.targetKey = approachTargetKey;
            approachState.anchorX = hx;
            approachState.anchorY = hy;
            approachState.anchorAt = now;
            approachState.failCount = 0;
        } else {
            const heroMoved = approachState.anchorX !== hx || approachState.anchorY !== hy;
            if (heroMoved) {
                approachState.anchorX = hx;
                approachState.anchorY = hy;
                approachState.anchorAt = now;
                approachState.failCount = 0;
            } else if (now - (approachState.anchorAt || now) > 2600) {
                approachState.failCount = (approachState.failCount || 0) + 1;
                approachState.anchorAt = now;
                HeroLogger.emit('DEBUG', 'APPROACH_STUCK_RETRY', `Nie mogę dojść do celu ${target.nick || target.id} (próba=${approachState.failCount}).`, "#ffcc80", { category: 'COMBAT', dedupeMs: 1500 });

                if (approachState.failCount >= 3) {
                    const mm = MonsterMemory.onTargetNotFound(currMap, target.id);
                    markTargetIgnoredOnMap(currMap, target, 'approach_fail_x3');
                    if (window.expMonsterCache) window.expMonsterCache.delete(String(target.cacheKey ?? target.id));
                    if (window.expFocusTarget && String(window.expFocusTarget.id) === String(target.id)) window.expFocusTarget = null;
                    window.expLastTargetNotFoundAt = Date.now();
                    expLastMissingTargetId = target.id ?? target.cacheKey ?? null;
                    expRetargetEarliestAt = window.expLastTargetNotFoundAt + Math.floor(Math.random() * 301);
                    HeroLogger.emit('DEBUG', 'APPROACH_STUCK_TARGET_SKIP', `Pomijam cel ${target.nick || target.id} — stoję w miejscu przy tym samym celu (cooldown=${mm?.cooldownUntil ? 'ON' : 'OFF'}).`, "#ff8a65", { category: 'COMBAT', dedupeMs: 2400 });
                    approachState.targetKey = null;
                    return;
                }
            }
        }
        if (now > nextAllowedClickTime) {
            const moveX = targetPathData.stand.x;
            const moveY = targetPathData.stand.y;
            const targetChanged = window.expLastMoveTx !== moveX || window.expLastMoveTy !== moveY;
            const isMoving = Engine.hero.d.path && Engine.hero.d.path.length > 0;
            const heroUnchanged = window.expLastMoveHeroX === hx && window.expLastMoveHeroY === hy;
            const isStuck = heroUnchanged && window.expLastMoveAt && (now - window.expLastMoveAt > 1600);
            const moveRetryTimedOut = !isMoving && window.expLastMoveCommandAt && (now - window.expLastMoveCommandAt > 1200);

            if (targetChanged || isStuck || moveRetryTimedOut) {
                ActionExecutor.run('MOVE', { x: moveX, y: moveY }, () => window.safeGoTo(moveX, moveY, false));
                window.expLastMoveTx = moveX;
                window.expLastMoveTy = moveY;
                window.expLastMoveAt = now;
                window.expLastMoveCommandAt = now;
            }

            window.expLastMoveHeroX = hx;
            window.expLastMoveHeroY = hy;
            nextAllowedClickTime = now + 600;
        }
        return;
    }

    if (expRetargetEarliestAt && now < expRetargetEarliestAt) return;

    // --- TRANZYT / ZMIANA MAPY ---
    if (!isExpMap || validMobs.length === 0) {
        // Bezpiecznik: po zmianie mapy tranzytowej czasem silnik "staje" bez decyzji.
        // Po krótkim timeoutcie wymuszamy ponowne obrane celu mapowego.
        if (!isExpMap && !window.isRushing && window.expMapEnteredAt && (now - window.expMapEnteredAt > 4200)) {
            const unclearedMaps = (mapsPool || []).filter(m => m && !isMapTemporarilyCleared(m));
            const nearestExpPath = getClosestExpMapPath(currMap, unclearedMaps.length ? unclearedMaps : mapsPool);
            if (nearestExpPath?.targetMap) {
                if (window.logExp && window._lastTransitRecoverLog !== `${currMap}->${nearestExpPath.targetMap}`) {
                    window.logExp(`🧭 [Recovery] Tranzyt zatrzymał się po zmianie mapy, ponawiam bieg do: [${nearestExpPath.targetMap}]`, "#ffb74d");
                    window._lastTransitRecoverLog = `${currMap}->${nearestExpPath.targetMap}`;
                }
                window.rushToMap(nearestExpPath.targetMap);
                expLastActionTime = now + 900;
                return;
            }
        }

        expEmptyScans++;
        if (expEmptyScans < 8 && isExpMap) {
            window.expDecisionInfo = `Mapa exp pusta chwilowo: ${currMap} (resp)`;
            return; // Czekaj na resp (berserk zostaje ON na exp mapie)
        }

        if (isExpMap && validMobs.length === 0) {
            markMapTemporarilyCleared(currMap);
            if (window.logExp && window._lastClearedMapLog !== currMap) {
                window.logExp(`🧹 Mapa wyczyszczona: [${currMap}] — szukam kolejnego expowiska.`, "#81c784");
                window._lastClearedMapLog = currMap;
            }
        }

        const unclearedMaps = (mapsPool || []).filter(m => m && !isMapTemporarilyCleared(m));
        const bestTransit = pickNextUnclearedExpMap(currMap, unclearedMaps.length ? unclearedMaps : mapsPool);
        window.expDecisionInfo = `Mapa pusta: ${currMap} -> szukam przejścia w trasie`;
        let bestTargetMap = bestTransit ? bestTransit.targetMap : null;

        // Jeśli startujemy poza expowiskiem, dobijamy najpierw do najbliższej mapy z kolejności,
        // ale priorytetowo ignorujemy mapy świeżo wyczyszczone.
        if (!bestTargetMap && !isExpMap) {
            const nearestExpPath = getClosestExpMapPath(currMap, unclearedMaps.length ? unclearedMaps : mapsPool);
            if (nearestExpPath?.targetMap) bestTargetMap = nearestExpPath.targetMap;
        }

        if (!bestTargetMap) {
            const fallbackRoute = pickNextReachableMapFromRoute(currMap, unclearedMaps.length ? unclearedMaps : mapsPool);
            if (fallbackRoute?.nextMap) bestTargetMap = fallbackRoute.nextMap;
        }

        if (bestTargetMap && !window.isRushing) {
            if (window.logExp && window._lastTransitMapLog !== bestTargetMap) {
                window.logExp(`🏃 Bieg do: [${bestTargetMap}]`, "#90caf9");
                window._lastTransitMapLog = bestTargetMap;
            }
            if (window.logExp && expLastLoggedTransitMap !== bestTargetMap) {
                window.logExp(`🧭 Aktualny cel mapy: [${bestTargetMap}]`, "#64b5f6");
                expLastLoggedTransitMap = bestTargetMap;
            }
            expLastLoggedTargetId = null;
            window.expAllMapsClearedAt = 0;
            window.expWaitingSafeMap = null;
            window.expDecisionInfo = `Tranzyt do mapy: ${bestTargetMap}`;
            window.rushToMap(bestTargetMap);
            expLastActionTime = now + 1000;
        } else if (!bestTargetMap && areAllExpMapsTemporarilyCleared(mapsPool)) {
            // Wszystkie mapy wyczyszczone: czekamy na bezpiecznej mapie i po minucie ponawiamy obieg.
            if (!window.expAllMapsClearedAt) {
                window.expAllMapsClearedAt = now;
                if (window.logExp) window.logExp("✅ Wyczyściłem wszystkie mapy. Szukam bezpiecznej mapy i czekam 1 minutę na resp.", "#4db6ac");
            }

            const isRedMap = Engine.map?.d?.pvp === 2;
            if (isRedMap && !window.isRushing) {
                const safeMap = getNearestKnownSafeExpMap(currMap, mapsPool);
                if (safeMap && safeMap !== currMap) {
                    window.expWaitingSafeMap = safeMap;
                    if (window.logExp) window.logExp(`🛡️ Mapa czerwona. Przenoszę się na bezpieczną mapę: [${safeMap}]`, "#81d4fa");
                    window.rushToMap(safeMap);
                    expLastActionTime = now + 1000;
                    return;
                }
            }

            const waitMs = 60 * 1000;
            const elapsed = now - window.expAllMapsClearedAt;
            if (elapsed < waitMs) {
                if (!window.expLastWaitLogAt || now - window.expLastWaitLogAt > 12000) {
                    const leftSec = Math.max(0, Math.ceil((waitMs - elapsed) / 1000));
                    if (window.logExp) window.logExp(`⏳ Czekam na odrodzenie potworów... (${leftSec}s)`, "#90a4ae");
                    window.expLastWaitLogAt = now;
                }
                return;
            }

            if (window.logExp) window.logExp("🔁 Minęła minuta — wracam sprawdzić mapy expowiska.", "#4fc3f7");
            window.mapClearTimes = {};
            window.expAllMapsClearedAt = 0;
            window.expLastWaitLogAt = 0;
            window.expWaitingSafeMap = null;
            expEmptyScans = 0;
            return;
        } else if (!bestTargetMap) {
            // Backtracking tylko do map osiągalnych i niezbannowanych map-level.
            let back = null;
            while (window.expMapHistory && window.expMapHistory.length) {
                const candidate = window.expMapHistory.pop();
                if (!candidate) continue;
                if (normMapName(candidate) === normMapName(currMap)) continue;
                if (isMapTemporarilyCleared(candidate)) continue;
                if (window.__bannedMaps && window.__bannedMaps[candidate] && Date.now() < window.__bannedMaps[candidate]) continue;
                let backPath = typeof getShortestPath === 'function' ? getShortestPath(currMap, candidate) : null;
                if ((!backPath || backPath.length < 2) && typeof getShortestPath === 'function') {
                    backPath = getShortestPath(currMap, candidate, { ignoreEdgeBans: true });
                }
                if (backPath && backPath.length > 1) {
                    back = candidate;
                    break;
                }
            }

            if (!back) {
                const nearestExpPath = getClosestExpMapPath(currMap);
                if (nearestExpPath?.targetMap) back = nearestExpPath.targetMap;
            }
            if (!back) {
                back = getNearestKnownSafeExpMap(currMap, mapsPool);
            }

            if (back) {
                if (window.logExp && window._lastTransitMapLog !== back) {
                    window.logExp(`↩️ Brak dalszego przejścia. Wracam na osiągalną mapę: [${back}]`, "#ffb74d");
                    window._lastTransitMapLog = back;
                }
                window.rushToMap(back);
            } else {
                if (window.logExp) window.logExp("🛑 Brak osiągalnej mapy do backtracku. Zatrzymuję EXP.", "#e53935");
                if (typeof stopPatrol === 'function') stopPatrol(true);
                else window.isExping = false;
            }
        }
    }
}
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

function clearExpMaps() {
    botSettings.exp.mapOrder = [];
    localStorage.setItem('exp_map_order_v64', '[]');
    if (typeof window.renderExpMaps === 'function') window.renderExpMaps();
}

window.clearExpMaps = clearExpMaps;

   window.optimizeExpRoute = function(silent = false) {
        let maps = botSettings.exp.mapOrder;
        if (!maps || maps.length < 2) {
            if (!silent) heroAlert("Dodaj co najmniej 2 mapy do listy, aby bot mógł je zoptymalizować!");
            return;
        }

        let unvisited = new Set(maps);
        let sysMap = typeof Engine !== 'undefined' && Engine.map && Engine.map.d ? Engine.map.d.name : lastMapName;

        // Zaczynamy od mapy, na której aktualnie stoimy (jeśli jest na liście), lub od pierwszej z brzegu
        let currentMap = unvisited.has(sysMap) ? sysMap : maps[0];
        let finalRoute = [currentMap];
        unvisited.delete(currentMap);

        // Sortowanie najbliższego sąsiada
        while(unvisited.size > 0) {
            let bestPath = null;
            let bestTarget = null;
            let minLen = Infinity;

            for (let target of unvisited) {
                let path = typeof getShortestPath === 'function' ? getShortestPath(currentMap, target) : null;
                let dist = path ? path.length : 999;
                if (dist < minLen) {
                    minLen = dist;
                    bestPath = path;
                    bestTarget = target;
                }
            }

            if (!bestPath || minLen === 999) {
                let remaining = Array.from(unvisited);
                bestTarget = remaining[0];
                finalRoute.push(bestTarget);
            } else {
                // PRZYWRÓCONA LOGIKA: Zapisujemy wszystkie mapy przejściowe do głównej trasy!
                // Dzięki temu bot po wejściu do lasu zatrzyma się, wybije potwory, odhaczy w pamięci jako "czyste" i pójdzie dalej.
                for (let i = 1; i < bestPath.length; i++) {
                    finalRoute.push(bestPath[i]);
                }
            }

            unvisited.delete(bestTarget);
            currentMap = bestTarget;
        }

        // Zamykamy pętlę powrotną (od ostatniej mapy wprost do pierwszej)
        let returnPath = typeof getShortestPath === 'function' ? getShortestPath(currentMap, finalRoute[0]) : null;
        if (returnPath && returnPath.length > 1) {
            for (let i = 1; i < returnPath.length - 1; i++) {
                finalRoute.push(returnPath[i]);
            }
        }

        // Redukcja duplikatów (jeśli algorytm przechodził przez tę samą mapę pod rzad)
        let cleanRoute = [];
        finalRoute.forEach(m => {
            if (cleanRoute.length === 0 || cleanRoute[cleanRoute.length - 1] !== m) {
                cleanRoute.push(m);
            }
        });

        botSettings.exp.mapOrder = cleanRoute;
        localStorage.setItem('exp_map_order_v64', JSON.stringify(cleanRoute));
        if (typeof window.renderExpMaps === 'function') window.renderExpMaps();

        if (!silent) heroAlert(`✅ Trasa połączona!\nBot dodał mapy przejściowe do głównej listy. Jeśli podczas biegu przez korytarz lub las spotka potwory, wyhamuje, normalnie je wybije i po zrobieniu czystki zapisze tę mapę w pamięci!`);
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
        // Obliczamy dystanse raz, dla całej mapy, co naprawi "brak dojścia"
        let distMap = typeof buildDistanceMapFromHero === 'function' ? buildDistanceMapFromHero() : new Map();
        let allGateways = typeof getCurrentMapGatewaysForRadar === 'function' ? getCurrentMapGatewaysForRadar(distMap) : [];

        c.innerHTML = heroMapOrder[hero].map((mapName, index) => {
            let safeMapName = mapName.replace(/'/g, "\\'");

            if (editingGatewayFor === mapName) {
                let defaultX = "";
                let defaultY = "";
                let refDoor = globalGateways[currentMap] && globalGateways[currentMap][mapName];

                if (refDoor) {
                    defaultX = refDoor.x;
                    defaultY = refDoor.y;
                }

                return `<div class="list-item active-route" style="flex-direction:column; align-items:stretch;">
                    <div style="display:flex; flex-direction:column; gap:4px; padding:2px;">
                        <span style="color:#d4af37; font-weight:bold; font-size:11px;">🚪 Bramo-Zapis: ${mapName}</span>
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:4px;">
                            <label style="color:#a99a75; font-size:10px; margin:0;">X:
                                <input type="number" id="gw_edit_x" value="${defaultX}" style="width:35px; padding:2px; font-size:10px; text-align:center;">
                            </label>
                            <label style="color:#a99a75; font-size:10px; margin:0;">Y:
                                <input type="number" id="gw_edit_y" value="${defaultY}" style="width:35px; padding:2px; font-size:10px; text-align:center;">
                            </label>
                            <button class="btn-sepia" style="flex-grow:1;"
                                onclick="document.getElementById('gw_edit_x').value = Engine.hero.d.x; document.getElementById('gw_edit_y').value = Engine.hero.d.y;"
                                title="Pobiera koordynaty z obecnej postaci">📍 Stąd</button>
                        </div>
                        <div style="display:flex; gap:4px; margin-top:4px;">
                            <button class="btn-sepia btn-go-sepia" style="flex-grow:1;" onclick="window.saveInlineGateway('${safeMapName}')">ZAPISZ</button>
                            <button class="btn-sepia" style="background:#8e0000; width:30px;" onclick="window.cancelInlineGateway()">✖</button>
                        </div>
                    </div>
                </div>`;
            } else {
                const inBase = isMapKnownInGatewayBase(mapName);
                
                // Sprawdzamy czy to wejście jest aktualnie osiągalne z miejsca gdzie stoisz
                const liveDoor = allGateways.find(g => g.targetMap.toLowerCase() === mapName.toLowerCase() && g.reachable);
                const doorDistance = liveDoor ? liveDoor.pathDistance : "?";
                
                const baseBadge = inBase
                    ? `<span style="color:#81c784; font-size:9px; margin-left:4px; white-space:nowrap;" title="${liveDoor ? `Odległość do bramy: ${doorDistance}` : `Nie widzę bramy z obecnego punktu`} ">[BAZA${liveDoor ? ' ✔' : ''}]</span>`
                    : `<span style="color:#ef9a9a; font-size:9px; margin-left:4px; white-space:nowrap;">[BRAK]</span>`;

                const mapColor = inBase ? (liveDoor ? "#4caf50" : "#aed581") : "#ef9a9a";

                return `<div class="list-item">
                    <div class="map-name-wrap" title="${mapName}">
                        <span class="btn-del-map" onclick="window.removeHeroMapFromOrder(${index})">✖</span>
                        <span class="map-name" style="color:${mapColor}; font-weight:bold;">
                            ${index + 1}. ${mapName}
                        </span>
                        ${baseBadge}
                    </div>
                    <div class="buttons-wrapper">
                        <input type="number"
                               min="1"
                               max="${heroMapOrder[hero].length}"
                               value="${index + 1}"
                               onchange="window.changeMapOrder(${index}, this.value)"
                               style="width:35px; text-align:center; font-size:10px; padding:2px; background:#111; color:#d4af37; border:1px solid #444; border-radius:4px;">
                        <button class="icon-btn" onclick="window.openInlineEditor('${safeMapName}')" title="Ręczna edycja kordów">🚪</button>
                    </div>
                </div>`;
            }
        }).join('');
    };

    window.renderExpMaps = () => {
        let c = document.getElementById('expMapList');
        if (!c) return;

        let currentMap = lastMapName;
        // Obliczamy dystanse raz, żeby uniknąć laga
        let distMap = typeof buildDistanceMapFromHero === 'function' ? buildDistanceMapFromHero() : new Map();
        let allGateways = typeof getCurrentMapGatewaysForRadar === 'function' ? getCurrentMapGatewaysForRadar(distMap) : [];

        c.innerHTML = botSettings.exp.mapOrder.map((mapName, index) => {
            let safeMapName = mapName.replace(/'/g, "\\'");

            if (editingGatewayFor === mapName) {
                let defaultX = "";
                let defaultY = "";
                let refDoor = globalGateways[currentMap] && globalGateways[currentMap][mapName];

                if (refDoor) {
                    defaultX = refDoor.x;
                    defaultY = refDoor.y;
                }

                return `<div class="list-item active-route" style="flex-direction:column; align-items:stretch;">
                    <div style="display:flex; flex-direction:column; gap:4px; padding:2px;">
                        <span style="color:#d4af37; font-weight:bold; font-size:11px;">🚪 Bramo-Zapis: ${mapName}</span>
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:4px;">
                            <label style="color:#a99a75; font-size:10px; margin:0;">X:
                                <input type="number" id="gw_edit_x" value="${defaultX}" style="width:35px; padding:2px; font-size:10px; text-align:center;">
                            </label>
                            <label style="color:#a99a75; font-size:10px; margin:0;">Y:
                                <input type="number" id="gw_edit_y" value="${defaultY}" style="width:35px; padding:2px; font-size:10px; text-align:center;">
                            </label>
                            <button class="btn-sepia" style="flex-grow:1;"
                                onclick="document.getElementById('gw_edit_x').value = Engine.hero.d.x; document.getElementById('gw_edit_y').value = Engine.hero.d.y;"
                                title="Pobiera koordynaty z obecnej postaci">📍 Stąd</button>
                        </div>
                        <div style="display:flex; gap:4px; margin-top:4px;">
                            <button class="btn-sepia btn-go-sepia" style="flex-grow:1;" onclick="window.saveInlineGateway('${safeMapName}')">ZAPISZ</button>
                            <button class="btn-sepia" style="background:#8e0000; width:30px;" onclick="window.cancelInlineGateway()">✖</button>
                        </div>
                    </div>
                </div>`;
            } else {
                const inBase = isMapKnownInGatewayBase(mapName);
                
                // Sprawdzamy czy to wejście jest aktualnie osiągalne z miejsca gdzie stoisz
                const liveDoor = allGateways.find(g => g.targetMap.toLowerCase() === mapName.toLowerCase() && g.reachable);
                const doorDistance = liveDoor ? liveDoor.pathDistance : "?";
                
                const baseBadge = inBase
                    ? `<span style="color:#81c784; font-size:9px; margin-left:4px; white-space:nowrap;" title="${liveDoor ? `Odległość do bramy: ${doorDistance}` : `Nie widzę bramy z obecnego punktu`} ">[BAZA${liveDoor ? ' ✔' : ''}]</span>`
                    : `<span style="color:#ef9a9a; font-size:9px; margin-left:4px; white-space:nowrap;">[BRAK]</span>`;

                const mapColor = inBase ? (liveDoor ? "#4caf50" : "#aed581") : "#ef9a9a";

                return `<div class="list-item">
                    <div class="map-name-wrap" title="${mapName}">
                        <span class="btn-del-map" onclick="window.removeExpMap(${index})">✖</span>
                        <span class="map-name" style="color:${mapColor}; font-weight:bold;">
                            ${mapName}
                        </span>
                        ${baseBadge}
                    </div>
                    <div class="buttons-wrapper">
                        <button class="icon-btn" onclick="window.openInlineEditor('${safeMapName}')" title="Ręczna edycja kordów (opcjonalne)">🚪</button>
                    </div>
                </div>`;
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
// WYMUSZENIE RĘCZNEJ SPRZEDAŻY ORAZ ANULOWANIE
        if (e.target && e.target.closest('#btnForceSell')) {
            if (!window.autoSellState) window.autoSellState = { active: false };

            if (window.autoSellState.active) {
             // --- ANULOWANIE SPRZEDAŻY ---
                window.autoSellState.active = false;
                window.autoSellState.ignoreUntil = Date.now() + 180000;
                sessionStorage.setItem('hero_autosell_ignore', window.autoSellState.ignoreUntil); // Twardy zapis blokady
                window.isRushing = false;
                window.isRushingToShop = false;
                if (window.rushInterval) clearTimeout(window.rushInterval);
                if (typeof stopPatrol === 'function') stopPatrol(true); // Twardy stop bota i postaci

                // Jeśli bot sam wyłączył Ci Berserka na czas powrotu - przywracamy go!
                if (window.autoSellState.wasBerserkOn) {
                    botSettings.berserk.enabled = true;
                    let chkBerserk = document.getElementById('berserkEnabled');
                    if (chkBerserk) chkBerserk.checked = true;
                    if (typeof window.updateServerBerserk === 'function') window.updateServerBerserk();
                    if (window.logExp) window.logExp("🛡️ Przywrócono Berserka.", "#ff9800");
                }

                if (window.logHero) window.logHero("🛑 Przerwano pójście do sklepu!", "#f44336");
                if (window.logExp) window.logExp("🛑 Przerwano pójście do sklepu!", "#f44336");
                return;
            }

            if (typeof stopPatrol === 'function') stopPatrol(true); // Zatrzymuje szukanie herosów i ruch expa

      if (window.logHero) window.logHero("🏃 Ręcznie wymuszono opróżnienie plecaka! Zatrzymuję akcje i wyruszam...", "#ff5252");
            if (window.logExp) window.logExp("🏃 Ręcznie wymuszono opróżnienie plecaka! Zatrzymuję akcje i wyruszam...", "#ff5252");

            sessionStorage.removeItem('hero_autosell_ignore'); // Ściągnięcie blokady przy ręcznym wywołaniu
            window.autoSellState.ignoreUntil = 0;
            window.autoSellState.active = true;
            window.autoSellState.step = 1;
            window.autoSellState.nextActionTime = 0;
            window.autoSellState.oldGold = parseInt(Engine.hero.d.gold || 0); // Zapis przed startem
            window.isRushingToShop = false;
            window.isRushing = true;

            window.autoSellState.wasExpingBeforeSell = !!window.isExping;
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
                HERO_LOG.error("Błąd rysowania Ekwipunku (Radar).", e);
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

            let healers = window.DatabaseModule.kupcy.filter(k => {
                if (!k.npc_name) return false;
                let n = k.npc_name.toLowerCase();
                return n.includes('uzdrow') || n.includes('tuni');
            });

            let html = `<div style="color:#d81b60; font-size:10px; margin-bottom:5px; font-weight:bold;">Medycy i Alchemicy (${healers.length} postaci):</div>`;

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
// --- TWOJE FUNKCJE DO DETEKCJI STANU NIEPRZYTOMNOŚCI ---
    function getUnconsciousState() {
        const overlay = document.querySelector(".dead-overlay.map-overlay, .dead-window, .death-window");
        const timerEl = document.querySelector(".dead-overlay.map-overlay .dazed-time, .dead-window .dazed-time");

        const visible = !!(
            overlay &&
            window.getComputedStyle(overlay).display !== "none" &&
            overlay.offsetParent !== null
        );

        const text = timerEl ? (timerEl.innerText || timerEl.textContent || "").trim() : null;

        let seconds = null;
        if (text) {
            const match = text.match(/(?:(\d+)\s*min)?\s*(\d+)\s*s/i);
            if (match) {
                const m = parseInt(match[1] || "0", 10);
                const s = parseInt(match[2] || "0", 10);
                seconds = m * 60 + s;
            }
        }

        return {
            unconscious: visible,
            timerText: text,
            timerSeconds: seconds
        };
    }

  function isUnconsciousNow() {
        // 1. Sprawdzamy DOM Twoją dokładną funkcją
        const domState = getUnconsciousState();

        // 2. Twarde sprawdzenie w silniku gry (Zabezpieczenie)
        const hero = (typeof Engine !== 'undefined' && Engine.hero && Engine.hero.d) ? Engine.hero.d : null;

        const engineDead = !!(
            (typeof Engine !== 'undefined' && Engine.dead) ||
            (hero && (hero.dead === true || hero.dead === 1 || hero.dead === "1"))
        );

        // USUNIĘTO BŁĘDNY WARUNEK "hp <= 1". Teraz ożywienie z 1 HP zostanie natychmiast wykryte!
        return domState.unconscious || engineDead;
    }

    // --- PĘTLA STRAŻNIKA ŚMIERCI ---
    setInterval(() => {
        const state = getUnconsciousState();
        const isDead = isUnconsciousNow();

      if (isDead && !window.__unconscious) {
            window.__unconscious = true;
            if (window.logExp) window.logExp("💀 [STRAŻNIK] Wykryto zgon! Zamykam walkę i zatrzymuję bota...", "#e53935");

            // --- WYMUSZONE ZAMKNIĘCIE OKNA WALKI ---
            if (typeof Engine !== 'undefined' && Engine.battle) {
                if (typeof Engine.battle.close === 'function') Engine.battle.close();
            }
            // Symulacja wciśnięcia klawisza "Z" (Opuść walkę)
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', keyCode: 90, which: 90 }));
            // Symulacja kliknięcia w fizyczny przycisk "Opuść walkę"
            let closeZ = document.querySelector('.battle-close, .button.close, [data-tip*="Opuść walkę"]');
            if (closeZ) {
                closeZ.click();
                if (window.jQuery) window.jQuery(closeZ).click();
            }
            // ---------------------------------------

            if (typeof Engine !== 'undefined' && Engine.hero && typeof Engine.hero.stop === 'function') {
                Engine.hero.stop();
            }
        }

        if (!isDead && window.__unconscious) {
            // Lekkie opóźnienie, żeby nie zrobić fałszywego 'ożyłeś'
            setTimeout(() => {
                if (window.__unconscious && !isUnconsciousNow()) {
                    window.__unconscious = false;
                    window.__stuckTimerCount = 0;
                    window.__lastParsedSeconds = null;
                    if (window.logExp) window.logExp("✅ [STRAŻNIK] Ożyłeś. Wracamy do akcji!", "#4caf50");

                    // WYMUSZENIE STATUSU LECZENIA (Działa niezależnie od expienia, wystarczy włączony autoheal)
                    if (botSettings && botSettings.autoheal && botSettings.autoheal.enabled) {
                        window.isRegeneratingToFull = true;
                    }
                }
            }, 1200);
        }

        // WATCHDOG: Wykrywanie ZAMROŻONEGO zegara z pomocą Twojego obiektu!
        if (window.__unconscious && state.timerSeconds !== null) {
            let seconds = state.timerSeconds;

            if (window.__lastParsedSeconds === seconds) {
                window.__stuckTimerCount++;
            } else {
                window.__lastParsedSeconds = seconds;
                window.__stuckTimerCount = 0;
            }

            // Jeśli zegar stoi w miejscu przez 6 sekund (lag gry)
            if (window.__stuckTimerCount >= 6) {
                if (window.logExp) window.logExp(`🔄 Zegar śmierci zamarzł na ${seconds}s! Miękkie odświeżanie interfejsu...`, "#ffb300");
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

            // --- DYNAMICZNY PRZYCISK ANULOWANIA ---
            let btnForce = document.getElementById('btnForceSell');
            if (btnForce) {
                if (window.autoSellState.active) {
                    if (btnForce.innerText !== "🛑 ANULUJ SPRZEDAŻ") {
                        btnForce.innerHTML = "🛑 ANULUJ SPRZEDAŻ";
                        btnForce.style.background = "#d32f2f";
                        btnForce.style.borderColor = "#b71c1c";
                    }
                } else {
                    if (btnForce.innerText !== "🏃 OPRÓŻNIJ TERAZ") {
                        btnForce.innerHTML = "🏃 OPRÓŻNIJ TERAZ";
                        btnForce.style.background = "#e65100";
                        btnForce.style.borderColor = "#bf360c";
                    }
                }
            }
            // ------------------------------------

          if (!window.autoSellState.active && !window.autoPotState.active && botSettings.autopot && botSettings.autopot.enabled) {
                    let potCount = Object.values(Engine.heroEquipment.getHItems?.() || {}).filter(i => Number(i?.st) === 0 && Number(i?.cl) === 16 && i?.getLeczyStat?.() != null).reduce((sum, i) => sum + (Number(i?.getAmount?.()) || 1), 0);
                    if (potCount <= 0) {

                        // ZABEZPIECZENIE: Czy mamy miejsce w plecaku na mikstury?
                        let s = typeof window.getBagStats === 'function' ? window.getBagStats() : { freeSlots: 99, totalCapacity: 0 };
                        let requiredStacks = botSettings.autopot.stacks || 14;

                        if (s.freeSlots < requiredStacks && botSettings.autosell && botSettings.autosell.enabled) {
                            if (window.logHero) window.logHero("🎒 Za mało miejsca na potki! Najpierw idę sprzedać śmieci...", "#ffb300");
                            if (window.logExp) window.logExp("🎒 Za mało miejsca na potki! Najpierw idę sprzedać śmieci...", "#ffb300");

                            const wasExpingBeforeSell = !!window.isExping;
                            const wasBerserkOnBeforeSell = !!(botSettings.berserk && botSettings.berserk.enabled);

                            if (typeof stopPatrol === 'function') stopPatrol(true);
                            sessionStorage.removeItem('hero_autosell_ignore');
                            window.autoSellState.ignoreUntil = 0;
                            window.autoSellState.active = true;
                            window.autoSellState.step = 1;
                            window.autoSellState.nextActionTime = 0;
                            window.autoSellState.failedNPCs = [];
                            window.isRushingToShop = false;
                            window.isRushing = true;

                            window.autoSellState.wasExpingBeforeSell = wasExpingBeforeSell;
                            window.autoSellState.wasBerserkOn = wasBerserkOnBeforeSell;
                            if (window.autoSellState.wasBerserkOn) {
                                botSettings.berserk.enabled = false;
                                let chkBerserk = document.getElementById('berserkEnabled');
                                if (chkBerserk) chkBerserk.checked = false;
                                if (typeof window.updateServerBerserk === 'function') window.updateServerBerserk();
                                if (window.logExp) window.logExp("🛡️ Wyłączam Berserka na czas powrotu do sklepu.", "#ff9800");
                            }
                            return; // Przerywamy Auto-Poty, niech demon sprzedaży przejmie stery!
                        }

                        // BRAK MIEJSCA, ALE AUTO-SELL WYŁĄCZONY? Kupujemy tyle, na ile jest miejsca
                        if (s.freeSlots < requiredStacks) {
                            if (s.freeSlots === 0) {
                                if (window.logHero) window.logHero("🚨 Brak miejsca w plecaku na mikstury! Włącz Auto-Sprzedaż!", "#e53935");
                                return; // Całkowity brak miejsca
                            }
                            requiredStacks = s.freeSlots; // Zmniejszamy zakup do limitu wolnych kratek
                        }

                        if (typeof stopPatrol === 'function') stopPatrol(true);
                        window.autoPotState.active = true;
                        window.autoPotState.stacksToBuy = requiredStacks; // Zapisujemy ile realnie kupujemy
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
                 // Rozszerzamy filtr: szukamy Uzdrowicieli ORAZ Tunii
                    let healers = (window.DatabaseModule.kupcy || []).filter(k => {
                        if (!k.npc_name) return false;
                        let n = k.npc_name.toLowerCase();
                        return n.includes('uzdrow') || n.includes('tuni');
                    });

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
                        let stacksToBuy = window.autoPotState.stacksToBuy || botSettings.autopot.stacks || 14;
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
        window.autoSellState = { active: false, step: 0, oldGold: 0, bagToSell: 1, nextActionTime: 0, lastFreeSlots: 0, failedNPCs: [], shopWaitStartTime: 0, targetNpc: null, wasExpingBeforeSell: false, wasBerserkOn: false };
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
                // Odczyt blokady z pamięci przeglądarki (Przeżyje odświeżenie F5)
                let savedIgnore = parseInt(sessionStorage.getItem('hero_autosell_ignore') || 0);
                if (savedIgnore > Date.now() || (window.autoSellState.ignoreUntil && Date.now() < window.autoSellState.ignoreUntil)) return;

                const s = typeof window.getBagStats === 'function' ? window.getBagStats() : { freeSlots: 99, totalCapacity: 0 };
                if (s.freeSlots <= 0 && s.totalCapacity > 0) {
                    const wasExpingBeforeSell = !!window.isExping;
                    const wasBerserkOnBeforeSell = !!(botSettings.berserk && botSettings.berserk.enabled);

                    if (typeof stopPatrol === 'function') stopPatrol(true);
                    window.autoSellState.active = true;
                    window.autoSellState.step = 1;
                    window.autoSellState.nextActionTime = 0;
                    window.autoSellState.failedNPCs = []; // Reset blacklisty przy nowej sesji
                    window.autoSellState.shopWaitStartTime = 0;
                    window.isRushingToShop = false;
                    window.isRushing = true;
                    window.autoSellState.wasExpingBeforeSell = wasExpingBeforeSell;
                    window.autoSellState.wasBerserkOn = wasBerserkOnBeforeSell;
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
                        // KLUCZOWE: Odcinamy "(elita)" lub inne dopiski z bazy danych!
                        const targetName = (namePart || "").split('(')[0].trim().toLowerCase();
                        HERO_LOG.info(`AUTO-SELL: inicjacja dla ${namePart}`);

                        // 1. ZABEZPIECZENIE MAPY (Czekamy, aż zniknie kran ładowania)
                        for (let w = 0; w < 50; w++) {
                            if (!Engine.map?.isLoading) break;
                            await sleep(100);
                        }
                        // Twardy oddech po wejściu na mapę (moby muszą się pojawić, a blokady ruchu wygasnąć)
                        await sleep(800);

                        // 2. ZNALEZIENIE NPC (Wg Twojego schematu)
                        let npc = null;
                        for (let k = 0; k < 50; k++) {
                            npc = Object.values(Engine.npcs?.check?.() || {})
                                .map(n => n?.d || n)
                                .find(n => (n.nick || "").toLowerCase().includes(targetName));

                            if (npc) break;
                            await sleep(100);
                        }

                        if (!npc) {
                            HERO_LOG.warn(`AUTO-SELL [A]: brak NPC na mapie po załadowaniu (${namePart}).`);
                            return false;
                        }

                        HERO_LOG.info(`AUTO-SELL: idę do ${npc.nick} (X: ${npc.x}, Y: ${npc.y}).`);

                      // 3. DOJŚCIE DO NPC
                        let reached = false;
                        for (let i = 0; i < 60; i++) { // 6 sekund
                            // NATYCHMIASTOWE PRZERWANIE BIEGU, JEŚLI WCIŚNIESZ ANULUJ
                            if (window.autoSellState && window.autoSellState.active === false) return false;

                            const h = Engine.hero?.d || Engine.hero;
                            if (!h) { await sleep(100); continue; }

                            const dist = Math.max(Math.abs(h.x - npc.x), Math.abs(h.y - npc.y));

                            if (dist <= 1) {
                                reached = true;
                                break;
                            }

                            // Agresywne ponawianie ruchu (omijamy wewnętrzne blokady anti-stuck bota!)
                            if (i % 10 === 0) {
                                try {
                                    if (typeof window.originalAutoWalk === 'function') {
                                        window.originalAutoWalk.call(Engine.hero, npc.x, npc.y);
                                    } else {
                                        Engine.hero.autoGoTo({x: npc.x, y: npc.y});
                                    }
                                } catch(e){}
                            }

                            await sleep(100);
                        }

                        // KRYTYCZNE: Jeśli nie podszedł, nie ma sensu klikać w dialog z 10 kratek!
                        if (!reached) {
                            HERO_LOG.warn("AUTO-SELL [B]: bot nie mógł podejść do NPC (dystans > 1), omijam.");
                            return false;
                        }

                        HERO_LOG.info("AUTO-SELL: odblokowuję stop.");
                        if (Engine.hero) Engine.hero.stop = false;

                        await sleep(400);

                        // Jeśli to elita/potwór, walka zaraz włączy się sama
                        if (npc.type === 2 || npc.type === 3) return true;

                        HERO_LOG.info("AUTO-SELL: rozpoczynam rozmowę.");

                        // --- 1:1 TWÓJ KOD ROZMOWY ---
                        try { Engine.npcs?.clickNpc?.(npc.id); } catch(e) {}
                        await sleep(200);

                        try {
                            if (typeof Engine.hero?.sendRequestToTalk === 'function') Engine.hero.sendRequestToTalk(npc.id);
                            else if (typeof window._g === 'function') window._g(`talk&id=${npc.id}`);
                        } catch(e) {}

                        await sleep(600);

                        // 4. SZUKANIE PRZYCISKU SKLEPU
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
                            HERO_LOG.warn(`AUTO-SELL [C]: brak opcji sklepu u ${npc.nick}.`);
                            return false;
                        }

                        HERO_LOG.info("AUTO-SELL: otwieram sklep.");
                        try { shopBtn.click(); } catch(e){}

                        // 5. WERYFIKACJA OTWARCIA SKLEPU
                        let shopOpened = false;
                        for (let i = 0; i < 30; i++) {
                            shopOpened = !!(
                                Engine?.shop?.wnd || Engine?.shop?.getData?.() ||
                                document.querySelector(".shop-window, .shop, .trade-window, .merchant-window")
                            );
                            if (shopOpened) break;
                            await sleep(100);
                        }

                        if (!shopOpened) {
                            HERO_LOG.warn("AUTO-SELL [D]: kliknięto opcję sklepu, ale okno się nie otworzyło.");
                            return false;
                        }

                        await sleep(500); // Twardy margines czasu na zsynchronizowanie plecaka z nowym oknem
                        HERO_LOG.success("AUTO-SELL: sklep otwarty pomyślnie.");
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

                        // Wybór listy dozwolonych kupców w zależności od Checkboxa
                        let allowedNames = ['Flineks', 'Makin', 'Rozen', 'Tuni', 'Unil', 'Aukcjoner', 'Syntia', 'Jemen'];
                        if (botSettings.autosell && botSettings.autosell.onlyTunia) {
                            allowedNames = ['Tuni']; // Ograniczamy listę wyłącznie do Tunii
                        }

                        let validMerchants = kupcy.filter(k => allowedNames.some(n => k.npc_name.includes(n)));
                        if (validMerchants.length === 0 && allowedNames.length > 1) validMerchants = kupcy;

                        // NAPRAWA BŁĘDU LOKALIZACJI Z BAZY DANYCH
                        validMerchants.forEach(m => {
                            if (m.npc_name.includes("Tuni") && m.map_name !== "Dom Tunii") {
                                m.map_name = "Dom Tunii";
                            }
                        });

                        if (window.autoSellState.failedNPCs.length > 0) {
                            validMerchants = validMerchants.filter(k => !window.autoSellState.failedNPCs.includes(k.npc_name));
                        }

                    if (validMerchants.length === 0) {
                            let msg = "❌ Brak kupców! (Wstrzymuję auto-sprzedaż na 3 minuty)";
                            if (window.logHero) window.logHero(msg, "#e53935");
                            if (window.logExp) window.logExp(msg, "#e53935");

                            window.autoSellState.active = false;
                            window.autoSellState.ignoreUntil = Date.now() + 180000;
                            sessionStorage.setItem('hero_autosell_ignore', window.autoSellState.ignoreUntil); // Twardy zapis blokady
                            window.autoSellState.failedNPCs = [];
                            window.autoSellState.targetNpc = null;
                            window.isExpSuspended = false;
                            window.isRushing = false;
                            window.isRushingToShop = false;
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
                                            window.autoSellState.oldGold = parseInt(Engine.hero.d.gold || 0); // <--- ZAPIS PIENIĘDZY PRZED SPRZEDAŻĄ
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
                        let currentGold = parseInt(Engine.hero.d.gold || 0);
                        let oldGold = parseInt(window.autoSellState.oldGold || 0);
                        let profit = currentGold - oldGold;

                        // Zabezpieczenie przed błędnym wyliczeniem
                        if (oldGold === 0 || profit === currentGold || profit < 0) profit = 0;

                        if (profit >= 0) {
                            let msg = `✅ Opróżnianie zakończone! Zarobek: ${profit.toLocaleString()} zł. Wracam do pracy.`;
                            if (window.logHero) window.logHero(msg, "#4caf50");
                            if (window.logExp) window.logExp(msg, "#4caf50");
                        }

                        const shouldRestoreBerserk = !!window.autoSellState.wasBerserkOn;
                        const shouldResumeExp = !!window.autoSellState.wasExpingBeforeSell;

      // Pełny, bezwarunkowy Reset po zakończeniu sprzedaży
                        window.autoSellState = { active: false, step: 0, oldGold: 0, bagToSell: 1, nextActionTime: 0, lastFreeSlots: 0, failedNPCs: [], shopWaitStartTime: 0, targetNpc: null, wasExpingBeforeSell: false, wasBerserkOn: false };
                        window.isExpSuspended = false;
                        window.isRushing = false;
                        window.isRushingToShop = false;
                        window.lastExpMap = null;

                        if (typeof Engine !== 'undefined' && Engine.shop && typeof Engine.shop.close === 'function') Engine.shop.close();

                        let closeBtn = document.querySelector('.shop-close-btn, .close-button, .window-close, .close-cross');
                        if (closeBtn) closeBtn.click();

                        // Awaryjnie upewniamy się, że bieg Exp zostanie wznowiony, jeśli był wcześniej aktywny
                        if (shouldRestoreBerserk) {
                             botSettings.berserk.enabled = true;
                             let chkBerserk = document.getElementById('berserkEnabled');
                             if (chkBerserk) chkBerserk.checked = true;
                             if (typeof window.updateServerBerserk === 'function') window.updateServerBerserk();
                        }

                        if (shouldResumeExp && !window.isExping) {
                            let btn = document.getElementById('btnStartExp');
                            if (btn) btn.click();
                        }
                    }
                }
            } // Tutaj zamykamy warunki czasu i active
        }, 1000);
    }
// --- DAEMON: DETEKCJA ZAPADKI (AUTO-SOLVER + ALARM) ---
    if (!window.captchaDaemonInstalled) {
        window.captchaDaemonInstalled = true;
        window.playerAlertTriggered = false;
        window.lastChatLength = 0;

        window.__captchaPhase = "none";
        window.__captchaLock = false;
        window.__wasExpingBeforeCaptcha = false;
        window.__wasPatrollingBeforeCaptcha = false;
        window.__wasBerserkBeforeCaptcha = false;
        window.__wasHeroModeBeforeCaptcha = false;
        window.__fullscreenByBotForTrap = false;
        window.__trapSolveStarted = false;
        window.__margoclickerOnline = false;
        window.__lastMargoclickerProbeAt = 0;
        window.__trapSeenAt = 0;
        window.__trapSessionActive = false;
        window.__trapResumeQueued = false;
        window.__trapBotPausedByCaptcha = false;
        window.__trapForceFullscreen = localStorage.getItem('hero_trap_force_fullscreen') === '1';
        window.__preCaptchaLastAttemptAt = 0;
        window.__preCaptchaAttempts = 0;
        window.__captchaSolveLastAttemptAt = 0;

        function shouldToggleFullscreenForTrap() {
            return !!window.__trapForceFullscreen;
        }

        async function checkMargoclickerAlive(force = false) {
            const now = Date.now();
            if (!force && now - (window.__lastMargoclickerProbeAt || 0) < 2500) return !!window.__margoclickerOnline;
            window.__lastMargoclickerProbeAt = now;
            try {
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), 900);
                const res = await fetch('http://127.0.0.1:5000/health', { method: 'GET', cache: 'no-store', signal: ctrl.signal });
                clearTimeout(timer);
                if (!res || !res.ok) {
                    window.__margoclickerOnline = false;
                    return false;
                }
                let data = null;
                try {
                    data = await res.clone().json();
                } catch (e) {}

                if (data && typeof data === 'object') {
                    const paused = !!data.paused;
                    const apiEnabled = data.api_enabled !== false;
                    window.__margoclickerOnline = !paused && apiEnabled;
                } else {
                    window.__margoclickerOnline = true;
                }
            } catch (e) {
                window.__margoclickerOnline = false;
            }
            return !!window.__margoclickerOnline;
        }

        async function runMargoclickerAction(actionType) {
            if (!actionType) return false;
            const online = await checkMargoclickerAlive(false);
            if (!online) return false;
            try {
                const res = await fetch(`http://127.0.0.1:5000/action?type=${encodeURIComponent(actionType)}`, {
                    method: 'GET',
                    cache: 'no-store',
                    mode: 'cors'
                });
                if (!res || !res.ok) return false;
                const data = await res.json().catch(() => ({}));
                return !!data?.ok;
            } catch (e) {
                return false;
            }
        }

        async function emitF11() {
            try {
                const online = await checkMargoclickerAlive(false);
                if (online) {
                    await fetch('http://127.0.0.1:5000/fullscreen', { method: 'GET', cache: 'no-store', mode: 'cors' });
                    return;
                }
            } catch (e) {}
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F11', code: 'F11', keyCode: 122, which: 122, bubbles: true }));
            document.dispatchEvent(new KeyboardEvent('keyup', { key: 'F11', code: 'F11', keyCode: 122, which: 122, bubbles: true }));
        }
        async function ensureFullscreenOnForTrap() {
            if (!shouldToggleFullscreenForTrap()) return;
            const isBrowserFullscreen = !!document.fullscreenElement;
            if (isBrowserFullscreen || window.__fullscreenByBotForTrap) return;
            let switched = false;
            try {
                const root = document.documentElement;
                if (root && root.requestFullscreen) {
                    await root.requestFullscreen();
                    switched = !!document.fullscreenElement;
                }
            } catch (e) {}
            if (!switched) {
                await emitF11();
            }
            window.__fullscreenByBotForTrap = true;
            HeroLogger.emit('INFO', 'FULLSCREEN_ON', 'Włączono pełny ekran przed pierwszą akcją zapadki.', "#4fc3f7");
        }
        async function ensureFullscreenOffAfterTrap() {
            if (!shouldToggleFullscreenForTrap()) {
                window.__fullscreenByBotForTrap = false;
                return;
            }
            if (!window.__fullscreenByBotForTrap) return;
            let switched = false;
            try {
                if (document.fullscreenElement && document.exitFullscreen) {
                    await document.exitFullscreen();
                    switched = !document.fullscreenElement;
                }
            } catch (e) {}
            if (!switched) {
                await emitF11();
            }
            window.__fullscreenByBotForTrap = false;
            HeroLogger.emit('INFO', 'FULLSCREEN_OFF', 'Wyłączono pełny ekran po zapadce i wznowieniu ruchu.', "#4fc3f7");
        }

        function randomDelay(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
        function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

        // Kliknięcie pre-zapadki dokładnie w tym samym poziomie co preset "Test: Pre zapadki" w margoclicker.py.
        // Używamy środka viewportu gry (0.5 / 0.5), bez losowego przesunięcia.
        function clickPreTrapPresetAsync() {
            return new Promise((resolve) => {
                const vx = Math.round(window.innerWidth * 0.5);
                const vy = Math.round(window.innerHeight * 0.5);
                const url = `http://127.0.0.1:5000/click?vx=${vx}&vy=${vy}`;

                if (typeof GM_xmlhttpRequest !== 'undefined') {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url,
                        onload: function() { resolve(true); },
                        onerror: function() { resolve(false); }
                    });
                    return;
                }

                fetch(url)
                    .then(() => resolve(true))
                    .catch(() => resolve(false));
            });
        }

        // HYBRYDOWY SYMULATOR KLIKNIĘCIA (JS + PYTHON) - Skalowanie VM + Rozrzut
        function humanClickAsync(el) {
            return new Promise((resolve) => {
                if (!el) return resolve();

                let rect = el.getBoundingClientRect();

                // Humanizacja: losowy rozrzut wewnątrz guzika
                let randomOffsetX = (Math.random() - 0.5) * (rect.width * 0.6);
                let randomOffsetY = (Math.random() - 0.5) * (rect.height * 0.6);

                // Punkt względem samego viewportu gry (bez ramek i paska przeglądarki).
                // Python przelicza to na absolutny ekran na podstawie aktywnego okna.
                let viewportX = rect.left + (rect.width / 2) + randomOffsetX;
                let viewportY = rect.top + (rect.height / 2) + randomOffsetY;
                let vx = viewportX;
                let vy = viewportY;

                // Fallback "nie-fullscreen": policz absolut z uwzględnieniem pasków przeglądarki.
                let browserLeftBar = Math.max(0, (window.outerWidth - window.innerWidth) / 2);
                let browserTopBar = Math.max(0, window.outerHeight - window.innerHeight);
                let absX = window.screenX + browserLeftBar + viewportX;
                let absY = window.screenY + browserTopBar + viewportY;

                if (typeof GM_xmlhttpRequest !== 'undefined') {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: `http://127.0.0.1:5000/click?vx=${vx}&vy=${vy}&ax=${absX}&ay=${absY}&topbar=${browserTopBar}`,
                        onload: function(response) {
                            if(window.logExp) window.logExp("🤖 Python strzela w losowy punkt celu!", "#e040fb");
                            resolve();
                        },
                        onerror: function(error) {
                            if(window.logExp) window.logExp("⚠️ Błąd GM_xml.", "#ff9800");
                            el.classList.add('pressed', 'active');
                            resolve();
                        }
                    });
                } else {
                    fetch(`http://127.0.0.1:5000/click?vx=${vx}&vy=${vy}&ax=${absX}&ay=${absY}&topbar=${browserTopBar}`)
                        .then(res => resolve())
                        .catch(err => { el.classList.add('pressed', 'active'); resolve(); });
                }
            });
        }

        // --- PRECYZYJNA DETEKCJA MAŁEGO OKNA ---
        function isVisibleCaptchaElement(el) {
            if (!el) return false;
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0 && el.offsetWidth > 0 && el.offsetHeight > 0;
        }

        function getPreCaptcha() {
            const elements = document.querySelectorAll('.pre-captcha, .zapadka-window, #captcha-alert, .zapadka-icon, .alert-window, .margo-window, .c-window, [role="dialog"]');
            for (let el of elements) {
                if (!isVisibleCaptchaElement(el)) continue;
                const text = (el.innerText || el.textContent || "").toLowerCase();
                const hasTrapKeyword = /(zapadka|zagadka|captcha)/i.test(text);
                const hasPreKeyword = /(pojawi|za\\s*\\d+\\s*s|rozwiąż\\s*teraz|rozwiaz\\s*teraz|solve\\s*now)/i.test(text);
                const hasSolveUi = /(zaznacz|potwierdzam|pozostałych\\s*prób|pozostalych\\s*prob)/i.test(text);
                if (hasSolveUi) continue;
                if (hasTrapKeyword && hasPreKeyword) {
                    return el;
                }
                const resolveBtn = findResolveNowButton(el);
                if (hasTrapKeyword && resolveBtn) {
                    return el;
                }
            }
            return null;
        }

        function findResolveNowButton(root) {
            if (!root) return null;
            const candidates = Array.from(root.querySelectorAll('button, .button, .btn, a, span, div'));
            return candidates.find(el => {
                if (!isVisibleCaptchaElement(el)) return false;
                const txt = (el.textContent || "").trim().toLowerCase();
                return /rozwiąż|rozwiaz|solve|start/i.test(txt);
            }) || null;
        }

        // --- PRECYZYJNA DETEKCJA GŁÓWNEGO OKNA ---
        function getCaptchaWindow() {
            const elements = document.querySelectorAll('.captcha, .margo-window[data-wnd="zapadka"], .captcha-window, .zapadka-window, .c-window[id="zapadka"], .margo-window, .c-window, [role="dialog"]');
            for (let el of elements) {
                if (!isVisibleCaptchaElement(el)) continue;
                const text = (el.innerText || el.textContent || "").toLowerCase();
                const hasSolveUi = /(zaznacz|potwierdzam|powodzenia|pozostałych\\s*prób|pozostalych\\s*prob)/i.test(text);
                const isPreOnly = /(pojawi\\s*się\\s*za|pojawi\\s*sie\\s*za|rozwiąż\\s*teraz|rozwiaz\\s*teraz|solve\\s*now)/i.test(text) && !hasSolveUi;
                if (!isPreOnly && hasSolveUi) {
                    return el;
                }
            }
            return null;
        }

        const symbolMap = {
            "gwiazdk": "*", "tyld": "~", "kratk": "#", "daszek": "^",
            "wykrzyknik": "!", "dolar": "$", "małp": "@", "procent": "%",
            "ampersand": "&", "plus": "+", "minus": "-", "zapytani": "?", "równa": "="
        };

        setInterval(async () => {
            if (window.__captchaLock) return;

            let fullWin = getCaptchaWindow();
            let preWin = getPreCaptcha();
            if (fullWin || preWin) {
                window.__trapSeenAt = Date.now();
                window.__trapSessionActive = true;
            }

            // 1. ZAMKNIĘCIE ZAPADKI I WZNOWIENIE PRACY
            if (!fullWin && !preWin) {
                const hadTrapSession = window.__trapSessionActive || (window.__trapSeenAt && (Date.now() - window.__trapSeenAt < 45000));
                window.__trapSessionActive = false;
                if (window.__fullscreenByBotForTrap && window.__captchaPhase === "none") {
                    await ensureFullscreenOffAfterTrap();
                }
                if (
                    hadTrapSession &&
                    !window.__trapResumeQueued &&
                    window.__trapBotPausedByCaptcha &&
                    (window.__captchaPhase === "solving" || window.__captchaPhase === "manual_waiting" || window.__captchaPhase === "pre" || window.__captchaPhase === "none")
                ) {
                    window.__trapResumeQueued = true;
                    window.__captchaPhase = "resuming";
                    window.__trapSolveStarted = false;
                    await ensureFullscreenOffAfterTrap();
                    let delay = randomDelay(1000, 2000);
                    if (window.logExp) window.logExp(`✅ Zapadka zniknęła. Wznawiam pracę za ${(delay/1000).toFixed(1)}s...`, "#4caf50");
                    if (window.logHero) window.logHero(`✅ Zapadka zniknęła. Wznawiam pracę za ${(delay/1000).toFixed(1)}s...`, "#4caf50");

                    setTimeout(() => {
                        if (window.__wasExpingBeforeCaptcha && !window.isExping) {
                            let btn = document.getElementById('btnStartExp');
                            if (btn) btn.click();
                        }
                        if (window.__wasBerserkBeforeCaptcha && window.BerserkController?.setBotBerserkState) {
                            window.BerserkController.setBotBerserkState(true, 'captcha_resume');
                        }
                        if (window.__wasPatrollingBeforeCaptcha && window.__wasHeroModeBeforeCaptcha && !window.isPatrolling && !window.isRushing) {
                            if (typeof startPatrol === 'function') startPatrol();
                        }
                        window.__wasExpingBeforeCaptcha = false;
                        window.__wasPatrollingBeforeCaptcha = false;
                        window.__wasBerserkBeforeCaptcha = false;
                        window.__wasHeroModeBeforeCaptcha = false;
                        window.__trapBotPausedByCaptcha = false;
                        window.__captchaPhase = "none";
                        window.__trapResumeQueued = false;
                        window.__trapSeenAt = 0;
                        window.__preCaptchaLastAttemptAt = 0;
                        window.__preCaptchaAttempts = 0;
                        window.__captchaSolveLastAttemptAt = 0;
                    }, delay);
                } else if (hadTrapSession && !window.__trapBotPausedByCaptcha) {
                    window.__captchaPhase = "none";
                    window.__trapSeenAt = 0;
                    window.__preCaptchaLastAttemptAt = 0;
                    window.__preCaptchaAttempts = 0;
                    window.__captchaSolveLastAttemptAt = 0;
                }
                return;
            }

            // 2. ZAPISANIE STANU BOTA
            if (window.__captchaPhase === "none") {
                HeroLogger.emit('INFO', 'TRAP_DETECTED', 'Wykryto zapadkę/captcha.', "#ffeb3b");
                window.__trapResumeQueued = false;
                window.__wasExpingBeforeCaptcha = window.isExping;
                window.__wasPatrollingBeforeCaptcha = window.isPatrolling || window.isRushing;
                window.__wasBerserkBeforeCaptcha = !!(botSettings?.berserk?.enabled || Engine?.settings?.d?.fight_auto_solo);
                window.__wasHeroModeBeforeCaptcha = !!document.getElementById('heroModeToggle')?.classList?.contains('active-tab');
            }

            // 3. OBSŁUGA MAŁEGO OKNA
            if (shouldToggleFullscreenForTrap() && (preWin || fullWin) && !window.__fullscreenByBotForTrap) {
                await ensureFullscreenOnForTrap();
            }
            if (preWin && !fullWin) {
                if (window.__captchaPhase !== "pre") {
                    window.__captchaPhase = "pre";
                }
                const now = Date.now();
                if (now - (window.__preCaptchaLastAttemptAt || 0) < 900) {
                    return;
                }
                window.__preCaptchaLastAttemptAt = now;
                window.__preCaptchaAttempts = (window.__preCaptchaAttempts || 0) + 1;
                window.__captchaLock = true;
                if (!window.__trapSolveStarted) {
                    window.__trapSolveStarted = true;
                }

                const clickerOnline = await checkMargoclickerAlive();
                if (!clickerOnline) {
                    window.__captchaPhase = "manual_waiting";
                    if (window.logExp) window.logExp("🛑 MargoClicker nie działa — nie rozwiązuję zapadki automatycznie.", "#ff9800");
                    if (window.logHero) window.logHero("🛑 MargoClicker nie działa — czekam na ręczne rozwiązanie zapadki.", "#ff9800");
                    window.__captchaLock = false;
                    return;
                }

                await sleep(randomDelay(500, 900));

                const usedTemplateClick = await runMargoclickerAction('pre_zapadka');
                if (usedTemplateClick && window.logExp) {
                    window.logExp(`🧩 Pre-zapadka kliknięta przez MargoClicker (próba ${window.__preCaptchaAttempts}).`, "#ab47bc");
                }

                if (!usedTemplateClick) {
                    const usedPresetLevelClick = await clickPreTrapPresetAsync();
                    if (usedPresetLevelClick) {
                        if (window.logExp) {
                            window.logExp(`🧩 Pre-zapadka kliknięta presetem 0.5/0.5 (jak "Test: Pre zapadki"), próba ${window.__preCaptchaAttempts}.`, "#ab47bc");
                        }
                    } else {
                        let btn = findResolveNowButton(preWin) || preWin.querySelector('button, .button, .btn, .pre-captcha__button');
                        if (btn) {
                            await humanClickAsync(btn);
                        } else {
                            await humanClickAsync(preWin);
                        }
                        if (window.logExp) {
                            window.logExp(`🧩 Fallback DOM klik pre-zapadki (próba ${window.__preCaptchaAttempts}).`, "#ab47bc");
                        }
                    }
                }

                window.__captchaLock = false;
                return;
            }

            // 4. OBSŁUGA GŁÓWNEGO OKNA ZAPADKI
            if (fullWin) {
                if (!window.__trapBotPausedByCaptcha) {
                    if (window.isExping) {
                        let btn = document.getElementById('btnStartExp');
                        if (btn) btn.click();
                    }
                    if (typeof stopPatrol === 'function') stopPatrol(true);
                    window.__trapBotPausedByCaptcha = true;
                    if (window.logExp) window.logExp("🚨 Wstrzymano bota na czas właściwej zapadki (pre-zapadka nie zatrzymuje bota).", "#ffeb3b");
                    if (window.logHero) window.logHero("🚨 Wstrzymano bota na czas właściwej zapadki (pre-zapadka nie zatrzymuje bota).", "#ffeb3b");
                }
                const now = Date.now();
                if (now - (window.__captchaSolveLastAttemptAt || 0) < 900) {
                    return;
                }
                window.__captchaSolveLastAttemptAt = now;

                window.__captchaPhase = "solving";
                window.__preCaptchaLastAttemptAt = 0;
                window.__preCaptchaAttempts = 0;
                window.__captchaLock = true;
                if (!window.__trapSolveStarted) {
                    if (shouldToggleFullscreenForTrap()) await ensureFullscreenOnForTrap();
                    window.__trapSolveStarted = true;
                }

                const clickerOnline = await checkMargoclickerAlive();
                if (!clickerOnline) {
                    window.__captchaPhase = "manual_waiting";
                    if (window.logExp) window.logExp("🛑 MargoClicker nie działa — pomijam auto-rozwiązywanie zapadki.", "#ff9800");
                    if (window.logHero) window.logHero("🛑 Brak margoclicker.py: czekam na ręczne rozwiązanie.", "#ff9800");
                    window.__captchaLock = false;
                    return;
                }

                if (botSettings.exp?.captchaAlert || botSettings.discord?.alerts?.captcha) {
                    if (!window.__lastCaptchaNotif || Date.now() - window.__lastCaptchaNotif > 15000) {
                        window.__lastCaptchaNotif = Date.now();
                        if (botSettings.discord?.alerts?.captcha) window.sendDiscordWebhook("🚨 [ZAPADKA] Wykryto Captcha!", "Bot próbuje ją właśnie rozwiązać...", 16711680);
                        if (botSettings.exp?.captchaAlert) {
                            try { let audio = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg'); audio.play(); setTimeout(()=>audio.pause(), 2000); } catch(e){}
                        }
                    }
                }

                await sleep(randomDelay(1000, 2000));

                const resolveNowBtn = findResolveNowButton(fullWin);
                if (resolveNowBtn) {
                    await humanClickAsync(resolveNowBtn);
                    if (window.logExp) window.logExp("🧩 Klikam „Rozwiąż teraz” w oknie zapadki.", "#ab47bc");
                    window.__captchaLock = false;
                    return;
                }

                let questionEl = fullWin.querySelector(".captcha__question, .question, .zapadka__question, .margo-window__text");
                let qText = "";
                if (questionEl && questionEl.textContent) {
                    qText = questionEl.textContent.toLowerCase();
                } else {
                    qText = (fullWin.innerText || fullWin.textContent || "").toLowerCase();
                }
                if (!qText || (!qText.includes("zaznacz") && !qText.includes("powodzenia"))) {
                    window.__captchaLock = false;
                    return;
                }
                let targetSymbol = null;

                for (let key in symbolMap) {
                    if (qText.includes(key) || qText.includes(symbolMap[key])) {
                        targetSymbol = symbolMap[key];
                        break;
                    }
                }

                if (targetSymbol) {
                    let buttons = Array.from(fullWin.querySelectorAll(".captcha__buttons button, .captcha__buttons .button, button, .button, .btn"));
                    let confirmCandidates = buttons.filter(b => /potwierdz|confirm|ok/i.test((b.textContent || "").trim()));
                    let toClick = buttons.filter(b => {
                        const txt = (b.textContent || "").trim();
                        if (!txt) return false;
                        if (confirmCandidates.includes(b)) return false;
                        return txt.includes(targetSymbol);
                    });

                    if (toClick.length > 0) {
                        for (let i = 0; i < toClick.length; i++) {
                            await humanClickAsync(toClick[i]);
                            await sleep(randomDelay(400, 700));
                        }

                        await sleep(randomDelay(600, 1000));
                        let confirmBtn = fullWin.querySelector(".captcha__confirm button, .captcha__confirm .button");
                        if (!confirmBtn && confirmCandidates.length > 0) {
                            confirmBtn = confirmCandidates[0];
                        }
                        if (confirmBtn) {
                             await humanClickAsync(confirmBtn);
                        } else {
                            if (window.logExp) window.logExp("⚠️ Nie znalazłem przycisku potwierdzenia zapadki.", "#ff9800");
                            window.__captchaPhase = "manual_waiting";
                        }
                    } else {
                        if (window.logExp) window.logExp("⚠️ Błąd: Nie znalazłem w opcjach symbolu: " + targetSymbol, "#ff9800");
                        window.__captchaPhase = "manual_waiting";
                    }
                } else {
                    if (window.logExp) window.logExp("⚠️ Nie rozpoznano pytania w zapadce. Rozwiąż ręcznie!", "#ff9800");
                    window.__captchaPhase = "manual_waiting";
                }

                window.__captchaLock = false;
            }
        }, 500);
    } // <--- TO JEST TA KLAMRA, KTÓRA WCZEŚNIEJ ZNIKNĘŁA!
// --- CZĘŚĆ 2: DETEKCJA GRACZY (Smart Player Radar - Zbiorczy) ---
    window.alertedPlayersList = window.alertedPlayersList || new Set();
    window.__playerThreatMemory = window.__playerThreatMemory || {};

    function getNearestSafeMapFromCurrent(currMap) {
        const distMap = typeof buildDistanceMapFromHero === 'function' ? buildDistanceMapFromHero() : new Map();
        const gateways = getCurrentMapGatewaysForRadar(distMap).filter(g => g?.reachable && g?.targetMap);
        if (!gateways.length) return null;

        window.expMapPvpCache = window.expMapPvpCache || {};
        const safeKnown = gateways
            .filter(g => window.expMapPvpCache[g.targetMap] !== 2)
            .sort((a, b) => (a.pathDistance || 9999) - (b.pathDistance || 9999));

        if (safeKnown.length > 0) return safeKnown[0].targetMap;

        const unknownFirst = gateways
            .filter(g => window.expMapPvpCache[g.targetMap] === undefined)
            .sort((a, b) => (a.pathDistance || 9999) - (b.pathDistance || 9999));

        return unknownFirst.length > 0 ? unknownFirst[0].targetMap : null;
    }

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
            const nowTs = Date.now();

            let currentIds = new Set(players.map(p => p.id));
            for (let id of window.alertedPlayersList) { if (!currentIds.has(id)) window.alertedPlayersList.delete(id); }
            Object.keys(window.__playerThreatMemory).forEach(pid => { if (!currentIds.has(Number(pid))) delete window.__playerThreatMemory[pid]; });

            let newPlayers = [];
            players.forEach(p => { if (!window.alertedPlayersList.has(p.id)) { window.alertedPlayersList.add(p.id); newPlayers.push(p); } });

            let isRedMap = Engine.map.d.pvp === 2;
            let shouldFlee = false;
            let threatPlayers = [];
            let nearestThreatDist = Infinity;

            if (isRedMap && botSettings.exp.pvpFlee) {
                players.forEach(p => {
                    let dist = Math.max(Math.abs(Engine.hero.d.x - p.x), Math.abs(Engine.hero.d.y - p.y));
                    const mem = window.__playerThreatMemory[p.id] || { dist, ts: nowTs };
                    const prevDist = Number(mem.dist);
                    const isClosing = Number.isFinite(prevDist) && prevDist - dist >= 1;
                    const closeThreat = dist <= 7;
                    const chaseThreat = dist <= 8 && isClosing;
                    if (closeThreat || chaseThreat) {
                        shouldFlee = true;
                        threatPlayers.push({ nick: p.nick, dist, chase: chaseThreat });
                        if (dist < nearestThreatDist) nearestThreatDist = dist;
                    }
                    window.__playerThreatMemory[p.id] = { dist, ts: nowTs, x: p.x, y: p.y };
                });
            } else {
                players.forEach(p => { window.__playerThreatMemory[p.id] = { dist: Math.max(Math.abs(Engine.hero.d.x - p.x), Math.abs(Engine.hero.d.y - p.y)), ts: nowTs, x: p.x, y: p.y }; });
            }

            if (newPlayers.length > 0) {
                let msgTitle = newPlayers.length === 1 ? `👁️ Wykryto Gracza!` : `👁️ Wykryto Graczy (${newPlayers.length})!`;
                let msgBody = newPlayers.map(p => `- ${p.nick} (${p.lvl} lvl)`).join('\n');
                let logBody = newPlayers.map(p => `${p.nick} (${p.lvl} lvl)`).join('<br> &nbsp;&nbsp;&nbsp; ↳ ');

                if (shouldFlee) {
                    const chased = threatPlayers.some(t => t.chase);
                    if (window.logExp) window.logExp(`🚨 UWAGA! Wróg ${nearestThreatDist <= 7 ? "≤7" : "≤8"} kratek${chased ? " i goni" : ""} na mapie PvP! Ewakuacja!`, "#ff5252");

                    // Banujemy mapę w logice pętli na równe 10 minut
                    let banTime = Date.now() + 10 * 60 * 1000;
                    window.__bannedMaps = window.__bannedMaps || {};
                    window.__bannedMaps[Engine.map.d.name] = banTime;

                    if (!window.mapClearTimes) window.mapClearTimes = {};
                    window.mapClearTimes[Engine.map.d.name] = banTime;

                    // Przerywamy obecną akcję i wymuszamy natychmiastowe obliczenie nowej drogi
                    expCurrentTargetId = null;
                    window.expCurrentTargetGroupKey = null;
                    window.expLastMoveTx = -1;
                    window.expLastMoveTy = -1;
                    window.isRushing = false;
                    expMapTransitionCooldown = 0;
                    expLastActionTime = 0;

                    if (typeof Engine.hero.stop === 'function') Engine.hero.stop();
                    const nearestSafe = getNearestSafeMapFromCurrent(Engine.map.d.name);
                    if (nearestSafe && nearestSafe !== Engine.map.d.name && typeof window.rushToMap === 'function') {
                        window.logExp?.(`🛡️ Uciekam na najbliższą bezpieczną mapę: [${nearestSafe}]`, "#80cbc4");
                        window.rushToMap(nearestSafe);
                    }
                } else {
                    // Tradycyjne powiadomienia i (ewentualne) zatrzymanie bota
                    if (checkBrowser) {
                        if (window.logExp) window.logExp(`👁️ Wykryto obcych:<br> &nbsp;&nbsp;&nbsp; ↳ ${logBody}`, "#ffb300");
                        if (Notification.permission === "granted") new Notification(msgTitle, { body: msgBody });
                    }
                    if (checkDiscord) {
                        let mapName = typeof Engine !== 'undefined' ? Engine.map.d.name : "Nieznana Mapa";
                        window.sendDiscordWebhook(msgTitle, `${msgBody}\n**Mapa:** ${mapName}`, 16711680);
                    }
                    // Jeśli ucieczka NIE zadziałała, ale opcja Stopu jest włączona
                    if (botSettings.exp.playerAlertStopBot || botSettings.discord?.stop?.player) {
                        if (typeof stopPatrol === 'function') stopPatrol(true);
                        if (window.isExping) { let btn = document.getElementById('btnStartExp'); if (btn) btn.click(); }
                        if (window.logExp) window.logExp(`🛑 Zatrzymano bota, ponieważ wykryto intruzów!`, "#f44336");
                    }
                }
            }
            if (shouldFlee && newPlayers.length === 0) {
                const chased = threatPlayers.some(t => t.chase);
                if (window.logExp) window.logExp(`🚨 Pościg na PvP (${nearestThreatDist} kr.). Kontynuuję ewakuację${chased ? " (gracz się zbliża)" : ""}.`, "#ff7043");
                let banTime = Date.now() + 10 * 60 * 1000;
                window.__bannedMaps = window.__bannedMaps || {};
                window.__bannedMaps[Engine.map.d.name] = banTime;
                if (!window.mapClearTimes) window.mapClearTimes = {};
                window.mapClearTimes[Engine.map.d.name] = banTime;
                expCurrentTargetId = null;
                window.expCurrentTargetGroupKey = null;
                window.expLastMoveTx = -1;
                window.expLastMoveTy = -1;
                window.isRushing = false;
                expMapTransitionCooldown = 0;
                expLastActionTime = 0;
                if (typeof Engine.hero.stop === 'function') Engine.hero.stop();
                const nearestSafe = getNearestSafeMapFromCurrent(Engine.map.d.name);
                if (nearestSafe && nearestSafe !== Engine.map.d.name && typeof window.rushToMap === 'function') {
                    window.rushToMap(nearestSafe);
                }
            }
        } else if (!isBotActive) {
            window.alertedPlayersList.clear();
            window.__playerThreatMemory = {};
        }
    }, 1000);
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

            if (typeof Engine === 'undefined' || !Engine.hero || !Engine.hero.d || Engine.map.isLoading) {
                window.stuckIdleCount = 0;
                return;
            }

            // --- KRYTYCZNE WYJĄTKI (Kiedy bot stoi CELOWO i nie wolno mu przeszkadzać) ---
            if (Engine.battle && Engine.battle.show) { window.stuckIdleCount = 0; return; }
            if (Engine.dead || Engine.hero.d.dead) { window.stuckIdleCount = 0; return; }
            if (window.isHealLocked || window.isRegeneratingToFull) { window.stuckIdleCount = 0; return; }
            if (window.__captchaPhase && window.__captchaPhase !== "none") { window.stuckIdleCount = 0; return; }

            // Wyjątki Sklepowe (Auto-Poty, Auto-Sprzedaż, Bieg do NPC)
            if (window.autoSellState && window.autoSellState.active) { window.stuckIdleCount = 0; return; }
            if (window.autoPotState && window.autoPotState.active) { window.stuckIdleCount = 0; return; }
            if (window.autoBuyTask) { window.stuckIdleCount = 0; return; }
            if (window.npcWalkInterval) { window.stuckIdleCount = 0; return; }
            if (window.isExpSuspended) { window.stuckIdleCount = 0; return; }

        // Wyjątek Czekania na Respawn / brak celu
if (
    window.isExping &&
    (
        (window.expMapTransitionCooldown && Date.now() < window.expMapTransitionCooldown) ||
        (!window.expCurrentTargetGroupKey && !window.expCurrentTargetId)
    )
) {
    window.stuckIdleCount = 0;
    return;
}
            // --------------------------------------------------------------------------

            let currentMap = Engine.map.d.name;
            let currentX = Engine.hero.d.x;
            let currentY = Engine.hero.d.y;
            let isMoving = Engine.hero.d.path && Engine.hero.d.path.length > 0;

            if (!isMoving) {
                if (window.lastStuckCheckPos.x === currentX && window.lastStuckCheckPos.y === currentY && window.lastStuckCheckPos.map === currentMap) {
                    window.stuckIdleCount++;
                    // Odskakuje dopiero po 6 sekundach fizycznego braku ruchu, jeśli żaden wyjątek z listy wyżej go nie uchronił
                    if (window.stuckIdleCount >= 6) {
                        const antiStuckMsg = "🔄 [Anti-Stuck] Wykryto zacięcie! Lekko odskakuję...";
                        if (window.isExping && window.logExp) window.logExp(antiStuckMsg, "#00e5ff");
                        else if (window.logHero) window.logHero(antiStuckMsg, "#00e5ff");

                        if (window.isExping) {
                            const stuckTargetId = window.expFocusTarget?.id ?? window.expCurrentTargetId ?? null;
                            const currentMapName = Engine?.map?.d?.name;
                            if (stuckTargetId != null && currentMapName && typeof MonsterMemory !== 'undefined' && MonsterMemory?.onTargetNotFound) {
                                const mm = MonsterMemory.onTargetNotFound(currentMapName, stuckTargetId);
                                const stuckMob =
                                    (window.expMonsterCache && window.expMonsterCache.get(String(stuckTargetId))) ||
                                    (window.expFocusTarget && String(window.expFocusTarget.id) === String(stuckTargetId) ? window.expFocusTarget : null) ||
                                    { id: stuckTargetId, nick: String(stuckTargetId), lvl: 0, ranga: '' };
                                markTargetIgnoredOnMap(currentMapName, stuckMob, 'anti_stuck');
                                if (window.logExp) {
                                    const suffix = mm?.cooldownUntil ? " (oznaczony jako trudny / cooldown i ignorowany na tej mapie)." : " (ignorowany na tej mapie).";
                                    window.logExp(`🎯 [Anti-Stuck] Zmieniam cel ${stuckTargetId}${suffix}`, "#ffb74d");
                                }
                            } else if (window.logExp && (window.expCurrentTargetGroupKey || window.expCurrentTargetId || window.expFocusTarget)) {
                                window.logExp("🎯 [Anti-Stuck] Resetuję aktualny cel i wybieram nowy.", "#ffb74d");
                            }
                            window.expCurrentTargetGroupKey = null;
                            expCurrentTargetId = null;
                            window.expFocusTarget = null;
                            window.expLastTargetNotFoundAt = Date.now();
                        }

                        let stepX = Math.max(0, currentX + (Math.random() > 0.5 ? 1 : -1));
                        let stepY = Math.max(0, currentY + (Math.random() > 0.5 ? 1 : -1));
                        Engine.hero.autoGoTo({x: stepX, y: stepY});
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
    // --- DAEMON: AUTO-ZAMYKANIE WALKI PO PRZEGRANEJ ---
    if (!window.autoCloseLostFightInstalled) {
        window.autoCloseLostFightInstalled = true;
        let lastLostCloseTime = 0;

        setInterval(() => {
            // 1. Sprawdzamy, czy w ogóle jesteśmy w trakcie wyświetlanej walki
            if (typeof Engine === 'undefined' || !Engine.battle || !Engine.battle.show) return;

            // 2. Pobieramy tekst z logów walki
            const battleLogs = document.querySelector(".left-column, .battle-content, .logbox, .battle-log");
            if (!battleLogs) return;

            const text = battleLogs.innerText || battleLogs.textContent || "";

            // 3. Jeśli padliśmy, szukamy przycisku opuszczenia
            if (/Poległ/i.test(text)) {
                const now = Date.now();
                if (now - lastLostCloseTime < 1500) return; // Cooldown na kliknięcie

                const btn = document.querySelector("div.button.green.close-battle-ground.small, .close-battle-btn, .battle-close-button");

                if (btn && getComputedStyle(btn).display !== "none" && getComputedStyle(btn).visibility !== "hidden") {
                    lastLostCloseTime = now;

                    // Podwójne, bezpieczne kliknięcie
                    if (window.jQuery) jQuery(btn).trigger('click');
                    if (typeof btn.click === 'function') btn.click();

                    if (window.logExp) window.logExp("💀 Przegrana walka! Automatycznie opuszczam pole bitwy...", "#e53935");
                    else if (window.logHero) window.logHero("💀 Przegrana walka! Zamykam...", "#e53935");
                }
            }
        }, 500);
    }
// ==========================================
// PŁYWAJĄCY RADAR TAKTYCZNY (DRAG & RESIZE)
// ==========================================
window.margoWalkableMask = new Set();
window.radarCompactMode = false;
window.radarShowGateways = true;
window.radarGatewayCache = [];
window.radarGroupsCache = [];
window.radarGroupsCacheTime = 0;
window.radarGroupsCacheMap = "";
window.radarTargetInfo = null;
window.__radarLastToggleTs = 0;

function toggleFloatingRadarWindow() {
    let win = document.getElementById('margoRadarWindow');
    if (!win) {
        if (typeof initFloatingRadarUI === 'function') initFloatingRadarUI();
        win = document.getElementById('margoRadarWindow');
    }
    if (!win) return;

    win.style.display = (win.style.display === 'none' || !win.style.display) ? 'flex' : 'none';
}

function handleRadarToggleEvent(e) {
    const btn = e.target?.closest?.('#btnToggleRadar');
    if (!btn) return;

    const now = Date.now();
    if (now - (window.__radarLastToggleTs || 0) < 140) return;
    window.__radarLastToggleTs = now;

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    toggleFloatingRadarWindow();
}

function ensureRadarButtonHandlers() {
    if (!window.__radarDelegatedHandlerInstalled) {
        window.__radarDelegatedHandlerInstalled = true;
        document.addEventListener('click', handleRadarToggleEvent, true);
        document.addEventListener('pointerup', handleRadarToggleEvent, true);
    }

    const toggleButtons = document.querySelectorAll('#btnToggleRadar');
    toggleButtons.forEach((btn) => {
        if (btn.dataset.radarBound === '1') return;
        btn.dataset.radarBound = '1';
        btn.addEventListener('click', handleRadarToggleEvent, true);
        btn.addEventListener('pointerup', handleRadarToggleEvent, true);
    });
}

function toggleRadar() {
    toggleFloatingRadarWindow();
}

function initFloatingRadarUI() {
    ensureRadarButtonHandlers();

    let toggleBtn = document.getElementById('btnToggleRadar');
    if (!toggleBtn) return;

    let win = document.getElementById('margoRadarWindow');

    if (win) {
        toggleBtn.onclick = handleRadarToggleEvent;
        return;
    }

    win = document.createElement('div');
    win.id = 'margoRadarWindow';
    win.style.cssText = 'display:none; position:fixed; top:50px; right:50px; width:350px; height:350px; background:#0a0a0a; border:2px solid #333; border-radius:6px; z-index:999998; resize:both; overflow:hidden; box-shadow:0 0 20px rgba(0,0,0,0.9); flex-direction:column;';

    let header = document.createElement('div');
    header.style.cssText = 'background:#111; padding:8px 10px; cursor:move; color:#00acc1; font-weight:bold; font-size:12px; border-bottom:1px solid #333; display:flex; justify-content:space-between; align-items:center; user-select:none; font-family:Tahoma,sans-serif;';
    header.innerHTML = `
        <span>🎯 Podgląd Mapy</span>
        <div style="display:flex; align-items:center; gap:6px; font-size:11px;">
            <label style="display:flex; align-items:center; gap:3px; cursor:pointer;">
                <input type="checkbox" id="radarCompactToggle">
                Compact
            </label>
            <label style="display:flex; align-items:center; gap:3px; cursor:pointer;">
                <input type="checkbox" id="radarGatewaysToggle" checked>
                Przejścia
            </label>
            <span id="closeRadarBtn" style="cursor:pointer; color:#e53935; padding:0 5px; font-size:14px;">✖</span>
        </div>
    `;
    win.appendChild(header);

    let canvasWrap = document.createElement('div');
    canvasWrap.id = 'margoRadarCanvasWrap';
    canvasWrap.style.cssText = 'flex:1; min-height:120px; position:relative; overflow:hidden; background:#000; cursor:crosshair;';

    let canvas = document.createElement('canvas');
    canvas.id = 'margoRadarCanvas';
    canvas.style.cssText = 'display:block; position:absolute; top:0; left:0;';
    canvasWrap.appendChild(canvas);
    win.appendChild(canvasWrap);

    let infoPanel = document.createElement('div');
    infoPanel.id = 'margoRadarInfoPanel';
    infoPanel.style.cssText = 'height:72px; overflow:auto; background:#0b0b0b; border-top:1px solid #222; color:#d7d7d7; font:11px Tahoma,sans-serif; padding:6px 8px; box-sizing:border-box;';
    infoPanel.innerHTML = '<div style="color:#777;">Brak danych grup.</div>';
    win.appendChild(infoPanel);

    document.body.appendChild(win);

    toggleBtn.onclick = handleRadarToggleEvent;

    document.getElementById('closeRadarBtn').onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        win.style.display = 'none';
    };

    const compactToggle = document.getElementById('radarCompactToggle');
    const gatewaysToggle = document.getElementById('radarGatewaysToggle');

    compactToggle.checked = !!window.radarCompactMode;
    const infoPanelInit = document.getElementById('margoRadarInfoPanel');
    if (infoPanelInit) {
        infoPanelInit.style.display = window.radarCompactMode ? 'none' : 'block';
    }
    gatewaysToggle.checked = !!window.radarShowGateways;

    compactToggle.onchange = () => {
        window.radarCompactMode = compactToggle.checked;
        const infoPanel = document.getElementById('margoRadarInfoPanel');
        if (infoPanel) {
            infoPanel.style.display = compactToggle.checked ? 'none' : 'block';
        }
    };

    gatewaysToggle.onchange = () => {
        window.radarShowGateways = gatewaysToggle.checked;
    };

    let isDragging = false;
    let dragOffsetX, dragOffsetY;

    header.onmousedown = (e) => {
        if (e.target.id === 'closeRadarBtn' || e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL') return;
        isDragging = true;
        dragOffsetX = e.clientX - win.getBoundingClientRect().left;
        dragOffsetY = e.clientY - win.getBoundingClientRect().top;
    };

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        win.style.left = (e.clientX - dragOffsetX) + 'px';
        win.style.top = (e.clientY - dragOffsetY) + 'px';
        win.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => isDragging = false);

    const resizeObserver = new ResizeObserver(() => {
        canvas.width = canvasWrap.clientWidth;
        canvas.height = canvasWrap.clientHeight;
    });
    resizeObserver.observe(win);
    resizeObserver.observe(canvasWrap);

    canvas.addEventListener('mousedown', (e) => {
        if (typeof Engine === 'undefined' || !Engine.map || !Engine.hero) return;

        let w = Engine.map.d.x;
        let h = Engine.map.d.y;
        let scale = Math.min(canvas.width / w, canvas.height / h);
        let offX = (canvas.width - (w * scale)) / 2;
        let offY = (canvas.height - (h * scale)) / 2;

        let clickX = Math.floor((e.clientX - canvas.getBoundingClientRect().left - offX) / scale);
        let clickY = Math.floor((e.clientY - canvas.getBoundingClientRect().top - offY) / scale);

        if (window.margoWalkableMask.has(`${clickX}_${clickY}`) && typeof Engine.hero.autoGoTo === 'function') {
            Engine.hero.autoGoTo({ x: clickX, y: clickY });
        }
    });
}

function isCollisionSafe(x, y) {
    if (typeof Engine === 'undefined' || !Engine.map) return false;
    // Bezpieczne sprawdzanie kolizji (działa na Starym i Nowym Interfejsie)
    if (typeof Engine.map.checkCollision === 'function') return Engine.map.checkCollision(x, y);
    if (Engine.map.col && typeof Engine.map.col.check === 'function') return Engine.map.col.check(x, y);
    return false;
}

function isCollisionSafe(x, y) {
    if (typeof Engine === 'undefined' || !Engine.map) return false;
    // Uniwersalne sprawdzanie kolizji (działa na Starym i Nowym Interfejsie)
    if (typeof Engine.map.checkCollision === 'function') return Engine.map.checkCollision(x, y);
    if (Engine.map.col && typeof Engine.map.col.check === 'function') return Engine.map.col.check(x, y);
    return false;
}

function updateWalkableArea() {
    if (typeof Engine === 'undefined' || !Engine.map || !Engine.hero) return;

    if (!(window.margoWalkableMask instanceof Set)) window.margoWalkableMask = new Set();
    window.margoWalkableMask.clear();
    let w = Engine.map.d.x;
    let h = Engine.map.d.y;
    let queue = [[Engine.hero.d.x, Engine.hero.d.y]];
    let visited = new Set();
    let getKey = (x, y) => `${x}_${y}`;

    visited.add(getKey(Engine.hero.d.x, Engine.hero.d.y));

    while (queue.length > 0) {
        let [cx, cy] = queue.shift();
        window.margoWalkableMask.add(getKey(cx, cy));

        let dirs = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1],[-1,1],[1,-1]];
        for (let d of dirs) {
            let nx = cx + d[0], ny = cy + d[1];
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                let nk = getKey(nx, ny);
                if (!visited.has(nk)) {
                    if (Math.abs(d[0]) === 1 && Math.abs(d[1]) === 1) {
                        // Zabezpieczenie przed przechodzeniem przez ściany na ukos
                        if (isCollisionSafe(cx + d[0], cy) && isCollisionSafe(cx, cy + d[1])) continue;
                    }
                    visited.add(nk);
                    if (!isCollisionSafe(nx, ny)) queue.push([nx, ny]);
                }
            }
        }
    }
    window._walkMaskMapName = Engine?.map?.d?.name || "";
}

function buildDistanceMapFromHero() {
    if (typeof Engine === 'undefined' || !Engine.map || !Engine.hero) return new Map();
    const currentMapName = Engine?.map?.d?.name || "";

    if (!(window.margoWalkableMask instanceof Set)) {
        window.margoWalkableMask = new Set();
    }

    if (window._walkMaskMapName !== currentMapName) {
        window.margoWalkableMask.clear();
        if (typeof updateWalkableArea === 'function') {
            HERO_LOG.info(`Odświeżam maskę przejścia dla mapy: ${currentMapName}`);
            updateWalkableArea();
        }
    }

    if (window.margoWalkableMask.size === 0 && typeof updateWalkableArea === 'function') {
        updateWalkableArea();
    }

    const w = Engine.map.d.x;
    const h = Engine.map.d.y;
    const getKey = (x, y) => `${x}_${y}`;
    const distMap = new Map();

    const startX = Engine.hero.d.x;
    const startY = Engine.hero.d.y;

    const startKey = getKey(startX, startY);
    const q = [[startX, startY]];
    distMap.set(startKey, 0);

    const dirs = [
        [0,1],[0,-1],[1,0],[-1,0],
        [1,1],[-1,-1],[-1,1],[1,-1]
    ];

    while (q.length > 0) {
        const [cx, cy] = q.shift();
        const baseDist = distMap.get(getKey(cx, cy));

        for (const [dx, dy] of dirs) {
            const nx = cx + dx;
            const ny = cy + dy;

            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const nk = getKey(nx, ny);

            if (!(window.margoWalkableMask instanceof Set)) continue;
            if (!window.margoWalkableMask.has(nk)) continue;
            if (distMap.has(nk)) continue;

            if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
                if (isCollisionSafe(cx + dx, cy) && isCollisionSafe(cx, cy + dy)) {
                    continue;
                }
            }

            distMap.set(nk, baseDist + 1);
            q.push([nx, ny]);
        }
    }
    return distMap;
}

function refreshRadarGroupsCache(force = false) {
    if (typeof Engine === 'undefined' || !Engine.map || !Engine.hero || !Engine.npcs) return;

    const now = Date.now();
    const currentMap = Engine.map.d.name || "";
    const cacheValid =
        !force &&
        window.radarGroupsCacheMap === currentMap &&
        (now - (window.radarGroupsCacheTime || 0) < 1200);

    if (cacheValid) return;

    let distMap = buildDistanceMapFromHero();
    let npcsData = typeof Engine.npcs.check === 'function' ? Engine.npcs.check() : Engine.npcs.d;
    let validMobs = [];

    for (let id in npcsData) {
        let n = npcsData[id].d || npcsData[id];
        if (!n || n.dead || n.del || n.delete) continue;

        if (n.type !== 2 && n.type !== 3 && n.type !== 11) continue;

        let isReachable = false;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const sk = `${n.x + dx}_${n.y + dy}`;
                if (window.margoWalkableMask.has(sk) && distMap.has(sk)) {
                    isReachable = true;
                    break;
                }
            }
            if (isReachable) break;
        }

        if (!isReachable) continue;

        validMobs.push({
            id: n.id || id,
            x: n.x,
            y: n.y,
            wt: parseInt(n.wt, 10) || 0,
            type: n.type,
            ranga: getMobRank(n),
            grp: n.grp,
            nick: (n.nick || n.name || "Potwór").replace(/<[^>]*>?/gm, '').trim()
        });
    }

    let serverGroups = typeof buildServerMobGroups === 'function' ? buildServerMobGroups(validMobs, distMap) : [];

    serverGroups.sort((a, b) => {
        const ad = a.bestPathDistance ?? 9999;
        const bd = b.bestPathDistance ?? 9999;
        return ad - bd;
    });

    window.radarGroupsCache = serverGroups;
    window.radarGroupsCacheTime = now;
    window.radarGroupsCacheMap = currentMap;

    let currentTarget = null;
    if (window.expCurrentTargetGroupKey) {
        currentTarget = serverGroups.find(g => g.key === window.expCurrentTargetGroupKey) || null;
    }

    if (!currentTarget && window.isExping && typeof expCurrentTargetId !== 'undefined' && expCurrentTargetId) {
        for (const g of serverGroups) {
            if (g.mobs && g.mobs.some(m => String(m.id) === String(expCurrentTargetId))) {
                currentTarget = g;
                break;
            }
        }
    }
    window.radarTargetInfo = currentTarget;
}

function getCurrentMapGatewaysForRadar(distMap) {
    let found = [];
    if (typeof Engine === 'undefined' || !Engine.map) return found;

    const currentMap = Engine?.map?.d?.name || '';
    const onlyExpMaps = window.isExping ? getExpAllowedMapSet() : null;
    const toCleanName = (raw) => String(raw || '').replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]*>?/gm, '').split('\n')[0].replace('Przejście do:', '').replace('Przejście do ', '').split('Przejście dostępne')[0].trim();

    const pushGateway = (x, y, targetMap) => {
        if (x === undefined || y === undefined) return;
        const cleanTarget = toCleanName(targetMap);
        if (!cleanTarget) return;
        if (onlyExpMaps && !onlyExpMaps.has(cleanTarget.toLowerCase())) return;

        let isReachable = false; let bestStand = null; let minDist = Infinity;
        let dirs = [[0,0], [0,1], [0,-1], [1,0], [-1,0], [1,1], [-1,-1], [-1,1], [1,-1]];
        for (let d of dirs) {
            let nx = x + d[0]; let ny = y + d[1]; let k = `${nx}_${ny}`;
            if (distMap && distMap.has(k)) {
                isReachable = true;
                let dist = distMap.get(k);
                if (dist < minDist) { minDist = dist; bestStand = {x: nx, y: ny}; }
            }
        }
        found.push({ x, y, targetMap: cleanTarget, reachable: isReachable, stand: bestStand, pathDistance: minDist });
    };

    let scannedGateways = [];
    if (typeof requestGatewayRefresh === 'function') {
        scannedGateways = requestGatewayRefresh('gateway-radar', false) || [];
    }
    if (!scannedGateways.length && typeof HeroScannerModule !== 'undefined' && typeof HeroScannerModule.scanCurrentMap === 'function') {
        try {
            scannedGateways = HeroScannerModule.scanCurrentMap(currentMap, typeof ZAKONNICY !== 'undefined' ? ZAKONNICY : null) || [];
        } catch (e) {
            scannedGateways = [];
        }
    }

    for (const gw of scannedGateways) {
        if (!gw) continue;
        const gx = gw.x !== undefined ? gw.x : gw.rx;
        const gy = gw.y !== undefined ? gw.y : gw.ry;
        pushGateway(gx, gy, gw.targetMap || gw.name || gw.title || gw.tooltip);
    }

    if (!found.length) {
        let gwsList = [];
        if (typeof Engine.map.getGateways === 'function') {
            try {
                gwsList = Engine.map.getGateways().getList().map(g => g.d || g);
            } catch (e) {
                gwsList = [];
            }
        }

        if (!gwsList.length) {
            let gws = (Engine.map.gateways) ? Engine.map.gateways : ((Engine.map.d && Engine.map.d.gw) ? Engine.map.d.gw : {});
            try { if (typeof gws.values === 'function') gwsList = Array.from(gws.values()); else gwsList = Object.values(gws); }
            catch(e) { for (let key in gws) { if (gws.hasOwnProperty(key)) gwsList.push(gws[key]); } }
            gwsList = gwsList.map(g => g.d || g);
        }

        for (const data of gwsList) {
            if (!data) continue;
            const px = data.x !== undefined ? data.x : data.rx;
            const py = data.y !== undefined ? data.y : data.ry;
            const targetMap = data.name || data.targetName || data.title || data.tooltip;
            pushGateway(px, py, targetMap);
        }
    }

    const dedup = new Map();
    for (const gw of found) {
        const key = `${gw.x}_${gw.y}_${String(gw.targetMap).toLowerCase()}`;
        if (!dedup.has(key)) {
            dedup.set(key, gw);
            continue;
        }
        const prev = dedup.get(key);
        if ((gw.pathDistance ?? 9999) < (prev.pathDistance ?? 9999)) {
            dedup.set(key, gw);
        }
    }

    if (window.isExping && currentMap) {
        const allowed = onlyExpMaps || new Set();
        return [...dedup.values()].filter(g => allowed.has(String(g.targetMap || '').toLowerCase()));
    }

    return [...dedup.values()];
}


function renderTacticalRadar() {
    let canvas = document.getElementById('margoRadarCanvas');
    let win = document.getElementById('margoRadarWindow');
    if (!canvas || !win || win.style.display === 'none' || typeof Engine === 'undefined' || !Engine.map || !Engine.hero) return;

    let ctx = canvas.getContext('2d');
    let w = Engine.map.d.x;
    let h = Engine.map.d.y;

    if (typeof refreshRadarGroupsCache === 'function') {
        refreshRadarGroupsCache(false);
    }

    const radarGroups = window.radarGroupsCache || [];
    const radarTarget = window.radarTargetInfo || null;
    const compactMode = !!window.radarCompactMode;
    const showGateways = !!window.radarShowGateways;

    let scale = Math.min(canvas.width / w, canvas.height / h);
    let offsetX = (canvas.width - (w * scale)) / 2;
    let offsetY = (canvas.height - (h * scale)) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    function drawRect(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(offsetX + (x * scale), offsetY + (y * scale), scale, scale);
    }

    function drawDot(x, y, color, sizeMult) {
        ctx.beginPath();
        ctx.arc(
            offsetX + (x * scale) + (scale / 2),
            offsetY + (y * scale) + (scale / 2),
            Math.max(1, (scale / 2) * sizeMult),
            0,
            2 * Math.PI
        );
        ctx.fillStyle = color;
        ctx.fill();
    }

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (window.margoWalkableMask.has(`${x}_${y}`)) {
                drawRect(x, y, '#1b3b22');
            } else {
                drawRect(x, y, '#050505');
            }
        }
    }

    if (showGateways) {
        let distMap = buildDistanceMapFromHero();
        let gateways = getCurrentMapGatewaysForRadar(distMap) || [];

        for (const gw of gateways) {
            if (!gw || (gw.x === undefined || gw.y === undefined)) continue;

            const gx = offsetX + (gw.x * scale) + (scale / 2);
            const gy = offsetY + (gw.y * scale) + (scale / 2);

            ctx.beginPath();
            ctx.arc(gx, gy, Math.max(2.5, scale * 0.45), 0, 2 * Math.PI);
            ctx.fillStyle = gw.reachable ? '#ffd54f' : '#666666';
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000000';
            ctx.stroke();

            if (!compactMode && gw.targetMap) {
                const label = String(gw.targetMap).slice(0, 18);
                ctx.font = `${Math.max(9, Math.floor(scale * 1.6))}px Arial`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';

                const tx = gx + 6;
                const ty = gy - 8;
                const tw = ctx.measureText(label).width;
                const th = 12;

                ctx.fillStyle = 'rgba(0,0,0,0.68)';
                ctx.fillRect(tx - 2, ty - th / 2, tw + 4, th);

                ctx.fillStyle = gw.reachable ? '#ffd54f' : '#aaaaaa';
                ctx.fillText(label, tx, ty);
            }
        }
    }

    let npcs = typeof Engine.npcs.check === 'function' ? Engine.npcs.check() : Engine.npcs.d;
    let rangaColors = { normal: '#ff5252', elite1: '#ff9800', elite2: '#ba68c8', hero: '#00e5ff' };

    for (let id in npcs) {
        let n = npcs[id].d || npcs[id];
        if (!n || n.dead || n.del || n.delete) continue;
        if (n.type !== 2 && n.type !== 3 && n.type !== 11) continue;

        let isReachable = false;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (window.margoWalkableMask.has(`${n.x + dx}_${n.y + dy}`)) {
                    isReachable = true;
                    break;
                }
            }
            if (isReachable) break;
        }

        const ranga = typeof getMobRank === 'function' ? getMobRank(n) : 'normal';

        if (!isReachable) drawDot(n.x, n.y, '#333333', 0.8);
        else drawDot(n.x, n.y, rangaColors[ranga] || '#ff5252', 1.1);
    }

    for (const g of radarGroups) {
        if (!g || !g.mobs || !g.mobs.length) continue;

        let avgX = 0;
        let avgY = 0;
        for (const m of g.mobs) {
            avgX += m.x;
            avgY += m.y;
        }
        avgX /= g.mobs.length;
        avgY /= g.mobs.length;

        const gx = offsetX + (avgX * scale) + (scale / 2);
        const gy = offsetY + (avgY * scale) + (scale / 2);
        const isCurrent = radarTarget && g.key === radarTarget.key;
        const radius = Math.max(6, scale * (1.1 + g.mobs.length * 0.35));

        ctx.beginPath();
        ctx.arc(gx, gy, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = isCurrent ? '#00e5ff' : 'rgba(255,255,255,0.22)';
        ctx.lineWidth = isCurrent ? 2.5 : 1.2;
        ctx.stroke();

        if (isCurrent) {
            ctx.beginPath();
            ctx.arc(gx, gy, radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(0,229,255,0.10)';
            ctx.fill();

            const label = `${g.mobs.length}x ${g.mainRanga}`;
            ctx.font = `${Math.max(10, Math.floor(scale * 1.8))}px Arial`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            const tx = gx + radius + 4;
            const ty = gy;
            const tw = ctx.measureText(label).width;
            const th = 14;

            ctx.fillStyle = 'rgba(0,0,0,0.78)';
            ctx.fillRect(tx - 3, ty - th / 2, tw + 6, th);

            ctx.fillStyle = '#00e5ff';
            ctx.fillText(label, tx, ty);
        }
    }

    ctx.beginPath();
    ctx.arc(
        offsetX + (Engine.hero.d.x * scale) + (scale / 2),
        offsetY + (Engine.hero.d.y * scale) + (scale / 2),
        Math.max(4, (scale / 2.0) * 1.9),
        0,
        2 * Math.PI
    );
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(
        offsetX + (Engine.hero.d.x * scale) + (scale / 2),
        offsetY + (Engine.hero.d.y * scale) + (scale / 2),
        Math.max(1.5, (scale / 2.8) * 0.9),
        0,
        2 * Math.PI
    );
    ctx.fillStyle = '#00e5ff';
    ctx.fill();
// --- RYSOWANIE LINII DO CELU ---
        if (window.isExping && window.expLastMoveTx >= 0) {
            const pathData = getPathToAdjacentTile(window.expLastMoveTx, window.expLastMoveTy, buildDistanceMapFromHero());
            if (pathData && pathData.path && pathData.path.length) {
                ctx.beginPath();
                const [sx, sy] = pathData.path[0];
                ctx.moveTo(offsetX + (sx * scale) + (scale / 2), offsetY + (sy * scale) + (scale / 2));
                for (let i = 1; i < pathData.path.length; i++) {
                    const [px, py] = pathData.path[i];
                    ctx.lineTo(offsetX + (px * scale) + (scale / 2), offsetY + (py * scale) + (scale / 2));
                }
                ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        if (window.isRushing && window.rushNextMap) {
            // Linia do bramy (TRANZYT)
            let tx = null, ty = null;
            let liveDoor = typeof getBestReachableGatewayToMap === 'function' ? getBestReachableGatewayToMap(window.rushNextMap) : null;
            
            if (liveDoor && liveDoor.reachable) {
                tx = liveDoor.x; ty = liveDoor.y;
            } else if (typeof globalGateways !== 'undefined' && globalGateways[Engine.map.d.name] && globalGateways[Engine.map.d.name][window.rushNextMap]) {
                let baseDoor = globalGateways[Engine.map.d.name][window.rushNextMap];
                tx = baseDoor.x; ty = baseDoor.y;
            }

            if (tx !== null && ty !== null) {
                let pX = offsetX + (tx * scale) + (scale / 2);
                let pY = offsetY + (ty * scale) + (scale / 2);

                ctx.beginPath();
                ctx.moveTo(heroX, heroY);
                ctx.lineTo(pX, pY);
                ctx.strokeStyle = 'rgba(186, 104, 200, 0.8)';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
                
                ctx.beginPath();
                ctx.arc(pX, pY, scale * 1.5, 0, 2 * Math.PI);
                ctx.strokeStyle = '#ba68c8';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
        else if (typeof window.isPatrolling !== 'undefined' && window.isPatrolling && typeof window.patrolIndex !== 'undefined' && typeof currentCordsList !== 'undefined' && currentCordsList[window.patrolIndex]) {
            // Linia do punktu na mapie (PATROL HEROSÓW)
            let pTarget = currentCordsList[window.patrolIndex];
            let tx = offsetX + (pTarget[0] * scale) + (scale / 2);
            let ty = offsetY + (pTarget[1] * scale) + (scale / 2);

            ctx.beginPath();
            ctx.moveTo(heroX, heroY);
            ctx.lineTo(tx, ty);
            ctx.strokeStyle = 'rgba(212, 175, 55, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.arc(tx, ty, scale * 1.5, 0, 2 * Math.PI);
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    
    try {
        const infoPanel = document.getElementById('margoRadarInfoPanel');
        if (infoPanel) {
            const decisionText = window.expDecisionInfo ? `<div style="padding:4px 0 6px 0; color:#9adcf7; border-bottom:1px solid rgba(255,255,255,0.09); margin-bottom:4px;">🧠 ${window.expDecisionInfo}</div>` : '';
            const serverGroups = [...radarGroups];

            serverGroups.sort((a, b) => {
                const ad = a.bestPathDistance ?? 9999;
                const bd = b.bestPathDistance ?? 9999;
                if (radarTarget && a.key === radarTarget.key && b.key !== radarTarget.key) return -1;
                if (radarTarget && b.key === radarTarget.key && a.key !== radarTarget.key) return 1;
                return ad - bd;
            });

            if (!serverGroups.length) {
                infoPanel.innerHTML = decisionText + '<div style="color:#777;">Brak wykrytych grup.</div>';
            } else {
                infoPanel.innerHTML = decisionText + serverGroups.map(g => {
                    const isCurrent = radarTarget && g.key === radarTarget.key;
                    const label = `${g.mobs.length}x ${g.mainRanga}`;
                    const dist = g.bestPathDistance ?? '?';
                    const score = typeof g.score !== 'undefined' ? g.score : '?';

                    return `
                        <div style="
                            padding:3px 0;
                            border-bottom:1px solid rgba(255,255,255,0.06);
                            color:${isCurrent ? '#00e5ff' : '#d7d7d7'};
                            font-weight:${isCurrent ? 'bold' : 'normal'};
                        ">
                            ${isCurrent ? '🎯 CEL: ' : '• '}
                            ${label}
                            <span style="color:#999;"> — dystans: ${dist}, score: ${score}</span>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (e) {}
}

// Główna pętla taktująca
setInterval(() => {
    if (typeof initFloatingRadarUI === 'function') initFloatingRadarUI();

    if (typeof Engine !== 'undefined' && Engine.hero && Engine.map) {
        // ZABEZPIECZENIE: Tworzy maskę jako prawdziwy zbiór danych (Set)
        if (!(window.margoWalkableMask instanceof Set)) {
            window.margoWalkableMask = new Set();
        }

        if (!window.margoWalkableMask.has(`${Engine.hero.d.x}_${Engine.hero.d.y}`)) {
            if (typeof updateWalkableArea === 'function') updateWalkableArea();
        }
        
        if (typeof renderTacticalRadar === 'function') renderTacticalRadar();
    }
}, 250);
})(); // Koniec kodu
