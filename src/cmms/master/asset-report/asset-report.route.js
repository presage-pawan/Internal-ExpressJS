import { Router } from 'express';
import { AssetReportController } from './asset-report.controller.js';
import { auth } from '../../../auth.js';
import { validate } from '../../../middlewares/validate.js';
import { createValidator, updateValidator } from './asset-report.validator.js';

const router = Router();
const controller = new AssetReportController();

/**
 * @swagger
 * tags:
 *   name: AssetReports
 *   description: Technical reports for assets
 */

/**
 * @swagger
 * /api/cmms/master/asset-reports:
 *   get:
 *     summary: Get all asset reports
 *     tags: [AssetReports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reports
 */
router.route('/')
    .get(auth, controller.getAll)
    /**
     * @swagger
     * /api/cmms/master/asset-reports:
     *   post:
     *     summary: Create an asset report
     *     tags: [AssetReports]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/AssetReport'
     *     responses:
     *       201:
     *         description: Report created
     */
    .post(auth, createValidator, validate, controller.create);

/**
 * @swagger
 * /api/cmms/master/asset-reports/{id}:
 *   get:
 *     summary: Get report by ID
 *     tags: [AssetReports]
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
 *         description: Report details
 */
router.route('/:id')
    .get(auth, controller.getById)
    /**
     * @swagger
     * /api/cmms/master/asset-reports/{id}:
     *   put:
     *     summary: Update report (Full)
     *     tags: [AssetReports]
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
     *         description: Report updated
     */
    .put(auth, updateValidator, validate, controller.update)
    /**
     * @swagger
     * /api/cmms/master/asset-reports/{id}:
     *   patch:
     *     summary: Update report (Partial)
     *     tags: [AssetReports]
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
     *         description: Report updated
     */
    .patch(auth, updateValidator, validate, controller.updatePartial)
    /**
     * @swagger
     * /api/cmms/master/asset-reports/{id}:
     *   delete:
     *     summary: Delete report
     *     tags: [AssetReports]
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
     *         description: Report deleted
     */
    .delete(auth, controller.delete);

export default router;
