# Sparou - Single Page Application Router

Sparou provides "just enough structure" to navigate a single page web
application.

### Routes

Sparou includes a simple router. It supports URL templates with named parts, and
allows you to order routes by precedence. A route is associated with a page
name, and is used to resolve which page is being requested.

The router is bi-directional. It can resolve page name and parameters from URLs,
and it can generate URLs from a page name and parameters. The router also parses
and exposes query string parameters, but cannot route based on them.

### Pages

A page is an object with some hooks on it. When a page is requested, Sparou will
perform the following steps:

* Try to call `canUnload` on the currently loaded page. If this function returns
  `false`, nothing more happens. If there is no current page, the current page
  does not implement `canUnload`, or the current page's `canUnload` returns
  anything other than `false`, Sparou continues with unloading the current page.
* Call `onUnload` on the current page, if there is one (and it defines the
  `onUnload` hook). This allows for performing state cleanup before loading a
  new URL.
* Call `onLoad` on the page matching the new URL. The routing resolution is
  passed as an argument.

## API docs

### `const appNav = navigateApp({prefix})`

Create an application navigator. The prefix is optional, and can be set if your
application is not served from the host root (e.g. your app is at
`http://example.com/lol/`).

### `nav.loadURL(url)`

Load the new URL.

### `nav.gotoURL(url)`

Like `loadURL`, but also push the `url` to the browser.

### `nav.getURL(pageName, params)`

Use the bi-directional router to generate a URL from the page name and
parameters.

### `nav.getCurrentURL()`

Returns the URL corresponding to the current page and current query parameters.
You can modify the location `query` and have it reflected in the URL returned
from `getCurrentURL`.

```js
nav.updateQueryParams({id: 42});
nav.getCurrentURL(); // ...?id=42
```

### `app.updateQueryParams(params)`

Add some URL query parameters. This will cause the app to refresh with the new
query parameters included in the URL. The new URL will also be loaded in the
browser.

### `app.start()`

Kick things off by loading `location.href`.

### Pages

Pages are plain old JavaScript objects.

#### `page.onLoad(location)`

The user navigated to this page. `location` is described with the router below.

#### `page.canUnload()`

Return `false` to stop the user from navigating away from this page. Useful if
there is unsaved changes etc. The user will probably appreciate it if you
provide a visual clue that the navigation was prevented.

#### `page.onUnload()`

Called before leaving this page to load another. Can be used to clean up
page-specific state etc.

## The router

The router is not exposed directly, although it is completely possible to use it
on its own if desired.

### `const routingTable = createRoutes(routes[, {prefix}])`

Creates a routing table. `routes` is an array of routes, where each route is a
tuple of `[pageName, urlTemplate]`. The `prefix` can be used to ignore static
URL prefixes, e.g. to target a URL like `/my/app/news/23` with the route
`/news/:id` and the prefix `/my/app`.

### `const url = toURLString({path, query})`

Produces a URL string from a path and a query parameter object.

### `const url = getURL(routes, page, params)`

Generates the URL to the given page type with the given parameters.

### `const location = getLocation(routes, url)`

Returns the matching page from the routing table for the giving URL. If no route
matches, it returns `null`. The location description includes the following
properties:

#### String `page`

The name of the matching page.

#### String `url`

The URL matched against.

#### String `path`

Only the path part of the URL matched against.

#### Object `params`

Parameters matched from the route. Any `:paramName` placeholder from URL
templates are included. For instance, if the matching route was `/stuff/:id`,
then `params` will contain the `id` property.

#### Object `query`

The query string, parsed into an object.
