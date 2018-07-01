const Hapi = require('hapi');
const tap = require('tap');
const plugin = require('../index');

tap.test('generates a sitemap', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path1',
    handler(request, h) {
      return { success: true };
    }
  });
  await server.register(plugin, {});
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.html'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  t.match(response.result, `<a href="http://${server.info.host}:${server.info.port}/path1">http://${server.info.host}:${server.info.port}/path1</a></li>`);
  await server.stop();
  t.end();
});

tap.test('generates a sitemap when htmlView is set', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path1',
    handler(request, h) {
      return { success: true };
    }
  });
  await server.register([
    {
      plugin,
      options: {
        htmlView: 'sitemap' // this will use the template at test/views/sitemap.html
      }
    },
    {
      plugin: require('vision'),
    }
  ]);
  server.views({
    engines: { html: require('handlebars') },
    relativeTo: __dirname,
    path: 'views'
  });
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.html'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  t.match(response.result, `<b>none</b>:<a href="http://${server.info.host}:${server.info.port}/path1">http://${server.info.host}:${server.info.port}/path1</a>`);
  await server.stop();
  t.end();
});

tap.test('forceHttps labels all routes with "https://" (useful if you are behind an HTTPS proxy)', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path1',
    handler(request, h) {
      return { success: true };
    }
  });
  await server.register({
    plugin,
    options: {
      forceHttps: true
    }
  });
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.html'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  t.notEqual(response.result.indexOf(`<a href="https://${server.info.host}:${server.info.port}/path1">https://${server.info.host}:${server.info.port}/path1</a></li>`), -1);
  await server.stop();
  t.end();
});

tap.test('html can be divided into sections', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path1',
    handler(request, h) {
      return { success: true };
    }
  });
  server.route({
    method: 'get',
    path: '/story1',
    config: {
      plugins: {
        sitemap: {
          section: 'Stories'
        }
      }
    },
    handler(request, h) {
      return { success: true };
    }
  });
  server.route({
    method: 'get',
    path: '/story2',
    config: {
      plugins: {
        sitemap: {
          section: 'Stories'
        }
      }
    },
    handler(request, h) {
      return { success: true };
    }
  });
  server.route({
    method: 'get',
    path: '/interview1',
    config: {
      plugins: {
        sitemap: {
          section: 'Interviews'
        }
      }
    },
    handler(request, h) {
      return { success: true };
    }
  });

  await server.register(plugin, {});
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.html'
  });
  t.has(response.result, `<h2>Interviews</h2><ul><li><a href="http://${server.info.host}:${server.info.port}/interview1">http://${server.info.host}:${server.info.port}/interview1</a></li></ul> <h2>Stories</h2><ul><li><a href="http://${server.info.host}:${server.info.port}/story1">http://${server.info.host}:${server.info.port}/story1</a></li><li><a href="http://${server.info.host}:${server.info.port}/story2">http://${server.info.host}:${server.info.port}/story2</a></li></ul>`);
  await server.stop();
  t.end();
});

