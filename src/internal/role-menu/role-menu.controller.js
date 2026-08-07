import { validateObjectId } from '../../utils/helper.js';
import { RoleMenuService } from './role-menu.service.js';

export class RoleMenuController {

  getService = (req) => new RoleMenuService(req.db_type);

  getAllRoles = async (req, res, next) => {
    try {
      const { query: { user_id } } = req;
      const filter = { };
      if (user_id) {
        filter.userId = validateObjectId(user_id);
      }
      const roles = await this.getService(req).getRoles(filter);
      if (!roles.length) {
        throw Object.assign(new Error('Roles not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Roles fetched successfully', data: roles });
    } catch (err) {
      next(err);
    }
  };

  getRoleById = async (req, res, next) => {
    try {
      const role = await this.getService(req).getRoleById(validateObjectId(req.params.id));
      if (!role) {
        throw Object.assign(new Error('Role not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Role fetched successfully', data: role });
    } catch (err) {
      next(err);
    }
  };

  createRole = async (req, res, next) => {
    try {
      console.log(req.user.id);
      const role = await this.getService(req).createRole(req.body.user_role, req.user?.id);
      if (!role) {
        throw Object.assign(new Error('Role not created'), { status: 404 });
      }
      res.status(201).json({ status: true, message: 'Role created successfully', data: role });
    } catch (err) {
      next(err);
    }
  };

  updateRole = async (req, res, next) => {
    try {
      const role = await this.getService(req).updateRole(validateObjectId(req.params.id), req.body);
      if (!role) {
        throw Object.assign(new Error('Role not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Role updated successfully', data: role });
    } catch (err) {
      next(err);
    }
  };

  updatePartialRole = async (req, res, next) => {
    try {
      const role = await this.getService(req).updatePartialRole(validateObjectId(req.params.id), req.body);
      if (!role) {
        throw Object.assign(new Error('Role not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Role updated successfully', data: role });
    } catch (err) {
      next(err);
    }
  };

  deleteRole = async (req, res, next) => {
    try {
      const role = await this.getService(req).deleteRole(validateObjectId(req.params.id), req.user?.id);
      if (!role) {
        throw Object.assign(new Error('Role not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Role deleted successfully' });
    } catch (err) {
      next(err);
    }
  };
}