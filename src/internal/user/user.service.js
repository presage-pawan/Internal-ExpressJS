import { PasswordService } from '../../utils/bcrypt.js';
import { InternalUserModel } from '../../schemas/users.model.js';
import { deleteAccessTokenByUserId } from '../../schemas/accessToken.model.js';
import { getConnection } from '../../_db/index.js';

export class UserService {

  constructor(dbType = 'production') {
    this.dbType = dbType;
  }

  get connection() {
    return getConnection(this.dbType, 'website');
  }

  get UserModel() {
    return InternalUserModel(this.connection);
  }

  normalizeUpdatePayload(payload = {}) {
    const normalized = { ...payload };
    if (!normalized.user_status && normalized.userstatus) normalized.user_status = normalized.userstatus;
    if (!normalized.user_role && normalized.userrole) normalized.user_role = normalized.userrole;
    delete normalized.userstatus;
    delete normalized.userrole;
    return normalized;
  }

  revokeUserSessions(userId) {
    return deleteAccessTokenByUserId(userId, this.connection);
  }

  async getAllUsers(filter = {}) {
    return this.UserModel.find(filter);
  }

  async getUserById(id) {
    return this.UserModel.findById(id);
  }

  async createUser(payload) {
    const password = await PasswordService.hash(payload.password);
    if (!password) {
      throw Object.assign(new Error('Failed to hash password'), { status: 500 });
    }
    return this.UserModel.create({ ...payload, password });
  }

  async updateUser(id, payload) {
    const normalizedPayload = this.normalizeUpdatePayload(payload);
    if (normalizedPayload.password) {
      normalizedPayload.password = await PasswordService.hash(normalizedPayload.password);
    }
    const user = await this.UserModel.findByIdAndUpdate(id, normalizedPayload, { new: true, runValidators: true });
    if (user?.user_status === 'inactive') await this.revokeUserSessions(id);
    return user;
  }

  async updatePartial(id, payload) {
    const normalizedPayload = this.normalizeUpdatePayload(payload);
    if (normalizedPayload.password) {
      normalizedPayload.password = await PasswordService.hash(normalizedPayload.password);
    }
    const user = await this.UserModel.findByIdAndUpdate(id, { $set: normalizedPayload }, { new: true, runValidators: true });
    if (user?.user_status === 'inactive') await this.revokeUserSessions(id);
    return user;
  }

  async deleteUser(id, updatedBy) {
    return this.UserModel.findByIdAndUpdate(id, { visible: false, updatedBy }, { new: true });
  }
}
