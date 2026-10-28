import test from 'node:test';
import assert from 'node:assert/strict';
import { isExactSecretMatch } from './support-login-secret.js';

test('support-login service credential requires an exact configured value', () => {
  assert.equal(isExactSecretMatch('shared-secret', 'shared-secret'), true);
  assert.equal(isExactSecretMatch('wrong-secret', 'shared-secret'), false);
  assert.equal(isExactSecretMatch('', 'shared-secret'), false);
});
