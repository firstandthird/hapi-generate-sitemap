module.exports = async (server, options, request) => {
  const routeTable = server.table();
  const results = [];

  const skip = ['/favicon.ico', '/sitemap.{type}'];

  const parseRoute = async (table) => {
    if (request.query.all !== '1' && !table.settings.plugins.sitemap) {
      return;
    }
    if (options.excludeTags && table.settings.tags) {
      // skip if any tags match the excluded tags:
      if (options.excludeTags.some(tag => table.settings.tags.includes(tag))) {
        return;
      }
    }
    if (table.public.method !== 'get') {
      return;
    }

    if (skip.includes(table.path)) {
      return;
    }
    const pluginSettings = table.settings.plugins.sitemap;

    const protocol = options.forceHttps ? 'https' : request.server.info.protocol;

    if (table.path.indexOf('{') !== -1) {
      if (options.dynamicRoutes) {
        const addRoutes = await options.dynamicRoutes(table.path, request);
        if (addRoutes) {
          addRoutes.forEach(route => {
            const obj = typeof route === 'object' ? route : { path: route };
            // if section wasn't set, try to pull it in from the route config:
            if (!obj.section) {
              obj.section = pluginSettings && pluginSettings.section ? pluginSettings.section : 'none';
            }
            // if title wasn't set, try to pull it in from the route config:
            if (!obj.title && pluginSettings) {
              obj.title = pluginSettings.title; // its ok if this is undefined
            }
            // if url wasn't set, construct it from the route:
            if (!obj.url) {
              obj.url = `${protocol}://${request.info.host}${obj.path}`;
            }
            // add the route if it is not excluded:
            if (!options.excludeUrls.includes(obj.path)) {
              results.push(obj);
            }
          });
        }
      } else {
        server.log(['hapi-generate-sitemap', 'warning'], { path: table.path, message: 'Not found in dynamic routes' });
      }
      return;
    }
    // add the route if it is not excluded:
    if (!options.excludeUrls.includes(table.path)) {
      const page = {
        path: table.path,
        url: `${protocol}://${request.info.host}${table.path}`,
        section: pluginSettings && pluginSettings.section ? pluginSettings.section : 'none',
        title: pluginSettings ? pluginSettings.title : undefined,
        lastmod: pluginSettings ? pluginSettings.lastmod : undefined,
        priority: pluginSettings ? pluginSettings.priority : undefined,
        changefreq: pluginSettings ? pluginSettings.changefreq : undefined
      };
      // supplement or override with any additional metadata for this route:
      if (options.getRouteMetaData) {
        const metadata = await options.getRouteMetaData(page);
        // skip if getRouteMetaData returned false:
        if (metadata === false) {
          return;
        }
        Object.assign(page, metadata);
      }
      results.push(page);
    }
    return;
  };


  const routePromises = routeTable.map(table => parseRoute(table));

  await Promise.all(routePromises);

  return results;
};
