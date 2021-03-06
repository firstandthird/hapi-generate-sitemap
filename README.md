# hapi-generate-sitemap

hapi-generate-sitemap is a simple [hapi](https://hapi.dev/) plugin that automates generating and serving your sitemap.html / sitemap.xml files.

## Install

```
npm install hapi-generate-sitemap
```

## Basic Usage

```js

await server.register(require('hapi-generate-sitemap'), {});

server.route({
  method: 'get',
  path: '/foopath1',
  config: {
    plugins: {
      sitemap: true
    }
  },
  handler(request, h) {
    return { success: true };
  }
});
```

Now GET _/sitemap.html_ and it will return:

```
<ul>
 <li><a href="http://localhost:8080/foopath">http://localhost:8080/foopath</a></li>
</ul>
```

GET _/sitemap.xml_ will return:

```xml
<?xml version="1.0" encoding="UTF-8"?>
  <url>
    <loc>http://localhost:8080/foopath</loc>
  </url>
</xml>
```

and GET _/sitemap.json_ will give:
```js
[{
  path: '/foopath',
}]
```

Note that you have to have _sitemap: true_ in your route config, or hapi-generate-sitemap will assume you do not want to show that route.

## Advanced Usage

hapi-generate-sitemap also supports populating a sitemap _template_ so you can customize the appearance of your HTML sitemap and render it with your view engine:

Say you are using [handlebars](https://handlebarsjs.com/) for rendering and you have a template called _sitemap_template.html_:

```html
<style>
a {
  color: green;
}
</style>

My Site Looks Like:
{{#each sitemap}}
    <a href="{{url}}">{{url}}</a>
{{/each}}
```

You can have hapi-generate-sitemap use this template:

```js
server.views({
  engines: { html: require('handlebars') },
  relativeTo: __dirname,
  path: 'views'
});

await server.register([
  {
    // hapi's template rendering library:
    plugin: require('vision'),
  },
  {
    plugin: require('hapi-generate-sitemap'),
    options: {
      htmlView: 'sitemap_template'
    }
  },
]);
```

Now when you GET _/sitemap.html_ the server will pass the  context to _sitemap_template.html_:

```js
{
  sitemap: [
   {
     path: '/foopath',
     url: 'http://localhost:8080/foopath',
     section: 'none',
     lastmod: '2005-01-01',
     changefreq: 'monthly',
     priority: 0.8
   }
 ]
}
```

And you will get something like:

```html
<style>
a {
  color: green;
}
</style>

My Site Looks Like:
<a href="http://localhost:8080/foopath">
  http://localhost:8080/foopath
</a>
```

## Query Options

You can pass these options as query parameters when you HTTP GET the sitemap:

- __meta__

Pass a positive value to this to include additional route metadata.  For example, if you have a route like this:
```javascript
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
```

 GET _sitemap.json?meta=1_ will return:
```javascript
[{
  path: '/path1',
  section: 'Interviews',
  lastmod: '2005-01-01',
  priority: 0.8,
  changefreq: 'monthly',
}]
```

- __all__

By default hapi-generate-sitemap will skip routes that don't have '_sitemap: true_' specified in their route config.  Passing the _all_ query parameter will ignore this and list all routes.

- __limit__

Limits the number of entries to show, eg _?limit=10_ will only show ten entries.

## Plugin Options

Pass these options when you _register()_ the plugin with hapi:

- __videoPages__

  A function which returns an array of videos on your site.  Each video should be returned in the format:

  ```js
  {
    url: '/the-video-url',
    video: {
      title: 'a car video',
      thumbnail_loc: 'car.png',
      description: 'description of a car video',
      content_loc: 'http://youtube.com/1234'
    }  
  ```

  and the video data will be listed as:
  ```html
  <video:video>
    <video:title>a car video</video:title>
    <video:description>description of a car video</video:description>
    <video:thumbnail_loc>car.png</video:thumbnail_loc>
    <video:content_loc>http://youtube.com/1234</video:content_loc>
  </video:video>
  ```

- __htmlView__

  Name of the template to use for rendering the HTML version of the sitemap, will use the built-in template if not specified.     

- __forceHttps__

  Forces each listed route to be 'https', default is false.

- __excludeTags__

  An array listing tags to be ignored. Routes containing one or more of these tags will not appear in the sitemap.

- __excludeUrls__

  An array of urls to be ignored.  These routes wiill not appear in the sitemap.

- __additionalRoutes__

  A function that returns a list of any additional routes you want to be listed on your sitemap.

- __dynamicRoutes__

  hapi allows you to specify routes that contain dynamic path parameters, for example _/user/{userName}_  will match both _/user/roberto_ and _/user/jin_. Since hapi does not know all the possible path options for dynamic parameters, you can pass a __dynamicRoutes__ function to manage these. __dynamicRoutes__ will take in the current _path_ and the _request_ (for access to query values) as parameters and should return a list of routes that mapping for the dynamic route like so:
  ```js
  function dynamicRoutes(path, request) {
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
  ```    

- __getRouteMetaData__

  You can also pass a __getRouteMetaData__ function to augment or override the path information contained by the server.  The current page data will be passed to the function.  If the function returns a false value then there is no effect.  If the function returns an object, it will be combined with the existing _page_ object, matching values that also exist in _page_ will be over-written by the metadata:  

```js
getRouteMetaData(page) {
  if (page.path === '/path1') {
    return {
      lastmod: '2005-01-01',
      priority: 0.8,
    };
  }
  return false;
}
```

- __endpoint__

  The root path where you can get the sitemap, default is "_/sitemap_".


- __logRequest__

  Specifies whether to log each request for the sitemap, default is false.

- __maxPerPage__

  Max number of route entries to return per page, default is 1000.
