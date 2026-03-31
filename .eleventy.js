module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/_redirects");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  // Part of two-way association for Universal Links
  eleventyConfig.addPassthroughCopy('src/.well-known');
  // Favicons, manifests, and browser config — glob covers all current and future root-level assets
  eleventyConfig.addPassthroughCopy('src/*.{ico,png,svg,webmanifest,xml}');
  eleventyConfig.addPassthroughCopy('src/robots.txt');

  eleventyConfig.addWatchTarget("src/css");
  eleventyConfig.addWatchTarget("src/js");
  return {
    dir: {
      input: 'src',
      includes: '_includes',
      output: '_site',
    },
    templateFormats: ['md', 'njk', 'html'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
  };
}