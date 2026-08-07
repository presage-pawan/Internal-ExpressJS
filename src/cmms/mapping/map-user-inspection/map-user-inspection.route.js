import { Router } from 'express';
import { MapUserInspectionController } from './map-user-inspection.controller.js';
import { auth } from '../../../auth.js';
import { validate } from '../../../middlewares/validate.js';
import { createValidator, updateValidator } from './map-user-inspection.validator.js';

const router = Router();
const controller = new MapUserInspectionController();

/**
 * @swagger
 * tags:
 *   name: MapUserInspection
 *   description: User to inspection mapping
 */

/**
 * @swagger
 * /api/cmms/mapping/map-user-inspection:
 *   get:
 *     summary: Get all user-inspection mappings
 *     tags: [MapUserInspection]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of mappings
 */
router.route('/')
    .get(auth, controller.getAll)
    /**
     * @swagger
     * /api/cmms/mapping/map-user-inspection:
     *   post:
     *     summary: Create user-inspection mapping
     *     tags: [MapUserInspection]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/MapUserInspection'
     *     responses:
     *       201:
     *         description: Mapping created
     */
    .post(auth, createValidator, validate, controller.create);

/**
 * @swagger
 * /api/cmms/mapping/map-user-inspection/{id}:
 *   get:
 *     summary: Get mapping by ID
 *     tags: [MapUserInspection]
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
 *         description: Mapping details
 */
router.route('/:id')
    .get(auth, controller.getById)
    /**
     * @swagger
     * /api/cmms/mapping/map-user-inspection/{id}:
     *   put:
     *     summary: Update mapping (Full)
     *     tags: [MapUserInspection]
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
     *         description: Mapping updated
     */
    .put(auth, updateValidator, validate, controller.update)
    /**
     * @swagger
     * /api/cmms/mapping/map-user-inspection/{id}:
     *   patch:
     *     summary: Update mapping (Partial)
     *     tags: [MapUserInspection]
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
     *         description: Mapping updated
     */
    .patch(auth, updateValidator, validate, controller.updatePartial)
    /**
     * @swagger
     * /api/cmms/mapping/map-user-inspection/{id}:
     *   delete:
     *     summary: Delete mapping
     *     tags: [MapUserInspection]
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
     *         description: Mapping deleted
     */
    .delete(auth, controller.delete);

export default router;
