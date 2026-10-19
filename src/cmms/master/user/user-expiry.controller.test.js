import test from 'node:test';
import assert from 'node:assert/strict';
import { UserController } from './user.controller.js';

for (const method of ['updateUser', 'updatePartial']) {
  test(`${method} enforces user-management edit permission for expiry changes`, async () => {
    const controller = new UserController();
    let writes = 0;
    controller.getService = () => ({ [method]: async () => { writes++; return { id: 'user', passwordExpired: false }; } });
    controller.getRoleMenuService = () => ({ getRoles: async () => [{ roleMenu: { user_management: { edit: false } } }] });
    const req = { body: { passwordExpiryAction: 'extend-three-months' }, params: { id: '64a000000000000000000001' }, db_type: 'staging', user: { _id: '64a000000000000000000002', user_role: 'employee' } };
    const res = { status() { return this; }, json() {} };
    let error;
    await controller[method](req, res, value => { error = value; });
    assert.equal(error?.status, 403); assert.equal(writes, 0);
    controller.getRoleMenuService = () => ({ getRoles: async () => [{ roleMenu: { user_management: { edit: true } } }] });
    error = undefined;
    await controller[method](req, res, value => { error = value; });
    assert.equal(error, undefined); assert.equal(writes, 1);
  });
}

test('admin expiry update keeps the existing response envelope and selected environment', async () => {
  const controller = new UserController();
  const req = { body: { passwordExpiredAt: '2099-01-01' }, params: { id: '64a000000000000000000001' }, db_type: 'staging', user: { user_role: 'admin' } };
  let body;
  controller.getService = request => {
    assert.equal(request.db_type, 'staging');
    return { updateUser: async (_id, update) => ({ ...update, passwordExpired: false }) };
  };
  await controller.updateUser(req, { status(code) { assert.equal(code, 200); return this; }, json(value) { body = value; } }, error => { throw error; });
  assert.equal(body.status, true); assert.equal(body.data.passwordExpired, false);
  assert.deepEqual(Object.keys(body).sort(), ['data', 'message', 'status']);
});
