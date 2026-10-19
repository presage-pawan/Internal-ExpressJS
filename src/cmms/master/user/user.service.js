import { UserModel } from '../../schemas/users.model.js';
import { getConnection } from '../../../_db/index.js';
import { normalizeExpiryUpdate, withPasswordExpiry } from './password-expiry.js';

export class UserService {

  constructor(dbType) {
    this.dbType = dbType;
  }

  get model() {
    const connection = getConnection(this.dbType, 'cmms');
    return UserModel(connection);
  }

  createUser(data) {
    return this.model.create(data);
  }

  async getAllUsers(filter = {}, projection = '-password') {
    const users = await this.model.find(filter, projection).exec();
    return users.map(user => withPasswordExpiry(user));
  }

  async getUserById(id) {
    return withPasswordExpiry(await this.model.findById(id).select('-password').exec());
  }

  async updateUser(id, data) {
    const payload = normalizeExpiryUpdate(data);
    return withPasswordExpiry(await this.model.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true }).exec());
  }

  async updatePartial(id, data) {
    return this.updateUser(id, data);
  }

  deleteUser(id, updatedBy) {
    return this.model.findByIdAndUpdate(id, { visible: false, updatedBy }, { new: true }).exec();
  }
}
