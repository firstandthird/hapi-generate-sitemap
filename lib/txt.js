module.exports = (protocol, host, pages, h) => {
  const txt = pages.map(url => `${protocol}://${host}${url.path}`).join('\n');
  return h.response(txt).type('text/plain');
};
