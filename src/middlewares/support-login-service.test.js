import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidSupportLoginServiceKey } from './support-login-service.js';

test('support-login service credential requires an exact configured value', () => {
  assert.equal(isValidSupportLoginServiceKey('shared-secret', 'shared-secret'), true);
  assert.equal(isValidSupportLoginServiceKey('wrong-secret', 'shared-secret'), false);
  assert.equal(isValidSupportLoginServiceKey('', 'shared-secret'), false);
});