tap.test('each section in html is sorted', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });

  server.route({
    method: 'get',
    path: '/storyB',
    config: {
      plugins: {
        sitemap: {
          section: 'Stories'
        }
      }
    },
    handler(request, h) {
      return { success: true };
    }
  });
  server.route({
    method: 'get',
    path: '/interviewB',
    config: {
      plugins: {
        sitemap: {
          section: 'Interviews'
        }
      }
    },
    handler(request, h) {
      return { success: true };
    }
  });
  server.route({
    method: 'get',
    path: '/sectionA',
    config: {
      plugins: {
        sitemap: {
          section: 'ASection'
        }
      }
    },
    handler(request, h) {
      return { success: true };
    }
  });
  server.route({
    method: 'get',
    path: '/sectionB',
    config: {
      plugins: {
        sitemap: {
          section: 'BSection'
        }
      }
    },
    handler(request, h) {
      return { success: true };
    }
  });
  server.route({
    method: 'get',
    path: '/interviewA',
    config: {
      plugins: {
        sitemap: {
          section: 'Interviews'
        }
      }
    },
    handler(request, h) {
      return { success: true };
    }
  });
  server.route({
    method: 'get',
    path: '/storyC',
    config: {
      plugins: {
        sitemap: {
          section: 'Stories'
        }
      }
    },
    handler(request, h) {
      return { success: true };
    }
  });
  server.route({
    method: 'get',
    path: '/storyA',
    config: {
      plugins: {
        sitemap: {
          section: 'Stories'
        }
      }
    },
    handler(request, h) {
      return { success: true };
    }
  });

  server.route({
    method: 'get',
    path: '/noneB',
    handler(request, h) {
      return { success: true };
    }
  });
  server.route({
    method: 'get',
    path: '/noneA',
    handler(request, h) {
      return { success: true };
    }
  });

  await server.register(plugin, {});
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.html'
  });
  const result = response.result;
  // make sure sections are sorted correctly:
  t.equal(result.indexOf('ASection') < result.indexOf('BSection') < result.indexOf('Interviews') < result.indexOf('Stories'), true, 'sections sorted correctly');
  t.equal(result.indexOf('noneA') < result.indexOf('noneB'), true, '"none" section is sorted');
  t.equal(result.indexOf('storyA') < result.indexOf('storyB') < result.indexOf('storyC'), true, '"Stories" section is sorted');
  t.equal(result.indexOf('interviewA') < result.indexOf('interviewB'), true, '"Interviews" section is sorted');
  await server.stop();
  t.end();
});

tap.test('can take custom endpoint', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path1',
    handler(request, h) {
      return { success: true };
    }
  });
  await server.register({
    plugin,
    options: {
      endpoint: '/endpoint'
    }
  });
  await server.start();
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/endpoint.html'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  await server.stop();
  t.end();
});

tap.test('ignore routes by routetag', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path1',
    handler(request, h) {
      return { success: true };
    }
  });
  server.route({
    method: 'get',
    config: {
      tags: ['redirect'],
    },
    path: '/redirect',
    handler(request, h) {
      return { success: true };
    }
  });
  await server.register({
    plugin,
    options: {
      excludeTags: ['redirect']
    }
  });
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.html'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  t.equal(response.result.indexOf('redirect'), -1);
  await server.stop();
  t.end();
});

tap.test('ignore routes by plugin config on route', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path1',
    handler(request, h) {
      return { success: true };
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
    handler(request, h) {
      return { success: true };
    }
  });
  await server.register({
    plugin,
    options: {
      excludeTags: ['redirect']
    }
  });
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.html'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  t.equal(response.result.indexOf('redirect'), -1);
  await server.stop();
  t.end();
});

tap.test('ignore urls by excludeUrls', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path1',
    handler(request, h) {
      return { success: true };
    }
  });
  server.route({
    method: 'get',
    path: '/redirect',
    handler(request, h) {
      return { success: true };
    }
  });
  await server.register({
    plugin,
    options: {
      excludeUrls: ['/path1']
    }
  });
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.html'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  t.equal(response.result.indexOf('path1'), -1);
  await server.stop();
  t.end();
});

tap.test('?all=1 query option will over-ride the "ignore" plugin config', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path1',
    handler(request, h) {
      return { success: true };
    }
  });
  server.route({
    method: 'get',
    path: '/path2',
    config: {
      plugins: {
        sitemap: false
      }
    },
    handler(request, h) {
      return { success: true };
    }
  });
  await server.register({
    plugin
  });
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.html?all=1'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  t.has(response.result, `<a href="http://${server.info.host}:${server.info.port}/path1">http://${server.info.host}:${server.info.port}/path1</a></li>`);
  t.has(response.result, `<a href="http://${server.info.host}:${server.info.port}/path2">http://${server.info.host}:${server.info.port}/path2</a></li>`);
  await server.stop();
  t.end();
});

tap.test('accepts dynamic route options', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path/{param}',
    handler(request, h) {
      return 'hello';
    }
  });

  server.route({
    method: 'get',
    path: '/static-route',
    handler(request, h) {
      return 'static hello';
    }
  });

  await server.register({
    plugin,
    options: {
      dynamicRoutes: (path, request) => {
        t.equal(request.query.limit, '1', 'passes request object to dynamicRoutes');
        const routes = {
          '/path/{param}': [
            '/path/param1',
            '/path/param2',
            '/path/param3'
          ]
        };

        return (routes[path]) ? routes[path] : [];
      }
    }
  });
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.json?limit=1'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  t.deepEqual(response.result, ['/path/param1', '/path/param2', '/path/param3', '/static-route']);
  await server.stop();

  t.end();
});

