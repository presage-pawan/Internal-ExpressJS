import express from 'express';
import mapUserRoutes from './map-user/map-user.route.js';
import { companyContext } from '../../middlewares/company.js';
import mapUserLocationRoutes from './map-user-location/map-user-location.route.js';
import mapUserWorkOrderRoutes from './map-user-work-order/map-user-work-order.route.js';
import mapUserInspectionRoutes from './map-user-inspection/map-user-inspection.route.js';

export default () => {
    const router = express.Router();

    router.use('/map-user', mapUserRoutes);
    router.use('/map-user-inspection', mapUserInspectionRoutes);
    router.use('/map-user-location', mapUserLocationRoutes);
    router.use('/map-user-work-orders', mapUserWorkOrderRoutes);

    const companyRouter = express.Router({ mergeParams: true });

    companyRouter.use('/map-user', mapUserRoutes);
    companyRouter.use('/map-user-inspection', mapUserInspectionRoutes);
    companyRouter.use('/map-user-location', mapUserLocationRoutes);
    companyRouter.use('/map-user-work-orders', mapUserWorkOrderRoutes);

    router.use('/:companyId', companyContext, companyRouter);

    return router;
};
