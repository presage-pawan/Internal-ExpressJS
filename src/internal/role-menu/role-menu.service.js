import { getConnection } from '../../_db/index.js';
import { InternalUserRoleMenuModel } from '../../schemas/role-menu.model.js';
import { RoleManager } from '../utils/role-menu.js';

export class RoleMenuService {

  constructor(dbType = 'production') {
    if (dbType && typeof dbType === 'object') {
      this.connectionOverride = dbType;
      this.dbType = 'production';
    } else {
      this.dbType = dbType;
    }
  }

  get connection() {
    return this.connectionOverride || getConnection(this.dbType, 'website');
  }

  get RoleMenuModel() {
    return InternalUserRoleMenuModel(this.connection);
  }

  async getRoles(filter = {}) {
    const roles = await this.RoleMenuModel.find(filter);
    return Promise.all(roles.map(role => this.ensureDefaultRoleMenu(role)));
  }

  async getRoleById(id) {
    const role = await this.RoleMenuModel.findById(id);
    return role ? this.ensureDefaultRoleMenu(role) : role;
  }

  async createRole(user_role, userId) {
    const roleMenu = await this.getDefaultRoleMenu(user_role);
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

  async getDefaultRoleMenu(roleName) {
    return JSON.parse(JSON.stringify(await RoleManager.getRoleMenuData(roleName)));
  }

  async ensureDefaultRoleMenu(role) {
    const defaultRoleMenu = await this.getDefaultRoleMenu(role.roleName);
    const roleMenu = { ...(role.roleMenu || {}) };
    let changed = false;

    Object.entries(defaultRoleMenu).forEach(([key, value]) => {
      if (!Object.prototype.hasOwnProperty.call(roleMenu, key)) {
        roleMenu[key] = value;
        changed = true;
      }
    });

    if (!changed) {
      return role;
    }

    return this.RoleMenuModel.findByIdAndUpdate(role._id, { roleMenu }, { new: true, runValidators: true });
  }
}
