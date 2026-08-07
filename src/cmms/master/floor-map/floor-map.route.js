import { Router } from 'express';
import { FloorMapController } from './floor-map.controller.js';
import { auth } from '../../../auth.js';
import { validate } from '../../../middlewares/validate.js';
import { createValidator, updateValidator } from './floor-map.validator.js';

const router = Router();
const controller = new FloorMapController();

/**
 * @swagger
 * tags:
 *   name: FloorMaps
 *   description: Equipment and asset floor mapping
 */

/**
 * @swagger
 * /api/cmms/master/floor-maps:
 *   get:
 *     summary: Get all floor map points
 *     tags: [FloorMaps]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of map points
 */
router.get('/', auth, controller.getAll);

/**
 * @swagger
 * /api/cmms/master/floor-maps:
 *   post:
 *     summary: Create a new floor map point
 *     tags: [FloorMaps]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FloorMap'
 *     responses:
 *       201:
 *         description: Floor map point created successfully
 */
router.post('/', auth, createValidator, validate, controller.create);

/**
 * @swagger
 * /api/cmms/master/floor-maps/{id}:
 *   put:
 *     summary: Update a floor map point by ID
 *     tags: [FloorMaps]
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
 *             $ref: '#/components/schemas/FloorMap'
 *     responses:
 *       200:
 *         description: Floor map point updated successfully
 */
router.put('/:id', auth, updateValidator, validate, controller.update);

/**
 * @swagger
 * /api/cmms/master/floor-maps/{id}:
 *   patch:
 *     summary: Update a floor map point by ID
 *     tags: [FloorMaps]
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
 *             $ref: '#/components/schemas/FloorMap'
 *     responses:
 *       200:
 *         description: Floor map point updated successfully
 */
router.patch('/:id', auth, updateValidator, validate, controller.updatePartial);

/**
 * @swagger
 * /api/cmms/master/floor-maps/{id}:
 *   delete:
 *     summary: Delete a floor map point by ID
 *     tags: [FloorMaps]
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
 *         description: Floor map point deleted successfully
 */
router.delete('/:id', auth, controller.delete);

export default router;
