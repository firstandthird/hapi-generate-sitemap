module.exports = (pages, h, pluginOptions, parentElem = 'urlset', childElem = 'url') => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <${parentElem} xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${pages.map((page) => {
    const loc = `<loc>${page.url}</loc>`;
    const lastmod = page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : '';
    const changefreq = page.changefreq ? `<changefreq>${page.changefreq}</changefreq>` : '';
    const priority = page.priority ? `<priority>${page.priority}</priority>` : '';
    return `<${childElem}>${loc}${lastmod}${changefreq}${priority}</${childElem}>`;
  }).join('')}
    </${parentElem}>`;
  return h.response(xml).type('text/xml');
};