tap.test('if dynamic route does not specify a section then fall back to route config', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path/{param}',
    config: {
      plugins: {
        sitemap: {
          section: 'Interview'
        }
      }
    },
    handler(request, h) {
      return 'hello';
    }
  });

  await server.register({
    plugin,
    options: {
      dynamicRoutes: (path, request) => {
        const routes = {
          '/path/{param}': [
            '/path/param1',
            '/path/param2',
            '/path/param3'
          ]
        };
        return (routes[path]) ? routes[path] : [];
      }
    }
  });
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.json?meta=1'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  t.equal(response.result.length, 3);
  response.result.forEach(entry => {
    t.match(entry, { section: 'Interview' });
  });
  await server.stop();
  t.end();
});

tap.test('accepts a function containing additional unlisted routes', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path1',
    handler(request, h) {
      return { success: true };
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
    handler(request, h) {
      return { success: true };
    }
  });
  await server.register({
    plugin,
    options: {
      additionalRoutes: () => new Promise((resolve, reject) => resolve(['/add1', '/add2']))
    }
  });
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.html'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  t.notEqual(response.result.indexOf('/add1'), -1);
  t.notEqual(response.result.indexOf('/add2'), -1);
  t.notEqual(response.result.indexOf('/path1'), -1);
  await server.stop();
  t.end();
});

tap.test('can also return txt output', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path1',
    handler(request, h) {
      return { success: true };
    }
  });
  await server.register({
    plugin,
    options: {}
  });
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.txt'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  t.has(response.headers['content-type'], 'text/plain;');
  t.equal(response.result, `http://${server.info.host}:${server.info.port}/path1`, 'returns txt map');
  await server.stop();
  t.end();
});

tap.test('can also return xml output', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path1',
    handler(request, h) {
      return { success: true };
    }
  });
  await server.register({
    plugin,
    options: {}
  });
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.xml'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  t.notEqual(response.result.indexOf('<?xml version="1.0" encoding="UTF-8"?>'), -1);
  await server.stop();
  t.end();
});

tap.test('lastmod, changefreq and priority sitemap tags can be set by route config', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  await server.register(plugin, {});
  server.route({
    method: 'get',
    path: '/path1',
    config: {
      plugins: {
        sitemap: {
          lastmod: '2005-01-01',
          changefreq: 'monthly',
          priority: 0.8,
        }
      }
    },
    handler(request, h) {
      return { success: true };
    }
  });
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.xml'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  t.match(response.result, `<url><loc>http://${server.info.host}:${server.info.port}/path1</loc><lastmod>2005-01-01</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`);
  await server.stop();
  t.end();
});

tap.test('lastmod, changefreq and priority sitemap tags can be set by dynamicRoutes', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  await server.register({
    plugin,
    options: {
      dynamicRoutes: (path, request) => {
        const routes = {
          '/path/{param}': [
            {
              path: '/path/param1',
              lastmod: '2005-01-01',
              changefreq: 'monthly',
              priority: 0.8,
            },
            '/path/param2',
            '/path/param3'
          ]
        };
        return (routes[path]) ? routes[path] : [];
      }
    }
  });
  server.route({
    method: 'get',
    path: '/path/{param}',
    handler(request, h) {
      return 'hello';
    }
  });
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.xml'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  t.match(response.result, `<url><loc>http://${server.info.host}:${server.info.port}/path/param1</loc><lastmod>2005-01-01</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`, 'formats sitemap tags correctly');
  t.match(response.result, `<loc>http://${server.info.host}:${server.info.port}/path/param2</loc></url>`, 'still formats correctly if no sitemap tags specified');
  await server.stop();
  t.end();
});

