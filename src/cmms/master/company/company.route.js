import { Router } from 'express';
import { CompanyController } from './company.controller.js';
import { auth } from '../../../auth.js';
import { validate } from '../../../middlewares/validate.js';
import { requireInternalAction } from '../../../middlewares/authorization.js';
import { requireCompanyAccess } from '../../../middlewares/company-access.js';
import {
  createCompanyValidator,
  listCompanyValidator,
  resetAccountRoleMenuValidator,
  updateAccountRoleMenuValidator,
  updateCompanyValidator,
  updateSubscriptionValidator
} from './company.validator.js';

const router = Router();
const controller = new CompanyController();

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Company management
 */

/**
 * @swagger
 * /api/cmms/master/companies:
 *   get:
 *     summary: Get all companies
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of companies
 */
router.route('/')
  .get(auth, listCompanyValidator, validate, controller.getAll)
  /**
   * @swagger
   * /api/cmms/master/companies:
   *   post:
   *     summary: Create a new company
   *     tags: [Companies]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Account'
   *     responses:
   *       201:
   *         description: Company created
   */
  .post(auth, requireInternalAction('internal.companies.manage'), createCompanyValidator, validate, controller.create);

router.route('/:id/account-role-menu')
  .get(auth, requireCompanyAccess('id'), controller.getAccountRoleMenu)
  .put(auth, requireCompanyAccess('id'), updateAccountRoleMenuValidator, validate, controller.updateAccountRoleMenu);

router.route('/:id/account-role-menu/reset')
  .post(auth, requireCompanyAccess('id'), resetAccountRoleMenuValidator, validate, controller.resetAccountRoleMenu);

router.route('/:id/api-key')
  .get(auth, requireInternalAction('internal.company-keys.manage'), controller.getApiKey)
  .post(auth, requireInternalAction('internal.company-keys.manage'), controller.generateApiKey)
  .put(auth, requireInternalAction('internal.company-keys.manage'), controller.generateApiKey)
  .delete(auth, requireInternalAction('internal.company-keys.manage'), controller.removeApiKey);

router.route('/:id/api-key/regenerate')
  .post(auth, requireInternalAction('internal.company-keys.manage'), controller.generateApiKey);

router.route('/:id/api-key/status')
  .patch(auth, requireInternalAction('internal.company-keys.manage'), controller.toggleApiKeyStatus)
  .put(auth, requireInternalAction('internal.company-keys.manage'), controller.toggleApiKeyStatus);

router.route('/:id/download-api-key')
  .get(auth, requireInternalAction('internal.company-keys.manage'), controller.getDownloadApiKey)
  .post(auth, requireInternalAction('internal.company-keys.manage'), controller.generateDownloadApiKey)
  .delete(auth, requireInternalAction('internal.company-keys.manage'), controller.removeDownloadApiKey);

/**
 * @swagger
 * /api/cmms/master/companies/{id}/subscription:
 *   patch:
 *     summary: Update company subscription and limits
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Company subscription updated
 */
router.route('/:id/subscription')
  .patch(auth, requireInternalAction('internal.companies.manage'), updateSubscriptionValidator, validate, controller.updateSubscription);

/**
 * @swagger
 * /api/cmms/master/companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Company details
 */
router.route('/:id')
  .get(auth, requireCompanyAccess('id'), controller.getById)
  /**
   * @swagger
   * /api/cmms/master/companies/{id}:
   *   put:
   *     summary: Update company (Full)
   *     tags: [Companies]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Company updated
   */
  .put(auth, requireInternalAction('internal.companies.manage'), updateCompanyValidator, validate, controller.update)
  /**
   * @swagger
   * /api/cmms/master/companies/{id}:
   *   patch:
   *     summary: Update company (Partial)
   *     tags: [Companies]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Company updated
   */
  .patch(auth, requireInternalAction('internal.companies.manage'), updateCompanyValidator, validate, controller.updatePartial)
  /**
   * @swagger
   * /api/cmms/master/companies/{id}:
   *   delete:
   *     summary: Delete company
   *     tags: [Companies]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Company deleted
   */
  .delete(auth, requireInternalAction('internal.companies.manage'), controller.delete);

export default router;
