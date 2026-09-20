/**
 * Racuna sve brojke o stazi iz staza.json, da se nijedna ne kuca rucno u tekst.
 * Cim se mapa dopuni (ili stigne GPX trag), brojke na sajtu se same isprave.
 *
 * U sablonima: {{ staza.duzinaKm }}, {{ staza.visinskaRazlika }}, {{ staza.pocetak }}...
 */

// Sirovi podaci namerno NE stoje u src/_data/. Eleventy bi tada napravio i
// kljuc "staza" iz staza.json i kljuc "staza" iz staza.js, pa bi ih spojio -
// nizovi tacaka bi se nadovezali jedan na drugi i udvostrucili.
const podaci = require("../../podaci/staza.json");

// Kad stigne snimljen GPX trag, on je merodavan - prati okuke, pa je duzina
// tacna. Dok ga nema, racuna se kroz tacke sa mape, sto secka krivine i daje
// manju duzinu od stvarne. Zato `procena` ostaje true i sajt to otvoreno kaze.
const trag = podaci.trag && podaci.trag.length ? podaci.trag : null;
const linija = trag
    ? trag.map(([lat, lon, visina]) => ({ lat, lon, visina }))
    : podaci.tacke;

/** Rastojanje izmedju dve tacke po povrsini Zemlje, u metrima. */
function rastojanje(a, b) {
    const R = 6371000;
    const f1 = (a.lat * Math.PI) / 180;
    const f2 = (b.lat * Math.PI) / 180;
    const df = f2 - f1;
    const dl = ((b.lon - a.lon) * Math.PI) / 180;
    const h =
        Math.sin(df / 2) ** 2 +
        Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

// Kumulativno rastojanje do svake tacke - treba i za duzinu i za profil.
const kumulativno = [0];
for (let i = 1; i < linija.length; i++) {
    kumulativno.push(kumulativno[i - 1] + rastojanje(linija[i - 1], linija[i]));
}
const duzinaM = kumulativno[kumulativno.length - 1];

const visine = linija.map((t) => t.visina);
const visinaMin = Math.min(...visine);
const visinaMax = Math.max(...visine);

// Ukupan uspon: zbir svih uzbrdica u smeru hoda. Kod staze koja stalno raste
// jednak je visinskoj razlici, ali ovako ostaje tacan i ako se pojave talasi.
let uspon = 0;
let spust = 0;
for (let i = 1; i < visine.length; i++) {
    const d = visine[i] - visine[i - 1];
    if (d > 0) uspon += d;
    else spust -= d;
}

// Naismith-ovo pravilo, verzija za setnju: 4 km/h po ravnom, plus jedan sat
// na svakih 600 m uspona. Gruba procena, zato se na stranici pise sa "око".
function uMinutima(metara, usponM, brzinaKmh) {
    return Math.round((metara / 1000 / brzinaKmh + usponM / 600) * 60);
}

// Nizbrdo se ne ide brze nego uzbrdo kad je strmo. Po Langmuir-ovoj dopuni
// Naismith-a, na nagibu preko 12% silazak se usporava - dodaje se 10 minuta
// na svakih 300 m visine koja se spusta. Ova staza je na oko 15%.
function nizbrdoMinuta(metara, spustM, nagib) {
    const osnovno = (metara / 1000 / 4.5) * 60;
    const strmo = nagib > 12 ? (spustM / 300) * 10 : 0;
    return Math.round(osnovno + strmo);
}
function satnica(min) {
    const zaokruzeno = Math.round(min / 5) * 5;
    const h = Math.floor(zaokruzeno / 60);
    const m = zaokruzeno % 60;
    if (!h) return `${m} мин`;
    return m ? `${h} ч ${m} мин` : `${h} ч`;
}

// Prosecan nagib u procentima: 15 znaci 15 m uspona na svakih 100 m puta.
const nagibProcenat = Math.round((uspon / duzinaM) * 100);

const pocetak = linija[0];
const kraj = linija[linija.length - 1];

/** Najmanja i najveca vrednost jednog polja (lat ili lon) u nizu tacaka. */
function opseg(niz, polje) {
    const v = niz.map((t) => t[polje]);
    return { min: Math.min(...v), max: Math.max(...v) };
}
const opsegLat = opseg(linija, "lat");
const opsegLon = opseg(linija, "lon");

// ---- Profil visine ------------------------------------------------------
// SVG nosi samo geometriju, u koordinatnom sistemu 0-100 po obe ose, i razvlaci
// se preko cele sirine (preserveAspectRatio="none"). Natpisi nisu u SVG-u nego
// u HTML-u pored njega - da se ne smanjuju zajedno sa slikom i ostanu citljivi
// i na telefonu. Crta se pri izgradnji sajta, pa se vidi i bez JavaScript-a.

// Opseg ose zaokruzen na 50 m, da podeoci budu okrugli brojevi.
const osaMin = Math.floor(visinaMin / 50) * 50;
const osaMax = Math.ceil(visinaMax / 50) * 50;

/** Visina u metrima -> razmak od vrha grafika, u procentima. */
function odVrha(metara) {
    return +((1 - (metara - osaMin) / (osaMax - osaMin)) * 100).toFixed(2);
}

const tackeProfila = linija.map((t, i) => ({
    x: +((kumulativno[i] / duzinaM) * 100).toFixed(2),
    y: odVrha(t.visina)
}));

const poli = tackeProfila.map((p) => `${p.x},${p.y}`).join(" ");

const podeoci = [];
for (let v = osaMin; v <= osaMax; v += 100) {
    podeoci.push({ v, odVrha: odVrha(v) });
}

module.exports = {
    // --- osnovno ---
    tacke: podaci.tacke,
    izdvojene: podaci.izdvojene,
    izvor: podaci.izvor,

    // Dok je true, sve duzine su merene po tackama sa mape i manje su od
    // stvarnih. Sablon uz njih ispisuje napomenu.
    procena: !trag,

    brojTacaka: podaci.tacke.length,

    // --- duzina i visina ---
    duzinaM: Math.round(duzinaM),
    duzinaKm: (duzinaM / 1000).toFixed(1).replace(".", ","),
    duzinaPovratnoKm: ((2 * duzinaM) / 1000).toFixed(1).replace(".", ","),
    visinaMin,
    visinaMax,
    visinskaRazlika: visinaMax - visinaMin,
    // Modeli terena imaju gresku od desetak metara, pa se u tekstu koristi
    // zaokruzena vrednost - da brojka ne deluje tacnije nego sto jeste.
    visinskaRazlikaOkruglo: Math.round((visinaMax - visinaMin) / 10) * 10,
    uspon: Math.round(uspon),
    spust: Math.round(spust),
    nagibProcenat,

    // --- vreme hoda ---
    vremeUzbrdo: satnica(uMinutima(duzinaM, uspon, 4)),
    vremeNizbrdo: satnica(nizbrdoMinuta(duzinaM, uspon, nagibProcenat)),

    // --- tacke za mapu ---
    pocetak,
    kraj,
    centar: {
        lat: +((opsegLat.min + opsegLat.max) / 2).toFixed(6),
        lon: +((opsegLon.min + opsegLon.max) / 2).toFixed(6)
    },
    // Jugozapadni i severoistocni ugao - Leaflet ovim namesta zum tako da
    // cela staza stane u vidno polje, bez rucno pogadjanog nivoa zuma.
    okvir: [
        [opsegLat.min, opsegLon.min],
        [opsegLat.max, opsegLon.max]
    ],

    // --- profil ---
    profil: {
        linija: poli,
        // Ista putanja zatvorena do dna grafika, da se moze popuniti bojom.
        povrsina: `M 0,100 L ${poli.replace(/ /g, " L ")} L 100,100 Z`,
        podeoci
    }
};
