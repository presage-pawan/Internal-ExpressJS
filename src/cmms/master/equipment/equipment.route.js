import { Router } from 'express';
import { EquipmentController } from './equipment.controller.js';
import { auth } from '../../../auth.js';
import { validate } from '../../../middlewares/validate.js';
import { createValidator, updateValidator } from './equipment.validator.js';

const router = Router();
const controller = new EquipmentController();

/**
 * @swagger
 * tags:
 *   name: Equipments
 *   description: Equipment management
 */

/**
 * @swagger
 * /api/cmms/master/equipments:
 *   get:
 *     summary: Get all equipments
 *     tags: [Equipments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of equipments
 */
router.route('/')
    .get(auth, controller.getAll)
    /**
     * @swagger
     * /api/cmms/master/equipments:
     *   post:
     *     summary: Create a new equipment
     *     tags: [Equipments]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/EquipmentSet'
     *     responses:
     *       201:
     *         description: Equipment created
     */
    .post(auth, createValidator, validate, controller.create);

/**
 * @swagger
 * /api/cmms/master/equipments/{id}:
 *   get:
 *     summary: Get equipment by ID
 *     tags: [Equipments]
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
 *         description: Equipment details
 */
router.route('/:id')
    .get(auth, controller.getById)
    /**
     * @swagger
     * /api/cmms/master/equipments/{id}:
     *   put:
     *     summary: Update equipment (Full)
     *     tags: [Equipments]
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
     *         description: Equipment updated
     */
    .put(auth, updateValidator, validate, controller.update)
    /**
     * @swagger
     * /api/cmms/master/equipments/{id}:
     *   patch:
     *     summary: Update equipment (Partial)
     *     tags: [Equipments]
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
     *         description: Equipment updated
     */
    .patch(auth, updateValidator, validate, controller.updatePartial)
    /**
     * @swagger
     * /api/cmms/master/equipments/{id}:
     *   delete:
     *     summary: Delete equipment
     *     tags: [Equipments]
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
     *         description: Equipment deleted
     */
    .delete(auth, controller.delete);

export default router;
