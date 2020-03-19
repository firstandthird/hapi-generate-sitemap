module.exports = (pages, h, pluginOptions, parentElem = 'urlset', childElem = 'url') => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <${parentElem} xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${pages.map((page) => {
    const loc = `<loc>${page.url}</loc>`;
    const lastmod = page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : '';
    const changefreq = page.changefreq ? `<changefreq>${page.changefreq}</changefreq>` : '';
    const priority = page.priority ? `<priority>${page.priority}</priority>` : '';
    let video = '';
    /* eslint-disable camelcase */
    if (page.video) {
      const title = `<video:title>${page.video.title}</video:title>`
      const description = `<video:description>${page.video.description}</video:description>`
      const thumbnail_loc = `<video:thumbnail_loc>${page.video.thumbnail_loc}</video:thumbnail_loc>`
      const content_loc = `<video:content_loc>${page.video.content_loc}</video:content_loc>`
      video = `<video:video>${title}${description}${thumbnail_loc}${content_loc}</video:video>`;
    }
    return `<${childElem}>${loc}${lastmod}${changefreq}${priority}${video}</${childElem}>`;
  }).join('')}
    </${parentElem}>`;
  return h.response(xml).type('text/xml');
};
