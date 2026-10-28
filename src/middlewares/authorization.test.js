import test from 'node:test';
import assert from 'node:assert/strict';
import { hasInternalAction, requireInternalAction, requireSelfOrInternalAction } from './authorization.js';

const admin = { id: 'u-admin', _id: 'u-admin', user_role: 'admin', user_status: 'active', visible: true };
const worker = { id: 'u-worker', _id: 'u-worker', user_role: 'worker', user_status: 'active', visible: true };

function run(middleware, req) {
  return new Promise((resolve) => {
    middleware(req, {}, (err) => resolve(err || null));
  });
}

test('admin is allowed to manage internal users', () => {
  assert.equal(hasInternalAction(admin, 'internal.users.manage'), true);
});

test('worker cannot manage internal users or roles', () => {
  assert.equal(hasInternalAction(worker, 'internal.users.manage'), false);
  assert.equal(hasInternalAction(worker, 'internal.roles.manage'), false);
});

test('inactive or hidden admin is denied', () => {
  assert.equal(hasInternalAction({ ...admin, user_status: 'inactive' }, 'internal.users.manage'), false);
  assert.equal(hasInternalAction({ ...admin, visible: false }, 'internal.users.manage'), false);
});

test('requireInternalAction returns 403 for a worker and allows an admin', async () => {
  const denied = await run(requireInternalAction('internal.assignments.manage'), { user: worker });
  assert.equal(denied?.status, 403);
  const allowed = await run(requireInternalAction('internal.assignments.manage'), { user: admin });
  assert.equal(allowed, null);
});

test('self access is allowed but another user requires the action', async () => {
  const self = await run(requireSelfOrInternalAction('internal.assignments.manage'), { user: worker, params: { id: 'u-worker' } });
  assert.equal(self, null);
  const other = await run(requireSelfOrInternalAction('internal.assignments.manage'), { user: worker, params: { id: 'u-admin' } });
  assert.equal(other?.status, 403);
});
