import assert from 'node:assert/strict';
import test from 'node:test';
import router from './invoice.route.js';

test('invoice endpoints require explicit action grants even for administrators', async () => {
  const cases = [
    ['/', 'get'], ['/', 'post'], ['/bulk', 'post'],
    ['/reports/monthly', 'get'], ['/reports/range', 'get'],
    ['/:id/schedules', 'get'], ['/:id', 'get'], ['/:id', 'patch'], ['/:id', 'delete']
  ];
  for (const [path, method] of cases) {
    const route = router.stack.find(layer => layer.route?.path === path)?.route;
    assert.ok(route, path);
    const middleware = route.stack.find(layer => layer.method === method)?.handle;
    assert.ok(middleware, path + ' ' + method);
    const error = await new Promise(resolve => middleware({ user: null }, {}, next => resolve(next)));
    assert.equal(error?.status, 403, path + ' ' + method);
  }
});
