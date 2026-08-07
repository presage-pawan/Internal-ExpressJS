import { PasswordService } from '../../utils/bcrypt.js';
import { InternalUserModel } from '../../schemas/users.model.js';
import { getConnection } from '../../_db/index.js';

export class UserService {

  constructor(dbType = 'production') {
    this.dbType = dbType;
  }

  get UserModel() {
    const connection = getConnection(this.dbType, 'website');
    return InternalUserModel(connection);
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
    if (payload.password) {
      payload.password = await PasswordService.hash(payload.password);
    }
    return this.UserModel.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  }

  async updatePartial(id, payload) {
    if (payload.password) {
      payload.password = await PasswordService.hash(payload.password);
    }
    return this.UserModel.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true });
  }

  async deleteUser(id, updatedBy) {
    return this.UserModel.findByIdAndUpdate(id, { visible: false, updatedBy }, { new: true });
  }
}