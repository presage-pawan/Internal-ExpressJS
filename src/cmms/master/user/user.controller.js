import { validateObjectId } from '../../../utils/helper.js';
import { bindCompanyPayload } from '../../tenant-payload.js';
import { UserService } from './user.service.js';
import { PasswordService } from '../../../utils/bcrypt.js';
import { RoleMenuService } from '../../../internal/role-menu/role-menu.service.js';

export class UserController {

  getService = (req) => new UserService(req.db_type);
  getRoleMenuService = (req) => new RoleMenuService(req.db_type);

  assertCanUpdateExpiry = async (req) => {
    if (!Object.hasOwn(req.body, 'passwordExpiredAt') && !Object.hasOwn(req.body, 'passwordExpiryAction')) return;
    if (req.user?.user_role === 'admin') return;
    const roles = await this.getRoleMenuService(req).getRoles({
      userId: req.user?._id || req.user?.id, roleName: req.user?.user_role, visible: true
    });
    if (!roles?.[0]?.roleMenu?.user_management?.edit) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }
  };

  getAllUsers = async (req, res, next) => {
    try {
      const { companyId, query: { search } } = req;
      const filter = {};
      if (companyId) {
        filter.account_id = companyId;
      }
      if (search) {
        filter.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      const users = await this.getService(req).getAllUsers(filter);
      if (!users || users.length === 0) throw Object.assign(new Error('Users not found'), { status: 400 });
      res.status(200).json({ status: true, message: 'Users fetched successfully', data: users });
    } catch (err) {
      next(err);
    }
  };

  getUserById = async (req, res, next) => {
    try {
      const user = await this.getService(req).getUserById(validateObjectId(req.params.id), req.companyId);
      if (!user) throw Object.assign(new Error('User not found'), { status: 400 });
      res.status(200).json({ status: true, message: 'User fetched successfully', data: user });
    } catch (err) {
      next(err);
    }
  };

  createUser = async (req, res, next) => {
    try {
      const user = await this.getService(req).createUser(bindCompanyPayload(req.body, req.companyId, 'account_id'));
      if (!user) throw Object.assign(new Error('User not found'), { status: 400 });
      res.status(201).json({ status: true, message: 'User created successfully', data: user });
    } catch (err) {
      next(err);
    }
  };

  updateUser = async (req, res, next) => {
    try {
      await this.assertCanUpdateExpiry(req);
      const user = await this.getService(req).updateUser(validateObjectId(req.params.id), bindCompanyPayload(req.body, req.companyId, 'account_id'), req.companyId);
      if (!user) throw Object.assign(new Error('User not found'), { status: 400 });
      res.status(200).json({ status: true, message: 'User updated successfully', data: user });
    } catch (err) {
      next(err);
    }
  };

  updatePartial = async (req, res, next) => {
    try {
      await this.assertCanUpdateExpiry(req);
      const user = await this.getService(req).updatePartial(validateObjectId(req.params.id), bindCompanyPayload(req.body, req.companyId, 'account_id'), req.companyId);
      if (!user) throw Object.assign(new Error('User not found'), { status: 400 });
      res.status(200).json({ status: true, message: 'User updated successfully', data: user });
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req, res, next) => {
    try {
      const { id } = req.params;
      const defaultPassword = await PasswordService.hash('Password@123');
      const user = await this.getService(req).updateUser(validateObjectId(id), { password: defaultPassword }, req.companyId);
      if (!user) throw Object.assign(new Error('User not found'), { status: 400 });
      res.status(200).json({ status: true, message: 'Password reset successfully' });
    } catch (err) {
      next(err);
    }
  };

  deleteUser = async (req, res, next) => {
    try {
      const deleted = await this.getService(req).deleteUser(validateObjectId(req.params.id), req.user?.id, req.companyId);
      if (!deleted) throw Object.assign(new Error('User not found'), { status: 400 });
      res.status(200).json({ status: true, message: 'User deleted successfully' });
    } catch (err) {
      next(err);
    }
  };
}
