const getRoutes = require('./lib/getRoutes');
const Joi = require('joi');
const html = require('./lib/html');
const xml = require('./lib/xml');
const txt = require('./lib/txt');

const handlers = { html, xml, txt };

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
      console.log(handlers)
      if (handlers[request.params.type]) {
        return handlers[request.params.type](protocol, request.info.host, pages, h);
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
