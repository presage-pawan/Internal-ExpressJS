import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldRevokeSessions } from './user-session-policy.js';

test('revokes sessions for credential changes', () => {
  assert.equal(shouldRevokeSessions({ password: 'new-value' }), true);
});

test('revokes sessions for role and status changes', () => {
  assert.equal(shouldRevokeSessions({ user_role: 'manager' }), true);
  assert.equal(shouldRevokeSessions({ userstatus: 'inactive' }), true);
  assert.equal(shouldRevokeSessions({ visible: false }), true);
});

test('revokes sessions when resulting user is inactive or hidden', () => {
  assert.equal(shouldRevokeSessions({}, { user_status: 'inactive', visible: true }), true);
  assert.equal(shouldRevokeSessions({}, { user_status: 'active', visible: false }), true);
});

test('preserves sessions for ordinary profile changes', () => {
  assert.equal(shouldRevokeSessions({ firstName: 'Updated', about: 'Profile text' }, { user_status: 'active', visible: true }), false);
});
