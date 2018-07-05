const boom = require('boom');
const getRoutes = require('./lib/getRoutes');
const Joi = require('joi');
const sortBy = require('lodash.sortby');
const html = require('./lib/html.js');
const txt = require('./lib/txt.js');
const xml = require('./lib/xml.js');

const handlers = { html, xml, txt };

const register = (server, pluginOptions) => {
  // const pathName = pluginOptions.endpoint || '/sitemap';
  const validation = Joi.validate(pluginOptions, Joi.object({
    assignSitemap: Joi.func().optional(), // specify a Function to return the sitemap filename for each route
    htmlView: Joi.string().default(''), // specify an html template to use for rendering the sitemap, otherwise it is done programmatically
    forceHttps: Joi.boolean().default(false), // force routes to be listed as https instead of http (useful if you are behind a proxy)
    excludeTags: Joi.array().default([]), // routes marked with these tags are excluded from the sitemap
    excludeUrls: Joi.array().default([]), // these urls are excluded from the sitemap
    additionalRoutes: Joi.func().optional(), // returns any additional routes you want listed on your sitemap
    dynamicRoutes: Joi.func().optional(), //  returns what routes to list for routes that use dynamic params (eg '/user/{userName}' --> ['/user/roberto', '/user/maria'])
    getRouteMetaData: Joi.func().optional(), // returns any metadata you want associated with a given route
    endpoint: Joi.string().default('/sitemap'), // name of the path where you can GET a copy of the sitemap
    logRequest: Joi.boolean().default(false) // specify whether to log each request for the sitemap
  }));

  if (validation.error) {
    throw validation.error;
  }
  pluginOptions = validation.value;
  const pathName = validation.value.endpoint;
  if (!pluginOptions.assignSitemap) {
    pluginOptions.assignSitemap = (route) => {
      route.sitemap = pluginOptions.endpoint;
    };
  }
  server.route({
    path: `${pathName}{suffix?}.{type}`,
    method: 'get',
    config: {
      auth: false
    },
    async handler(request, h) {
      const requestedFile = request.params.suffix ? `${pathName}${request.params.suffix}` : pathName;
      const protocol = pluginOptions.forceHttps ? 'https' : request.server.info.protocol;
      if (pluginOptions.logRequest) {
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
          pages.push({ path: route, title: route, section: 'none', url: `${protocol}://${request.info.host}${route}` });
        } else {
          // otherwise assume it is an object with a path and section heading:
          route.url = `${protocol}://${request.info.host}${route}`;
          pages.push(route);
        }
      });
      // determine which sitemap each goes to:
      pages.forEach(pluginOptions.assignSitemap);
      pages = pages.filter(p => p.sitemap === requestedFile);
      // sort everything by path:
      pages = sortBy(pages, 'path');
      if (request.params.type && request.params.type !== 'json' && !handlers[request.params.type]) {
        throw boom.notFound(`No handler found for file type ${request.params.type}`);
      }
      if (handlers[request.params.type]) {
        return handlers[request.params.type](pages, h, pluginOptions);
      }
      // assume .json:
      if (request.query.meta) {
        return pages;
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
