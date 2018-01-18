const getRoutes = require('./lib/getRoutes');
const Joi = require('joi');

const register = (server, pluginOptions) => {
  // const pathName = pluginOptions.endpoint || '/sitemap';
  const validation = Joi.validate(pluginOptions, Joi.object({
    excludeTags: Joi.array().default([]),
    additionalRoutes: Joi.func().optional(),
    endpoint: Joi.string().default('/sitemap')
  }));
  if (validation.error) {
    throw validation.error;
  }
  const pathName = validation.value.endpoint;
  server.route({
    path: `${pathName}.{type}`,
    method: 'get',
    async handler(request, h) {
      const pages = getRoutes(server, pluginOptions);
      const additionalRoutes = typeof pluginOptions.additionalRoutes === 'function' ? await pluginOptions.additionalRoutes() : [];
      const all = [].concat(pages, additionalRoutes);
      all.sort();
      if (request.params.type === 'html') {
        const html = `
          <ul>
            ${all.map((url) => `<li><a href="${request.server.info.protocol}://${request.info.host}${url}">${request.server.info.protocol}://${request.info.host}${url}</a></li>`).join('')}
          </ul>`;
        return html;
      } else if (request.params.type === 'xml') {
        const xml = `;
          <?xml version="1.0" encoding="UTF-8"?>
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${all.map((url) => `<url><loc>${request.server.info.protocol}://${request.info.host}${url}</loc></url>`).join('')}
          </urlset>`;
        return xml;
      } else if (request.params.type === 'txt') {
        return all.map(url => `${request.server.info.protocol}://${request.info.host}${url}`).join('\n');
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
