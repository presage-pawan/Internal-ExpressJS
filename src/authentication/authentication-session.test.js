import test from 'node:test';
import assert from 'node:assert/strict';
import { CookiesService } from '../utils/cookies.service.js';
import { AuthenticationController } from './authenticate.controller.js';

test('Internal cookies are host-only, HttpOnly and namespaced away from CMMS', () => {
  const calls = [];
  const response = {
    cookie: (...args) => { calls.push(['cookie', ...args]); return response; },
    clearCookie: (...args) => { calls.push(['clear', ...args]); return response; }
  };
  CookiesService.setAuthTokenCookie(response, 'valid-internal-session');
  assert.equal(calls[0][1], CookiesService.AUTH_COOKIE_NAME);
  assert.notEqual(calls[0][1], 'access_token');
  assert.equal(calls[0][2], 'valid-internal-session');
  assert.equal(calls[0][3].path, '/');
  assert.equal(calls[0][3].httpOnly, true);
  assert.equal(Object.hasOwn(calls[0][3], 'domain'), false);
  assert.equal(CookiesService.getAuthTokenFromCookie({ cookies: { access_token: 'cmms-legacy' } }), null);
  assert.equal(CookiesService.getAuthTokenFromCookie({ cookies: { [CookiesService.AUTH_COOKIE_NAME]: 'internal' } }), 'internal');
  CookiesService.clearAuthTokenCookie(response);
  const cleared = calls.filter(call => call[0] === 'clear');
  assert.deepEqual(cleared.map(call => call[1]), [CookiesService.AUTH_COOKIE_NAME, CookiesService.CSRF_COOKIE_NAME]);
  for (const call of cleared) {
    assert.equal(call[2].path, '/');
    assert.equal(Object.hasOwn(call[2], 'domain'), false);
  }
});

test('authenticated /me restores sanitized user and server-side role menu', async () => {
  const controller = new AuthenticationController();
  controller.getService = () => ({
    RoleMenuService: {
      getRoles: async () => [{ roleMenu: { account_management: { view: false } } }]
    }
  });
  const req = {
    user: {
      _id: 'user-1',
      username: 'operator',
      user_role: 'worker',
      password: 'hash-secret',
      refreshToken: 'private-refresh'
    }
  };
  let sent;
  const res = {
    status(code) { assert.equal(code, 200); return this; },
    json(value) { sent = value; return this; }
  };
  await controller.me(req, res, (error) => { throw error; });
  assert.equal(sent.status, true);
  assert.equal(sent.data.userDetails.id, 'user-1');
  assert.equal(sent.data.userDetails.password, undefined);
  assert.equal(sent.data.userDetails.refreshToken, undefined);
  assert.equal(sent.data.roleMenu.account_management.view, false);
  assert.equal(sent.data.token, undefined);
});
