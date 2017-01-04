import {createRoute, getLocation, getURL, toURLString} from './router';

export function navigateApp({prefix}) {
  const routes = [];
  const pages = {};
  prefix = prefix || '';
  let currentPage, currentLocation, pageViewId = 0;

  function qualify(url) {
    const pf = `${window.location.protocol}//${window.location.host}`;
    return url.indexOf(pf) < 0 ? `${pf}${url.replace(/^\/?/, '/')}` : url;
  }

  function loadURL(url) {
    const location = getLocation(routes, qualify(url));
    currentPage = pages[location.page] || pages[404];
    currentLocation = location;

    if (currentPage && currentPage.onLoad) {
      return currentPage.onLoad(currentLocation);
    }
  }

  function getCurrentURL() {
    return toURLString(currentLocation);
  }

  function updateQueryParams(params) {
    if (!currentPage) {
      throw new Error('Cannot update query params before a page is loaded');
    }

    currentLocation.query = params;
    const url = getCurrentURL();
    history.pushState({}, '', url);
    return loadURL(url);
  }

  function gotoURL(url, historyMethod) {
    if (currentPage && currentPage.canUnload) {
      if (currentPage.canUnload(currentLocation) === false) {
        return;
      }
    }

    if (currentPage && currentPage.onUnload) {
      currentPage.onUnload(currentLocation);
    }

    history[historyMethod]({}, '', url.replace(new RegExp(`^(${prefix})?`), prefix));
    return loadURL(url);
  }

  return {
    loadURL,
    getCurrentURL,

    getURL(...args) {
      return getURL(routes, ...args);
    },

    addPage(name, route, page) {
      routes.push(createRoute(name, route, {prefix}));
      pages[name] = page;
    },

    start() {
      window.onpopstate = function () {
        loadURL(location.href);
      };

      return loadURL(location.href);
    },

    gotoURL(url) {
      return gotoURL(url, 'pushState');
    },

    replaceURL(url) {
      return gotoURL(url, 'replaceState');
    },

    updateQueryParams(params) {
      return updateQueryParams(Object.keys(params).reduce((newParams, key) => {
        newParams[key] = params[key];
        return newParams;
      }, currentLocation.query));
    },

    clearQueryParams() {
      return updateQueryParams({});
    },

    getLocation(url) {
      return url ? getLocation(routes, qualify(url)) : currentLocation;
    }
  };
}
