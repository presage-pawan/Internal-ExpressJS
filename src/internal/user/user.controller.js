import { validateObjectId } from '../../utils/helper.js';
import { UserService } from './user.service.js';
import { RoleMenuService } from '../role-menu/role-menu.service.js';

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
      const user = await this.getUserService(req).createUser(req.body);
      if (!user) {
        throw Object.assign(new Error('User not found'), { status: 404 });
      }
      const role = await this.getRoleService(req).createRole(req.body.user_role, user._id);
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
      const user = await this.getUserService(req).updateUser(validateObjectId(req.params.id), req.body);
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
      const user = await this.getUserService(req).updatePartial(validateObjectId(req.params.id), req.body);
      if (!user) {
        throw Object.assign(new Error('User not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'User updated successfully', data: user });
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