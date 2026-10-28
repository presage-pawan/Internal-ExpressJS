import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSupportLoginBaseUrl, buildSupportLoginRequest } from './support-login.policy.js';

const config = { productionApiUrl: 'https://prod.example/cmms_express', stagingApiUrl: 'https://stage.example/cmms_express' };

test('support login target is selected only from server configuration', () => {
  assert.equal(resolveSupportLoginBaseUrl('production', config), config.productionApiUrl);
  assert.equal(resolveSupportLoginBaseUrl('staging', config), config.stagingApiUrl);
  assert.throws(() => resolveSupportLoginBaseUrl('other', config), (e) => e.status === 400);
});

test('support login request carries only the dedicated service credential and target identity', () => {
  const request = buildSupportLoginRequest('user@example.com', 'company-1', 'service-secret');
  assert.equal(request.method, 'POST');
  assert.equal(request.headers['x-support-login-key'], 'service-secret');
  assert.deepEqual(JSON.parse(request.body), { email: 'user@example.com', company_id: 'company-1' });
  assert.equal(Object.prototype.hasOwnProperty.call(request.headers, 'authorization'), false);
});

test('missing service secret fails closed', () => {
  assert.throws(() => buildSupportLoginRequest('user@example.com', 'company-1', ''), (e) => e.status === 503);
});
