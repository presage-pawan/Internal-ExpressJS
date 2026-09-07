import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { RoleMenuService } from '../role-menu/role-menu.service.js';
import { SalesLeadController } from './sales-lead.controller.js';
import { createSalesLeadValidator, listSalesLeadValidator, updateSalesLeadValidator } from './sales-lead.validator.js';

const router = Router();
const controller = new SalesLeadController();

const requireSalesLeadPermission = (permission) => async (req, res, next) => {
  try {
    if (!req.user) throw Object.assign(new Error('Forbidden'), { status: 403 });
    if (req.user.user_role === 'admin') return next();
    const userId = req.user?._id || req.user?.id;
    const roles = await new RoleMenuService(req.db_type).getRoles({ userId, visible: true });
    const permissions = roles[0]?.roleMenu?.sales_lead_tracker;
    if (!permissions?.[permission]) throw Object.assign(new Error('Forbidden'), { status: 403 });
    return next();
  } catch (error) {
    return next(error);
  }
};

router.route('/')
  .get(requireSalesLeadPermission('view'), listSalesLeadValidator, validate, controller.getAll)
  .post(requireSalesLeadPermission('add'), createSalesLeadValidator, validate, controller.create);

router.route('/:id')
  .get(requireSalesLeadPermission('view'), controller.getById)
  .patch(requireSalesLeadPermission('edit'), updateSalesLeadValidator, validate, controller.update)
  .delete(requireSalesLeadPermission('delete'), controller.delete);

export default router;
