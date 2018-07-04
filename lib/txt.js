module.exports = (pages, h, pluginOptions) => {
  const txt = pages.map(page => `${page.url}`).join('\n');
  return h.response(txt).type('text/plain');
};
