module.exports = {
    naslov: "Љубицина стаза",
    opis: "Едукативна стаза на планини Вујан — флора, фауна, историја и природа Вујна, уз табле постављене дуж стазе.",

    // Adresu sajta Netlify sam prosledi pri izgradnji, pa je ne treba upisivati
    // rucno - ni sada dok stoji na netlify.app adresi, ni kasnije kad se doda
    // pravi domen. Lokalno ostaje prazno, sto je u redu.
    url: process.env.URL || "",

    // Slika koja se vidi kad se link podeli u poruci
    slika: "/images/vujan1.jpeg",

    // PRE OBJAVE PREBACITI NA true.
    // Dok je false, sajt trazi od pretrazivaca da ga ne indeksiraju - deli se
    // samo sa prijateljima, a ne zelimo da se pojavi u Guglu pre nego sto staza
    // bude postavljena i tekstovi dovrseni.
    vidljivoZaPretragu: false
};
