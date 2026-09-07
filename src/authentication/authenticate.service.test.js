import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AuthenticationService } from './authenticate.service.js';

class LoginTestService extends AuthenticationService {
  constructor() {
    super('production');
    this.loginFilter = null;
  }

  get UserModel() {
    return {
      findOne: (filter) => {
        this.loginFilter = filter;
        return {
          select: () => ({ exec: async () => null })
        };
      }
    };
  }
}

describe('AuthenticationService account status', () => {
  it('only allows visible, active users into the password login flow', async () => {
    const service = new LoginTestService();

    await assert.rejects(
      service.login({ username: 'inactive.user', password: 'Password@123' }),
      error => error.status === 401 && error.message === 'Invalid username or password'
    );

    assert.equal(service.loginFilter.username, 'inactive.user');
    assert.equal(service.loginFilter.user_status, 'active');
    assert.deepEqual(service.loginFilter.visible, { $ne: false });
  });
});
