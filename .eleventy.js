module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/airwaves")
  eleventyConfig.addPassthroughCopy('src/favicon.ico');
  eleventyConfig.addPassthroughCopy('src/apple-touch-icon.png');
  eleventyConfig.addPassthroughCopy('src/favicon-16x16.png');
  eleventyConfig.addPassthroughCopy('src/favicon-32x32.png');
  eleventyConfig.addPassthroughCopy('src/site.webmanifest');
  eleventyConfig.addPassthroughCopy('src/safari-pinned-tab.svg');
  eleventyConfig.addPassthroughCopy('src/android-chrome-192x192.png');
  eleventyConfig.addPassthroughCopy('src/android-chrome-512x512.png');

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