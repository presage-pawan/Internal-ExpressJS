import test from 'node:test';
import assert from 'node:assert/strict';
import { hasExplicitInternalPermission, requireInternalPermission } from './internal-permission.js';

const role = {
  master_blog: { view: true },
  blog: { parent: 'master_blog', view: true, add: false, edit: true, delete: false }
};

test('Internal explicit permission requires grant and visible parent', () => {
  assert.equal(hasExplicitInternalPermission(role, 'blog', 'view'), true);
  assert.equal(hasExplicitInternalPermission(role, 'blog', 'edit'), true);
  assert.equal(hasExplicitInternalPermission(role, 'blog', 'add'), false);
  assert.equal(hasExplicitInternalPermission(role, 'blog', 'delete'), false);
  assert.equal(hasExplicitInternalPermission({}, 'blog', 'view'), false);
  assert.equal(hasExplicitInternalPermission({ ...role, master_blog: { view: false } }, 'blog', 'edit'), false);
  assert.equal(hasExplicitInternalPermission({ ...role, blog: { ...role.blog, view: false } }, 'blog', 'edit'), false);
});

test('server reads actor-specific role menu on each mutating request and fails closed', async () => {
  const calls = [];
  const factory = () => ({
    getRoles: async filter => {
      calls.push(filter);
      return [{ roleMenu: role }];
    }
  });
  const run = (req, permission = 'edit') => new Promise(resolve => {
    requireInternalPermission('blog', permission, factory)(req, {}, err => resolve(err || null));
  });
  const request = { user: { _id: 'u-1', user_role: 'admin', user_status: 'active', visible: true }, db_type: 'production' };
  assert.equal(await run(request), null);
  assert.deepEqual(calls, [{ userId: 'u-1', visible: true }]);
  assert.equal((await run(request, 'delete'))?.status, 403);
  assert.equal((await run({ ...request, user: { ...request.user, user_status: 'inactive' } }))?.status, 403);
  assert.equal((await run({ ...request, user: { ...request.user, visible: false } }))?.status, 403);
  assert.equal((await run({ ...request, user: null }))?.status, 403);
});

test('Internal blog mutation routes all use explicit permission policy', async () => {
  const { default: router } = await import('../internal/blog/blog.route.js');
  for (const [path, methods] of [['/', ['post']], ['/:id', ['put', 'patch', 'delete']]]) {
    const route = router.stack.find(item => item.route?.path === path)?.route;
    assert.ok(route, path);
    for (const method of methods) {
      const stack = route.stack.filter(item => item.method === method);
      assert.ok(stack.length >= 2, method);
      // First handler must enforce role menu access before validators/controllers.
      const denied = await new Promise(resolve => {
        stack[0].handle({ user: null }, {}, err => resolve(err));
      });
      assert.equal(denied?.status, 403, method);
    }
  }
});
