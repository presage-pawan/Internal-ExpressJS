import { Router } from 'express';
import { WorkRequestController } from './work-request.controller.js';
import { auth } from '../../../auth.js';
import { canonicalWorkflowRequired } from '../../../middlewares/canonical-workflow.js';
import { validate } from '../../../middlewares/validate.js';
import { createValidator, updateValidator } from './work-request.validator.js';

const router = Router();
const controller = new WorkRequestController();

/**
 * @swagger
 * tags:
 *   name: WorkRequests
 *   description: Maintenance request management
 */

/**
 * @swagger
 * /api/cmms/work/work-requests:
 *   get:
 *     summary: Get all work requests
 *     tags: [WorkRequests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of work requests
 */
router.route('/')
    .get(auth, controller.getAll)
    /**
     * @swagger
     * /api/cmms/work/work-requests:
     *   post:
     *     summary: Create a new work request
     *     tags: [WorkRequests]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/WorkRequest'
     *     responses:
     *       201:
     *         description: Work request created
     */
    .post(auth, canonicalWorkflowRequired, createValidator, validate, controller.create);

/**
 * @swagger
 * /api/cmms/work/work-requests/{id}:
 *   get:
 *     summary: Get work request by ID
 *     tags: [WorkRequests]
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
 *         description: Work request details
 */
router.route('/:id')
    .get(auth, controller.getById)
    /**
     * @swagger
     * /api/cmms/work/work-requests/{id}:
     *   put:
     *     summary: Update work request (Full)
     *     tags: [WorkRequests]
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
     *         description: Work request updated
     */
    .put(auth, canonicalWorkflowRequired, updateValidator, validate, controller.update)
    /**
     * @swagger
     * /api/cmms/work/work-requests/{id}:
     *   patch:
     *     summary: Update work request (Partial)
     *     tags: [WorkRequests]
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
     *         description: Work request updated
     */
    .patch(auth, canonicalWorkflowRequired, updateValidator, validate, controller.updatePartial)
    /**
     * @swagger
     * /api/cmms/work/work-requests/{id}:
     *   delete:
     *     summary: Delete work request
     *     tags: [WorkRequests]
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
     *         description: Work request deleted
     */
    .delete(auth, canonicalWorkflowRequired, controller.delete);

export default router;
