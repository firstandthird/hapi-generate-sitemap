module.exports = (server, options) => {
  const routeTable = server.table();
  const results = [];

  const skip = ['/favicon.ico'];

  routeTable.forEach((route) => {
    route.table.forEach((table) => {
      // exclude matching route tags:
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
        return;
      }
      if (table.public.method !== 'get') {
        return;
      }

      if (skip.includes(table.path)) {
        return;
      }

      results.push(table.path);
    });
  });

  return results;
};
