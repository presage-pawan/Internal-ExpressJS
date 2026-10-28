import express from 'express';
import mapUserRoutes from './map-user/map-user.route.js';
import { companyContext } from '../../middlewares/company.js';
import mapUserLocationRoutes from './map-user-location/map-user-location.route.js';
import mapUserWorkOrderRoutes from './map-user-work-order/map-user-work-order.route.js';
import mapUserInspectionRoutes from './map-user-inspection/map-user-inspection.route.js';
import { requireInternalAction } from '../../middlewares/authorization.js';

export default () => {
    const router = express.Router();

    router.use('/map-user', requireInternalAction('cmms.global.manage'), mapUserRoutes);
    router.use('/map-user-inspection', requireInternalAction('cmms.global.manage'), mapUserInspectionRoutes);
    router.use('/map-user-location', requireInternalAction('cmms.global.manage'), mapUserLocationRoutes);
    router.use('/map-user-work-orders', requireInternalAction('cmms.global.manage'), mapUserWorkOrderRoutes);

    const companyRouter = express.Router({ mergeParams: true });

    companyRouter.use('/map-user', mapUserRoutes);
    companyRouter.use('/map-user-inspection', mapUserInspectionRoutes);
    companyRouter.use('/map-user-location', mapUserLocationRoutes);
    companyRouter.use('/map-user-work-orders', mapUserWorkOrderRoutes);

    router.use('/:companyId', companyContext, companyRouter);

    return router;
};
