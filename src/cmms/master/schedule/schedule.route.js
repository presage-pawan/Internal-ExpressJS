import { Router } from 'express';
import { ScheduleController } from './schedule.controller.js';
import { auth } from '../../../auth.js';
import { validate } from '../../../middlewares/validate.js';
import { createValidator, updateValidator } from './schedule.validator.js';

const router = Router();
const controller = new ScheduleController();

/**
 * @swagger
 * tags:
 *   name: Schedules
 *   description: Preventive maintenance scheduling
 */

/**
 * @swagger
 * /api/cmms/master/schedules:
 *   get:
 *     summary: Get all schedules
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of schedules
 */
router.route('/')
    .get(auth, controller.getAll)
    /**
     * @swagger
     * /api/cmms/master/schedules:
     *   post:
     *     summary: Create a new schedule
     *     tags: [Schedules]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ScheduleMaster'
     *     responses:
     *       201:
     *         description: Schedule created
     */
    .post(auth, createValidator, validate, controller.create);

/**
 * @swagger
 * /api/cmms/master/schedules/{id}:
 *   get:
 *     summary: Get schedule by ID
 *     tags: [Schedules]
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
 *         description: Schedule details
 */
router.route('/:id')
    .get(auth, controller.getById)
    /**
     * @swagger
     * /api/cmms/master/schedules/{id}:
     *   put:
     *     summary: Update schedule (Full)
     *     tags: [Schedules]
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
     *         description: Schedule updated
     */
    .put(auth, updateValidator, validate, controller.update)
    /**
     * @swagger
     * /api/cmms/master/schedules/{id}:
     *   patch:
     *     summary: Update schedule (Partial)
     *     tags: [Schedules]
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
     *         description: Schedule updated
     */
    .patch(auth, updateValidator, validate, controller.updatePartial)
    /**
     * @swagger
     * /api/cmms/master/schedules/{id}:
     *   delete:
     *     summary: Delete schedule
     *     tags: [Schedules]
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
     *         description: Schedule deleted
     */
    .delete(auth, controller.delete);

export default router;
