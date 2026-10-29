import assert from 'node:assert/strict';
import test from 'node:test';
import router from './sales-lead.route.js';

test('sales-lead mutations enforce explicit server-side permissions for every action', async () => {
  const routes = [
    ['/', ['post']],
    ['/bulk', ['post']],
    ['/:id/interactions', ['post']],
    ['/:id/owner', ['patch']],
    ['/:id', ['patch', 'delete']]
  ];
  for (const [path, methods] of routes) {
    const route = router.stack.find(layer => layer.route?.path === path)?.route;
    assert.ok(route, path);
    for (const method of methods) {
      const handlers = route.stack.filter(layer => layer.method === method);
      assert.ok(handlers.length >= 2, path + ' ' + method);
      const error = await new Promise(resolve =>
        handlers[0].handle({ user: null }, {}, issue => resolve(issue))
      );
      assert.equal(error?.status, 403, path + ' ' + method);
    }
  }
});
