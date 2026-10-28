import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSupportLoginBaseUrl, buildSupportLoginRequest } from './support-login.policy.js';

const config = { productionApiUrl: 'https://prod.example/cmms_express', stagingApiUrl: 'https://stage.example/cmms_express' };

test('support login target is selected only from server configuration', () => {
  assert.equal(resolveSupportLoginBaseUrl('production', config), config.productionApiUrl);
  assert.equal(resolveSupportLoginBaseUrl('staging', config), config.stagingApiUrl);
  assert.throws(() => resolveSupportLoginBaseUrl('other', config), (e) => e.status === 400);
});

test('support login request binds actor, company, environment and browser state', () => {
  const request = buildSupportLoginRequest({
    email: 'user@example.com',
    companyId: 'company-1',
    actorId: 'admin-1',
    environment: 'staging',
    stateChallenge: 'state-challenge-abcdefghijklmnopqrstuvwxyz123456'
  }, 'service-secret');
  assert.equal(request.method, 'POST');
  assert.equal(request.headers['x-support-login-key'], 'service-secret');
  assert.deepEqual(JSON.parse(request.body), {
    email: 'user@example.com',
    company_id: 'company-1',
    actor_id: 'admin-1',
    environment: 'staging',
    state_challenge: 'state-challenge-abcdefghijklmnopqrstuvwxyz123456'
  });
  assert.equal(Object.prototype.hasOwnProperty.call(request.headers, 'authorization'), false);
});

test('missing service secret or browser state fails closed', () => {
  const input = {
    email: 'user@example.com',
    companyId: 'company-1',
    actorId: 'admin-1',
    environment: 'staging',
    stateChallenge: 'state-challenge-abcdefghijklmnopqrstuvwxyz123456'
  };
  assert.throws(() => buildSupportLoginRequest(input, ''), (e) => e.status === 503);
  assert.throws(() => buildSupportLoginRequest({ ...input, stateChallenge: '' }, 'service-secret'), (e) => e.status === 400);
});
