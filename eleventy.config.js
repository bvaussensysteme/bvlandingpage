module.exports = function (eleventyConfig) {
  return {
    dir: {
      input: "src",
      output: ".",
      includes: "_includes"
    },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
