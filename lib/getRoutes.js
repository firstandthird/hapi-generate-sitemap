module.exports = async (server, options) => {
  const routeTable = server.table();
  const results = [];

  const skip = ['/favicon.ico', '/sitemap.{type}'];

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
    if (table.public.method !== 'get') {
      return;
    }

    if (skip.includes(table.path)) {
      return;
    }

    if (table.path.indexOf('{') !== -1) {
      if (options.dynamicRoutes) {
        const addRoutes = await options.dynamicRoutes(table.path);
        if (addRoutes) {
          addRoutes.forEach(r => {
            results.push(r);
          });
        }
      } else if(options.dynamicRoutes){
        server.log(['hapi-generate-sitemap', 'warning'], { path: table.path, message: 'Not found in dynamic routes' });
      }
      return;
    }

    results.push(table.path);
    return;
  };


  const routePromises = routeTable.map(table => parseRoute(table));
  
  await Promise.all(routePromises);

  return results;
};
