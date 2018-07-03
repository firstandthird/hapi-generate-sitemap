module.exports = (pages, h, pluginOptions) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${pages.map((page) => {
    const loc = `<loc>${page.url}</loc>`;
    const lastmod = page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : '';
    const changefreq = page.changefreq ? `<changefreq>${page.changefreq}</changefreq>` : '';
    const priority = page.priority ? `<priority>${page.priority}</priority>` : '';
    return `<url>${loc}${lastmod}${changefreq}${priority}</url>`;
  }).join('')}
    </urlset>`;
  return h.response(xml).type('text/xml');
};
