import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('company user namespace excludes non-tenant verification records', () => {
  const routes = read('./users/users.routes.js');
  const companyBlock = routes.slice(routes.indexOf('const companyRouter'));
  assert.doesNotMatch(companyBlock, /companyRouter\.use\('\/verifications'/);
});

for (const base of ['user-logs/user-logs', 'user-token/user-token', 'user-role-menu/role-menu']) {
  test(`${base} carries company context into record operations`, () => {
    const controller = read(`./users/${base}.controller.js`);
    const service = read(`./users/${base}.service.js`);
    assert.match(controller, /req\.companyId|companyId/);
    assert.match(service, /account_id/);
  });
}

test('company-scoped query filters cannot be overridden by account query parameters', () => {
  const logs = read('./users/user-logs/user-logs.controller.js');
  const roles = read('./users/user-role-menu/role-menu.controller.js');
  const tokens = read('./users/user-token/user-token.controller.js');
  for (const source of [logs, roles, tokens]) {
    assert.match(source, /if \(req\.companyId|if \(companyId/);
  }
});
