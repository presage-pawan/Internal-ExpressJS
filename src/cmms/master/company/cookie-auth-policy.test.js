import test from 'node:test';
import assert from 'node:assert/strict';
import { assertCookieAuthEnabled } from './cookie-auth-policy.js';

test('accepts no legacy cookie setting or explicitly enabled legacy settings', () => {
  assert.doesNotThrow(() => assertCookieAuthEnabled({ account_name: 'Industrial Plant' }));
  assert.doesNotThrow(() => assertCookieAuthEnabled({ cookie_status: 'enabled' }));
  assert.doesNotThrow(() => assertCookieAuthEnabled({ cookies_status: 'ENABLED' }));
  assert.doesNotThrow(() => assertCookieAuthEnabled({ cookie_status: true }));
});

test('rejects disabled cookie authentication including legacy aliases', () => {
  for (const payload of [
    { cookie_status: 'disabled' },
    { cookie_status: false },
    { cookie_status: null },
    { cookies_status: 'disabled' },
    { cookie_status: 'enabled', cookies_status: false }
  ]) {
    assert.throws(() => assertCookieAuthEnabled(payload), (error) => {
      assert.equal(error.status, 400);
      assert.equal(error.code, 'INVALID_ACCOUNT_AUTH_MODE');
      return true;
    });
  }
});

test('never mutates existing account update payloads', () => {
  const payload = { cookie_status: 'enabled', encrypt_payload: 'disabled' };
  assertCookieAuthEnabled(payload);
  assert.deepEqual(payload, { cookie_status: 'enabled', encrypt_payload: 'disabled' });
});
