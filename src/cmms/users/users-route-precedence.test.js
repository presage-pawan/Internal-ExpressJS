import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('role-menu user route is registered before the generic id route', () => {
  const source = read('./user-role-menu/role-menu.route.js');
  const userRoute = source.indexOf("router.get('/user/:userId'");
  const idRoute = source.indexOf("router.get('/:id'");
  assert.ok(userRoute >= 0, 'user lookup route must exist');
  assert.ok(idRoute >= 0, 'generic id route must exist');
  assert.ok(userRoute < idRoute, 'specific /user/:userId route must precede /:id');
});

test('top-level user submodules are registered before the generic id alias', () => {
  const source = read('./users.routes.js');
  const idRoute = source.indexOf("router.get('/:id'");
  for (const path of ['/logs', '/tokens', '/role-menus', '/verifications']) {
    const route = source.indexOf(`router.use('${path}'`);
    assert.ok(route >= 0, `${path} route must exist`);
    assert.ok(route < idRoute, `${path} must precede /:id`);
  }
});
