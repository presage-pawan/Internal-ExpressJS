import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRequestedEnvironment, isEnvironmentAuthorized } from './environment-context.js';

const admin = { _id: 'admin-1', user_role: 'admin', user_status: 'active', visible: true };
const worker = { _id: 'worker-1', user_role: 'worker', user_status: 'active', visible: true };

test('internal identity APIs are server-bound to production and ignore client selector', () => {
  assert.equal(resolveRequestedEnvironment({ baseUrl: '/api/internal', headers: {} }), 'production');
  assert.equal(resolveRequestedEnvironment({ baseUrl: '/api/internal', headers: { 'x-db-type': 'staging' } }), 'production');
});

test('CMMS APIs require an explicit known environment', () => {
  assert.throws(() => resolveRequestedEnvironment({ baseUrl: '/api/cmms', headers: {} }), (e) => e.status === 400);
  assert.throws(() => resolveRequestedEnvironment({ baseUrl: '/api/cmms', headers: { 'x-db-type': 'prod' } }), (e) => e.status === 400);
  assert.equal(resolveRequestedEnvironment({ baseUrl: '/api/cmms', headers: { 'x-db-type': 'staging' } }), 'staging');
  assert.equal(resolveRequestedEnvironment({ baseUrl: '/api/cmms', headers: { 'x-db-type': 'production' } }), 'production');
});

test('admin can use either recognized CMMS environment', () => {
  assert.equal(isEnvironmentAuthorized(admin, 'production', []), true);
  assert.equal(isEnvironmentAuthorized(admin, 'staging', []), true);
});

test('non-admin requires a matching assignment with at least one company', () => {
  assert.equal(isEnvironmentAuthorized(worker, 'staging', [{ db_type: 'staging', company_ids: ['c1'] }]), true);
  assert.equal(isEnvironmentAuthorized(worker, 'production', [{ db_type: 'staging', company_ids: ['c1'] }]), false);
  assert.equal(isEnvironmentAuthorized(worker, 'staging', [{ db_type: 'staging', company_ids: [] }]), false);
});
