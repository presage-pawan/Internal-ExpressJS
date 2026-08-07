import { getConnection } from '../../_db/index.js';
import { InternalUserRoleMenuModel } from '../../schemas/role-menu.model.js';
import { RoleManager } from '../utils/role-menu.js';

export class RoleMenuService {

  constructor(dbType = 'production') {
    this.dbType = dbType;
  }

  get RoleMenuModel() {
    const connection = getConnection(this.dbType, 'website');
    return InternalUserRoleMenuModel(connection);
  }

  async getRoles(filter = {}) {
    return this.RoleMenuModel.find(filter)
  }

  async getRoleById(id) {
    return this.RoleMenuModel.findById(id)
  }

  async createRole(user_role, userId) {
    const roleMenu = await RoleManager.getRoleMenuData(user_role);
    const payload = {
      roleName: user_role,
      roleMenu: roleMenu,
      userId: userId,
      createdBy: userId
    };
    return this.RoleMenuModel.create(payload);
  }

  async updateRole(id, payload) {
    return this.RoleMenuModel.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  }

  async updatePartialRole(id, payload) {
    return this.RoleMenuModel.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true });
  }

  async deleteRole(id, updatedBy) {
    return this.RoleMenuModel.findByIdAndUpdate(id, { visible: false, updatedBy }, { new: true });
  }
}