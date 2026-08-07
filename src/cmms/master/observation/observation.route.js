import { Router } from 'express';
import { ObservationController } from './observation.controller.js';
import { auth } from '../../../auth.js';
import { validate } from '../../../middlewares/validate.js';
import { createValidator, updateValidator } from './observation.validator.js';

const router = Router();
const controller = new ObservationController();

/**
 * @swagger
 * tags:
 *   name: Observations
 *   description: Asset condition observations and logs
 */

/**
 * @swagger
 * /api/cmms/master/observations:
 *   get:
 *     summary: Get all observations
 *     tags: [Observations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of observations
 */
router.route('/')
    .get(auth, controller.getAll)
    /**
     * @swagger
     * /api/cmms/master/observations:
     *   post:
     *     summary: Create an observation
     *     tags: [Observations]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Observation'
     *     responses:
     *       201:
     *         description: Observation created
     */
    .post(auth, createValidator, validate, controller.create);

/**
 * @swagger
 * /api/cmms/master/observations/{id}:
 *   get:
 *     summary: Get observation by ID
 *     tags: [Observations]
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
 *         description: Observation details
 */
router.route('/:id')
    .get(auth, controller.getById)
    /**
     * @swagger
     * /api/cmms/master/observations/{id}:
     *   put:
     *     summary: Update observation (Full)
     *     tags: [Observations]
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
     *         description: Observation updated
     */
    .put(auth, updateValidator, validate, controller.update)
    /**
     * @swagger
     * /api/cmms/master/observations/{id}:
     *   patch:
     *     summary: Update observation (Partial)
     *     tags: [Observations]
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
     *         description: Observation updated
     */
    .patch(auth, updateValidator, validate, controller.updatePartial)
    /**
     * @swagger
     * /api/cmms/master/observations/{id}:
     *   delete:
     *     summary: Delete observation
     *     tags: [Observations]
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
     *         description: Observation deleted
     */
    .delete(auth, controller.delete);

export default router;
