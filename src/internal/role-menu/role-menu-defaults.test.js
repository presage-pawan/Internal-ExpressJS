import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeRoleMenuDefaults } from './role-menu-defaults.js';

test('adds missing defaults without replacing explicit permissions', () => {
  const current = { users: { view: false } };
  const defaults = { users: { view: true }, reports: { view: true } };
  const merged = mergeRoleMenuDefaults(current, defaults);
  assert.deepEqual(merged, { users: { view: false }, reports: { view: true } });
  assert.deepEqual(current, { users: { view: false } });
});

test('returns an independent object when defaults are already present', () => {
  const current = { users: { view: false } };
  const merged = mergeRoleMenuDefaults(current, { users: { view: true } });
  assert.notEqual(merged, current);
});
