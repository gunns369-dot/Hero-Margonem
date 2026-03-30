// ==UserScript==
// @name         Hero, Elity II & Kolosy - Optimized Edition
// @version      65
// @description  Automatyczne wykrywanie, inteligentny zasięg, natywny auto-atak, poprawne limity poziomowe, naprawiony scroll.
// @author       Ty & Gemini
// @match        https://*.margonem.pl/
// @grant        none
// @updateURL    https://raw.githubusercontent.com/gunns369-dot/Hero-Margonem/main/Hero-Optimized.user.js
// @downloadURL  https://raw.githubusercontent.com/gunns369-dot/Hero-Margonem/main/Hero-Optimized.user.js
// ==/UserScript==

(function() {
    'use strict';
// Ładowanie modułu bojowego z zewnątrz
 function loadCombatModule() {
        const script = document.createElement('script');
        // TUTAJ WKLEJ SKOPIOWANY LINK RAW Z GITHUBA:
        script.src = `https://raw.githubusercontent.com/gunns369-dot/Hero-Margonem/refs/heads/main/hero-combat.js}`;
        script.onload = () => console.log("%c[HERO] Pobrano moduł bojowy z serwera!", "color: #4caf50;");
        document.head.appendChild(script);
    }
    loadCombatModule();
    // ==========================================
    // BAZA DANYCH HEROSÓW
    // ==========================================
    const heroData = {
        "Domina Ecclesiae": {"Stare Ruiny": [[56,53],[57,48],[58,25],[66,22],[72,17]], "Przeklęty Zamek - wejście południowe": [[9,8],[16,7]], "Przeklęty Zamek - wejście północne": [[6,9],[18,7]], "Przeklęty Zamek - wejście wschodnie": [[8,8],[12,7]], "Przeklęty Zamek - podziemia południowe": [[8,27],[11,8],[19,27],[21,8]], "Przeklęty Zamek - kanały": [[8,8],[20,28]], "Przeklęty Zamek - sala zgromadzeń": [[4,8],[10,10],[30,9],[42,29]], "Przeklęty Zamek p.1": [[8,13],[13,4]], "Przeklęty Zamek p.2": [[2,11],[21,6]], "Orla Grań": [[44,9],[46,24],[52,10],[54,12],[56,22]], "Przeklęta Strażnica": [[4,10],[6,13],[8,9],[13,12],[17,8]], "Przeklęta Strażnica p.1": [[3,10],[4,17],[5,8],[12,8],[15,16],[17,14]], "Przeklęta Strażnica p.2": [[5,14],[8,4],[9,14],[13,12],[15,6]], "Przeklęta Strażnica - podziemia p.1 s.1": [[5,36],[7,35],[9,9],[15,27],[22,33],[24,6],[26,34],[27,20],[30,8],[31,21],[31,35]], "Przeklęta Strażnica - podziemia p.1 s.2": [[5,9],[5,35],[12,17],[17,4],[17,34],[21,22],[22,4],[27,24]], "Przeklęta Strażnica - podziemia p.2 s.2": [[2,5],[7,11],[8,5],[12,6],[12,18]]},
        "Mietek Żul": {"Ithan": [[4,6],[5,95],[18,55],[22,44],[27,16],[29,87],[40,16],[48,67],[49,67],[50,57],[53,2],[58,21],[66,57],[78,35],[89,81]], "Izba wytrzeźwień": [[15,7]], "Zajazd u Makiny": [[2,14],[7,10],[30,11]], "Zajazd u Makiny p.1": [[11,5],[16,15]], "Zajazd u Makiny p.2": [[10,12],[13,7],[14,14]], "Pod Rozbrykanym Niziołkiem - piwnica": [[3,19],[15,7]], "Torneg": [[78,54]], "Zajazd Umbara": [[1,11],[19,4],[30,15]], "Zajazd Umbara p.1": [[20,4],[21,8],[30,11]], "Łany Zboża": [[5,53]], "Oberża pod Złotym Kłosem - piwnica": [[3,9]], "Werbin": [[20,87],[25,9],[51,10]], "Karczma pod Fioletowym Kryształem": [[7,13],[14,16]], "Eder": [[5,29],[54,35],[59,56],[60,75],[63,30]], "Karczma pod Posępnym Czerepem": [[13,5]], "Karczma pod Posępnym Czerepem p.1": [[9,6]], "Dom Schadzek": [[5,3],[8,10],[22,5]], "Fort Eder": [[2,27],[13,14],[16,34],[20,28],[22,87],[57,10]], "Mokradła": [[6,32],[7,31],[31,4],[36,22],[38,29],[40,30],[47,18],[48,50],[49,49],[49,51],[50,50]], "Karka-han": [[27,49],[60,8]], "Karczma pod Złotą Wywerną": [[14,3],[22,16],[26,17],[28,10]], "Knajpa pod Czarnym Tulipanem": [[7,5]]},
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
      {"name": "Grobowce (18lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Grobowiec Rodziny Tywelta", "Grobowiec Rodziny Tywelta p.1", "Grobowiec Rodziny Tywelta p.2", "Krypta Rodu Heregata", "Krypta Rodu Heregata p.1", "Krypta Rodu Heregata p.2 - lewe skrzydło", "Krypta Rodu Heregata p.2 - prawe skrzydło"]},
      {"name": "Mrówki (20lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Kopiec Mrówek", "Kopiec Mrówek p.1", "Kopiec Mrówek p.2", "Mrowisko", "Mrowisko p.1", "Mrowisko p.2"]},
      {"name": "Pumy i tygrysy (21lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Jaskinia Dzikich Kotów", "Kryjówka Dzikich Kotów", "Leśna Przełęcz", "Tygrysia Polana"]},
      {"name": "Niedźwiedzie i nietoperze (23lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Dziewicza Knieja", "Siedlisko Nietoperzy p.1", "Siedlisko Nietoperzy p.2", "Siedlisko Nietoperzy p.3 - sala 1", "Siedlisko Nietoperzy p.3 - sala 2", "Siedlisko Nietoperzy p.4", "Siedlisko Nietoperzy p.5"]},
      {"name": "Bazyliszki (26lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Las Tropicieli"]},
      {"name": "Mulusy (28lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Dzikie Pagórki", "Osada Mulusów", "Pradawne Wzgórze Przodków"]},
      {"name": "Demony (29lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Przeklęta Strażnica", "Przeklęta Strażnica - podziemia p.1 s.1", "Przeklęta Strażnica - podziemia p.1 s.2", "Przeklęta Strażnica - podziemia p.2 s.1", "Przeklęta Strażnica - podziemia p.2 s.2", "Przeklęta Strażnica - podziemia p.2 s.3", "Przeklęta Strażnica p.1", "Przeklęta Strażnica p.2"]},
      {"name": "Rozbojnicy (32lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Dolina Rozbójników", "Kamienna Kryjówka", "Namiot Bandytów", "Pagórki Łupieżców", "Przełęcz Łotrzyków", "Skład Grabieżców"]},
      {"name": "Gobliny (34lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Jaskinia Pogardy", "Las Goblinów", "Morwowe Przejście", "Podmokła Dolina"]},
      {"name": "Puffy (37lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Pieczara Niepogody p.1", "Pieczara Niepogody p.2 - sala 1", "Pieczara Niepogody p.2 - sala 2", "Pieczara Niepogody p.3", "Pieczara Niepogody p.4", "Pieczara Niepogody p.5"]},
      {"name": "Dziki (40lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Pieczara Kwiku - sala 1", "Pieczara Kwiku - sala 2", "Racicowy Matecznik", "Spokojne Przejście", "Ukwiecona Skarpa"]},
      {"name": "Ghule (40lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Ghuli Mogilnik", "Polana Ścierwojadów", "Zapomniany Grobowiec p.1", "Zapomniany Grobowiec p.2", "Zapomniany Grobowiec p.3", "Zapomniany Grobowiec p.4", "Zapomniany Grobowiec p.5"]},
      {"name": "Wilcze plemię (44lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Krasowa Pieczara p.1", "Krasowa Pieczara p.2", "Krasowa Pieczara p.3", "Legowisko Wilczej Hordy", "Warczące Osuwiska", "Wilcza Nora p.1", "Wilcza Nora p.2", "Wilcza Skarpa"]},
      {"name": "Tolloki (45lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Skalne Turnie", "Skarpiska Tolloków"]},
      {"name": "Zbiry (46lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Ciemnica Szubrawców p.1 - sala 1", "Ciemnica Szubrawców p.1 - sala 2", "Ciemnica Szubrawców p.1 - sala 3", "Stary Kupiecki Trakt", "Stukot Widmowych Kół", "Wertepy Rzezimieszków"]},
      {"name": "Orkowie (47lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Nawiedzony Jar", "Opuszczony Bastion", "Podziemne Przejście p.1", "Podziemne Przejście p.2", "Stare Wyrobisko p.1", "Stare Wyrobisko p.2", "Stare Wyrobisko p.3", "Stare Wyrobisko p.4", "Stare Wyrobisko p.5", "Zburzona Twierdza", "Zrujnowana Wieża", "Świszcząca Grota p.1", "Świszcząca Grota p.2", "Świszcząca Grota p.3", "Świszcząca Grota p.4"]},
      {"name": "Przesmyk (50lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Migotliwa Pieczara", "Mroczna Pieczara p.0", "Mroczna Pieczara p.1 - sala 1", "Mroczna Pieczara p.1 - sala 2", "Mroczna Pieczara p.1 - sala 3", "Mroczna Pieczara p.2", "Mroczny Przesmyk", "Zapomniany Szlak"]},
      {"name": "Galarety (51lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Mokra Grota p.1", "Mokra Grota p.1 - boczny korytarz", "Mokra Grota p.1 - przełaz", "Mokra Grota p.2", "Mokra Grota p.2 - korytarz"]},
      {"name": "Pokątniki (52lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Grota Bezszelestnych Kroków - sala 1", "Grota Bezszelestnych Kroków - sala 2", "Grota Bezszelestnych Kroków - sala 3"]},
      {"name": "Koboldy (54lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Lazurytowa Grota p.1", "Lazurytowa Grota p.2", "Lazurytowa Grota p.3 - sala 1", "Lazurytowa Grota p.3 - sala 2", "Lazurytowa Grota p.4"]},
      {"name": "Żądłaki (58lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Kopalnia Kapiącego Miodu p.1 - sala 1", "Kopalnia Kapiącego Miodu p.1 - sala 2", "Kopalnia Kapiącego Miodu p.2 - sala 1", "Kopalnia Kapiącego Miodu p.2 - sala 2", "Kopalnia Kapiącego Miodu p.2 - sala Owadziej Matki", "Kopalnia Kapiącego Miodu p.3", "Porzucone Pasieki"]},
      {"name": "Bazyliszki (61lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Pieczara Szaleńców - sala 1", "Pieczara Szaleńców - sala 2", "Pieczara Szaleńców - sala 3", "Pieczara Szaleńców - sala 4"]},
      {"name": "Gnolle (64lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Czeluść Ognistej Pożogi", "Grota Pragnolli p.1", "Grota Pragnolli p.1 - sala 2", "Grota Pragnolli p.2", "Grota Pragnolli p.3", "Jaskinia Gnollich Szamanów - komnata Kozuga", "Jaskinia Gnollich Szamanów p.1", "Jaskinia Gnollich Szamanów p.2", "Jaskinia Gnollich Szamanów p.3", "Namiot Vari Krugera", "Radosna Polana", "Wioska Gnolli"]},
      {"name": "Mrówcza kolonia (66lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Mrówcza Kolonia p.1 - lewy tunel", "Mrówcza Kolonia p.1 - prawy tunel", "Mrówcza Kolonia p.2 - lewe korytarze", "Mrówcza Kolonia p.2 - prawe korytarze", "Mrówcza Kolonia p.3 - lewa komora jaj", "Mrówcza Kolonia p.3 - prawa komora jaj", "Mrówcza Kolonia p.4 - królewskie gniazdo"]},
      {"name": "Rosomaki (66lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": []},
      {"name": "Olbrzymy (67lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Kamienna Jaskinia - sala 1", "Kamienna Jaskinia - sala 2", "Ukryty Kanion"]},
      {"name": "Andarum i okolice (70lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Andarum Ilami", "Cmentarzysko Szerpów", "Skały Mroźnych Śpiewów", "Śnieżna Granica"]},
      {"name": "Jaskiniowe tolloki (71lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Głębokie Skałki p.1", "Głębokie Skałki p.2", "Głębokie Skałki p.3", "Głębokie Skałki p.4", "Zdradzieckie Przejście p.1"]},
      {"name": "Demilisze (72lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Krypty Dusz Śniegu p.1", "Krypty Dusz Śniegu p.2", "Krypty Dusz Śniegu p.3", "Krypty Dusz Śniegu p.3 - komnata Lisza"]},
      {"name": "Mnisi (74lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Świątynia Andarum", "Świątynia Andarum - lokum mnichów", "Świątynia Andarum - podziemia", "Świątynia Andarum - zejście lewe", "Świątynia Andarum - zejście prawe"]},
      {"name": "Biblioteka Andarum (75lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Świątynia Andarum - biblioteka"]},
      {"name": "Wodniki (75lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Moczary Rybiego Oka", "Uroczysko Wodnika", "Źródło Narumi"]},
      {"name": "Magazynierzy (77lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Świątynia Andarum - magazyn p.1", "Świątynia Andarum - magazyn p.2", "Świątynia Andarum - zbrojownia"]},
      {"name": "Erem (80lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Erem Czarnego Słońca p.1 - północ", "Erem Czarnego Słońca p.2", "Erem Czarnego Słońca p.3", "Erem Czarnego Słońca p.3 - południe", "Erem Czarnego Słońca p.4 - sala 1", "Erem Czarnego Słońca p.4 - sala 2", "Erem Czarnego Słońca p.5"]},
      {"name": "Minotaury (81lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Labirynt Wyklętych p.1", "Labirynt Wyklętych p.2 - sala 1", "Labirynt Wyklętych p.2 - sala 2", "Pieczara Czaszek"]},
      {"name": "Dławiciele (83lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Wylęgarnia Choukkerów p.1", "Wylęgarnia Choukkerów p.2", "Wylęgarnia Choukkerów p.3"]},
      {"name": "Miśki (83lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Firnowa Grota p.1", "Firnowa Grota p.2", "Firnowa Grota p.2 s.1", "Lodowa Wyrwa p.1 s.1", "Lodowa Wyrwa p.1 s.2", "Lodowa Wyrwa p.2", "Sala Lodowych Iglic"]},
      {"name": "Wermonty (85lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Zdradzieckie Przejście p.2"]},
      {"name": "Krasnoludy (86lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Kopalnia Margorii", "Labirynt Margorii", "Margoria", "Margoria - Sala Królewska"]},
      {"name": "Darhouny (87lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Szyb Zdrajców", "Ślepe Wyrobisko"]},
      {"name": "Grexy (89 lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Grota Samotnych Dusz p.1", "Grota Samotnych Dusz p.2", "Grota Samotnych Dusz p.3", "Grota Samotnych Dusz p.3 - sala wyjściowa", "Grota Samotnych Dusz p.4", "Grota Samotnych Dusz p.5", "Grota Samotnych Dusz p.6"]},
      {"name": "Leszy (91lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Księżycowe Wzniesienie", "Liściaste Rozstaje", "Sosnowe Odludzie", "Zapomniany Święty Gaj p.1", "Zapomniany Święty Gaj p.1 - sala 1", "Zapomniany Święty Gaj p.2", "Zapomniany Święty Gaj p.3"]},
      {"name": "Wieczornice i Południce (92lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Kamienna Strażnica - Sala Chwały", "Kamienna Strażnica - Sanktuarium", "Kamienna Strażnica - tunel", "Kamienna Strażnica - wsch. baszta skalna sala p.0", "Kamienna Strażnica - wsch. baszta skalna sala p.1", "Kamienna Strażnica - wsch. baszta zasypany tunel", "Kamienna Strażnica - zach. baszta p.1", "Kamienna Strażnica - zach. baszta p.2", "Mglista Polana Vesy", "Płacząca Grota - sala Lamentu", "Płacząca Grota p.1 - sala 1", "Płacząca Grota p.1 - sala 2", "Płacząca Grota p.2", "Płacząca Grota p.3", "Trupia Przełęcz", "Wzgórze Płaczek"]},
      {"name": "Grexy (93lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Grota Samotnych Dusz p.1", "Grota Samotnych Dusz p.2", "Grota Samotnych Dusz p.3", "Grota Samotnych Dusz p.4", "Grota Samotnych Dusz p.5", "Grota Samotnych Dusz p.6"]},
      {"name": "Błotniste gady (94lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Gadzia Kotlina", "Złowrogie Bagna"]},
      {"name": "Gnomy (94lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Gadzia Kotlina", "Mglista Polana Vesy", "Wzgórze Płaczek", "Zagrzybiałe Ścieżki p.1 - sala 1", "Zagrzybiałe Ścieżki p.1 - sala 2", "Zagrzybiałe Ścieżki p.1 - sala 3", "Zagrzybiałe Ścieżki p.2", "Zagrzybiałe Ścieżki p.3", "Złowrogie Bagna"]},
      {"name": "Ogniki (96lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Gadzia Kotlina", "Złowrogie Bagna"]},
      {"name": "Centaury (98lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Błędny Szlak", "Dolina Centaurów", "Iglaste Ścieżki", "Ostępy Szalbierskich Lasów", "Selva Oscura", "Zawiły Bór"]},
      {"name": "Małe gady i płazy (99lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Ostępy Szalbierskich Lasów", "Selva Oscura"]},
      {"name": "Bandyci (100lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Cienisty Bór", "Las Dziwów", "Ostępy Szalbierskich Lasów"]},
      {"name": "Mykonidy (102lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Lodowa Sala", "Przejście Lodowatego Wiatru", "Przejście Magicznego Mrozu", "Przejście Zamarzniętych Kości", "Sala Lodowatego Wiatru", "Sala Magicznego Mrozu", "Sala Zamarzniętych Kości", "Śnieżna Grota p.2", "Śnieżna Grota p.3"]},
      {"name": "Molochy (103lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Podziemia Zniszczonej Wieży p.2", "Podziemia Zniszczonej Wieży p.3", "Podziemia Zniszczonej Wieży p.4", "Podziemia Zniszczonej Wieży p.5"]},
      {"name": "Dwugłowe olbrzymy (105lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Przełaz olbrzymów", "Selva Oscura", "Smocza Jaskinia", "Smocze Góry"]},
      {"name": "Gady i płazy (106lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Solny Szyb p.3", "Zabłocona Jama p.1 - sala 1", "Zabłocona Jama p.1 - sala 2", "Zabłocona Jama p.2 - sala 1", "Zabłocona Jama p.2 - sala 3"]},
      {"name": "Błotniste istoty (107lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": []},
      {"name": "Alghule (111lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Skalne Cmentarzysko p.1", "Skalne Cmentarzysko p.2", "Skalne Cmentarzysko p.3", "Skalne Cmentarzysko p.4"]},
      {"name": "Szkielety-koty (111lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Grobowiec Nieznających Spokoju", "Płaskowyż Arpan", "Sucha Dolina"]},
      {"name": "Mumie (114lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Ciche Rumowiska", "Dolina Suchych Łez", "Oaza Siedmiu Wichrów", "Piramida Pustynnego Władcy p.1", "Piramida Pustynnego Władcy p.2", "Piramida Pustynnego Władcy p.3", "Złote Piaski"]},
      {"name": "Kałamarnice (118lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Archipelag Bremus An", "Jama Morskiej Macki p.1 - sala 1", "Jama Morskiej Macki p.1 - sala 2", "Jama Morskiej Macki p.1 - sala 3"]},
      {"name": "Ingotia (121lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Korytarze Wygnańców p.1 - Bezdenne Przepaści", "Korytarze Wygnańców p.1 - Hala Odszczepieńców", "Korytarze Wygnańców p.1 - Jaskinia Zagubionych", "Korytarze Wygnańców p.1 - Komora Opuszczonych", "Korytarze Wygnańców p.1 - Sala Ech", "Korytarze Wygnańców p.1 - Sala Szlachetnych", "Korytarze Wygnańców p.2 - Komnata Wygnańców", "Korytarze Wygnańców p.2 - Komora Budowniczego", "Korytarze Wygnańców p.2 - Sala Żądzy", "Korytarze Wygnańców p.3 - Komnata Przeklętego Daru", "Twierdza Rogogłowych - Sala Byka", "Wyspa Ingotia"]},
      {"name": "Kraby (122lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Wyspa Rem"]},
      {"name": "Caneum (124lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Piaskowa Pułapka - Grota Piaskowej Śmierci", "Piaskowa Pułapka p.1 - sala 1", "Piaskowa Pułapka p.1 - sala 2", "Piaskowa Pułapka p.1 - sala 3", "Piaskowa Pułapka p.1 - sala 4", "Wyspa Caneum"]},
      {"name": "Magradit (127lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Wulkan Politraki p.1 - sala 1", "Wulkan Politraki p.1 - sala 2", "Wulkan Politraki p.1 - sala 3", "Wulkan Politraki p.2 - sala 1", "Wulkan Politraki p.2 - sala 2"]},
      {"name": "Wraki (127lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Grota Trzeszczących Kości p.1 - sala 1", "Grota Trzeszczących Kości p.1 - sala 2", "Wrak statku", "Wyspa Wraków"]},
      {"name": "Pajaki (129lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Szlak Thorpa p.1", "Szlak Thorpa p.2", "Szlak Thorpa p.3", "Szlak Thorpa p.4", "Szlak Thorpa p.5", "Szlak Thorpa p.6"]},
      {"name": "Piraci (130lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Korsarska Nora - sala 1", "Korsarska Nora - sala 2", "Korsarska Nora - sala 3", "Korsarska Nora - sala 4", "Korsarska Nora - sala 5", "Korsarska Nora - sala 6", "Korsarska Nora - statek", "Korsarska Nora - wschodni przełaz", "Korsarska Nora - zachodni przełaz", "Ukryta Grota Morskich Diabłów", "Ukryta Grota Morskich Diabłów - arsenał", "Ukryta Grota Morskich Diabłów - korytarz", "Ukryta Grota Morskich Diabłów - magazyn", "Ukryta Grota Morskich Diabłów - siedziba", "Ukryta Grota Morskich Diabłów - skarbiec"]},
      {"name": "Piaskowi niewolnicy (133lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Dolina Pustynnych Kręgów", "Piachy Zniewolonych", "Piaskowa Gęstwina", "Piaszczysta Grota p.1 - sala 1", "Piaszczysta Grota p.1 - sala 2", "Ruchome Piaski"]},
      {"name": "Korredy (134lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Kopalnia Żółtego Kruszcu p.1 - sala 1", "Kopalnia Żółtego Kruszcu p.1 - sala 2", "Kopalnia Żółtego Kruszcu p.2 - sala 1", "Kopalnia Żółtego Kruszcu p.2 - sala 2"]},
      {"name": "Impy (136lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Chodniki Mrinding", "Chodniki Mrinding p.1 - sala 1", "Chodniki Mrinding p.1 - sala 2", "Chodniki Mrinding p.2 - sala 1", "Chodniki Mrinding p.2 - sala 2"]},
      {"name": "Ognie (137lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Ognista Studnia p.1", "Ścieżki Erebeth p.2 - sala 1", "Ścieżki Erebeth p.2 - sala 2", "Ścieżki Erebeth p.3"]},
      {"name": "Ogniste golemy (138lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Kuźnia Worundriela - Komnata Żaru", "Kuźnia Worundriela p.1", "Kuźnia Worundriela p.2", "Kuźnia Worundriela p.3", "Ognista Studnia p.2", "Ognista Studnia p.3"]},
      {"name": "Ważki (140lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Jezioro Ważek"]},
      {"name": "Górale (143lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Babi Wzgórek", "Chata Teściowej", "Chata wójta Fistuły", "Chata wójta Fistuły p.1", "Góralska Pieczara p.1", "Góralska Pieczara p.2", "Góralska Pieczara p.3", "Góralskie Przejście", "Wyjąca Jaskinia", "Wyjący Wąwóz"]},
      {"name": "Berserkerzy (147lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Cenotaf Berserkerów - przejście przodków", "Cenotaf Berserkerów p.1 - sala 1", "Cenotaf Berserkerów p.1 - sala 2", "Czarcie Oparzeliska", "Grobowiec Przodków", "Mała Twierdza - korytarz zachodni", "Mała Twierdza - magazyn", "Mała Twierdza - mały barak", "Mała Twierdza - mury wschodnie", "Mała Twierdza - mury zachodnie", "Mała Twierdza - podziemny magazyn", "Mała Twierdza - sala główna", "Mała Twierdza - sala wejściowa", "Mała Twierdza - wieża strażnicza", "Mała Twierdza - wieża wschodnia", "Mała Twierdza - wieża zachodnia", "Mała Twierdza p.1", "Opuszczona Twierdza", "Zaginiona Dolina", "Śnieżna Granica"]},
      {"name": "Duchy (149lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Korytarze Milczących Intryg p.1", "Korytarze Milczących Intryg p.2 - sala 1", "Korytarze Milczących Intryg p.2 - sala 2", "Korytarze Milczących Intryg p.3", "Sala Ukrytych Paktów"]},
      {"name": "Mechaniczne gobliny (151lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Lokum Złych Goblinów - warsztat", "Lokum Złych Goblinów - wieża", "Lokum Złych Goblinów - zejście p.1", "Lokum Złych Goblinów p.2 - sala 1", "Lokum Złych Goblinów p.2 - sala 2", "Lokum Złych Goblinów p.3 - sala 1", "Lokum Złych Goblinów p.3 - sala 2"]},
      {"name": "Dusze (152lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Upiorna Droga"]},
      {"name": "Wiedzmy (154lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Dom Adariel", "Dom Amry", "Dom Atalii", "Dom czarnej magii", "Dom starej czarownicy", "Laboratorium Adariel", "Lochy Tristam", "Magazyn mioteł", "Ograbiona świątynia", "Opuszczone więzienie", "Sabatowe Góry", "Splugawiona kaplica", "Splądrowana kaplica", "Tristam", "Wiedźmie Kotłowisko"]},
      {"name": "Czerwoni orkowie (156lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Grota Orczej Hordy p.1 s.1", "Grota Orczej Hordy p.1 s.2", "Grota Orczej Hordy p.2 s.1", "Grota Orczej Hordy p.2 s.2", "Grota Orczej Hordy p.2 s.3", "Grota Orczych Szamanów p.1 s.1", "Grota Orczych Szamanów p.1 s.2", "Grota Orczych Szamanów p.2 s.1", "Grota Orczych Szamanów p.2 s.2", "Kurhany Zwyciężonych", "Orcza Wyżyna", "Osada Czerwonych Orków"]},
      {"name": "Dziki zagajnik (161lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Dziki Zagajnik", "Przepaść Aguti", "Przełęcz Krwistego Posłańca", "Skały Pamięci Nikantosa", "Ukryty Kanion"]},
      {"name": "Kazamaty (163lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Nawiedzone Kazamaty p.1 s.1", "Nawiedzone Kazamaty p.1 s.2", "Nawiedzone Kazamaty p.2 s.1", "Nawiedzone Kazamaty p.2 s.2", "Nawiedzone Kazamaty p.3 s.1", "Nawiedzone Kazamaty p.3 s.2", "Nawiedzone Kazamaty p.4", "Nawiedzone Komnaty - przedsionek"]},
      {"name": "Komnaty (170lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Komnaty Czarnej Gwardii - wschód", "Komnaty Czarnej Gwardii - zachód", "Nawiedzone Komnaty - przedsionek", "Nawiedzone Komnaty - wschód", "Nawiedzone Komnaty - zachód", "Sala Dowódcy Orków", "Sala Królewska", "Sala Rady Orków"]},
      {"name": "Kryształowa grota (174lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Kryształowa Grota - Sala Smutku", "Kryształowa Grota - przepaść", "Kryształowa Grota p.1", "Kryształowa Grota p.2 - sala 1", "Kryształowa Grota p.2 - sala 2", "Kryształowa Grota p.3 - sala 1", "Kryształowa Grota p.3 - sala 2", "Kryształowa Grota p.4", "Kryształowa Grota p.5", "Kryształowa Grota p.6"]},
      {"name": "Driady (178lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Błota Sham Al", "Drzewo Dusz p.1", "Drzewo Dusz p.2", "Grota Arbor s.1", "Grota Arbor s.2", "Głusza Świstu", "Kwieciste Kresy", "Las Porywów Wiatru", "Ruiny Tass Zhil"]},
      {"name": "Ogry (181lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Ogrza Kawerna p.1", "Ogrza Kawerna p.2", "Ogrza Kawerna p.3", "Ogrza Kawerna p.4"]},
      {"name": "Patrycjusze (184lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Krypty Bezsennych p.1 s.1", "Krypty Bezsennych p.1 s.2", "Krypty Bezsennych p.2 s.1", "Krypty Bezsennych p.2 s.2", "Krypty Bezsennych p.3"]},
      {"name": "Zmutowane rośliny (187lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Głuchy Las", "Kwieciste Przejście", "Skarpa Trzech Słów", "Ukwiecona Skarpa", "Zapomniana Ścieżyna", "Złudny Trakt"]},
      {"name": "Draki (189lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Kwieciste Kresy", "Przysiółek Valmirów", "Szczerba Samobójców", "Śnieżna Granica", "Śnieżycowy Las"]},
      {"name": "Mroczny las (192lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Bezgwiezdna Gęstwina", "Bór Zagubionych", "Grota Skamieniałej Kory p.1 - sala 1", "Grota Skamieniałej Kory p.1 - sala 2", "Grota Skamieniałej Kory p.2", "Martwy Las", "Starodrzew Przedwiecznych p.1", "Starodrzew Przedwiecznych p.2", "Zbocze Starych Bogów", "Ziemia Szepczących Cierni", "Złudny Trakt"]},
      {"name": "Myświóry (196lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Kanały Nithal p.1 - sala 1", "Kanały Nithal p.1 - sala 2", "Kanały Nithal p.1 - sala 3", "Szlamowe Kanały p.2 - sala 1", "Szlamowe Kanały p.2 - sala 2", "Szlamowe Kanały p.2 - sala 3"]},
      {"name": "Hurysy (199lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Mroczne Komnaty", "Przedsionek Kultu", "Przerażające Sypialnie"]},
      {"name": "Heretycy (203lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Korytarz Ostatnich Nadziei", "Lochy Kultu", "Przejście Oczyszczenia", "Sala Skaryfikacji Grzeszników", "Sala Spowiedzi Konających", "Sala Tysiąca Świec", "Sale Rozdzierania", "Tajemnicza Siedziba"]},
      {"name": "Furbole (208lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Dolina Gniewu", "Rozległa Równina", "Terytorium Furii", "Wzgórza Obłędu", "Zalana Grota", "Zapadlisko Zniewolonych", "Zapomniany Las"]},
      {"name": "Pająki (212lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Arachnitopia p.1", "Arachnitopia p.2", "Arachnitopia p.3", "Arachnitopia p.4", "Arachnitopia p.5", "Arachnitopia p.6", "Dolina Pajęczych Korytarzy", "Otchłań Pajęczych Sieci", "Pajęczy Las", "Zapadlisko Zniewolonych"]},
      {"name": "Drowy (216lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Dawny Przełaz", "Erem Aldiphrina", "Porzucone Noiridum p.2", "Porzucone Noiridum p.3 - sala 1", "Porzucone Noiridum p.3 - sala 2", "Porzucone Noiridum p.3 - sala 3", "Zakazana Grota"]},
      {"name": "Dridery (219lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Dawny Przełaz", "Zamierzchłe Arterie p.2 - sala 1", "Zamierzchłe Arterie p.2 - sala 2", "Zamierzchłe Arterie p.3", "Zapomniane Sztolnie"]},
      {"name": "Anuraki (223lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Bagna Umarłych", "Gnijące Topielisko", "Grząska Ziemia", "Mglisty Las", "Smocze Skalisko", "Urwisko Vapora"]},
      {"name": "Maddoki (227lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Dolina Potoku Śmierci", "Grota Porośniętych Stalagmitów p.1 - sala 1", "Grota Porośniętych Stalagmitów p.1 - sala 2", "Grota Porośniętych Stalagmitów p.2 - sala 1", "Grota Porośniętych Stalagmitów p.2 - sala 2", "Jaszczurze Korytarze p.1 - sala 1", "Jaszczurze Korytarze p.1 - sala 2", "Jaszczurze Korytarze p.1 - sala 3", "Jaszczurze Korytarze p.1 - sala 4", "Jaszczurze Korytarze p.2 - sala 1", "Jaszczurze Korytarze p.2 - sala 2", "Jaszczurze Korytarze p.2 - sala 3", "Jaszczurze Korytarze p.2 - sala 4", "Jaszczurze Korytarze p.2 - sala 5", "Mechata Jama p.1", "Mechata Jama p.2", "Mechata Jama p.3", "Nora Jaszczurzych Koszmarów p.1 - sala 1", "Nora Jaszczurzych Koszmarów p.1 - sala 2", "Skryty Azyl", "Strumienie Szemrzących Wód", "Zawodzące Kaskady", "Złota Dąbrowa"]},
      {"name": "Zagrzybiony las (232lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Garb Połamanych Konarów", "Gardziel Podgnitych Mchów p.1", "Gardziel Podgnitych Mchów p.2", "Gardziel Podgnitych Mchów p.3", "Gęste Sploty", "Zalesiony Step", "Zarosłe Szczeliny p.1 - sala 1", "Zarosłe Szczeliny p.1 - sala 2", "Zarosłe Szczeliny p.1 - sala 3", "Zmurszały Łęg"]},
      {"name": "Elgary (236lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Gaj Księżycowego Blasku", "Głusza Srebrnego Rogu", "Knieja Lunarnych Głazów", "Szepty Menhirów", "Zacienione Wnęki p.1 - sala 1", "Zacienione Wnęki p.1 - sala 2", "Zacienione Wnęki p.2 - sala 1", "Zacienione Wnęki p.2 - sala 2", "Zakątek Nocnych Szelestów"]},
      {"name": "Drzewce (239lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Jaskinia Korzennego Czaru p.1 - sala 1", "Jaskinia Korzennego Czaru p.1 - sala 2", "Jaskinia Korzennego Czaru p.1 - sala 3", "Jaskinia Korzennego Czaru p.1 - sala 4", "Jaskinia Korzennego Czaru p.2 - sala 1", "Jaskinia Korzennego Czaru p.2 - sala 2", "Jaskinia Korzennego Czaru p.3", "Krzaczasta Grota p.1 - sala 1", "Krzaczasta Grota p.1 - sala 2", "Krzaczasta Grota p.1 - sala 3", "Krzaczasta Grota p.2 - sala 1", "Krzaczasta Grota p.2 - sala 2", "Krzaczasta Grota p.2 - sala 3", "Piaskowa Gęstwina", "Regiel Zabłąkanych", "Urwisko Zdrewniałych", "Wąwóz Zakorzenionych Dusz", "Źródło Zakorzenionego Ludu"]},
      {"name": "Bolity (244lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Dolina Chmur", "Złota Góra p.1 - sala 1", "Złota Góra p.1 - sala 2", "Złota Góra p.1 - sala 3", "Złota Góra p.1 - sala 4", "Złota Góra p.2 - sala 1", "Złota Góra p.2 - sala 2", "Złota Góra p.2 - sala 3", "Złota Góra p.2 - sala 4", "Złota Góra p.3 - sala 1", "Złota Góra p.3 - sala 2"]},
      {"name": "Niecka (248lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Chantli", "Chantli Cuaitla Citlalina", "Niecka Xiuh Atl", "Oztotl Tzacua p.1 - sala 1", "Oztotl Tzacua p.1 - sala 2", "Oztotl Tzacua p.2 - sala 1", "Oztotl Tzacua p.2 - sala 2", "Oztotl Tzacua p.3 - sala 1", "Oztotl Tzacua p.3 - sala 2", "Oztotl Tzacua p.4 - sala 1", "Oztotl Tzacua p.4 - sala 2", "Oztotl Tzacua p.5"]},
      {"name": "Maho (253lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Altepetl Mahoptekan", "Topan p.1", "Topan p.10", "Topan p.11", "Topan p.12", "Topan p.13", "Topan p.2", "Topan p.3", "Topan p.4", "Topan p.5", "Topan p.6", "Topan p.7", "Topan p.8", "Topan p.9", "Wschodni Mictlan p.1", "Wschodni Mictlan p.2", "Wschodni Mictlan p.3", "Wschodni Mictlan p.4", "Wschodni Mictlan p.5", "Wschodni Mictlan p.6", "Wschodni Mictlan p.7", "Wschodni Mictlan p.8", "Zachodni Mictlan p.1", "Zachodni Mictlan p.2", "Zachodni Mictlan p.3", "Zachodni Mictlan p.4", "Zachodni Mictlan p.5", "Zachodni Mictlan p.6", "Zachodni Mictlan p.7", "Zachodni Mictlan p.8", "Zachodni Mictlan p.9"]},
      {"name": "Wiedźmowe potwory (258lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Jęczywąwóz", "Plugawe Pustkowie", "Pogranicze Wisielców", "Siedlisko Przyjemnej Woni", "Siedlisko Przyjemnej Woni - źródło", "Skalisty Styk", "Zachodnie Zbocze", "Zacisze Zimnych Wiatrów"]},
      {"name": "Potępione zamczysko (261lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Potępione Zamczysko", "Potępione Zamczysko - głębokie lochy", "Potępione Zamczysko - korytarz wejściowy", "Potępione Zamczysko - korytarz wschodni", "Potępione Zamczysko - korytarz zachodni", "Potępione Zamczysko - lochy wschodnie p.1", "Potępione Zamczysko - lochy wschodnie p.2", "Potępione Zamczysko - lochy zachodnie p.1", "Potępione Zamczysko - lochy zachodnie p.2", "Potępione Zamczysko - północna komnata", "Potępione Zamczysko - sala ofiarna", "Potępione Zamczysko - wschodnia komnata", "Potępione Zamczysko - zachodnia komnata", "Potępione Zamczysko - łącznik wschodni", "Potępione Zamczysko - łącznik zachodni", "Wieża Szlochów p.1", "Wieża Szlochów p.2", "Wieża Szlochów p.3"]},
      {"name": "Katakumby (268lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Grobowiec Seta", "Katakumby Gwałtownej Śmierci", "Katakumby Krwawych Wypraw", "Katakumby Odnalezionych Skrytobójców", "Katakumby Opętanych Dusz", "Katakumby Poległych Legionistów", "Komnaty Bezdusznych - sala 1", "Komnaty Bezdusznych - sala 2", "Korytarz Porzuconych Marzeń", "Korytarz Porzuconych Nadziei", "Pustynne Katakumby", "Pustynne Katakumby - sala 1", "Pustynne Katakumby - sala 2", "Wschodni Tunel Jaźni", "Zachodni Tunel Jaźni"]},
      {"name": "Pustynia (275lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Grota Poświęcenia", "Jaskinia Odwagi", "Jaskinia Piaskowej Burzy s.1", "Jaskinia Piaskowej Burzy s.2", "Jaskinia Próby", "Jaskinia Smoczej Paszczy p.1", "Jaskinia Smoczej Paszczy p.2", "Jaskinia Szczęk", "Jaskinia Sępa s.1", "Jaskinia Sępa s.2", "Jurta Chaegda", "Jurta Czcicieli", "Jurta Nomadzka", "Namiot Błogosławionych", "Namiot Gwardii Smokoszczękich", "Namiot Naznaczonych", "Namiot Piechoty Piłowej", "Namiot Pustynnych Smoków", "Pustynia Shaiharrud - wschód", "Pustynia Shaiharrud - zachód", "Skały Umarłych", "Smocze Skalisko", "Sępiarnia", "Urwisko Vapora", "Świątynia Hebrehotha - przedsionek", "Świątynia Hebrehotha - sala czciciela", "Świątynia Hebrehotha - sala ofiary"]},
      {"name": "Driady (280lvl)", "desc": "Zoptymalizowana baza wbudowana", "maps": ["Drzewo Życia p.1", "Drzewo Życia p.2", "Drzewo Życia p.3", "Gvar Hamryd", "Jaskinia Suchych Pędów s.1", "Jaskinia Suchych Pędów s.2", "Jaskinia Suchych Pędów s.3", "Jaskinia Suchych Pędów s.4", "Matecznik Szelestu", "Rozlewisko Kai"]}
    ];

    let lsProfiles = JSON.parse(localStorage.getItem('exp_profiles_v64') || 'null');

    // Wymuszacz załadowania nowych baz: jeśli starych jest mniej niż 80 (czyli mamy śmieci lub błędy) - nadpisz twardo!
    if (!lsProfiles || lsProfiles.length < 80) {
        lsProfiles = [...window.defaultExpProfiles];
        localStorage.setItem('exp_profiles_v64', JSON.stringify(lsProfiles));
    }
    let loadedProfiles = lsProfiles;

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

    function loadData() {
        let s1 = localStorage.getItem('hero_settings_db_v64') || localStorage.getItem('hero_settings_db_v61');
        if (s1) {
            let parsed = JSON.parse(s1);
            if (parsed.waitMin === undefined) { parsed.waitMin = 200; parsed.waitMax = 500; }
            if (parsed.autoAttack === undefined) { parsed.autoAttack = false; }
            // Usuwamy combatKey ze starych zapisów
            delete parsed.combatKey;
            botSettings = {...botSettings, ...parsed};
        }
        let s2 = localStorage.getItem('hero_global_gateways_v20'); if (s2) globalGateways = JSON.parse(s2);
        let s3 = localStorage.getItem('hero_map_order_v20'); if (s3) heroMapOrder = JSON.parse(s3);
    }

    function saveSettings() { localStorage.setItem('hero_settings_db_v64', JSON.stringify(botSettings)); }
    function saveGateways() { localStorage.setItem('hero_global_gateways_v20', JSON.stringify(globalGateways)); }
    function saveMapOrder() { localStorage.setItem('hero_map_order_v20', JSON.stringify(heroMapOrder)); }

    function updateUI() {
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
                if (target.includes(" .")) {
                    let base = target.split(" .")[0];
                    let gw = globalGateways[src][target];

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
    // AUTO-SKANER SILNIKA MARGONEM (Deep Engine Read)
    // ==========================================
    function autoLearnGateways() {
        if (typeof Engine === 'undefined' || !Engine.map || !Engine.map.d) return;
        let currMap = Engine.map.d.name;
        if (!currMap) return;

        let added = false;
        if (!globalGateways[currMap]) globalGateways[currMap] = {};

        // Silnik Margonem trzyma bramy w kilku miejscach w zależności od trybu (nowy interfejs / stary interfejs)
        let gws = {};
        if (Engine.map.gateways) gws = Engine.map.gateways;
        if (Engine.map.d.gw && Object.keys(gws).length === 0) gws = Engine.map.d.gw;
        if (typeof g !== 'undefined' && g.townname && Object.keys(gws).length === 0) gws = g.townname; // Stary silnik

        // Skanowanie
        for (let id in gws) {
            let gw = gws[id].d || gws[id];

            // Pobieramy nazwę, a jeśli gra ją ukrywa, próbujemy wyłuskać ją z okienka "Tooltip" bramy
            let rawName = gw.name || gw.targetName || gw.title || "";

            if (rawName && typeof rawName === 'string') {
                // Usuwamy znaczniki (często są tam ramki, kolory, napisy "Przejście do:")
                let cleanName = rawName.replace(/<[^>]*>?/gm, '').replace("Przejście do: ", "").replace("Przejście do ", "").split(" .")[0].trim();

                // Omijamy śmieci, powroty do miasta, "Wyjście" (domyślny tekst pustej bramy)
                if (cleanName.length > 2 && cleanName !== currMap && cleanName !== "Wyjście") {
                    let px = gw.x;
                    let py = gw.y;

                    if (px !== undefined && py !== undefined) {
                        if (!globalGateways[currMap][cleanName]) {
                            globalGateways[currMap][cleanName] = { x: px, y: py, allCoords: [[px, py]] };
                            added = true;
                        } else {
                            let exists = globalGateways[currMap][cleanName].allCoords.some(c => c[0] === px && c[1] === py);
                            if (!exists) {
                                globalGateways[currMap][cleanName].allCoords.push([px, py]);
                                added = true;
                            }
                        }
                    }
                }
            }
        }

        if (added) {
            saveGateways();
            if (document.getElementById('heroGatewaysGUI') && document.getElementById('heroGatewaysGUI').style.display === 'flex') {
                renderGatewaysDatabase();
            }
        }
    }
    function autoDetectEngineData() {
        if (!Engine || !Engine.map || !Engine.map.d) return;
        let currentName = Engine.map.d.name;
        if (!currentName || currentName === "undefined") return;

        updateSuitableBosses('e2SuitableContainer', 'e2Search', elityIIData, '#ba68c8');
        updateSuitableBosses('kolosySuitableContainer', 'kolosySearch', kolosyData, '#ff7043');

        if (currentName !== lastMapName) {
            window.lastLoggedMap = ""; // Reset zapobiegania spamu w logach
            
            if (lastMapName !== "" && positionHistory.length > 0) {
                let validPos = null;
                for (let i = positionHistory.length - 1; i >= 0; i--) { if (positionHistory[i].map === lastMapName) { validPos = positionHistory[i]; break; } }
                if (validPos && botSettings.isRecording) { saveGatewayToDB(lastMapName, currentName, validPos.x, validPos.y); }
            }

            positionHistory = [];
            lastMapName = currentName;
            heroFoundAlerted = false;

            // Szpieg i pobieranie ukrytych przejść silnika
            autoLearnGateways();

            let domMap = document.getElementById('currentMapNameDisplay');
            if (domMap) domMap.innerText = currentName;

            let domHero = document.getElementById('selHero');
            if (domHero && document.getElementById('heroModeToggle').classList.contains('active-tab')) {
                let matchingHero = domHero.value;
                let mapHasCurrent = matchingHero && heroData[matchingHero] && heroData[matchingHero][currentName];

                // 1. AUTO-WYKRYWANIE HEROSA NA BAZIE MAPY
                if (!isPatrolling && !isRushing && !mapHasCurrent) {
                    let foundHero = null;
                    for (const h in heroData) {
                        if (heroData[h][currentName]) { foundHero = h; break; }
                    }
                    if (foundHero) {
                        matchingHero = foundHero;
                    }
                }

                // 2. ŁADOWANIE DANYCH ZNALEZIONEGO HEROSA
                if (matchingHero) {
                    // Wymuś bazę map jeśli pusta
                    if (!heroMapOrder[matchingHero] || heroMapOrder[matchingHero].length === 0) {
                        heroMapOrder[matchingHero] = Object.keys(heroData[matchingHero]);
                        saveMapOrder();
                    }

                    // Bezpieczna zmiana wyboru (bez wyzwalania rekursji "change")
                    if (domHero.value !== matchingHero) {
                        domHero.value = matchingHero;
                        currentRouteIndex = -1;
                        sessionStorage.removeItem('hero_route_index');
                        checkedMapsThisSession.clear();
                        saveCheckedMaps();
                    }

                    let mapList = heroMapOrder[matchingHero];
                    if (currentRouteIndex !== -1 && mapList[currentRouteIndex] === currentName) {
                        // Jesteśmy na poprawnej mapie z pętli
                    } else if (currentRouteIndex !== -1 && mapList[(currentRouteIndex + 1) % mapList.length] === currentName) {
                        currentRouteIndex = (currentRouteIndex + 1) % mapList.length;
                        sessionStorage.setItem('hero_route_index', currentRouteIndex);
                    } else {
                        if (mapList.includes(currentName)) {
                            currentRouteIndex = mapList.indexOf(currentName);
                            sessionStorage.setItem('hero_route_index', currentRouteIndex);
                        }
                    }

                    if (checkedMapsThisSession.has(currentName)) {
                        currentCordsList = [];
                    } else if(heroData[matchingHero] && heroData[matchingHero][currentName]) {
                        currentCordsList = [...heroData[matchingHero][currentName]];
                    } else {
                        currentCordsList = [];
                    }

                    checkedPoints.clear();

                    // Natychmiastowo buduj środkową listę!
                    updateUI();

                    // Generuj kordy
                    setTimeout(() => {
                        if(currentCordsList.length > 0) optimizeRoute();
                        renderCordsList();
                    }, 200);

                } else {
                    currentCordsList = [];
                    checkedPoints.clear();
                    renderCordsList();
                    updateUI();
                }
            } else if (!document.getElementById('heroModeToggle').classList.contains('active-tab')) {
                 currentCordsList = [];
                 checkedPoints.clear();
                 renderCordsList();
                 updateUI();
            }

            if (isRushing) {
                clearTimeout(rushInterval);
                setTimeout(() => { if (isRushing) executeRushStep(); }, 800);
            } else if (isPatrolling) {
                patrolIndex = 0; checkedPoints.clear(); clearTimeout(smoothPatrolInterval);
                let loadDelay = Math.floor(Math.random() * (botSettings.mapLoadMax - botSettings.mapLoadMin + 1)) + botSettings.mapLoadMin;
                setTimeout(() => { if(isPatrolling) executePatrolStep(); }, loadDelay);
            }
        }
    }
    // ==========================================
    // RUSH MODE
    // ==========================================
window.rushToMap = function(targetMapName, x = null, y = null) {
        let currentSysMap = lastMapName;

        if (currentSysMap === targetMapName) {
            if (x !== null && y !== null) {
                console.log("%c[HERO] Już stoisz na tej mapie! Podchodzę pod resp...", "color: #4caf50;");
                safeGoTo(x, y, false);
                return;
            }
            return console.log("%c[HERO] Już stoisz na tej mapie!", "color: #4caf50;");
        }

        let path = getShortestPath(currentSysMap, targetMapName);
        if (!path) {
            return console.log(`%c[HERO] Brak zapisanej drogi do: [${targetMapName}]!\nSkorzystaj z nagrywania (🎥), aby nauczyć bota trasy.`, "color: #e53935; font-weight: bold;");
        }

        stopPatrol(true);
        isRushing = true;
        rushTarget = targetMapName;
        rushTargetX = x;
        rushTargetY = y;

        let btn = document.getElementById('btnStartStop');
        if (btn) {
            btn.innerHTML = '<span class="btn-icon">⏹</span><span>Stop RUSH</span>';
            btn.style.color = "#00acc1";
            btn.style.borderColor = "#00acc1";
        }

        console.log(`%c[HERO] 🏃 Rozpoczynam bieg na mapę: [${targetMapName}]`, "color: #00acc1; font-weight: bold;");
        executeRushStep(); // Uruchamia logikę biegu, którą wyczyściliśmy z okienek w poprzedniej łatce
    };

function executeRushStep() {
        if (!isRushing) return;
        let currentSysMap = lastMapName;

        if (currentSysMap === rushTarget) {
            stopPatrol(false);
            if (rushTargetX !== null && rushTargetY !== null) {
                console.log("%c[HERO] Dotarto na mapę bosa! Podchodzę na zapisane koordynaty...", "color: #4caf50;");
                setTimeout(() => safeGoTo(rushTargetX, rushTargetY, false), 500);
            } else {
                console.log("%c[HERO] Dotarto na wybraną mapę!", "color: #4caf50;");
            }
            return;
        }

        let path = getShortestPath(currentSysMap, rushTarget);
        if (!path || path.length < 2) {
            stopPatrol(false);
            console.log(`%c[HERO] Zgubiłem drogę! Brak ścieżki do ${rushTarget}.`, "color: #e53935;");
            return;
        }

        let nextMap = path[1];
        let door = globalGateways[currentSysMap] && globalGateways[currentSysMap][nextMap];

        if (door) {
            let targetX = door.x; let targetY = door.y;
            if(door.allCoords && door.allCoords.length > 0) {
                let rnd = door.allCoords[Math.floor(Math.random() * door.allCoords.length)];
                targetX = rnd[0]; targetY = rnd[1];
            }
            safeGoTo(targetX, targetY, false);
            clearTimeout(rushInterval);
            rushInterval = setTimeout(checkRushArrival, 500);
        } else {
            stopPatrol(false);
            console.log(`%c[HERO] Brak zapisanej bramy do: [${nextMap}]`, "color: #e53935;");
        }
    }

    function checkRushArrival() {
        if (!isRushing || !Engine || !Engine.hero) return;
        let currentSysMap = lastMapName;
        if (currentSysMap === rushTarget) { executeRushStep(); return; }

        let path = getShortestPath(currentSysMap, rushTarget);
        if(!path || path.length < 2) return;
        let nextMap = path[1];
        let door = globalGateways[currentSysMap] && globalGateways[currentSysMap][nextMap];
        if (!door) return;

        let cx = Engine.hero.d.x; let cy = Engine.hero.d.y;
        let targetX = door.x; let targetY = door.y;
        let dist = Math.abs(cx - targetX) + Math.abs(cy - targetY);

        if (dist > 1) {
            if (cx === lastX && cy === lastY) {
                stuckCount++;
                if(stuckCount > 6) {
                    safeGoTo(targetX, targetY, false);
                    stuckCount = 0;
                }
            } else { stuckCount = 0; }
        }
        lastX = cx; lastY = cy;
        rushInterval = setTimeout(checkRushArrival, 400);
    }

    // ==========================================
    // ALGRORYTMY BFS
    // ==========================================
    function getShortestPath(start, end) {
        if (start === end) return [start];
        let queue = [[start]]; let visited = new Set([start]);
        while (queue.length > 0) {
            let path = queue.shift(); let node = path[path.length - 1];

            // 1. Logika standardowych przejść
            if (globalGateways[node]) {
                for (let neighbor in globalGateways[node]) {
                    if (!visited.has(neighbor)) {
                        visited.add(neighbor); let newPath = [...path, neighbor];
                        if (neighbor === end) return newPath;
                        queue.push(newPath);
                    }
                }
            }
            // 2. Wirtualne ścieżki przez teleporty Zakonników
            if (botSettings.useTeleports && ZAKONNICY[node]) {
                for (let tpMap in botSettings.unlockedTeleports) {
                    if (botSettings.unlockedTeleports[tpMap] && !visited.has(tpMap) && tpMap !== node) {
                        visited.add(tpMap); let newPath = [...path, tpMap];
                        if (tpMap === end) return newPath;
                        queue.push(newPath);
                    }
                }
            }
        }
        return null;
    }

window.handleTeleportNPC = function(targetMap) {
        if (!isRushing && !isPatrolling) return;
        let currentSysMap = lastMapName;
        let tp = ZAKONNICY[currentSysMap];
        if (!tp) return;

        let cx = Engine.hero.d.x; let cy = Engine.hero.d.y;
        let dist = Math.max(Math.abs(cx - tp.x), Math.abs(cy - tp.y));

        // 1. Musimy podejść bardzo blisko (1 kratka), żeby klawisz "r" zadziałał na odpowiedniego NPC
        if (dist > 1) {
            if (!Engine.hero.d.path || Engine.hero.d.path.length === 0) {
                console.log(`%c[HERO] Podbiegam do Zakonnika na [${tp.x}, ${tp.y}]...`, "color: #9c27b0;");
                safeGoTo(tp.x, tp.y, false);
            }
            rescheduleTeleportCheck(targetMap);
            return;
        }

        // 2. Sprawdzanie, czy okno dialogowe jest otwarte
        let dialogBox = document.querySelector('.dialog-texts') || document.querySelector('.dialog-content');
        let isDialogOpen = dialogBox && dialogBox.offsetParent !== null;

        if (!isDialogOpen) {
            console.log("%c[HERO] Wciskam klawisz [ R ], aby zacząć rozmowę...", "color: yellow; font-weight: bold;");
            simulateKeyPress('r');
            rescheduleTeleportCheck(targetMap);
            return;
        }

        // 3. Pobieramy opcje dialogowe i wyszukujemy cyfry
        let options = Array.from(document.querySelectorAll('.dialog-texts li, .dialog-options li, .answer, [data-option]'));
        if (options.length > 0) {

            // Wewnętrzna funkcja: szuka cyfry na początku zdania (np. "1. Chciałam...")
            // lub z automatu przypisuje jej numer od góry do dołu.
            const getOptionKey = (el, index) => {
                let match = el.innerText.match(/^(\d+)\./);
                if (match) return match[1];
                return (index + 1).toString();
            };

            // ETAP 1: Klawisz dla "Chciałam się teleportować"
            let startOptIndex = options.findIndex(el => el.innerText.toLowerCase().includes("teleportować"));
            if (startOptIndex !== -1) {
                let key = getOptionKey(options[startOptIndex], startOptIndex);
                console.log(`%c[HERO] Wybieram opcję teleportacji -> Wciskam klawisz [ ${key} ]`, "color: #00acc1;");
                simulateKeyPress(key);
                rescheduleTeleportCheck(targetMap);
                return;
            }

            // ETAP 2: Klawisz dla miasta docelowego
            let destOptIndex = options.findIndex(el => el.innerText.toLowerCase().includes(targetMap.toLowerCase()));
            if (destOptIndex !== -1) {
                let destOpt = options[destOptIndex];

                // Jeśli brak zezwolenia - anuluj i wyjdź (szukamy klawisza dla opcji "Nigdzie")
                if (destOpt.innerText.toLowerCase().includes("brak zezwolenia")) {
                    console.log(`%c[HERO] Zablokowane! Nie wykupiłeś zezwolenia do: ${targetMap}!`, "color: red; font-weight: bold;");
                    let closeOptIndex = options.findIndex(el => el.innerText.toLowerCase().includes("nigdzie") || el.innerText.toLowerCase().includes("zakończ"));
                    if (closeOptIndex !== -1) {
                        let closeKey = getOptionKey(options[closeOptIndex], closeOptIndex);
                        simulateKeyPress(closeKey);
                    }
                    stopPatrol(false);
                    return;
                }

                let key = getOptionKey(destOpt, destOptIndex);
                console.log(`%c[HERO] 🚀 Cel: ${targetMap} -> Wciskam klawisz [ ${key} ]!`, "color: #4caf50; font-weight: bold;");
                simulateKeyPress(key);

                // Czekamy dłużej, bo ładowanie mapy po teleporcie potrafi chwilę zająć
                if (isRushing) { clearTimeout(rushInterval); rushInterval = setTimeout(executeRushStep, 3500); }
                else if (isPatrolling) { clearTimeout(smoothPatrolInterval); smoothPatrolInterval = setTimeout(executePatrolStep, 3500); }
                return;
            }
        }
        rescheduleTeleportCheck(targetMap);
    };

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

    function rescheduleTeleportCheck(targetMap) {
        if (isRushing) { clearTimeout(rushInterval); rushInterval = setTimeout(() => handleTeleportNPC(targetMap), 600); }
        else if (isPatrolling) { clearTimeout(smoothPatrolInterval); smoothPatrolInterval = setTimeout(() => handleTeleportNPC(targetMap), 600); }
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
            // Unikaj spamowania klikania w to samo miejsce jeśli postać już tam biegnie!
            let tx = Engine.hero.d.x;
            let ty = Engine.hero.d.y;

            if (Engine.hero.d.path && Engine.hero.d.path.length > 0) {
                // Skrypt pobiera z pamięci gry punkt, do którego gracz obecnie zmierza.
                let targetDest = Engine.hero.d.path[Engine.hero.d.path.length - 1];
                if (targetDest.x === x && targetDest.y === y) return; // Zapobiega zacinaniu, gracz już idzie poprawnie w ten punkt
            }
            if (tx === x && ty === y) return;

            Engine.hero.autoGoTo({x: x, y: y});
            let throttleDelay = Math.floor(Math.random() * (botSettings.throttleMax - botSettings.throttleMin + 1)) + botSettings.throttleMin;
            nextAllowedClickTime = Date.now() + throttleDelay;
        }
    }

    function stopPatrol(hardStop = false) {
        isPatrolling = false;
        isRushing = false;
        clearTimeout(rushInterval);

        let btn = document.getElementById('btnStartStop');
        if (btn) {
            btn.innerHTML = '<span class="btn-icon">▶</span><span>START</span>';
            btn.style.color = "#4caf50";
            btn.style.borderColor = "#4caf50";
        }
        checkedPoints.clear();
        clearTimeout(smoothPatrolInterval);
        renderCordsList(-1);

        if (hardStop && typeof Engine !== 'undefined' && Engine.hero && Engine.hero.d) {
            try {
                if (typeof Engine.hero.stop === 'function') Engine.hero.stop();
                Engine.hero.autoGoTo({x: Engine.hero.d.x, y: Engine.hero.d.y});
                if (Engine.hero.d.path) Engine.hero.d.path = [];
            } catch(e) {}
        }
    }

    function startPatrol() {
        let hero = document.getElementById('selHero').value; let mapList = heroMapOrder[hero];
        if (hero && mapList) {
            let currentSysMap = lastMapName;
            if (currentRouteIndex === -1 || mapList[currentRouteIndex] !== currentSysMap) { currentRouteIndex = mapList.indexOf(currentSysMap); sessionStorage.setItem('hero_route_index', currentRouteIndex); updateUI(); }
        }
        isPatrolling = true; patrolIndex = 0; checkedPoints.clear(); heroFoundAlerted = false;
        let btn = document.getElementById('btnStartStop'); btn.innerHTML = '<span class="btn-icon">⏹</span><span>STOP</span>'; btn.style.color = "#f44336"; btn.style.borderColor = "#f44336"; executePatrolStep();
    }

    function executePatrolStep() {
        if (!isPatrolling) return;

        checkVisionRange();

        while (patrolIndex < currentCordsList.length && checkedPoints.has(patrolIndex)) {
            patrolIndex++;
        }

        let hero = document.getElementById('selHero').value;
        let currentSysMap = lastMapName;

        if (patrolIndex >= currentCordsList.length || currentCordsList.length === 0) {
            clearTimeout(smoothPatrolInterval);

            if (!checkedMapsThisSession.has(currentSysMap)) { checkedMapsThisSession.add(currentSysMap); saveCheckedMaps(); }

            if(hero && heroMapOrder[hero] && heroMapOrder[hero].length > 0) {
                let mapList = heroMapOrder[hero];

                let nextRouteIndex = (currentRouteIndex + 1) % mapList.length;
                let finalDestinationMap = mapList[nextRouteIndex];

                let path = getShortestPath(currentSysMap, finalDestinationMap);

                if (path && path.length > 1) {
                    let immediateNextMap = path[1];
                    let door = globalGateways[currentSysMap] && globalGateways[currentSysMap][immediateNextMap];

                    if(door) {
                        let targetX = door.x; let targetY = door.y;
                        if(door.allCoords && door.allCoords.length > 0) { let rnd = door.allCoords[Math.floor(Math.random() * door.allCoords.length)]; targetX = rnd[0]; targetY = rnd[1]; }

                        safeGoTo(targetX, targetY, false);
                        return;
                    }
                }

                stopPatrol(true);
                let fallbackMissing = path ? path[1] : finalDestinationMap;
                heroAlert(`❌ BRAK BRAMY W BAZIE!\n\nJesteś na: [${currentSysMap}]\n\nNie wiem jak stąd wyjść na mapę: [${fallbackMissing}]\n\nUpewnij się, że masz połączone te mapy (wyjścia/powroty z podziemi). Kliknij 🎥 Nagrywam i przejdź tam!`);
                return;
            }

            checkedMapsThisSession.clear(); saveCheckedMaps(); currentRouteIndex = -1; sessionStorage.removeItem('hero_route_index'); stopPatrol(true); heroAlert("✅ Trasa zrobiona!"); return;
        }

        renderCordsList(patrolIndex);
        let target = currentCordsList[patrolIndex];
        safeGoTo(target[0], target[1], true);
        stuckCount = 0; clearTimeout(smoothPatrolInterval);

        let pingDelay = Math.floor(Math.random() * (botSettings.stepMax - botSettings.stepMin + 1)) + botSettings.stepMin;
        smoothPatrolInterval = setTimeout(checkSmoothArrival, pingDelay);
    }

    function checkSmoothArrival() {
        if (!isPatrolling || !Engine || !Engine.hero || !Engine.hero.d) return;

        checkVisionRange();

        let cx = Engine.hero.d.x; let cy = Engine.hero.d.y;

        if (checkedPoints.has(patrolIndex)) {
            clearTimeout(smoothPatrolInterval);
            patrolIndex++;
            executePatrolStep();
            return;
        }

        let target = currentCordsList[patrolIndex];
        let dist = Math.abs(cx - target[0]) + Math.abs(cy - target[1]);

        if (dist <= 1) {
            clearTimeout(smoothPatrolInterval);
            checkedPoints.add(patrolIndex);

            let waitDelay = Math.floor(Math.random() * (botSettings.waitMax - botSettings.waitMin + 1)) + botSettings.waitMin;

            patrolIndex++;
            setTimeout(executePatrolStep, waitDelay);
        } else {
            if (cx === lastX && cy === lastY) {
                stuckCount++;
                if (stuckCount > 8) {
                    clearTimeout(smoothPatrolInterval); checkedPoints.add(patrolIndex); patrolIndex++; executePatrolStep(); return;
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
    window.lastLoggedMap = ""; // Zapobiega spamowaniu logami bram
    let expMapTransitionCooldown = 0;
    let expLastActionTime = 0;
    let expCurrentTargetId = null;

    let expLastX = -1;
    let expLastY = -1;
    let expAntiLagTime = 0;

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

    function runExpLogic() {
        if (!window.isExping) return;
        if (typeof Engine === 'undefined' || !Engine.hero || Engine.map.isLoading) return;

        // --- AUTOMATYCZNY ZAKRES LEVELOWY ---
        if (Engine.hero.d && Engine.hero.d.lvl) {
            let currentLvl = Engine.hero.d.lvl;
            if (window.lastHeroExpLevel === 0) {
                window.lastHeroExpLevel = currentLvl;
            } else if (currentLvl > window.lastHeroExpLevel) {
                let diff = currentLvl - window.lastHeroExpLevel;
                botSettings.exp.minLvl += diff;
                botSettings.exp.maxLvl += diff;
                saveSettings();

                let minInp = document.getElementById('expMinL');
                let maxInp = document.getElementById('expMaxL');
                if (minInp) minInp.value = botSettings.exp.minLvl;
                if (maxInp) maxInp.value = botSettings.exp.maxLvl;

                window.logExp(`[AWANS!] Zaktualizowano przedział na: ${botSettings.exp.minLvl} - ${botSettings.exp.maxLvl}.`, "#ffb300");
                window.lastHeroExpLevel = currentLvl;

                // Odśwież natywny berserk jeśli włączony
                if (botSettings.berserk && botSettings.berserk.enabled && typeof window.updateServerBerserk === 'function') {
                    window.updateServerBerserk();
                }
            }
        }

        let now = Date.now();

        if (Engine.battle && (Engine.battle.show || Engine.battle.d)) {
            expLastActionTime = now + 500;
            expCurrentTargetId = null;
            return;
        }

        if (now < expLastActionTime) return;

        let npcs = (typeof Engine.npcs.check === 'function') ? Engine.npcs.check() : Engine.npcs.d;
        let hx = Engine.hero.d.x, hy = Engine.hero.d.y;

        const getAntiLagDelay = () => {
            let min = botSettings.expAntiLagMin || 1500;
            let max = botSettings.expAntiLagMax || 2500;
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };

        // --- WYSZUKIWANIE BRAM NA MAPIE ---
        const isOnGateway = (x, y) => {
            let gws = (Engine.map && Engine.map.gateways) ? Engine.map.gateways : ((Engine.map && Engine.map.d && Engine.map.d.gw) ? Engine.map.d.gw : {});
            for (let id in gws) {
                let gw = gws[id].d || gws[id];
                if (gw.x === x && gw.y === y) return true;
            }
            return false;
        };

        // --- DETEKCJA RUCHU I BEZRUCHU (ANTY-LAG) ---
        if (hx !== expLastX || hy !== expLastY) {
            expLastX = hx;
            expLastY = hy;
            expAntiLagTime = now + getAntiLagDelay(); // Jeśli idziemy, resetujemy timer
        } else if (now > expAntiLagTime) {
            // Ratunek: Czy stoimy na przejściu między mapami?
            if (isOnGateway(hx, hy)) {
                window.logExp(`Stoję na przejściu! Odbiegam kawałek...`, "#ff9800");
                let stepX = Math.max(0, hx + (Math.random() > 0.5 ? 2 : -2));
                let stepY = Math.max(0, hy + (Math.random() > 0.5 ? 2 : -2));
                Engine.hero.autoGoTo({x: stepX, y: stepY});

                expAntiLagTime = now + 1500;
                expMapTransitionCooldown = now + 1500;
                expLastActionTime = now + 500;
                return;
            }

            if (expCurrentTargetId) {
                window.logExp(`Zawieszenie w drodze do potwora. Resetuję cel!`, "#f44336");
                expCurrentTargetId = null;
                expAntiLagTime = now + getAntiLagDelay();
            } else {
                expAntiLagTime = now + getAntiLagDelay();
            }
        }

        // --- OCENA AKTUALNEGO CELU ---
        let currentTargetDist = 999;
        if (expCurrentTargetId && npcs[expCurrentTargetId]) {
            let n = npcs[expCurrentTargetId].d || npcs[expCurrentTargetId];
            if (!n.dead) {
                currentTargetDist = Math.max(Math.abs(n.x - hx), Math.abs(n.y - hy));
            } else {
                expCurrentTargetId = null; // Cel nie żyje, porzucamy
            }
        } else {
            expCurrentTargetId = null;
        }

        // --- SZUKANIE NAJLEPSZEGO CELU ---
        let closestDist = 999;
        let closestTx = -1, closestTy = -1;
        let closestName = "";
        let closestId = null;

        for (let id in npcs) {
            let n = npcs[id].d || npcs[id];
            if ((n.type === 2 || n.type === 3) && !n.dead) {
                let lvl = parseInt(n.lvl) || 0;
                if (lvl < botSettings.exp.minLvl || lvl > botSettings.exp.maxLvl) continue;

                let wt = parseInt(n.wt) || 0;
                if (wt === 0 && !botSettings.exp.normal) continue;
                if (wt === 1 && !botSettings.exp.elite) continue;
                if (wt >= 2) continue;

                let dist = Math.max(Math.abs(n.x - hx), Math.abs(n.y - hy));
                if (dist < closestDist) {
                    closestDist = dist;
                    closestTx = n.x;
                    closestTy = n.y;
                    closestId = id;
                    closestName = n.nick ? n.nick.replace(/<[^>]*>?/gm, '') : "Potwór";
                }
            }
        }

        // --- DECYZJA LOGICZNA ---
        if (closestId && closestDist <= 999) {
            // Zmiana celu na bliższy
            if (!expCurrentTargetId || closestDist < currentTargetDist) {
                if (expCurrentTargetId !== closestId) {
                    expCurrentTargetId = closestId;
                    window.logExp(`Namierzono: ${closestName} (${closestDist}m)`, "#00e5ff");
                    Engine.hero.autoGoTo({x: closestTx, y: closestTy});
                    expLastActionTime = now + 800; // Zmniejszenie spamu
                    return;
                }
            }

            // Jesteśmy przy samym mobku (1 kratka)
            if (expCurrentTargetId && currentTargetDist <= 1) {
                let finalTx = npcs[expCurrentTargetId].d ? npcs[expCurrentTargetId].d.x : npcs[expCurrentTargetId].x;
                let finalTy = npcs[expCurrentTargetId].d ? npcs[expCurrentTargetId].d.y : npcs[expCurrentTargetId].y;

                Engine.hero.autoGoTo({x: finalTx, y: finalTy});
                expLastActionTime = now + 1200; // Dajemy grze czas na załadowanie walki
                return;
            }

            return; // Czekamy aż dobiegniemy
        } else {
            // --- SMART-ROAM (ZMIANA MAPY, GDY JEST CZYSTO) ---
            if (now < expMapTransitionCooldown) return;
            expCurrentTargetId = null;

            let maps = botSettings.exp.mapOrder;
            let currMap = Engine.map.d.name;

            if (maps.includes(currMap)) window.mapClearTimes[currMap] = Date.now();

            if (maps.length > 1) {
                let oldestMap = maps[0];
                let oldestTime = window.mapClearTimes[oldestMap] || 0;

                for (let i = 1; i < maps.length; i++) {
                    let t = window.mapClearTimes[maps[i]] || 0;
                    if (t < oldestTime) {
                        oldestMap = maps[i];
                        oldestTime = t;
                    }
                }

                if (oldestMap === currMap) {
                    if (now - expMapTransitionCooldown > 3000) {
                        window.logExp("Wszystkie mapy czyste. Czekam...", "#777");
                        expMapTransitionCooldown = now + 3000;
                    }
                    return;
                }

                let path = getShortestPath(currMap, oldestMap);
                if (path && path.length > 1) {
                    let nextStepMap = path[1];
                    let door = globalGateways[currMap] && globalGateways[currMap][nextStepMap];

                    if (door) {
                        if (window.lastLoggedMap !== nextStepMap) {
                            window.logExp(`[Przejście] ➝ ${nextStepMap}`, "#ba68c8");
                            window.lastLoggedMap = nextStepMap;
                        }
                        
                        // Nie spamujemy, jeżeli postać już tam biegnie (path wbudowane w Margonem)
                        if (!Engine.hero.d.path || Engine.hero.d.path.length === 0) {
                            Engine.hero.autoGoTo({x: door.x, y: door.y});
                        }
                        
                        expAntiLagTime = now + getAntiLagDelay();
                        expMapTransitionCooldown = now + 1000;
                        expLastActionTime = now + 500;
                    } else {
                        expMapTransitionCooldown = now + 5000;
                    }
                } else {
                    window.mapClearTimes[oldestMap] = Date.now();
                    expMapTransitionCooldown = now + 2000;
                }
            } else {
                if (now - expMapTransitionCooldown > 5000) {
                    window.logExp("Wyczyszczono. Czekam na respawn...", "#777");
                    expMapTransitionCooldown = now + 5000;
                }
            }
        }
    }

    setInterval(runExpLogic, 150);

    // --- BAZA DANYCH PROFILI EXPOWISK ---
    window.loadExpProfile = function(index) {
        let p = botSettings.expProfiles[index];
        if(p) {
            botSettings.exp.mapOrder = [...p.maps];
            localStorage.setItem('exp_map_order_v64', JSON.stringify(botSettings.exp.mapOrder));

            // Ustawienie poziomu: Min: -5, Max: +15
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
            saveSettings();
            if(typeof window.renderExpMaps === 'function') window.renderExpMaps();
            heroAlert(`✅ Załadowano i NADPISANO trasę: ${p.name}\nAutomatycznie ustawiono poziom potworów na: ${botSettings.exp.minLvl} - ${botSettings.exp.maxLvl}.`);
        }
    };

    window.appendExpProfile = function(index) {
        let p = botSettings.expProfiles[index];
        if(p) {
            p.maps.forEach(m => {
                if (!botSettings.exp.mapOrder.includes(m)) {
                    botSettings.exp.mapOrder.push(m);
                }
            });
            localStorage.setItem('exp_map_order_v64', JSON.stringify(botSettings.exp.mapOrder));

            // Zmiana zakresu z uwzględnieniem tolerancji 5 w dół
            let lvlMatch = p.name.match(/\((\d+)\s*lvl\)/i);
            if(lvlMatch && lvlMatch[1]) {
                let baseLvl = parseInt(lvlMatch[1]);
                let newMin = Math.max(1, baseLvl - 5);
                let newMax = baseLvl + 15;

                botSettings.exp.minLvl = Math.min(botSettings.exp.minLvl, newMin);
                botSettings.exp.maxLvl = Math.max(botSettings.exp.maxLvl, newMax);

                let minInput = document.getElementById('expMinL');
                let maxInput = document.getElementById('expMaxL');
                if (minInput) minInput.value = botSettings.exp.minLvl;
                if (maxInput) maxInput.value = botSettings.exp.maxLvl;
            }

            saveSettings();
            if(typeof window.renderExpMaps === 'function') window.renderExpMaps();
            heroAlert(`➕ DOŁĄCZONO do obecnej trasy: ${p.name}\nZakres potworów został poszerzony i wynosi teraz: ${botSettings.exp.minLvl} - ${botSettings.exp.maxLvl}.`);
        }
    };

    window.renderExpProfiles = function() {
        let c = document.getElementById('expProfilesList'); if(!c) return;

        if (!botSettings.expProfiles || botSettings.expProfiles.length === 0) {
            if (window.defaultExpProfiles && window.defaultExpProfiles.length > 0) {
                botSettings.expProfiles = [...window.defaultExpProfiles];
                localStorage.setItem('exp_profiles_v64', JSON.stringify(botSettings.expProfiles));
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
                </div>
            `;

            header.onclick = () => {
                let isHidden = content.style.display === "none";

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
            if (editingGatewayFor === mapName) {
                let defaultX = "", defaultY = "";
                let refDoor = globalGateways[currentMap] && globalGateways[currentMap][mapName];
                if (refDoor) { defaultX = refDoor.x; defaultY = refDoor.y; }
                return `<div class="list-item active-route" style="flex-direction:column; align-items:stretch;"><div style="display:flex; flex-direction:column; gap:4px; padding:2px;"><span style="color:#d4af37; font-weight:bold; font-size:11px;">🚪 Bramo-Zapis: ${mapName}</span><div style="display:flex; justify-content:space-between; align-items:center; gap:4px;"><label style="color:#a99a75; font-size:10px; margin:0;">X: <input type="number" id="gw_edit_x" value="${defaultX}" style="width:35px; padding:2px; font-size:10px; text-align:center;"></label><label style="color:#a99a75; font-size:10px; margin:0;">Y: <input type="number" id="gw_edit_y" value="${defaultY}" style="width:35px; padding:2px; font-size:10px; text-align:center;"></label><button class="btn-sepia" style="flex-grow:1;" onclick="document.getElementById('gw_edit_x').value = Engine.hero.d.x; document.getElementById('gw_edit_y').value = Engine.hero.d.y;" title="Pobiera koordynaty z obecnej postaci">📍 Stąd</button></div><div style="display:flex; gap: 4px; margin-top: 4px;"><button class="btn-sepia btn-go-sepia" style="flex-grow:1;" onclick="saveInlineGateway('${mapName}')">ZAPISZ</button><button class="btn-sepia" style="background:#8e0000; width:30px;" onclick="cancelInlineGateway()">✖</button></div></div></div>`;
            } else {
                let isPathPossible = false;
                for(let fromMap in globalGateways) { if(globalGateways[fromMap][mapName]) isPathPossible = true; }
                let gatewayIndicator = isPathPossible ? "<span style='color:#4caf50;' title='Zapisano przejście w bazie'>[🚪✔]</span>" : "<span style='color:#777;' title='Brak powiązań do tej mapy!'>[➕🚪]</span>";

                let activeClass = (currentRouteIndex === index) ? "active-route" : "";
                let checkClass = checkedMapsThisSession.has(mapName) ? "checked" : "";
                let nameColor = (currentRouteIndex === index) ? "#00acc1" : "#d4af37";

                return `<div class="list-item ${activeClass} ${checkClass}"><div class="map-name-wrap"><span class="btn-del-map" onclick="removeMapFromOrder(${index})">✖</span><span class="map-name" style="color:${nameColor}; font-weight:bold;" onclick="setManualRouteIndex(${index}, '${mapName}')">${index + 1}. ${gatewayIndicator} ${mapName}</span></div><div class="buttons-wrapper"><input type="number" class="order-input" value="${index + 1}" onchange="changeMapOrder(${index}, this.value)" title="Zmień pozycję na liście (1-10)"><button class="icon-btn" onclick="openInlineEditor('${mapName}')" title="Edytuj kordy przejścia">🚪</button></div></div>`;
            }
        }).join('');
    };

    window.renderExpMaps = () => {
        let c = document.getElementById('expMapList'); if (!c) return;
        let currentMap = lastMapName;
        c.innerHTML = botSettings.exp.mapOrder.map((mapName, index) => {
            if (editingGatewayFor === mapName) {
                let defaultX = "", defaultY = ""; let refDoor = globalGateways[currentMap] && globalGateways[currentMap][mapName];
                if (refDoor) { defaultX = refDoor.x; defaultY = refDoor.y; }
                return `<div class="list-item active-route" style="flex-direction:column; align-items:stretch;"><div style="display:flex; flex-direction:column; gap:4px; padding:2px;"><span style="color:#d4af37; font-weight:bold; font-size:11px;">🚪 Bramo-Zapis: ${mapName}</span><div style="display:flex; justify-content:space-between; align-items:center; gap:4px;"><label style="color:#a99a75; font-size:10px; margin:0;">X: <input type="number" id="gw_edit_x" value="${defaultX}" style="width:35px; padding:2px; font-size:10px; text-align:center;"></label><label style="color:#a99a75; font-size:10px; margin:0;">Y: <input type="number" id="gw_edit_y" value="${defaultY}" style="width:35px; padding:2px; font-size:10px; text-align:center;"></label><button class="btn-sepia" style="flex-grow:1;" onclick="document.getElementById('gw_edit_x').value = Engine.hero.d.x; document.getElementById('gw_edit_y').value = Engine.hero.d.y;" title="Pobiera koordynaty z obecnej postaci">📍 Stąd</button></div><div style="display:flex; gap: 4px; margin-top: 4px;"><button class="btn-sepia btn-go-sepia" style="flex-grow:1;" onclick="saveInlineGateway('${mapName}')">ZAPISZ</button><button class="btn-sepia" style="background:#8e0000; width:30px;" onclick="cancelInlineGateway()">✖</button></div></div></div>`;
            } else {
                let isPathPossible = false;
                for(let fromMap in globalGateways) { if(globalGateways[fromMap][mapName]) isPathPossible = true; }
                let gatewayIndicator = isPathPossible ? "<span style='color:#4caf50;' title='Zapisano w bazie'>[🚪✔]</span>" : "<span style='color:#777;' title='Brakuje w bazie!'>[➕🚪]</span>";
                return `<div class="list-item"><div class="map-name-wrap"><span class="btn-del-map" onclick="removeExpMap(${index})">✖</span><span class="map-name" style="color:#81c784; font-weight:bold;">${index + 1}. ${gatewayIndicator} ${mapName}</span></div><div class="buttons-wrapper"><button class="icon-btn" onclick="openInlineEditor('${mapName}')">🚪</button></div></div>`;
            }
        }).join('');
    };

    window.renderTeleportOptions = function() {
        let container = document.getElementById('tpCheckboxes');
        if (!container) return; // Zabezpieczenie przed błędem
        container.innerHTML = '';
        for (let city in botSettings.unlockedTeleports) {
            let checked = botSettings.unlockedTeleports[city] ? 'checked' : '';
            container.innerHTML += `
                <label style="color:#d4af37; font-size:11px; cursor:pointer; background:#1a1a1a; padding:5px; border:1px solid #333; display:flex; align-items:center; gap:6px;">
                    <input type="checkbox" onchange="botSettings.unlockedTeleports['${city}'] = this.checked; localStorage.setItem('hero_teleports_v64', JSON.stringify(botSettings.unlockedTeleports));" ${checked}>
                    ${city}
                </label>
            `;
        }
    };

})(); // Koniec kodu
