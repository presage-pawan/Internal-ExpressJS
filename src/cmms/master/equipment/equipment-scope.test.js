import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEquipmentMutationFilter, extractEquipmentLocationIds, equipmentBelongsToAllowedLocations } from './equipment-scope.js';

test('extracts unique equipment location references', () => {
  assert.deepEqual(extractEquipmentLocationIds({ Equipment: { value: [
    { location_id: 'l1' }, { location_id: 'l2' }, { location_id: 'l1' }
  ] } }), ['l1','l2']);
});

test('equipment company scope requires at least one location and all locations allowed', () => {
  assert.equal(equipmentBelongsToAllowedLocations({ Equipment: { value: [{ location_id: 'l1' }] } }, ['l1']), true);
  assert.equal(equipmentBelongsToAllowedLocations({ Equipment: { value: [{ location_id: 'l1' }, { location_id: 'l2' }] } }, ['l1']), false);
  assert.equal(equipmentBelongsToAllowedLocations({ Equipment: { value: [] } }, ['l1']), false);
});


test('builds an atomic equipment mutation predicate for allowed locations', () => {
  assert.deepEqual(buildEquipmentMutationFilter('equipment-1', ['l1', 'l2']), {
    _id: 'equipment-1',
    'Equipment.value.0': { $exists: true },
    'Equipment.value': { $not: { $elemMatch: { location_id: { $nin: ['l1', 'l2'] } } } }
  });
  assert.deepEqual(buildEquipmentMutationFilter('equipment-1', null), { _id: 'equipment-1' });
});
