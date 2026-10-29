import assert from 'node:assert/strict';
import test from 'node:test';
import router from './sap-mapping.route.js';

test('SAP mapping read, create, change and delete routes require action-level server permissions', async () => {
  const cases = [['/options/accounts', 'get'], ['/options/users', 'get'],
    ['/', 'get'], ['/', 'post'], ['/:id', 'get'],
    ['/:id', 'put'], ['/:id', 'delete']];
  for (const [path, method] of cases) {
    const route = router.stack.find(item => item.route?.path === path)?.route;
    assert.ok(route, path);
    const handlers = route.stack.filter(layer => layer.method === method);
    assert.ok(handlers.length > 1);
    const error = await new Promise(resolve =>
      handlers[0].handle({ user: null }, {}, issue => resolve(issue))
    );
    assert.equal(error?.status, 403, path + ' ' + method);
  }
});
