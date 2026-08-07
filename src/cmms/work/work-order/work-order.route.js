import { Router } from 'express';
import { WorkOrderController } from './work-order.controller.js';
import { auth } from '../../../auth.js';
import { validate } from '../../../middlewares/validate.js';
import { createValidator, updateValidator } from './work-order.validator.js';

const router = Router();
const controller = new WorkOrderController();

/**
 * @swagger
 * tags:
 *   name: WorkOrders
 *   description: Operational work order management
 */

/**
 * @swagger
 * /api/cmms/work/work-orders:
 *   get:
 *     summary: Get all work orders
 *     tags: [WorkOrders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of work orders
 */
router.route('/')
    .get(auth, controller.getAll)
    /**
     * @swagger
     * /api/cmms/work/work-orders:
     *   post:
     *     summary: Create a new work order
     *     tags: [WorkOrders]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/WorkOrder'
     *     responses:
     *       201:
     *         description: Work order created
     */
    .post(auth, createValidator, validate, controller.create);

/**
 * @swagger
 * /api/cmms/work/work-orders/{id}:
 *   get:
 *     summary: Get work order by ID
 *     tags: [WorkOrders]
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
 *         description: Work order details
 */
router.route('/:id')
    .get(auth, controller.getById)
    /**
     * @swagger
     * /api/cmms/work/work-orders/{id}:
     *   put:
     *     summary: Update work order (Full)
     *     tags: [WorkOrders]
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
     *         description: Work order updated
     */
    .put(auth, updateValidator, validate, controller.update)
    /**
     * @swagger
     * /api/cmms/work/work-orders/{id}:
     *   patch:
     *     summary: Update work order (Partial)
     *     tags: [WorkOrders]
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
     *         description: Work order updated
     */
    .patch(auth, updateValidator, validate, controller.updatePartial)
    /**
     * @swagger
     * /api/cmms/work/work-orders/{id}:
     *   delete:
     *     summary: Delete work order
     *     tags: [WorkOrders]
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
     *         description: Work order deleted
     */
    .delete(auth, controller.delete);

export default router;
