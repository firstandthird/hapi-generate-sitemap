const async = require('async');
const getRoutes = require('./methods/getRoutes');

exports.register = function(serverObject, pluginOptions, next) {
  serverObject.method('getRoutes', getRoutes.method.bind(serverObject), {});
  const pathName = pluginOptions.endpoint || '/sitemap';
  serverObject.route({
    path: `${pathName}.{type}`,
    method: 'get',
    handler: {
      autoInject: {
        pages(server, done) {
          const routes = server.methods.getRoutes(pluginOptions);
          done(null, routes);
        },
        additionalRoutes(server, done) {
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
        reply(request, all, done) {
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
        }
      }
    }
  });
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
