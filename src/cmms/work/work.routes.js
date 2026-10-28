import express from 'express';
import workOrderRoutes from './work-order/work-order.route.js';
import workRequestRoutes from './work-request/work-request.route.js';
import workInspectionRoutes from './work-inspection/work-inspection.route.js';
import workInstructionsRoutes from './work-instructions/work-instructions.route.js';
import workOrderCommentRoutes from './work-order-comment/work-order-comment.route.js';
import { companyContext } from '../../middlewares/company.js';
import { requireInternalAction } from '../../middlewares/authorization.js';

export default () => {
    const router = express.Router();

    router.use('/work-orders', requireInternalAction('cmms.global.manage'), workOrderRoutes);
    router.use('/work-requests', requireInternalAction('cmms.global.manage'), workRequestRoutes);
    router.use('/work-inspections', requireInternalAction('cmms.global.manage'), workInspectionRoutes);
    router.use('/work-instructions', requireInternalAction('cmms.global.manage'), workInstructionsRoutes);
    router.use('/work-order-comments', requireInternalAction('cmms.global.manage'), workOrderCommentRoutes);

    const companyRouter = express.Router({ mergeParams: true });

    companyRouter.use('/work-orders', companyContext, workOrderRoutes);
    companyRouter.use('/work-requests', companyContext, workRequestRoutes);
    companyRouter.use('/work-inspections', companyContext, workInspectionRoutes);
    companyRouter.use('/work-instructions', companyContext, workInstructionsRoutes);
    companyRouter.use('/work-order-comments', companyContext, workOrderCommentRoutes);
    router.use('/:companyId', companyRouter);

    return router;
};
