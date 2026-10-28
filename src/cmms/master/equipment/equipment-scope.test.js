import test from 'node:test';
import assert from 'node:assert/strict';
import { extractEquipmentLocationIds, equipmentBelongsToAllowedLocations } from './equipment-scope.js';

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
