const pAll = require('p-all');

module.exports = async (server, options) => {
  const routeTable = server.table();
  const results = [];

  const skip = ['/favicon.ico'];

  const parseRoute = async (table) => {
    if (options.excludeTags && table.settings.tags) {
      for (let i = 0; i < options.excludeTags.length; i++) {
        const tag = options.excludeTags[i];
        if (table.settings.tags.indexOf(tag) !== -1) {
          return;
        }
      }
    }
    if (table.settings.plugins.sitemap === false) {
      return;
    }
    if (table.path.indexOf('{') !== -1) {
      if (options.dynamicRoutes && options.dynamicRoutes[table.path]) {
        const routeFunc = options.dynamicRoutes[table.path];
        const addRoutes = await routeFunc();
        if (addRoutes) {
          addRoutes.forEach(r => {
            results.push(r);
          });
        }
      } else if(options.dynamicRoutes){
        server.log(['hapi-generate-sitemap', 'warn'], { path: table.path, message: 'Not found in dynamic routes' });
      }
      return;
    }
    if (table.public.method !== 'get') {
      return;
    }

    if (skip.includes(table.path)) {
      return;
    }
    results.push(table.path);
    return;
  };


  const routePromises = [];

  routeTable.forEach((table) => {
    routePromises.push(() => { parseRoute(table) });
  });

  await pAll(routePromises);

  return results;
};
