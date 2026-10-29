import assert from 'node:assert/strict';
import test from 'node:test';
import companyRouter from './company.route.js';

const worker = { _id: 'worker', user_role: 'worker', user_status: 'active', visible: true };
const admin = { _id: 'admin', user_role: 'admin', user_status: 'active', visible: true };

async function run(layer, user) {
  return new Promise(resolve => {
    layer.handle({ user, params: { id: 'company-1' } }, {}, error => resolve(error || null));
  });
}

test('company account-role-menu mutations enforce global administrator action', async () => {
  for (const [path, verb] of [['/:id/account-role-menu', 'put'], ['/:id/account-role-menu/reset', 'post']]) {
    const route = companyRouter.stack.find(layer => layer.route?.path === path)?.route;
    assert.ok(route, path);
    const handlers = route.stack.filter(layer => layer.method === verb);
    // Authentication is the first handler, followed by the action boundary.
    assert.ok(handlers.length >= 4);
    assert.equal((await run(handlers[1], worker))?.status, 403);
    assert.equal(await run(handlers[1], admin), null);
  }
});
