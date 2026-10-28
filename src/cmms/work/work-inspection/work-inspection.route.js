import { Router } from 'express';
import { WorkInspectionController } from './work-inspection.controller.js';
import { auth } from '../../../auth.js';
import { canonicalWorkflowRequired } from '../../../middlewares/canonical-workflow.js';
import { validate } from '../../../middlewares/validate.js';
import { createValidator, updateValidator } from './work-inspection.validator.js';

const router = Router();
const controller = new WorkInspectionController();

/**
 * @swagger
 * tags:
 *   name: WorkInspections
 *   description: Asset inspection management
 */

/**
 * @swagger
 * /api/cmms/work/work-inspections:
 *   get:
 *     summary: Get all work inspections
 *     tags: [WorkInspections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of work inspections
 */
router.route('/')
    .get(auth, controller.getAll)
    /**
     * @swagger
     * /api/cmms/work/work-inspections:
     *   post:
     *     summary: Create a new work inspection
     *     tags: [WorkInspections]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/WorkInspection'
     *     responses:
     *       201:
     *         description: Work inspection created
     */
    .post(auth, canonicalWorkflowRequired, createValidator, validate, controller.create);

/**
 * @swagger
 * /api/cmms/work/work-inspections/{id}:
 *   get:
 *     summary: Get work inspection by ID
 *     tags: [WorkInspections]
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
 *         description: Work inspection details
 */
router.route('/:id')
    .get(auth, controller.getById)
    /**
     * @swagger
     * /api/cmms/work/work-inspections/{id}:
     *   put:
     *     summary: Update work inspection (Full)
     *     tags: [WorkInspections]
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
     *         description: Work inspection updated
     */
    .put(auth, canonicalWorkflowRequired, updateValidator, validate, controller.update)
    /**
     * @swagger
     * /api/cmms/work/work-inspections/{id}:
     *   patch:
     *     summary: Update work inspection (Partial)
     *     tags: [WorkInspections]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
       200:
 *         description: Work inspection updated
 */
    .patch(auth, canonicalWorkflowRequired, updateValidator, validate, controller.updatePartial)
    /**
     * @swagger
     * /api/cmms/work/work-inspections/{id}:
     *   delete:
     *     summary: Delete work inspection
     *     tags: [WorkInspections]
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
     *         description: Work inspection deleted
     */
    .delete(auth, canonicalWorkflowRequired, controller.delete);

export default router;
