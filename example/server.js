'use strict';

const Hapi = require('hapi');

const server = new Hapi.Server({ port: 8081, debug: { log: ['*'] } });

const start = async function() {
  await server.register({
    plugin: require('../'),
    options: {
      maxPerPage: 5,
      dynamicRoutes: (slug) => [
        '/slug-one',
        '/slug-two',
        '/slug-three',
        '/slug-four',
        '/slug-five',
        '/slug-six',
        '/slug-seven',
        '/slug-eight',
        '/slug-nine',
        '/slug-ten',
        '/slug-eleven',
        '/slug-twelve'
      ]
    }
  });

  server.route({
    method: 'GET',
    path: '/handy-dandy',
    config: {
      plugins: {
        sitemap: true
      }
    },
    handler(request, h) {
      return 'handy';
    }
  });

  server.route({
    method: 'GET',
    path: '/handy/{fruits}',
    config: {
      plugins: {
        sitemap: {
          file: 'handy'
        }
      }
    },
    handler(request, h) {
      return 'handy';
    }
  });

  await server.start();
  server.log(['notice'], `server running at ${server.info.uri}`);
};

start();

