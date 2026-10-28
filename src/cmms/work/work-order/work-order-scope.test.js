import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWorkOrderIdentityFilter } from './work-order-scope.js';

test('company-scoped work order identity includes account_id', () => {
  assert.deepEqual(buildWorkOrderIdentityFilter('wo-1', 'company-1'), { _id: 'wo-1', account_id: 'company-1' });
});

test('platform-admin flat lookup remains explicitly global', () => {
  assert.deepEqual(buildWorkOrderIdentityFilter('wo-1'), { _id: 'wo-1' });
});
