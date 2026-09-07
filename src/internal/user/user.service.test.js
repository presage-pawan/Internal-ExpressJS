import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Types } from 'mongoose';
import { UserService } from './user.service.js';

class UserStatusTestService extends UserService {
  constructor() {
    super('production');
    this.savedPayload = null;
    this.revokedUserId = null;
  }

  get UserModel() {
    return {
      findByIdAndUpdate: async (_id, payload) => {
        this.savedPayload = payload;
        const values = payload.$set || payload;
        return { _id, ...values };
      }
    };
  }

  async revokeUserSessions(userId) {
    this.revokedUserId = userId;
  }
}

describe('UserService status updates', () => {
  it('persists the legacy status alias and revokes sessions for inactive users', async () => {
    const userId = new Types.ObjectId();
    const service = new UserStatusTestService();

    const user = await service.updateUser(userId, { userstatus: 'inactive', userrole: 'worker' });

    assert.equal(service.savedPayload.user_status, 'inactive');
    assert.equal(service.savedPayload.user_role, 'worker');
    assert.equal(service.savedPayload.userstatus, undefined);
    assert.equal(user.user_status, 'inactive');
    assert.equal(String(service.revokedUserId), String(userId));
  });

  it('does not revoke sessions when a user remains active', async () => {
    const service = new UserStatusTestService();

    await service.updatePartial(new Types.ObjectId(), { user_status: 'active' });

    assert.equal(service.savedPayload.$set.user_status, 'active');
    assert.equal(service.revokedUserId, null);
  });
});