tap.test('lastmod, changefreq and priority sitemap tags can be set by a custom function (getRouteMetaData)', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  await server.register({
    plugin,
    options: {
      getRouteMetaData(page) {
        t.match(page.path, '/path1');
        return {
          lastmod: '2005-01-01',
          priority: 0.8,
        };
      }
    }
  });
  server.route({
    method: 'get',
    path: '/path1',
    config: {
      plugins: {
        sitemap: {
          changefreq: 'monthly',
        }
      }
    },
    handler(request, h) {
      return 'hello';
    }
  });
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.xml'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  t.match(response.result, `<url><loc>http://${server.info.host}:${server.info.port}/path1</loc><lastmod>2005-01-01</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`, 'formats sitemap tags correctly');
  await server.stop();
  t.end();
});

tap.test('if getRouteMetaData returns false then the route will not be included in the sitemap', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  await server.register({
    plugin,
    options: {
      getRouteMetaData(page) {
        // /path1 will return false:
        return page.path === '/path1' ? false : {};
      }
    }
  });
  server.route({
    method: 'get',
    path: '/path1',
    config: {
      plugins: {
        sitemap: {
          changefreq: 'monthly',
        }
      }
    },
    handler(request, h) {
      return 'hello';
    }
  });
  server.route({
    method: 'get',
    path: '/path2',
    config: {
      plugins: {
        sitemap: {
          changefreq: 'monthly',
        }
      }
    },
    handler(request, h) {
      return 'hello';
    }
  });
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.xml'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  t.notMatch(response.result, '/path1', 'route not included when getRouteMetaData returns false');
  t.match(response.result, `<url><loc>http://${server.info.host}:${server.info.port}/path2</loc><changefreq>monthly</changefreq></url>`, 'non-false values for getRouteMetaData are still included');
  await server.stop();
  t.end();
});

tap.test('.json?meta=1 will also return metadata (section, lastmod, changefreq, priority) ', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  await server.register(plugin, {});
  server.route({
    method: 'get',
    path: '/path1',
    config: {
      plugins: {
        sitemap: {
          section: 'Interviews',
          lastmod: '2005-01-01',
          changefreq: 'monthly',
          priority: 0.8,
        }
      }
    },
    handler(request, h) {
      return { success: true };
    }
  });
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.json?meta=1'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  t.match(response.result, [{
    path: '/path1',
    section: 'Interviews',
    lastmod: '2005-01-01',
    priority: 0.8,
    changefreq: 'monthly',
  }]);
  await server.stop();
  t.end();
});

tap.test('will use title as text for hyperlink (if specified)', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path1',
    config: {
      plugins: {
        sitemap: {
          title: 'A link'
        }
      }
    },
    handler(request, h) {
      return { success: true };
    }
  });
  server.route({
    method: 'get',
    path: '/path2',
    config: {
      plugins: {
        sitemap: {
          section: 'A',
          title: 'A second link'
        }
      }
    },
    handler(request, h) {
      return { success: true };
    }
  });
  await server.register(plugin, {});
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap.html'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  t.match(response.result, `<a href="http://${server.info.host}:${server.info.port}/path1">A link</a></li>`);
  t.match(response.result, `<a href="http://${server.info.host}:${server.info.port}/path2">A second link</a></li>`);
  await server.stop();
  t.end();
});

tap.test('take in an assignSitemap method', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path/{param}',
    handler(request, h) {
      return 'hello';
    }
  });
  server.route({
    method: 'get',
    path: '/static-route',
    handler(request, h) {
      return 'static hello';
    }
  });

  await server.register({
    plugin,
    options: {
      assignSitemap: (route) => {
        if (route.path === '/path/param1') {
          route.sitemap = '/sitemap-huh';
        }
      },
      dynamicRoutes: (path, request) => {
        const routes = {
          '/path/{param}': [
            '/path/param1',
            '/path/param2',
            '/path/param3'
          ]
        };
        return (routes[path]) ? routes[path] : [];
      }
    }
  });
  await server.start();
  const response = await server.inject({
    method: 'get',
    url: '/sitemap-huh.json'
  });
  t.equal(response.statusCode, 200, 'returns HTTP OK');
  t.deepEqual(response.result, ['/path/param1']);
  await server.stop();

  t.end();
});
