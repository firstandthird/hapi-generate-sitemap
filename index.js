const getRoutes = require('./lib/getRoutes');
const Joi = require('joi');
const groupBy = require('lodash.groupby');

const register = (server, pluginOptions) => {
  // const pathName = pluginOptions.endpoint || '/sitemap';
  const validation = Joi.validate(pluginOptions, Joi.object({
    forceHttps: Joi.boolean().default(false),
    excludeTags: Joi.array().default([]),
    excludeUrls: Joi.array().default([]),
    additionalRoutes: Joi.func().optional(),
    dynamicRoutes: Joi.func().optional(),
    endpoint: Joi.string().default('/sitemap'),
    logRequest: Joi.boolean().default(false)
  }));

  if (validation.error) {
    throw validation.error;
  }

  const pathName = validation.value.endpoint;
  server.route({
    path: `${pathName}.{type}`,
    method: 'get',
    async handler(request, h) {
      if (validation.value.logRequest) {
        const logVal = { request: request.path, timestamp: new Date() };
        if (request.headers['user-agent']) {
          logVal.userAgent = request.headers['user-agent'];
        }
        server.log(['hapi-generate-sitemap', 'requested', 'info'], logVal);
      }

      let pages = await getRoutes(server, pluginOptions, request);
      const additionalRoutes = typeof pluginOptions.additionalRoutes === 'function' ? await pluginOptions.additionalRoutes() : [];
      // add any additional pages:
      additionalRoutes.forEach(route => {
        if (typeof route === 'string') {
          pages.push({ path: route, section: 'none' });
        } else {
          // otherwise assume it is an object with a path and section heading:
          pages.push(route);
        }
      });
      // sort by path:
      pages.sort((a, b) => a.path > b.path);
      const protocol = pluginOptions.forceHttps ? 'https' : request.server.info.protocol;
      if (pluginOptions.excludeUrls) {
        pages = pages.filter(url => !pluginOptions.excludeUrls.includes(url.path));
      }
      if (request.params.type === 'html') {
        // group the list by sections:
        const sections = groupBy(pages, (page) => page.section);
        // first list all the routes that have no section:
        let html = `
          <ul>
            ${sections.none.map((page) => `<li><a href="${protocol}://${request.info.host}${page.path}">${protocol}://${request.info.host}${page.path}</a></li>`).join('')}
          </ul>`;
        Object.keys(sections).forEach(sectionName => {
          if (sectionName === 'none') {
            return;
          }
          html = `${html} <h2>${sectionName}</h2><ul>`;
          sections[sectionName].forEach(page => {
            html = `${html}<li><a href="${protocol}://${request.info.host}${page.path}">${protocol}://${request.info.host}${page.path}</a></li>`;
          });
          html = `${html}</ul>`;
        });
        return html;
      } else if (request.params.type === 'xml') {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${pages.map((url) => `<url><loc>${protocol}://${request.info.host}${url.path}</loc></url>`).join('')}
          </urlset>`;
        return h.response(xml).type('text/xml');
      } else if (request.params.type === 'txt') {
        const txt = pages.map(url => `${protocol}://${request.info.host}${url.path}`).join('\n');
        return h.response(txt).type('text/plain');
      }
      return pages.map(page => page.path);
    }
  });
};

exports.plugin = {
  name: 'hapi-generate-sitemap',
  register,
  once: true,
  pkg: require('./package.json')
};
