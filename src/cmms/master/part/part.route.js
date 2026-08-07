import { Router } from 'express';
import { PartController } from './part.controller.js';
import { auth } from '../../../auth.js';
import { createPartValidator, updatePartValidator } from './part.validator.js';
import { validate } from '../../../middlewares/validate.js';

const router = Router();
const controller = new PartController();

/**
 * @swagger
 * tags:
 *   name: Parts
 *   description: Spare parts management
 */

/**
 * @swagger
 * /api/cmms/master/parts:
 *   get:
 *     summary: Get all parts
 *     tags: [Parts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of parts
 */
router.route('/')
    .get(auth, controller.getAll)
    /**
     * @swagger
     * /api/cmms/master/parts:
     *   post:
     *     summary: Create a new part
     *     tags: [Parts]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Part'
     *     responses:
     *       201:
     *         description: Part created
     */
    .post(auth, createPartValidator, validate, controller.create);

/**
 * @swagger
 * /api/cmms/master/parts/{id}:
 *   get:
 *     summary: Get part by ID
 *     tags: [Parts]
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
 *         description: Part details
 */
router.route('/:id')
    .get(auth, controller.getById)
    /**
     * @swagger
     * /api/cmms/master/parts/{id}:
     *   put:
     *     summary: Update part (Full)
     *     tags: [Parts]
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
     *         description: Part updated
     */
    .put(auth, updatePartValidator, validate, controller.update)
    /**
     * @swagger
     * /api/cmms/master/parts/{id}:
     *   patch:
     *     summary: Update part (Partial)
     *     tags: [Parts]
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
     *         description: Part updated
     */
    .patch(auth, updatePartValidator, validate, controller.updatePartial)
    /**
     * @swagger
     * /api/cmms/master/parts/{id}:
     *   delete:
     *     summary: Delete part
     *     tags: [Parts]
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
     *         description: Part deleted
     */
    .delete(auth, controller.delete);

export default router;
