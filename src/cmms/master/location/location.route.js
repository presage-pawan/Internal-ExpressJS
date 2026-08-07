import { Router } from 'express';
import { LocationController } from './location.controller.js';
import { auth } from '../../../auth.js';
import { validate } from '../../../middlewares/validate.js';
import { createLocationValidator, updateLocationValidator } from './location.validator.js';

const router = Router();
const controller = new LocationController();

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: Facility and equipment location management
 */

/**
 * @swagger
 * /api/cmms/master/locations:
 *   get:
 *     summary: Get all locations
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of locations
 */
router.route('/')
  .get(auth, controller.getAll)
  /**
   * @swagger
   * /api/cmms/master/locations:
   *   post:
   *     summary: Create a new location
   *     tags: [Locations]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Location'
   *     responses:
   *       201:
   *         description: Location created
   */
  .post(auth, createLocationValidator, validate, controller.create);

/**
 * @swagger
 * /api/cmms/master/locations/{id}:
 *   get:
 *     summary: Get location by ID
 *     tags: [Locations]
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
 *         description: Location details
 */
router.route('/:id')
  .get(auth, controller.getById)
  /**
   * @swagger
   * /api/cmms/master/locations/{id}:
   *   put:
   *     summary: Update location (Full)
   *     tags: [Locations]
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
   *         description: Location updated
   */
  .put(auth, updateLocationValidator, validate, controller.update)
  /**
   * @swagger
   * /api/cmms/master/locations/{id}:
   *   patch:
   *     summary: Update location (Partial)
   *     tags: [Locations]
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
   *         description: Location updated
   */
  .patch(auth, updateLocationValidator, validate, controller.updatePartial)
  /**
   * @swagger
   * /api/cmms/master/locations/{id}:
   *   delete:
   *     summary: Delete location
   *     tags: [Locations]
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
   *         description: Location deleted
   */
  .delete(auth, controller.delete);

export default router;