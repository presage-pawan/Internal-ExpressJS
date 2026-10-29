import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { requireInternalPermission } from '../../middlewares/internal-permission.js';
import { SalesLeadController } from './sales-lead.controller.js';
import {
  addSalesLeadInteractionValidator,
  bulkCreateSalesLeadValidator,
  createSalesLeadValidator,
  listSalesLeadValidator,
  reassignSalesLeadValidator,
  salesLeadAnalyticsValidator,
  updateSalesLeadValidator
} from './sales-lead.validator.js';

const router = Router();
const controller = new SalesLeadController();

const requireSalesLeadPermission = permission => requireInternalPermission('sales_lead_tracker', permission);

router.route('/')
  .get(requireSalesLeadPermission('view'), listSalesLeadValidator, validate, controller.getAll)
  .post(requireSalesLeadPermission('add'), createSalesLeadValidator, validate, controller.create);

router.get('/analytics', requireSalesLeadPermission('view'), salesLeadAnalyticsValidator, validate, controller.getAnalytics);
router.post('/bulk', requireSalesLeadPermission('import'), bulkCreateSalesLeadValidator, validate, controller.bulkCreate);
router.post('/:id/interactions', requireSalesLeadPermission('edit'), addSalesLeadInteractionValidator, validate, controller.addInteraction);
router.patch('/:id/owner', requireSalesLeadPermission('edit'), reassignSalesLeadValidator, validate, controller.reassign);

router.route('/:id')
  .get(requireSalesLeadPermission('view'), controller.getById)
  .patch(requireSalesLeadPermission('edit'), updateSalesLeadValidator, validate, controller.update)
  .delete(requireSalesLeadPermission('delete'), controller.delete);

export default router;
