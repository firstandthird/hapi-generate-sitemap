const async = require('async');
const getRoutes = require('./lib/getRoutes');
const Joi = require('joi');
exports.register = function(server, pluginOptions, next) {
  // const pathName = pluginOptions.endpoint || '/sitemap';
  const validation = Joi.validate(pluginOptions, Joi.object({
    excludeTags: Joi.array().default([]),
    additionalRoutes: Joi.func().optional(),
    endpoint: Joi.string().default('/sitemap')
  }));
  if (validation.error) {
    return next(validation.error);
  }
  const pathName = validation.value.endpoint;
  server.route({
    path: `${pathName}.{type}`,
    method: 'get',
    handler(request, reply) {
      async.autoInject({
        pages(done) {
          const routes = getRoutes(server, pluginOptions);
          done(null, routes);
        },
        additionalRoutes(done) {
          if (typeof pluginOptions.additionalRoutes === 'function') {
            return pluginOptions.additionalRoutes(done);
          }
          return done(null, []);
        },
        all(additionalRoutes, pages, done) {
          const all = [].concat(pages, additionalRoutes);
          all.sort();
          done(null, all);
        },
        format(all, done) {
          if (request.params.type === 'html') {
            const html = `
              <ul>
                ${all.map((url) => `<li><a href="${request.connection.info.protocol}://${request.info.host}${url}">${request.connection.info.protocol}://${request.info.host}${url}</a></li>`).join('')}
              </ul>`;
            return done(null, html);
          } else if (request.params.type === 'xml') {
            const xml = `
              <?xml version="1.0" encoding="UTF-8"?>
              <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                ${all.map((url) => `<url><loc>${request.connection.info.protocol}://${request.info.host}${url}</loc></url>`).join('')}
              </urlset>`;
            return done(null, xml);
          } else if (request.params.type === 'txt') {
            return done(null, all.map(url => `${request.connection.info.protocol}://${request.info.host}${url}`).join('\n'));
          }
          done(null, all);
        },
      }, (err, results) => {
        if (err) {
          return reply(err);
        }
        reply(null, results.format);
      });
    }
  });
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
