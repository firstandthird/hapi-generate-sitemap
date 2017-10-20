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
    sitemap(server, done) {
      server.register(plugin, {}, done);
    },
    start(server, sitemap, done) {
      server.start(done);
    },
    test(start, server, done) {
      server.inject({
        method: 'get',
        url: '/sitemap.html'
      }, (response) => {
        t.equal(response.statusCode, 200, 'returns HTTP OK');
        t.equal(response.result, `
              <ul>
                <li><a href="http://${server.info.host}:${server.info.port}/path1">http://${server.info.host}:${server.info.port}/path1</a></li>
              </ul>`);
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
    sitemap(server, done) {
      server.register({
        register: plugin,
        options: {
          endpoint: '/endpoint'
        }
      }, done);
    },
    start(server, sitemap, done) {
      server.start(done);
    },
    test(start, server, done) {
      server.inject({
        method: 'get',
        url: '/endpoint.html'
      }, (response) => {
        t.equal(response.statusCode, 200, 'returns HTTP OK');
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
    sitemap(server, done) {
      server.register({
        register: plugin,
        options: {
          excludeTags: ['redirect']
        }
      }, done);
    },
    start(server, sitemap, done) {
      server.start(done);
    },
    test(start, server, done) {
      server.inject({
        method: 'get',
        url: '/sitemap.html'
      }, (response) => {
        t.equal(response.statusCode, 200, 'returns HTTP OK');
        t.equal(response.result.trim(),
        `<ul>
                <li><a href="http://${server.info.host}:${server.info.port}/path1">http://${server.info.host}:${server.info.port}/path1</a></li>
              </ul>`);
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
    sitemap(server, done) {
      server.register({
        register: plugin,
        options: {
          excludeTags: ['redirect']
        }
      }, done);
    },
    start(server, sitemap, done) {
      server.start(done);
    },
    test(start, server, done) {
      server.inject({
        method: 'get',
        url: '/sitemap.html'
      }, (response) => {
        t.equal(response.statusCode, 200, 'returns HTTP OK');
        t.equal(response.result.trim(), `<ul>
                <li><a href="http://${server.info.host}:${server.info.port}/path1">http://${server.info.host}:${server.info.port}/path1</a></li>
              </ul>`);
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
    sitemap(server, done) {
      server.register({
        register: plugin,
        options: {
          additionalRoutes: (callback) => callback(null, [
            '/add1', '/add2'
          ])
        }
      }, done);
    },
    start(server, sitemap, done) {
      server.start(done);
    },
    test(start, server, done) {
      server.inject({
        method: 'get',
        url: '/sitemap.html'
      }, (response) => {
        t.equal(response.statusCode, 200, 'returns HTTP OK');
        t.equal(response.result.trim(), `<ul>
                <li><a href="http://${server.info.host}:${server.info.port}/add1">http://${server.info.host}:${server.info.port}/add1</a></li><li><a href="http://${server.info.host}:${server.info.port}/add2">http://${server.info.host}:${server.info.port}/add2</a></li><li><a href="http://${server.info.host}:${server.info.port}/path1">http://${server.info.host}:${server.info.port}/path1</a></li>
              </ul>`);
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

tap.test('can also return txt output', (t) => {
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
    sitemap(server, done) {
      server.register({
        register: plugin,
        options: {}
      }, done);
    },
    start(server, sitemap, done) {
      server.start(done);
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

tap.test('can also return xml output', (t) => {
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
    sitemap(server, done) {
      server.register({
        register: plugin,
        options: {}
      }, done);
    },
    start(server, sitemap, done) {
      server.start(done);
    },
    testXml(start, server, done) {
      server.inject({
        method: 'get',
        url: '/sitemap.xml'
      }, (response) => {
        t.equal(response.statusCode, 200, 'returns HTTP OK');
        t.equal(response.result.trim(), `<?xml version="1.0" encoding="UTF-8"?>
              <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                <url><loc>http://${server.info.host}:${server.info.port}/path1</loc></url>
              </urlset>`, 'returns xml content');
        done();
      });
    },
  }, (err, results) => {
    t.equal(err, null);
    results.server.stop(() => {
      t.end();
    });
  });
});
