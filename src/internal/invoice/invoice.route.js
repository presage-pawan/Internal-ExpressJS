import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { InvoiceController } from './invoice.controller.js';
import {
  createInvoiceValidator,
  listInvoiceValidator,
  monthlyReportValidator,
  updateInvoiceValidator
} from './invoice.validator.js';

const router = Router();
const controller = new InvoiceController();

const requireAdmin = (req, res, next) => {
  if (req.user?.user_role !== 'admin') {
    return next(Object.assign(new Error('Forbidden'), { status: 403 }));
  }

  return next();
};

router.use(requireAdmin);

router.route('/')
  .get(listInvoiceValidator, validate, controller.getAll)
  .post(createInvoiceValidator, validate, controller.create);

router.route('/reports/monthly')
  .get(monthlyReportValidator, validate, controller.getMonthlyReport);

router.route('/:id/schedules')
  .get(controller.getSchedules);

router.route('/:id')
  .get(controller.getById)
  .patch(updateInvoiceValidator, validate, controller.update)
  .delete(controller.delete);

export default router;
