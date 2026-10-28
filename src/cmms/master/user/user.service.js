import { UserModel } from '../../schemas/users.model.js';
import { getConnection } from '../../../_db/index.js';
import { buildResourceScopeFilter } from '../../resource-scope.js';
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

  async getUserById(id, companyId) {
    return withPasswordExpiry(await this.model.findOne(buildResourceScopeFilter(id, companyId, 'account_id')).select('-password').exec());
  }

  async updateUser(id, data, companyId) {
    const payload = normalizeExpiryUpdate(data);
    return withPasswordExpiry(await this.model.findOneAndUpdate(buildResourceScopeFilter(id, companyId, 'account_id'), { $set: payload }, { new: true, runValidators: true }).exec());
  }

  async updatePartial(id, data, companyId) {
    return this.updateUser(id, data, companyId);
  }

  deleteUser(id, updatedBy, companyId) {
    return this.model.findOneAndUpdate(buildResourceScopeFilter(id, companyId, 'account_id'), { visible: false, updatedBy }, { new: true }).exec();
  }
}
