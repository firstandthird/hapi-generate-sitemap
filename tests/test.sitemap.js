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
  t.notEqual(response.result.indexOf(`<a href="http://${server.info.host}:${server.info.port}/path1">http://${server.info.host}:${server.info.port}/path1</a></li>`), -1);
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
    plugin,
    options: {
      excludeTags: ['redirect']
    }
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
