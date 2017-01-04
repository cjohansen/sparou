/*global describe, beforeEach, it */
import {navigateApp} from '../';
import {assert, refute, sinon} from './test-helper';

function promised(val) {
  return new Promise((resolve, reject) => resolve(val));
}

describe('Sparou', () => {
  let app, page;

  beforeEach(() => {
    app = navigateApp({});
    page = {onLoad: sinon.stub()};
    app.addPage('viewUser', '/users/:id', page);
    global.history = {pushState: sinon.spy()};
  });

  describe('loadURL', () => {
    it('calls onLoad on page', () => {
      app.loadURL('/users/42');

      assert.calledOnce(page.onLoad);
      assert.match(page.onLoad.getCall(0).args, [{
        page: 'viewUser',
        params: {id: 42},
        path: '/users/42',
        port: 80,
        query: {},
        scheme: 'http',
        url: 'http://localhost/users/42'
      }]);
    });

    it('does not require an onLoad function', () => {
      delete page.onLoad;

      refute.exception(() => app.loadURL('/users/42'));
    });

    it('renders the 404 page if no matching page is found', () => {
      const notFound = {onLoad: sinon.spy()};
      app.addPage('404', '/404', notFound);

      app.loadURL('/zorg');

      assert.calledOnce(notFound.onLoad);
    });

    it('routes prefixed page', () => {
      const app = navigateApp({prefix: '/myapp'});
      const page = {onLoad: sinon.spy()};
      app.addPage('viewThing', '/things/:id', page);

      app.loadURL('/myapp/things/42');

      assert.equals(page.onLoad.getCall(0).args[0].params, {id: 42})
    });
  });

  describe('getCurrentURL', () => {
    it('returns full URL for current location', () => {
      app.loadURL('/users/someone', {more: 'states'});

      assert.equals(app.getCurrentURL(), '/users/someone');
    });
  });

  describe('getURL', () => {
    it('resolves page URL with router', () => {
      assert.equals(app.getURL('viewUser', {id: 12}), '/users/12');
    });

    it('resolves prefixed page URL', () => {
      const app = navigateApp({prefix: '/myapp'});
      app.addPage('viewIndex', '/', {});

      assert.equals(app.getURL('viewIndex', {}), '/myapp/');
    });
  });

  describe('gotoURL', () => {
    it('adds prefixes to browser URLs', () => {
      const app = navigateApp({prefix: '/myapp'});
      const page = {onLoad: sinon.stub()};
      app.addPage('viewList', '/lists/:id', page);

      app.gotoURL('/lists/42');

      assert.calledOnce(global.history.pushState);
      assert.equals(global.history.pushState.getCall(0).args[2], '/myapp/lists/42');
      assert.match(page.onLoad.getCall(0).args[0], {params: {id: 42}});
    });

    it('does not duplicate incoming prefixes', () => {
      const app = navigateApp({prefix: '/myapp'});
      const page = {onLoad: sinon.stub()};
      app.addPage('viewList', '/lists/:id', page);

      app.gotoURL('/myapp/lists/42');

      assert.calledOnce(global.history.pushState);
      assert.equals(global.history.pushState.getCall(0).args[2], '/myapp/lists/42');
      assert.match(page.onLoad.getCall(0).args[0], {params: {id: 42}});
    });
  });

  describe('loadURL', () => {
    it('ignores incoming prefixes', () => {
      const app = navigateApp({prefix: '/myapp'});
      const page = {onLoad: sinon.stub()};
      app.addPage('viewList', '/lists/:id', page);

      app.loadURL('/myapp/lists/42');

      assert.match(page.onLoad.getCall(0).args[0], {params: {id: 42}});
    });
  });

  describe('updateQueryParams', () => {
    it('adds params to the location', () => {
      app.loadURL('/users/42');

      app.updateQueryParams({filter: 'everything'});

      assert.equals(app.getCurrentURL(), '/users/42?filter=everything');
      assert.equals(page.onLoad.getCall(1).args[0].query, {filter: 'everything'});
    });
  });

  describe('clearQueryParams', () => {
    it('removes all query params', () => {
      app.loadURL('/users/42?a=42&b=13');
      app.clearQueryParams();

      assert.equals(app.getCurrentURL(), '/users/42');
    });
  });

  describe('canUnload', () => {
    let page1, page2;

    beforeEach(() => {
      page1 = {canUnload: sinon.stub()};
      page2 = {onLoad: sinon.stub()};
      app.addPage('viewUser', '/users/:id', page1);
      app.addPage('viewSettings', '/settings/:id', page2);
    });

    it('calls canUnload before calling onLoad on next page', () => {
      app.gotoURL('/users/1');
      app.gotoURL('/settings/1');

      assert.calledOnce(page1.canUnload);
      assert.callOrder(page1.canUnload, page2.onLoad);
    });

    it('does not navigate if canUnload returns false', () => {
      page1.canUnload.returns(false);

      app.gotoURL('/users/1');
      app.gotoURL('/settings/1');

      refute.called(page2.onLoad);
    });
  });

  describe('onUnload', () => {
    beforeEach(() => {
      page = {onUnload: sinon.stub()};
      app.addPage('viewUser', '/users/:id', page);
      app.addPage('viewSettings', '/settings/:id', {render() {}});

    });

    it('calls onUnload before loading new page', () => {
      app.gotoURL('/users/1');
      refute.called(page.onUnload);

      app.gotoURL('/settings/1');
      assert.calledOnce(page.onUnload);
    });

    it('calls onUnload if canUnload returns true', () => {
      page.canUnload = sinon.stub().returns(true);

      app.gotoURL('/users/1');
      refute.called(page.onUnload);

      app.gotoURL('/settings/1');
      assert.callOrder(page.canUnload, page.onUnload);
    });

    it('does not call onUnload if canUnload returns false', () => {
      page.canUnload = sinon.stub().returns(false);

      app.gotoURL('/users/1');
      refute.called(page.onUnload);

      app.gotoURL('/settings/1');
      refute.called(page.onUnload);
    });
  });
});
