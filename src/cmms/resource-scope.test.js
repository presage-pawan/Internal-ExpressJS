import test from 'node:test';
import assert from 'node:assert/strict';
import { buildResourceScopeFilter, applyCompanyScope } from './resource-scope.js';

test('resource identity binds to company when company context exists', () => {
  assert.deepEqual(buildResourceScopeFilter('resource-1', 'company-1'), {
    _id: 'resource-1',
    account_id: 'company-1'
  });
  assert.deepEqual(buildResourceScopeFilter('resource-1', 'company-1', 'accountId'), {
    _id: 'resource-1',
    accountId: 'company-1'
  });
});

test('flat admin identity remains global when no company context exists', () => {
  assert.deepEqual(buildResourceScopeFilter('resource-1'), { _id: 'resource-1' });
});

test('list filters inherit company scope without mutating caller filter', () => {
  const original = { visible: { $ne: false } };
  assert.deepEqual(applyCompanyScope(original, 'company-1'), {
    visible: { $ne: false },
    account_id: 'company-1'
  });
  assert.deepEqual(original, { visible: { $ne: false } });
});
