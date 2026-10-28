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
import { requireInternalAction } from '../../middlewares/authorization.js';
import userRoutes from './user/user.route.js';

export default () => {
  const router = express.Router();

  router.use('/companies', companyRoutes);
  router.use('/users', requireInternalAction('cmms.global.manage'), userRoutes);
  router.use('/assets', requireInternalAction('cmms.global.manage'), assetsRoutes);
  router.use('/parts', requireInternalAction('cmms.global.manage'), partRoutes);
  router.use('/equipments', requireInternalAction('cmms.global.manage'), equipmentRoutes);
  router.use('/schedules', requireInternalAction('cmms.global.manage'), scheduleRoutes);
  router.use('/observations', requireInternalAction('cmms.global.manage'), observationRoutes);
  router.use('/forms', requireInternalAction('cmms.global.manage'), formRoutes);
  router.use('/form-categories', requireInternalAction('cmms.global.manage'), formCategoryRoutes);
  router.use('/asset-reports', requireInternalAction('cmms.global.manage'), assetReportRoutes);
  router.use('/location-reports', requireInternalAction('cmms.global.manage'), locationReportRoutes);
  router.use('/floor-maps', requireInternalAction('cmms.global.manage'), floorMapRoutes);
  router.use('/helps', requireInternalAction('cmms.global.manage'), helpRoutes);
  router.use('/mail-logs', requireInternalAction('cmms.global.manage'), mailLogRoutes);
  router.use('/posts', requireInternalAction('cmms.global.manage'), postRoutes);
  router.use('/troubleshoot-guides', requireInternalAction('cmms.global.manage'), troubleshootGuideRoutes);

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
