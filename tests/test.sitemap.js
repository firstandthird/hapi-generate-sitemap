const Hapi = require('hapi');
const tap = require('tap');
const plugin = require('../index');
const async = require('async');

tap.test('generates a sitemap', (t) => {
  async.autoInject({
    server(done) {
      const server = new Hapi.Server();
      server.connection({ port: 8080 });
      return done(null, server);
    },
    routes(server, done) {
      server.route({
        method: 'get',
        path: '/path1',
        handler(request, reply) {
          return reply(null, { success: true });
        }
      });
      done();
    },
    autoHandler(server, done) {
      server.register(require('hapi-auto-handler'), {}, done);
    },
    req(server, done) {
      server.register(require('hapi-req'), {}, done);
    },
    sitemap(server, done) {
      server.register(plugin, {}, done);
    },
    start(server, autoHandler, req, sitemap, done) {
      server.start(done);
    },
    test(start, server, done) {
      server.inject({
        method: 'get',
        url: '/sitemap.html'
      }, (response) => {
        t.equal(response.statusCode, 200, 'returns HTTP OK');
        t.notEqual(response.result.indexOf(`<a href="http://${server.info.host}:${server.info.port}/path1">http://${server.info.host}:${server.info.port}/path1</a>`), -1, 'maps server route');
        done();
      });
    }
  }, (err, results) => {
    t.equal(err, null);
    results.server.stop(() => {
      t.end();
    });
  });
});

tap.test('can take custom endpoint', (t) => {
  async.autoInject({
    server(done) {
      const server = new Hapi.Server();
      server.connection({ port: 8080 });
      return done(null, server);
    },
    routes(server, done) {
      server.route({
        method: 'get',
        path: '/path1',
        handler(request, reply) {
          return reply(null, { success: true });
        }
      });
      done();
    },
    autoHandler(server, done) {
      server.register(require('hapi-auto-handler'), {}, done);
    },
    req(server, done) {
      server.register(require('hapi-req'), {}, done);
    },
    sitemap(server, done) {
      server.register({
        register: plugin,
        options: {
          endpoint: '/endpoint'
        }
      }, done);
    },
    start(server, autoHandler, req, sitemap, done) {
      server.start(done);
    },
    test(start, server, done) {
      server.inject({
        method: 'get',
        url: '/endpoint.html'
      }, (response) => {
        t.equal(response.statusCode, 200, 'returns HTTP OK');
        t.notEqual(response.result.indexOf(`<a href="http://${server.info.host}:${server.info.port}/path1">http://${server.info.host}:${server.info.port}/path1</a>`), -1, 'maps server route');
        done();
      });
    }
  }, (err, results) => {
    t.equal(err, null);
    results.server.stop(() => {
      t.end();
    });
  });
});

tap.test('ignore routes by routetag', (t) => {
  async.autoInject({
    server(done) {
      const server = new Hapi.Server();
      server.connection({ port: 8080 });
      return done(null, server);
    },
    routes(server, done) {
      server.route({
        method: 'get',
        path: '/path1',
        handler(request, reply) {
          return reply(null, { success: true });
        }
      });
      server.route({
        method: 'get',
        config: {
          tags: ['redirect'],
        },
        path: '/redirect',
        handler(request, reply) {
          return reply(null, { success: true });
        }
      });
      done();
    },
    autoHandler(server, done) {
      server.register(require('hapi-auto-handler'), {}, done);
    },
    req(server, done) {
      server.register(require('hapi-req'), {}, done);
    },
    sitemap(server, done) {
      server.register({
        register: plugin,
        options: {
          excludeTags: ['redirect']
        }
      }, done);
    },
    start(server, autoHandler, req, sitemap, done) {
      server.start(done);
    },
    test(start, server, done) {
      server.inject({
        method: 'get',
        url: '/sitemap.html'
      }, (response) => {
        t.equal(response.statusCode, 200, 'returns HTTP OK');
        t.notEqual(response.result.indexOf(`<a href="http://${server.info.host}:${server.info.port}/path1">http://${server.info.host}:${server.info.port}/path1</a>`), -1, 'maps server route');
        t.equal(response.result.indexOf(`<a href="http://${server.info.host}:${server.info.port}/redirect">http://${server.info.host}:${server.info.port}/redirect</a>`), -1, 'excluded routes not mapped');
        done();
      });
    }
  }, (err, results) => {
    t.equal(err, null);
    results.server.stop(() => {
      t.end();
    });
  });
});

