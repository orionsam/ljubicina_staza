/**
 * Mapa staze (Leaflet + OpenTopoMap).
 *
 * Podaci ne stoje ovde nego u <script type="application/json" id="staza-podaci">
 * koji Eleventy ispise iz src/_data/staza.js. Tako ovaj fajl ostaje isti kad se
 * mapa dopuni, a podaci se ne dupliraju izmedju sablona i skripte.
 */
(function () {
    "use strict";

    var okvir = document.getElementById("mapa");
    var podaciEl = document.getElementById("staza-podaci");
    if (!okvir || !podaciEl || typeof L === "undefined") return;

    var podaci = JSON.parse(podaciEl.textContent);

    // Boje se citaju iz CSS-a, da mapa prati temu sajta i da se menjaju na
    // jednom mestu. Ako promenljiva nedostaje, ostaje razumna rezerva.
    function boja(ime, rezerva) {
        var v = getComputedStyle(document.documentElement).getPropertyValue(ime);
        return v.trim() || rezerva;
    }

    var nacrtana = false;

    function nacrtaj() {
        if (nacrtana) return;
        nacrtana = true;

        // Sklanjamo poruku "Mapa se ucitava..." - Leaflet svoje slojeve dodaje
        // u isti element, pa bi inace ostala ispod mape.
        okvir.innerHTML = "";

        var mapa = L.map(okvir, {
            // Bez ovoga tocak misa zumira mapu umesto da skroluje stranicu,
            // pa se posetilac "zaglavi" u mapi dok cita. Ukljucuje se tek kad
            // korisnik klikne na mapu.
            scrollWheelZoom: false,
            // Na telefonu isto: prst prvo skroluje stranicu, a mapa se pomera
            // sa dva prsta - zato dole stoji i objasnjenje na dodir.
            tap: true
        });

        L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
            maxZoom: 17,
            // Uslov koriscenja OpenTopoMap-a - ne uklanjati.
            attribution:
                'Подлога: © <a href="https://opentopomap.org">OpenTopoMap</a> ' +
                '(CC-BY-SA), подаци © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(mapa);

        mapa.on("click", function () {
            mapa.scrollWheelZoom.enable();
        });

        var putanja = podaci.tacke.map(function (t) {
            return [t.lat, t.lon];
        });

        // Dve linije jedna preko druge: svetla podloga ispod tanje tamne, da se
        // staza vidi i preko tamnih delova topografske podloge.
        L.polyline(putanja, {
            color: "#ffffff",
            weight: 7,
            opacity: 0.8,
            lineJoin: "round"
        }).addTo(mapa);

        L.polyline(putanja, {
            color: boja("--staza-linija", "#b4472e"),
            weight: 3.5,
            opacity: 1,
            lineJoin: "round",
            // Isprekidana dok je trasa samo procena kroz tacke; puna kad stigne
            // snimljen GPX trag. Vizuelno govori isto sto i napomena u tekstu.
            dashArray: podaci.procena ? "8 6" : null
        }).addTo(mapa);

        // Tacke duz staze. Kad se pinovi obeleze u My Maps, ovde se moze
        // granati po t.tip (табла / порука / кућица / хотел).
        podaci.tacke.forEach(function (t, i) {
            if (i === 0 || i === podaci.tacke.length - 1) return;
            L.circleMarker([t.lat, t.lon], {
                radius: 4,
                weight: 2,
                color: "#ffffff",
                fillColor: boja("--staza-tacka", "#2d4130"),
                fillOpacity: 1
            })
                .addTo(mapa)
                .bindPopup(
                    (t.opis ? t.opis + "<br>" : "") +
                        "Надморска висина: " + t.visina + " м"
                );
        });

        function oznaka(t, klasa, naslov) {
            return L.marker([t.lat, t.lon], {
                title: naslov,
                icon: L.divIcon({
                    className: "mapa-oznaka " + klasa,
                    html: '<span class="mapa-oznaka-tacka"></span>' +
                          '<span class="mapa-oznaka-tekst">' + naslov + "</span>",
                    iconSize: null
                })
            }).addTo(mapa);
        }

        oznaka(podaci.pocetak, "je-pocetak", "Почетак стазе")
            .bindPopup(
                "<strong>Почетак стазе</strong><br>Луњевица, " +
                podaci.pocetak.visina + " м<br>" +
                '<a href="https://www.google.com/maps/dir/?api=1&destination=' +
                podaci.pocetak.lat + "," + podaci.pocetak.lon +
                '" target="_blank" rel="noopener">Навигација довде</a>'
            );

        oznaka(podaci.kraj, "je-vrh", "Вујан")
            .bindPopup("<strong>Вујан</strong><br>" + podaci.kraj.visina + " м");

        mapa.fitBounds(podaci.okvir, { padding: [28, 28] });
    }

    // Mapa se ucitava tek kad posetilac dodje do nje. Pod Vujnom je signal slab,
    // a plocice podloge su najtezi deo stranice - nema razloga da se povlace
    // nekome ko je dosao samo da procita tekst.
    if ("IntersectionObserver" in window) {
        var posmatrac = new IntersectionObserver(
            function (ulazi) {
                if (ulazi.some(function (u) { return u.isIntersecting; })) {
                    posmatrac.disconnect();
                    nacrtaj();
                }
            },
            { rootMargin: "200px" }
        );
        posmatrac.observe(okvir);
    } else {
        nacrtaj();
    }
})();
