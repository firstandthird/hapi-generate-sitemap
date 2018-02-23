const groupBy = require('lodash.groupby');

module.exports = (protocol, host, pages, h) => {
  // group the list by sections:
  const sections = groupBy(pages, (page) => page.section);
  // first list all the routes that have no section:
  let html = `
    <ul>
      ${sections.none.map((page) => `<li><a href="${protocol}://${host}${page.path}">${protocol}://${host}${page.path}</a></li>`).join('')}
    </ul>`;
  Object.keys(sections).forEach(sectionName => {
    if (sectionName === 'none') {
      return;
    }
    html = `${html} <h2>${sectionName}</h2><ul>`;
    sections[sectionName].forEach(page => {
      html = `${html}<li><a href="${protocol}://${host}${page.path}">${protocol}://${host}${page.path}</a></li>`;
    });
    html = `${html}</ul>`;
  });
  return html;
};
