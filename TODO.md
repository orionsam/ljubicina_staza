# Šta ostaje da se uradi

## Pre objave

- [ ] **Proveriti naziv puta i mesto putokaza** na stranici „О стази", sekcija
      „Како до стазе?" ([src/o-stazi.njk](src/o-stazi.njk), potraži komentar
      `ПРОВЕРИТИ ПРЕ ОБЈАВЕ`).
      Sada piše: *„Долази се магистралним путем Горњи Милановац—Чачак; путоказ
      на магистрали усмерава право на почетак стазе."*
      Položaj sela i nadmorske visine su izmereni i tačni; naziv puta je uzet iz
      OpenStreetMap-a (`ref 22`) i nije potvrđen na terenu. Ne zna se ni gde je
      tačno putokaz — to treba da napiše neko ko je tuda prolazio.

## Kad stigne GPX

- [ ] **Ponovo izmeriti stazu.** Dok nema snimljenog traga, dužine na sajtu su
      računate kroz tačke sa mape i manje su od stvarnih (staza seče okuke).
      Kad GPX stigne, upisati ga u `podaci/staza.json` kao polje `trag`, niz
      `[lat, lon, visina]`. Sve brojke na stranici se posle toga same isprave, a
      napomena o približnosti i isprekidana linija na mapi nestaju same.

## Kad se pinovi obeleže u My Maps

- [ ] **Pokrenuti `node alati/izvuci-stazu.js`** i popuniti polje `tip` po
      tačkama (tabla / poruka / kućica za ptice / hotel za insekte). Mapa tada
      može da dobije ikonice po tipu i linkove sa tabli ka Flori i Fauni.

## Slike iz Ljubičinog albuma koje nisu ušle u galeriju

- [ ] **Proći ostatak `src/images/org/` i reći šta od toga ide na sajt.**
      Od 82 slike u albumu, 45 je 20. 9. 2026. prebačeno u
      [src/images/galerija/](src/images/galerija/) (spisak i opisi su u
      [src/_data/galerija.json](src/_data/galerija.json)), tri su na stranici
      o Ljubici, a dvanaest je već ranije bilo na sajtu. Ostaje ovo, po grupama:

      *Preuzete grafike i digitalne slike* — nisu njene fotografije nego slike
      sačuvane sa interneta, sa citatima na engleskom („Let it be", „good things
      take time", „never force a connection", „ending is the new beginning",
      „what is yours will find you", „not everyone deserves your energy"), pa
      impasto slika cveća, lavandino polje, planine iznad oblaka, mesec nad
      livadom, papirne planine i dvostruka ekspozicija lica. Na javnom sajtu
      otvaraju pitanje autorstva. Ako ipak treba da uđu, ne bi trebalo da stoje
      među njenim fotografijama — pre kao zasebna celina, uz napomenu da su to
      slike koje je čuvala:
      `12.26.17 (1)`, `12.26.17 (2)`, `12.26.19`, `14.21.33 (2)`,
      `14.21.34 (1)`, `14.21.34 (5)`, `14.21.35 (1)`, `14.21.35`,
      `14.21.36 (1)`, `14.21.36 (2)`, `14.21.36`, `14.21.37 (1)`,
      `14.21.53 (2)`.

      *Skrinšot* Instagram priče Mudrijade, sa vidljivim delovima aplikacije:
      `14.21.37`. Ako je taj trenutak važan, bolje je naći originalnu
      fotografiju nego snimak ekrana.

      *Privatni kadrovi sa plaže* — nisam ih stavljao sam: `12.26.18 (1)`
      (u kupaćem, u moru) i `12.26.18` (presvlačenje iza marame, leđima).

      *Duplikati* — isti fajl postoji još jednom ili dvaput u albumu, tu nema
      šta da se bira: `14.21.33 (3)`, `14.21.33`, `14.21.34 (6)`,
      `14.21.34 (7)`, `14.21.34 (8)`, `14.21.34`.

      Sva imena su skraćena — u folderu stoje kao
      `WhatsApp Image 2026-01-11 at <ime>.jpeg`.

- [ ] **Odlučiti šta sa samim folderom `src/images/org/`.** Sada se ceo kopira
      u `_site/` i svih 82 slike su javno dostupne na adresi sajta, pod svojim
      imenima — i one privatne. Treba ga ili izmestiti izvan `src/`, ili mu
      dodati izuzetak u [.eleventy.js](.eleventy.js).
