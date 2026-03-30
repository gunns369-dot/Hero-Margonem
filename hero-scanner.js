// hero-scanner.js
console.log("%c[HERO] Załadowano zewnętrzny moduł skanera przejść!", "color: #ff9800; font-weight: bold;");

window.HeroScannerModule = {
    // Główna funkcja skanująca obecną mapę
    scanCurrentMap: function(currentMapName, zakkonicyData) {
        if (typeof Engine === 'undefined' || !Engine.map || !Engine.map.d) return [];
        
        // Pobieramy surowe bramy z silnika Margonem (obsługa starego i nowego interfejsu)
        let gws = {};
        if (Engine.map.gateways) gws = Engine.map.gateways;
        if (Engine.map.d.gw && Object.keys(gws).length === 0) gws = Engine.map.d.gw;

        let foundGateways = [];
        
        for (let id in gws) {
            let gw = gws[id].d || gws[id];
            if (!gw) continue;

            let px = gw.x; 
            let py = gw.y;
            if (px === undefined || py === undefined) continue;

            // Zabezpieczenie przed skanowaniem Zakonników Planu Astralnego jako zwykłych drzwi
            let tp = zakkonicyData ? zakkonicyData[currentMapName] : null;
            if (tp && Math.abs(px - tp.x) <= 2 && Math.abs(py - tp.y) <= 2) continue;

            // Pobranie ukrytej nazwy mapy docelowej
            let rawName = gw.name || gw.targetName || gw.title || "";
            if (!rawName || typeof rawName !== 'string') continue;

            // Agresywne czyszczenie nazwy (usunięcie tagów HTML, ramek, dopisków silnika)
            let cleanName = rawName.replace(/<[^>]*>?/gm, '')
                                   .replace("Przejście do: ", "")
                                   .replace("Przejście do ", "")
                                   .split(" .")[0]
                                   .trim();

            // Ignorujemy przejścia, które prowadzą "donikąd", powroty do tego samego miasta i zapętlone bramy
            if (cleanName.length > 2 && cleanName !== currentMapName && cleanName !== "Wyjście" && !cleanName.includes("Brak")) {
                foundGateways.push({ x: px, y: py, targetMap: cleanName });
            }
        }
        
        return foundGateways; // Zwracamy czystą, wyselekcjonowaną tablicę dla głównego skryptu
    }
};
