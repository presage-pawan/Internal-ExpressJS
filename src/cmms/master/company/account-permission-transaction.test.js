import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPermissionVersionFilter } from './account-permission-transaction.js';

test('uses the exact persisted permission version when present', () => {
  assert.deepEqual(buildPermissionVersionFilter('account-1', 4), {
    _id: 'account-1',
    account_permission_version: 4
  });
});

test('allows only legacy missing-version documents when the observed version is missing', () => {
  assert.deepEqual(buildPermissionVersionFilter('account-1', undefined), {
    _id: 'account-1',
    account_permission_version: { $exists: false }
  });
});
