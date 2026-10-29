import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { InvoiceController } from './invoice.controller.js';
import { requireAnyInternalPermission, requireInternalPermission } from '../../middlewares/internal-permission.js';
import {
  bulkCreateInvoiceValidator,
  createInvoiceValidator,
  invoiceMigrationValidator,
  listInvoiceValidator,
  monthlyReportValidator,
  rangeReportValidator,
  updateInvoiceValidator
} from './invoice.validator.js';

const router = Router();
const controller = new InvoiceController();

const requireInvoicePermission = permission => requireInternalPermission('invoice_tracker', permission);
const requireInvoiceView = requireInvoicePermission('view');
const requireInvoiceAdd = requireInvoicePermission('add');
const requireInvoiceEdit = requireInvoicePermission('edit');
const requireInvoiceDelete = requireInvoicePermission('delete');
const requireInvoiceImport = requireInvoicePermission('import');

const requireAnyInvoiceExportOrView = requireAnyInternalPermission('invoice_tracker', ['export', 'view']);

const requireInvoiceScheduleView = (req, res, next) => requireInvoiceView(req, res, next);

const requireAdmin = (req, res, next) => {
  if (req.user?.user_role !== 'admin') {
    return next(Object.assign(new Error('Admin access is required'), { status: 403 }));
  }
  return next();
};

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

router.route('/reports/range')
  .get(requireAnyInvoiceExportOrView, rangeReportValidator, validate, controller.getRangeReport);

router.route('/migrations/cmms-to-website')
  .get(requireAdmin, controller.getMigrationStatus)
  .post(requireAdmin, invoiceMigrationValidator, validate, controller.migrateToWebsite);

router.route('/:id/schedules')
  .get(requireInvoiceScheduleView, controller.getSchedules);

router.route('/:id')
  .get(requireInvoiceView, controller.getById)
  .patch(requireInvoiceEdit, updateInvoiceValidator, validate, controller.update)
  .delete(requireInvoiceDelete, controller.delete);

export default router;
