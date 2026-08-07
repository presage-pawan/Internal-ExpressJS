import { validateObjectId } from '../../../utils/helper.js';
import { RoleMenuService } from '../../../internal/role-menu/role-menu.service.js';
import { CompanyService } from './company.service.js';
import { AssignedCompaniesService } from '../../../internal/assigned-companies/assigned-companies.service.js';

export class CompanyController {

  getService = (req) => new CompanyService(req.db_type);
  getInternalService = (req) => new AssignedCompaniesService(req.db_type);

  getRoleMenuService = (req) => new RoleMenuService(req.db_type);

  assertCanManageAccountPermissions = async (req) => {
    if (req.user?.user_role === 'admin') {
      return;
    }

    const roleMenus = await this.getRoleMenuService(req).getRoles({
      userId: req.user?._id || req.user?.id,
      roleName: req.user?.user_role,
      visible: true
    });
    const roleMenu = roleMenus?.[0]?.roleMenu || {};
    const canEdit = Boolean(
      roleMenu.account_management?.edit ||
      roleMenu.account_permissions?.edit ||
      roleMenu.user_management?.edit
    );

    if (!canEdit) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }
  };

  create = async (req, res, next) => {
    try {
      const data = await this.getService(req).create(req.body);
      if (!data) {
        throw Object.assign(new Error('Account not found'), { status: 404 });
      }
      res.status(201).json({ status: true, message: 'Account created successfully', data });
    } catch (err) {
      next(err);
    }
  };

  getAll = async (req, res, next) => {
    try {
      const service = this.getService(req);
      const filter = service.buildListFilter(req.query);
      const data = await service.findAll(filter, null, { sort: { account_name: 1 } });

      const internalFilter = {
        user_id: req.user.id,
        db_type: req.db_type
      };

      const assignedCompList = await this.getInternalService(req).getCompByUserId(internalFilter);
      const assignedIds = assignedCompList[0]?.company_ids?.map(id => String(id)) || [];

      const finalRes = data.filter(item =>
        assignedIds.includes(String(item._id || item.id))
      );

      res.status(200).json({ status: true, message: 'Accounts fetched successfully', data: finalRes });

    } catch (err) {
      next(err);
    }
  };

  getById = async (req, res, next) => {
    try {
      const data = await this.getService(req).findById(validateObjectId(req.params.id));
      if (!data) {
        throw Object.assign(new Error('Account not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Account fetched successfully', data });
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const data = await this.getService(req).update(validateObjectId(req.params.id), req.body);
      if (!data) {
        throw Object.assign(new Error('Account not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Account updated successfully', data });
    } catch (err) {
      next(err);
    }
  };

  updatePartial = async (req, res, next) => {
    try {
      const data = await this.getService(req).updatePartial(validateObjectId(req.params.id), req.body);
      if (!data) {
        throw Object.assign(new Error('Account not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Account updated successfully', data });
    } catch (err) {
      next(err);
    }
  };

  updateSubscription = async (req, res, next) => {
    try {
      const data = await this.getService(req).updateSubscription(validateObjectId(req.params.id), req.body);
      if (!data) {
        throw Object.assign(new Error('Account not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Account subscription updated successfully', data });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      const data = await this.getService(req).delete(validateObjectId(req.params.id), req.user?.id);
      if (!data) {
        throw Object.assign(new Error('Account not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Account deleted successfully' });
    } catch (err) {
      next(err);
    }
  };

  getAccountRoleMenu = async (req, res, next) => {
    try {
      await this.assertCanManageAccountPermissions(req);
      const data = await this.getService(req).getAccountRoleMenu(validateObjectId(req.params.id));
      res.status(200).json({ status: true, message: 'Account permissions fetched successfully', data });
    } catch (err) {
      next(err);
    }
  };

  updateAccountRoleMenu = async (req, res, next) => {
    try {
      await this.assertCanManageAccountPermissions(req);
      const data = await this.getService(req).updateAccountRoleMenu(
        validateObjectId(req.params.id),
        req.body,
        req.user?._id || req.user?.id
      );
      res.status(200).json({ status: true, message: 'Account permissions updated successfully', data });
    } catch (err) {
      next(err);
    }
  };

  resetAccountRoleMenu = async (req, res, next) => {
    try {
      await this.assertCanManageAccountPermissions(req);
      const data = await this.getService(req).resetAccountRoleMenu(
        validateObjectId(req.params.id),
        req.body,
        req.user?._id || req.user?.id
      );
      res.status(200).json({ status: true, message: 'Account permissions reset successfully', data });
    } catch (err) {
      next(err);
    }
  };
}
