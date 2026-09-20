/**
 * Izvlaci podatke o stazi iz Google My Maps i upisuje ih u podaci/staza.json.
 *
 * Pokretanje:  node alati/izvuci-stazu.js
 *
 * Zasto skripta, a ne ucitavanje mape pri svakoj izgradnji sajta:
 * My Maps i servis za nadmorsku visinu su tudji serveri. Da sajt zavisi od njih
 * pri svakom build-u na Netlify-u, izgradnja bi pucala svaki put kad neki od njih
 * zastane. Ovako se podaci povuku jednom, upisu u podaci/staza.json i taj fajl
 * ide u git. Brojke iz njega racuna src/_data/staza.js.
 * Skripta se pokrece rucno - kad se nesto promeni na mapi.
 */

const fs = require("fs");
const path = require("path");

// Mapa "Ljubicina staza". forcekml=1 vraca ceo XML umesto zapakovanog KMZ-a.
const MID = "1SjdGc5pSjFRucT4UYKc_4thATNXvY2g";
const KML_URL = `https://www.google.com/maps/d/kml?mid=${MID}&forcekml=1`;

// Sloj u mapi iz kog se citaju tacke. Drugi sloj ("Путања од Синђелићева...")
// je Google-ova automatski iscrtana drumska ruta od 19 km i nema veze sa stazom.
const SLOJ = "Ljubicina staza";

// Tacke su u My Maps numerisane u opisu. Brojevi 4-39 idu redom duz staze, od
// vrha Vujna nadole ka Lunjevici - to se vidi po tome sto nadmorska visina duz
// tog niza opada bez i jednog skoka. Tacka 2 (i njen duplikat 3) stoji izdvojeno
// kod dna i ne pripada nizu, pa se cuva posebno dok se ne utvrdi sta je.
const PRVA_NA_STAZI = 4;

// Dva nezavisna modela terena. Uzimaju se oba da bi se videlo koliko se slazu;
// za prikaz na sajtu koristi se srtm30m, jer pokriva ceo svet i stabilniji je.
const VISINE = ["srtm30m", "eudem25m"];

// [^] u regexu znaci "bilo koji znak, ukljucujuci novi red".
function tekst(xml, tag) {
    const m = xml.match(new RegExp(`<${tag}>([^]*?)</${tag}>`));
    return m ? m[1].trim() : "";
}

/** Vraca sve <Placemark> blokove iz onog <Folder>-a koji se zove SLOJ. */
function placemarkoviSloja(kml) {
    const folderi = kml.split("<Folder>").slice(1);
    const nas = folderi.find((f) => tekst(f, "name") === SLOJ);
    if (!nas) throw new Error(`U mapi nema sloja "${SLOJ}".`);
    return nas.split("<Placemark>").slice(1);
}

async function main() {
    process.stdout.write("Preuzimam mapu... ");
    const kml = await (await fetch(KML_URL)).text();
    console.log("ok");

    const sve = [];
    for (const pm of placemarkoviSloja(kml)) {
        const koord = tekst(pm, "coordinates");
        // Tacke imaju jednu koordinatu; linije ih imaju stotine - njih preskacemo.
        if (!koord || koord.split(/\s+/).length !== 1) continue;
        const [lon, lat] = koord.split(",").map(Number);
        sve.push({
            br: Number(tekst(pm, "description")),
            naziv: tekst(pm, "name"),
            lat,
            lon
        });
    }
    if (!sve.length) throw new Error("U sloju nema nijedne tacke.");

    // Ista tacka ubodena dvaput u My Maps - zadrzavamo prvu.
    const videno = new Set();
    const tacke = sve.filter((t) => {
        const kljuc = `${t.lat},${t.lon}`;
        if (videno.has(kljuc)) return false;
        videno.add(kljuc);
        return true;
    });

    process.stdout.write(`Trazim nadmorsku visinu za ${tacke.length} tacaka... `);
    const lokacije = tacke.map((t) => `${t.lat},${t.lon}`).join("|");
    for (const model of VISINE) {
        const r = await fetch(`https://api.opentopodata.org/v1/${model}?locations=${lokacije}`);
        const d = await r.json();
        if (d.status !== "OK") throw new Error(`${model}: ${d.error || d.status}`);
        d.results.forEach((res, i) => (tacke[i][model] = res.elevation));
        await new Promise((r) => setTimeout(r, 1200)); // servis dozvoljava 1 poziv/s
    }
    console.log("ok");

    const ocisti = (t, opis) => ({
        br: t.br,
        lat: Number(t.lat.toFixed(6)),
        lon: Number(t.lon.toFixed(6)),
        visina: Math.round(t.srtm30m),
        // tip i opis se popunjavaju kad se pinovi obeleze u My Maps
        // (tabla / poruka / kucica za ptice / hotel za insekte).
        tip: null,
        opis: opis || null
    });

    // Hodamo uzbrdo: iz sela ka vrhu, dakle od najveceg broja ka najmanjem.
    const naStazi = tacke
        .filter((t) => t.br >= PRVA_NA_STAZI)
        .sort((a, b) => b.br - a.br)
        .map((t) => ocisti(t));

    const izdvojene = tacke
        .filter((t) => t.br < PRVA_NA_STAZI)
        .map((t) => ocisti(t, "Ne pripada nizu tacaka duz staze - proveriti sta je."));

    const neslaganje = Math.round(
        Math.max(...tacke.map((t) => Math.abs(t.srtm30m - t.eudem25m)))
    );

    const izlaz = {
        _napomena: "Generisano sa: node alati/izvuci-stazu.js - ne menjati rucno.",
        izvor: {
            mid: MID,
            povuceno: new Date().toISOString().slice(0, 10),
            visine: VISINE[0],
            najvece_neslaganje_modela_m: neslaganje
        },
        // Dok ne postoji snimljen GPX trag, linija na mapi se crta kroz tacke,
        // pa secka okuke - zato je i duzina samo priblizna. Kad GPX stigne,
        // upisuje se ovde kao niz [lat, lon, visina] i sve brojke se isprave same.
        trag: null,
        tacke: naStazi,
        izdvojene
    };

    const cilj = path.join(__dirname, "..", "podaci", "staza.json");
    fs.mkdirSync(path.dirname(cilj), { recursive: true });
    fs.writeFileSync(cilj, JSON.stringify(izlaz, null, 2) + "\n", "utf8");
    console.log(`Upisano: ${naStazi.length} tacaka na stazi, ${izdvojene.length} izdvojenih.`);
    console.log(`Modeli terena se razilaze najvise ${neslaganje} m.`);
}

main().catch((e) => {
    console.error("Greska:", e.message);
    process.exit(1);
});
