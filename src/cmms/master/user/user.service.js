import { UserModel } from '../../schemas/users.model.js';
import { getConnection } from '../../../_db/index.js';

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

  getAllUsers(filter = {}, projection = '-password') {
    return this.model.find(filter, projection).exec();
  }

  getUserById(id) {
    return this.model.findById(id).select('-password').exec();
  }

  updateUser(id, data) {
    return this.model.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
  }

  updatePartial(id, data) {
    return this.model.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
  }

  deleteUser(id, updatedBy) {
    return this.model.findByIdAndUpdate(id, { visible: false, updatedBy }, { new: true }).exec();
  }
}
