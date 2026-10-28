import test from 'node:test';
import assert from 'node:assert/strict';
import { pickSelfProfileFields, pickAdminProfileFields, pickCreateUserFields } from './user-field-policy.js';

test('self profile cannot change role, status, identity, password or visibility', () => {
  assert.deepEqual(pickSelfProfileFields({
    firstName: 'A', about: 'B', user_role: 'admin', user_status: 'inactive',
    email: 'other@example.com', username: 'other', password: 'secret', visible: false
  }), { firstName: 'A', about: 'B' });
});

test('admin profile uses an explicit field allowlist but excludes password', () => {
  assert.deepEqual(pickAdminProfileFields({
    firstName: 'A', user_role: 'manager', visible: false, password: 'secret', createdBy: 'x'
  }), { firstName: 'A', user_role: 'manager', visible: false });
});

test('create user allows password but drops unknown administrative metadata', () => {
  assert.deepEqual(pickCreateUserFields({
    firstName: 'A', username: 'a', email: 'a@example.com', password: 'Secret123',
    createdBy: 'forged', accessTokens: ['x']
  }), { firstName: 'A', username: 'a', email: 'a@example.com', password: 'Secret123' });
});
