module.exports = async (server, options, request) => {
  const routeTable = server.table();
  const results = [];

  const skip = ['/favicon.ico', '/sitemap.{type}'];

  const parseRoute = async (table) => {
    if (options.excludeTags && table.settings.tags) {
      // skip if any tags match the excluded tags:
      if (options.excludeTags.some(tag => table.settings.tags.includes(tag))) {
        return;
      }
    }
    if (request.query.all !== '1' && table.settings.plugins.sitemap === false) {
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
        const addRoutes = await options.dynamicRoutes(table.path, request);
        if (addRoutes) {
          addRoutes.forEach(r => {
            // add the route if it is not excluded:
            if (!options.excludeUrls.includes(r)) {
              results.push({ path: r, section: 'none' });
            }
          });
        }
      } else if (options.dynamicRoutes) {
        server.log(['hapi-generate-sitemap', 'warning'], { path: table.path, message: 'Not found in dynamic routes' });
      }
      return;
    }
    // add the route if it is not excluded:
    if (!options.excludeUrls.includes(table.path)) {
      results.push({ path: table.path, section: table.settings.plugins['hapi-generate-sitemap'] ? table.settings.plugins['hapi-generate-sitemap'].section : 'none' });
    }
    return;
  };


  const routePromises = routeTable.map(table => parseRoute(table));

  await Promise.all(routePromises);

  return results;
};
