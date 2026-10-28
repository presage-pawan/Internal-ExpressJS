import test from 'node:test';
import assert from 'node:assert/strict';
import { mappingUsesAllowedWorkOrder, restrictIdsToCompany } from './map-user-work-order-scope.js';

test('work-order mapping belongs to company only through an allowed work order', () => {
  assert.equal(mappingUsesAllowedWorkOrder({ woId: 'wo-1' }, ['wo-1','wo-2']), true);
  assert.equal(mappingUsesAllowedWorkOrder({ woId: 'wo-3' }, ['wo-1','wo-2']), false);
});

test('builds an explicit allowed-ID predicate', () => {
  assert.deepEqual(restrictIdsToCompany(['wo-1','wo-2']), { $in: ['wo-1','wo-2'] });
});
