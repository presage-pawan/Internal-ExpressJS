import test from 'node:test';
import assert from 'node:assert/strict';
import { CookiesService } from '../utils/cookies.service.js';
import { requireInternalCsrf } from './internal-csrf.js';

function createSession(token = 'signed-session') {
  const cookies = {};
  const response = {
    cookie(name, value) { cookies[name] = value; return this; }
  };
  CookiesService.setAuthTokenCookie(response, token);
  const headers = { 'X-Internal-CSRF': cookies[CookiesService.CSRF_COOKIE_NAME], Origin: 'https://app.presageinsights.ai' };
  const req = {
    method: 'PATCH', token, cookies,
    get(name) { return headers[name]; }
  };
  return { req, cookies, headers };
}
function run(req) {
  return new Promise(resolve => requireInternalCsrf(req, {}, error => resolve(error || null)));
}
test('cookie-backed unsafe mutations require signed session-bound double submit proof', async () => {
  const { req, headers, cookies } = createSession();
  assert.equal(await run(req), null);
  headers['X-Internal-CSRF'] = '';
  assert.equal((await run(req)).status, 403);
  headers['X-Internal-CSRF'] = cookies[CookiesService.CSRF_COOKIE_NAME];
  req.token = 'different-user-session';
  assert.equal((await run(req)).status, 403);
});
test('origin restrictions are enforced for cookie-authenticated mutations', async () => {
  const { req, headers } = createSession();
  headers.Origin = 'https://untrusted.invalid';
  assert.equal((await run(req)).status, 403);
  headers.Origin = 'https://app.presageinsights.ai';
  assert.equal(await run(req), null);
});
test('safe methods and non-cookie bearer API clients bypass CSRF header requirement', async () => {
  const { req, cookies } = createSession();
  req.method = 'GET';
  assert.equal(await run(req), null);
  req.method = 'POST';
  delete cookies[CookiesService.AUTH_COOKIE_NAME];
  assert.equal(await run(req), null);
});
