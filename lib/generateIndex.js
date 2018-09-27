const xml = require('./xml.js');

module.exports = (pageCount, file, protocol, options, request, h) => {
  const pages = [];
  for (let i = 1; i <= pageCount; i++) {
    pages.push({
      url: `${protocol}://${request.info.host}/sitemap-${file}-${i}.${request.params.type}`
    });
  }

  return xml(pages, h, options, 'sitemapindex', 'sitemap');
};
