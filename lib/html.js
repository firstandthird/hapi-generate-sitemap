const groupBy = require('lodash.groupby');
const sortBy = require('lodash.sortby');

module.exports = (pages, h, pluginOptions) => {
  pages = sortBy(pages, ['section', 'path']);
  // if we're using a view just render and return that:;
  if (pluginOptions.htmlView !== '') {
    return h.view(pluginOptions.htmlView, { sitemap: pages });
  }
  // group the list by sections:
  const sections = groupBy(pages, (page) => page.section);
  // first list all the routes that have no section:
  let html = `
    <ul>
      ${sections.none.map((page) => `<li><a href="${page.url}">${page.title || page.url}</a></li>`).join('')}
    </ul>`;
  Object.keys(sections).sort().forEach(sectionName => {
    if (sectionName === 'none') {
      return;
    }
    html = `${html} <h2>${sectionName}</h2><ul>`;
    sections[sectionName].forEach(page => {
      html = `${html}<li><a href="${page.url}">${page.title || page.url}</a></li>`;
    });
    html = `${html}</ul>`;
  });
  return html;
};
