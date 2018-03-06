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
    const pluginSettings = table.settings.plugins.sitemap;

    if (table.path.indexOf('{') !== -1) {
      if (options.dynamicRoutes) {
        const addRoutes = await options.dynamicRoutes(table.path, request);
        if (addRoutes) {
          addRoutes.forEach(r => {
            const obj = typeof r === 'object' ? r : { path: r };
            // if section wasn't set, try to pull it in from the route config:
            if (!obj.section) {
              obj.section = pluginSettings && pluginSettings.section ? pluginSettings.section : 'none';
            }
            // if title wasn't set, try to pull it in from the route config:
            if (!obj.title && pluginSettings) {
              obj.title = pluginSettings.title; // its ok if this is undefined
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
      results.push({
        path: table.path,
        section: pluginSettings && pluginSettings.section ? pluginSettings.section : 'none',
        title: pluginSettings ? pluginSettings.title : undefined,
        lastmod: pluginSettings ? pluginSettings.lastmod : undefined,
        priority: pluginSettings ? pluginSettings.priority : undefined,
        changefreq: pluginSettings ? pluginSettings.changefreq : undefined
      });
    }
    return;
  };


  const routePromises = routeTable.map(table => parseRoute(table));

  await Promise.all(routePromises);

  return results;
};
