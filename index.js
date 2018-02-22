const getRoutes = require('./lib/getRoutes');
const Joi = require('joi');

const register = (server, pluginOptions) => {
  // const pathName = pluginOptions.endpoint || '/sitemap';
  const validation = Joi.validate(pluginOptions, Joi.object({
    forceHttps: Joi.boolean().default(false),
    excludeTags: Joi.array().default([]),
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

      const pages = await getRoutes(server, pluginOptions, request);

      const additionalRoutes = typeof pluginOptions.additionalRoutes === 'function' ? await pluginOptions.additionalRoutes() : [];
      const all = [].concat(pages, additionalRoutes);
      all.sort();
      const protocol = pluginOptions.forceHttps ? 'https' : request.server.info.protocol;
      if (request.params.type === 'html') {
        const html = `
          <ul>
            ${all.map((url) => `<li><a href="${protocol}://${request.info.host}${url}">${protocol}://${request.info.host}${url}</a></li>`).join('')}
          </ul>`;
        return html;
      } else if (request.params.type === 'xml') {
        const xml = `;
          <?xml version="1.0" encoding="UTF-8"?>
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${all.map((url) => `<url><loc>${protocol}://${request.info.host}${url}</loc></url>`).join('')}
          </urlset>`;
        return xml;
      } else if (request.params.type === 'txt') {
        const txt = all.map(url => `${protocol}://${request.info.host}${url}`).join('\n');
        return h.response(txt).type('text/plain');
      }
      return all;
    }
  });
};

exports.plugin = {
  name: 'hapi-generate-sitemap',
  register,
  once: true,
  pkg: require('./package.json')
};
