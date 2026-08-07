import express from 'express';
import workOrderRoutes from './work-order/work-order.route.js';
import workRequestRoutes from './work-request/work-request.route.js';
import workInspectionRoutes from './work-inspection/work-inspection.route.js';
import workInstructionsRoutes from './work-instructions/work-instructions.route.js';
import workOrderCommentRoutes from './work-order-comment/work-order-comment.route.js';
import { companyContext } from '../../middlewares/company.js';

export default () => {
    const router = express.Router();

    router.use('/work-orders', workOrderRoutes);
    router.use('/work-requests', workRequestRoutes);
    router.use('/work-inspections', workInspectionRoutes);
    router.use('/work-instructions', workInstructionsRoutes);
    router.use('/work-order-comments', workOrderCommentRoutes);

    const companyRouter = express.Router({ mergeParams: true });

    companyRouter.use('/work-orders', companyContext, workOrderRoutes);
    companyRouter.use('/work-requests', companyContext, workRequestRoutes);
    companyRouter.use('/work-inspections', companyContext, workInspectionRoutes);
    companyRouter.use('/work-instructions', companyContext, workInstructionsRoutes);
    companyRouter.use('/work-order-comments', companyContext, workOrderCommentRoutes);
    router.use('/:companyId', companyRouter);

    return router;
};
