const { eleventyImageTransformPlugin } = require("@11ty/eleventy-img");
const fs = require("fs");

module.exports = function (eleventyConfig) {
    // Ubacuje SVG pravo u HTML: {% svg "znak" %}
    // Mora inline (a ne <img src>), jer se boje znaka zadaju CSS promenljivama
    // (--znak-ime, --znak-staza, --znak-srce), a slika ucitana preko <img>
    // ne moze da nasledi CSS sa stranice.
    eleventyConfig.addShortcode("svg", function (ime) {
        return fs.readFileSync("./src/images/" + ime + ".svg", "utf8");
    });
    // Sve <img> oznake u izlaznom HTML-u se automatski pretvaraju u responsive
    // slike (webp + originalni format, vise sirina, lazy). Zato se ni na jednoj
    // stranici ne pise srcset rucno - dovoljno je obicno <img src="/images/...">.
    eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        extensions: "html",
        formats: ["webp", "auto"],
        widths: [200, 400, 800, 1200],
        // Nesto nizi kvalitet: na fotografijama se ne vidi, a stranica se
        // na slabom signalu pod Vujnom otvara osetno brze.
        sharpWebpOptions: { quality: 68 },
        sharpJpegOptions: { quality: 76, progressive: true },
        outputDir: "./_site/img/",
        urlPath: "/img/",
        defaultAttributes: {
            loading: "lazy",
            decoding: "async",
            sizes: "(max-width: 800px) 100vw, 800px"
        },
        failOnError: false
    });

    // Znak se ugradjuje inline, pa ga eleventy sam ne prati - bez ovoga se
    // izmena znaka ne bi videla dok se server ne restartuje.
    eleventyConfig.addWatchTarget("./src/images/znak.svg");

    // Kopiraj CSS i slike direktno u output
    eleventyConfig.addPassthroughCopy("style.css");
    eleventyConfig.addPassthroughCopy("src/images");

    // Izdvajanje vrsta iz src/_data/vrste.json po polju.
    // Nunjucks-ov selectattr ume samo da proveri da li polje postoji (ignorise
    // treci argument), pa filtriranje po vrednosti mora ovako:
    //   vrste.gljive | gde("grupa", "otrovne")   -> samo otrovne
    //   vrste.ptice  | gde("slika")              -> samo one koje imaju sliku
    eleventyConfig.addFilter("gde", function (lista, polje, vrednost) {
        return (lista || []).filter(function (x) {
            return vrednost === undefined ? Boolean(x[polje]) : x[polje] === vrednost;
        });
    });

    // Aktivna stavka u navigaciji: /flora/ je aktivno i na /flora/ i na /tabla/*
    // koje pripada flori (kasnije, kad table stignu).
    eleventyConfig.addFilter("aktivno", function (link, url) {
        if (link === "/") return url === "/" ? "active" : "";
        return url && url.startsWith(link) ? "active" : "";
    });

    return {
        markdownTemplateEngine: "njk",
        htmlTemplateEngine: "njk",
        dir: {
            input: "src",
            output: "_site"
        }
    };
};
