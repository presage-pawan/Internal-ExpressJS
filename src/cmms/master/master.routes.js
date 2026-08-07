import express from 'express';
import companyRoutes from './company/company.route.js';
import assetsRoutes from './asset/asset.route.js';
import partRoutes from './part/part.route.js';
import equipmentRoutes from './equipment/equipment.route.js';
import scheduleRoutes from './schedule/schedule.route.js';
import observationRoutes from './observation/observation.route.js';
import formRoutes from './form/form.route.js';
import formCategoryRoutes from './form-category/form-category.route.js';
import assetReportRoutes from './asset-report/asset-report.route.js';
import locationReportRoutes from './location-report/location-report.route.js';
import floorMapRoutes from './floor-map/floor-map.route.js';
import helpRoutes from './help/help.route.js';
import mailLogRoutes from './mail-log/mail-log.route.js';
import postRoutes from './post/post.route.js';
import troubleshootGuideRoutes from './troubleshoot-guide/troubleshoot-guide.route.js';
import locationRoutes from './location/location.route.js';
import { companyContext } from '../../middlewares/company.js';
import userRoutes from './user/user.route.js';

export default () => {
  const router = express.Router();

  router.use('/companies', companyRoutes);
  router.use('/users', userRoutes);
  router.use('/assets', assetsRoutes);
  router.use('/parts', partRoutes);
  router.use('/equipments', equipmentRoutes);
  router.use('/schedules', scheduleRoutes);
  router.use('/observations', observationRoutes);
  router.use('/forms', formRoutes);
  router.use('/form-categories', formCategoryRoutes);
  router.use('/asset-reports', assetReportRoutes);
  router.use('/location-reports', locationReportRoutes);
  router.use('/floor-maps', floorMapRoutes);
  router.use('/helps', helpRoutes);
  router.use('/mail-logs', mailLogRoutes);
  router.use('/posts', postRoutes);
  router.use('/troubleshoot-guides', troubleshootGuideRoutes);

  const companyRouter = express.Router({ mergeParams: true });

  companyRouter.use('/assets', companyContext, assetsRoutes);
  companyRouter.use('/users', companyContext, userRoutes);
  companyRouter.use('/parts', companyContext, partRoutes);
  companyRouter.use('/equipments', companyContext, equipmentRoutes);
  companyRouter.use('/schedules', companyContext, scheduleRoutes);
  companyRouter.use('/observations', companyContext, observationRoutes);
  companyRouter.use('/forms', companyContext, formRoutes);
  companyRouter.use('/form-categories', companyContext, formCategoryRoutes);
  companyRouter.use('/asset-reports', companyContext, assetReportRoutes);
  companyRouter.use('/location-reports', companyContext, locationReportRoutes);
  companyRouter.use('/floor-maps', companyContext, floorMapRoutes);
  companyRouter.use('/helps', companyContext, helpRoutes);
  companyRouter.use('/mail-logs', companyContext, mailLogRoutes);
  companyRouter.use('/posts', companyContext, postRoutes);
  companyRouter.use('/troubleshoot-guides', companyContext, troubleshootGuideRoutes);
  companyRouter.use('/locations', companyContext, locationRoutes);
  router.use('/:companyId', companyRouter);

  return router;
};
