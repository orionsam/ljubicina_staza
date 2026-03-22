const fs = require("fs");

module.exports = function(eleventyConfig) {
    // Shortcode koji čita SVG fajl i ubacuje ga direktno u HTML
    eleventyConfig.addShortcode("svgBackground", function() {
        return fs.readFileSync("./src/images/godovi.svg", "utf8");
    });
    // Kopiraj CSS i slike direktno u output
    eleventyConfig.addPassthroughCopy("style.css");
    eleventyConfig.addPassthroughCopy("src/images");

    return {
        dir: {
            input: "src",
            output: "_site"
        }
    };
};