tap.test('ignore routes by plugin config on route', (t) => {
  async.autoInject({
    server(done) {
      const server = new Hapi.Server();
      server.connection({ port: 8080 });
      return done(null, server);
    },
    routes(server, done) {
      server.route({
        method: 'get',
        path: '/path1',
        handler(request, reply) {
          return reply(null, { success: true });
        }
      });
      server.route({
        method: 'get',
        config: {
          plugins: {
            sitemap: false
          }
        },
        path: '/redirect',
        handler(request, reply) {
          return reply(null, { success: true });
        }
      });
      done();
    },
    autoHandler(server, done) {
      server.register(require('hapi-auto-handler'), {}, done);
    },
    req(server, done) {
      server.register(require('hapi-req'), {}, done);
    },
    sitemap(server, done) {
      server.register({
        register: plugin,
        options: {
          excludeTags: ['redirect']
        }
      }, done);
    },
    start(server, autoHandler, req, sitemap, done) {
      server.start(done);
    },
    test(start, server, done) {
      server.inject({
        method: 'get',
        url: '/sitemap.html'
      }, (response) => {
        t.equal(response.statusCode, 200, 'returns HTTP OK');
        t.notEqual(response.result.indexOf(`<a href="http://${server.info.host}:${server.info.port}/path1">http://${server.info.host}:${server.info.port}/path1</a>`), -1, 'maps server route');
        t.equal(response.result.indexOf(`<a href="http://${server.info.host}:${server.info.port}/redirect">http://${server.info.host}:${server.info.port}/redirect</a>`), -1, 'excluded routes not mapped');
        done();
      });
    }
  }, (err, results) => {
    t.equal(err, null);
    results.server.stop(() => {
      t.end();
    });
  });
});

tap.test('accepts a function containing additional unlisted routes', (t) => {
  async.autoInject({
    server(done) {
      const server = new Hapi.Server();
      server.connection({ port: 8080 });
      return done(null, server);
    },
    routes(server, done) {
      server.route({
        method: 'get',
        path: '/path1',
        handler(request, reply) {
          return reply(null, { success: true });
        }
      });
      server.route({
        method: 'get',
        config: {
          plugins: {
            sitemap: false
          }
        },
        path: '/redirect',
        handler(request, reply) {
          return reply(null, { success: true });
        }
      });
      done();
    },
    autoHandler(server, done) {
      server.register(require('hapi-auto-handler'), {}, done);
    },
    req(server, done) {
      server.register(require('hapi-req'), {}, done);
    },
    sitemap(server, done) {
      server.register({
        register: plugin,
        options: {
          additionalRoutes: (callback) => callback(null, [
            {
              path: 'add1',
              method: 'get'
            },
            {
              path: 'add2',
              method: 'post'
            }
          ])
        }
      }, done);
    },
    start(server, autoHandler, req, sitemap, done) {
      server.start(done);
    },
    test(start, server, done) {
      server.inject({
        method: 'get',
        url: '/sitemap.html'
      }, (response) => {
        t.equal(response.statusCode, 200, 'returns HTTP OK');
        t.equal(response.result.indexOf(`<a href="http://${server.info.host}:${server.info.port}/add1">http://${server.info.host}:${server.info.port}/add1</a>`), -1, 'addition routes mapped');
        t.equal(response.result.indexOf(`<a href="http://${server.info.host}:${server.info.port}/add2">http://${server.info.host}:${server.info.port}/add2</a>`), -1, 'addition routes mapped');
        done();
      });
    }
  }, (err, results) => {
    t.equal(err, null);
    results.server.stop(() => {
      t.end();
    });
  });
});

tap.test('can also return txt and xml output', (t) => {
  async.autoInject({
    server(done) {
      const server = new Hapi.Server();
      server.connection({ port: 8080 });
      return done(null, server);
    },
    routes(server, done) {
      server.route({
        method: 'get',
        path: '/path1',
        handler(request, reply) {
          return reply(null, { success: true });
        }
      });
      done();
    },
    autoHandler(server, done) {
      server.register(require('hapi-auto-handler'), {}, done);
    },
    req(server, done) {
      server.register(require('hapi-req'), {}, done);
    },
    sitemap(server, done) {
      server.register({
        register: plugin,
        options: {}
      }, done);
    },
    start(server, autoHandler, req, sitemap, done) {
      server.start(done);
    },
    testXml(start, server, done) {
      server.inject({
        method: 'get',
        url: '/sitemap.xml'
      }, (response) => {
        t.notEqual(response.result.indexOf('<?xml version="1.0" encoding="UTF-8"?>'), -1, 'returns xml content');
        t.equal(response.statusCode, 200, 'returns HTTP OK');
        done();
      });
    },
    testTxt(start, server, done) {
      server.inject({
        method: 'get',
        url: '/sitemap.txt'
      }, (response) => {
        t.equal(response.statusCode, 200, 'returns HTTP OK');
        t.equal(response.result, `http://${server.info.host}:${server.info.port}/path1`, 'returns txt map');
        done();
      });
    }
  }, (err, results) => {
    t.equal(err, null);
    results.server.stop(() => {
      t.end();
    });
  });
});
