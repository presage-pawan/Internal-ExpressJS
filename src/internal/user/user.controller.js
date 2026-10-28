import { validateObjectId } from '../../utils/helper.js';
import { UserService } from './user.service.js';
import { RoleMenuService } from '../role-menu/role-menu.service.js';
import { hasInternalAction } from '../../middlewares/authorization.js';
import { pickAdminProfileFields, pickCreateUserFields, pickSelfProfileFields } from './user-field-policy.js';

export class UserController {

  getUserService = (req) => new UserService(req.db_type);
  getRoleService = (req) => new RoleMenuService(req.db_type);

  getAllUsers = async (req, res, next) => {
    try {
      const users = await this.getUserService(req).getAllUsers();
      if (!users.length) {
        throw Object.assign(new Error('Users not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Users fetched successfully', data: users });
    } catch (err) {
      next(err);
    }
  };

  getUserById = async (req, res, next) => {
    try {
      const user = await this.getUserService(req).getUserById(validateObjectId(req.params.id));
      if (!user) {
        throw Object.assign(new Error('User not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'User fetched successfully', data: user });
    } catch (err) {
      next(err);
    }
  };

  createUser = async (req, res, next) => {
    try {
      const payload = pickCreateUserFields(req.body);
      const user = await this.getUserService(req).createUser(payload);
      if (!user) {
        throw Object.assign(new Error('User not found'), { status: 404 });
      }
      const role = await this.getRoleService(req).createRole(payload.user_role || user.user_role, user._id);
      if (!role) {
        throw Object.assign(new Error('Role not found'), { status: 404 });
      }
      res.status(201).json({ status: true, message: 'User created successfully', data: user });
    } catch (err) {
      next(err);
    }
  };

  updateUser = async (req, res, next) => {
    try {
      const targetId = validateObjectId(req.params.id);
      const isAdmin = hasInternalAction(req.user, 'internal.users.manage');
      const payload = isAdmin ? pickAdminProfileFields(req.body) : pickSelfProfileFields(req.body);
      if (!Object.keys(payload).length) throw Object.assign(new Error('No permitted profile fields supplied'), { status: 400 });
      const user = await this.getUserService(req).updateUser(targetId, payload);
      if (!user) {
        throw Object.assign(new Error('User not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'User updated successfully', data: user });
    } catch (err) {
      next(err);
    }
  };

  updatePartial = async (req, res, next) => {
    try {
      const targetId = validateObjectId(req.params.id);
      const isAdmin = hasInternalAction(req.user, 'internal.users.manage');
      const payload = isAdmin ? pickAdminProfileFields(req.body) : pickSelfProfileFields(req.body);
      if (!Object.keys(payload).length) throw Object.assign(new Error('No permitted profile fields supplied'), { status: 400 });
      const user = await this.getUserService(req).updatePartial(targetId, payload);
      if (!user) {
        throw Object.assign(new Error('User not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'User updated successfully', data: user });
    } catch (err) {
      next(err);
    }
  };

  updatePassword = async (req, res, next) => {
    try {
      const targetId = validateObjectId(req.params.id);
      const actorId = String(req.user?.id || req.user?._id || '');
      const isSelf = actorId === String(targetId);
      const user = await this.getUserService(req).updatePassword(targetId, {
        currentPassword: req.body?.currentPassword,
        newPassword: req.body?.newPassword,
        requireCurrentPassword: isSelf
      });
      if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
      res.status(200).json({ status: true, message: 'Password updated successfully' });
    } catch (err) {
      next(err);
    }
  };

  deleteUser = async (req, res, next) => {
    try {
      const user = await this.getUserService(req).deleteUser(validateObjectId(req.params.id), req.user?.id);
      if (!user) {
        throw Object.assign(new Error('User not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'User deleted' });
    } catch (err) {
      next(err);
    }
  };
}