import test from 'node:test';
import assert from 'node:assert/strict';
import { bindCompanyPayload } from './tenant-payload.js';

test('company context overrides a conflicting tenant field', () => {
  assert.deepEqual(bindCompanyPayload({ account_id: 'other', name: 'x' }, 'company-1'), {
    account_id: 'company-1',
    name: 'x'
  });
  assert.deepEqual(bindCompanyPayload({ accountId: 'other' }, 'company-1', 'accountId'), {
    accountId: 'company-1'
  });
});

test('flat admin payload is unchanged without company context', () => {
  assert.deepEqual(bindCompanyPayload({ account_id: 'company-2', name: 'x' }), {
    account_id: 'company-2',
    name: 'x'
  });
});
