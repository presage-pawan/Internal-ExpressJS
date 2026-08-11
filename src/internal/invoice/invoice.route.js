import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { InvoiceController } from './invoice.controller.js';
import { RoleMenuService } from '../role-menu/role-menu.service.js';
import {
  bulkCreateInvoiceValidator,
  createInvoiceValidator,
  listInvoiceValidator,
  monthlyReportValidator,
  updateInvoiceValidator
} from './invoice.validator.js';

const router = Router();
const controller = new InvoiceController();

const requireInvoicePermission = (permission) => async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const roles = await new RoleMenuService(req.db_type).getRoles({ userId, visible: true });
    const invoicePermissions = roles[0]?.roleMenu?.invoice_tracker;
    if (!invoicePermissions && req.user?.user_role === 'admin') {
      return next();
    }
    if (!invoicePermissions?.[permission]) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }
    return next();
  } catch (err) {
    return next(err);
  }
};

const requireInvoiceView = requireInvoicePermission('view');
const requireInvoiceAdd = requireInvoicePermission('add');
const requireInvoiceEdit = requireInvoicePermission('edit');
const requireInvoiceDelete = requireInvoicePermission('delete');
const requireInvoiceImport = requireInvoicePermission('import');

const requireAnyInvoiceExportOrView = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const roles = await new RoleMenuService(req.db_type).getRoles({ userId, visible: true });
    const invoicePermissions = roles[0]?.roleMenu?.invoice_tracker;
    if (!invoicePermissions && req.user?.user_role === 'admin') {
      return next();
    }
    if (!invoicePermissions?.view && !invoicePermissions?.export) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }
    return next();
  } catch (err) {
    return next(err);
  }
};

const requireInvoiceScheduleView = (req, res, next) => requireInvoiceView(req, res, next);

router.use((req, res, next) => {
  if (!req.user) {
    return next(Object.assign(new Error('Forbidden'), { status: 403 }));
  }

  return next();
});

router.route('/')
  .get(requireInvoiceView, listInvoiceValidator, validate, controller.getAll)
  .post(requireInvoiceAdd, createInvoiceValidator, validate, controller.create);

router.route('/bulk')
  .post(requireInvoiceImport, bulkCreateInvoiceValidator, validate, controller.bulkCreate);

router.route('/reports/monthly')
  .get(requireAnyInvoiceExportOrView, monthlyReportValidator, validate, controller.getMonthlyReport);

router.route('/:id/schedules')
  .get(requireInvoiceScheduleView, controller.getSchedules);

router.route('/:id')
  .get(requireInvoiceView, controller.getById)
  .patch(requireInvoiceEdit, updateInvoiceValidator, validate, controller.update)
  .delete(requireInvoiceDelete, controller.delete);

export default router;
