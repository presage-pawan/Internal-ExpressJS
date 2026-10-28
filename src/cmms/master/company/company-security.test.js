import test from 'node:test';
import assert from 'node:assert/strict';
import { isCompanyAccessible, stripCompanySecrets } from './company-security.js';

const admin = { id: 'admin', user_role: 'admin', user_status: 'active', visible: true };
const worker = { id: 'worker', user_role: 'worker', user_status: 'active', visible: true };

test('admin can access any company and worker needs assignment', () => {
  assert.equal(isCompanyAccessible(admin, 'c2', []), true);
  assert.equal(isCompanyAccessible(worker, 'c1', [{ company_ids: ['c1', 'c3'] }]), true);
  assert.equal(isCompanyAccessible(worker, 'c2', [{ company_ids: ['c1', 'c3'] }]), false);
});

test('routine company DTO removes reusable credential fields', () => {
  const sanitized = stripCompanySecrets({
    _id: 'c1', account_name: 'Plant', apiKey: 'secret-a', download_api_key: 'secret-b',
    downloadToken: 'secret-c', external_token: 'secret-d',
    downloadTokenDetails: { apiKey: 'secret-e' }, apiKeyVisible: true, hasExistingToken: true
  });
  assert.equal(sanitized._id, 'c1');
  assert.equal(sanitized.account_name, 'Plant');
  assert.equal(sanitized.apiKeyVisible, true);
  assert.equal(sanitized.hasExistingToken, true);
  for (const key of ['apiKey','download_api_key','downloadToken','external_token','downloadTokenDetails']) {
    assert.equal(Object.prototype.hasOwnProperty.call(sanitized, key), false, key);
  }
});

test('secret stripping does not mutate the source object', () => {
  const source = { _id: 'c1', apiKey: 'secret', account_name: 'Plant' };
  const result = stripCompanySecrets(source);
  assert.equal(source.apiKey, 'secret');
  assert.notEqual(result, source);
});
