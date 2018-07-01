const getRoutes = require('./lib/getRoutes');
const Joi = require('joi');
const groupBy = require('lodash.groupby');
const sortBy = require('lodash.sortby');

const register = (server, pluginOptions) => {
  // const pathName = pluginOptions.endpoint || '/sitemap';
  const validation = Joi.validate(pluginOptions, Joi.object({
    assignSitemap: Joi.func().optional(), // specify a unction to return the sitemap filename for each route
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
      if (request.params.type === 'html') {
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
      } else if (request.params.type === 'xml') {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${pages.map((page) => {
              const loc = `<loc>${page.url}</loc>`;
              const lastmod = page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : '';
              const changefreq = page.changefreq ? `<changefreq>${page.changefreq}</changefreq>` : '';
              const priority = page.priority ? `<priority>${page.priority}</priority>` : '';
              return `<url>${loc}${lastmod}${changefreq}${priority}</url>`;
            }).join('')}
          </urlset>`;
        return h.response(xml).type('text/xml');
      } else if (request.params.type === 'txt') {
        const txt = pages.map(page => `${page.url}`).join('\n');
        return h.response(txt).type('text/plain');
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
