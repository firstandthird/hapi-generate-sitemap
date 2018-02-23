module.exports = (protocol, host, pages, h) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${pages.map((url) => `<url><loc>${protocol}://${host}${url.path}</loc></url>`).join('')}
    </urlset>`;
  return h.response(xml).type('text/xml');
};
