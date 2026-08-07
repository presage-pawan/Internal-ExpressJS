import { Router } from 'express';
import { FormController } from './form.controller.js';
import { auth } from '../../../auth.js';
import { validate } from '../../../middlewares/validate.js';
import { createValidator, updateValidator } from './form.validator.js';

const router = Router();
const controller = new FormController();

/**
 * @swagger
 * tags:
 *   name: SOPForms
 *   description: Digital Standard Operating Procedure forms
 */

/**
 * @swagger
 * /api/cmms/master/forms:
 *   get:
 *     summary: Get all SOP forms
 *     tags: [SOPForms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of forms
 */
router.route('/')
    .get(auth, controller.getAll)
    /**
     * @swagger
     * /api/cmms/master/forms:
     *   post:
     *     summary: Create an SOP form
     *     tags: [SOPForms]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SOPForm'
     *     responses:
     *       201:
     *         description: Form created
     */
    .post(auth, createValidator, validate, controller.create);

/**
 * @swagger
 * /api/cmms/master/forms/{id}:
 *   get:
 *     summary: Get form by ID
 *     tags: [SOPForms]
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
 *         description: Form details
 */
router.route('/:id')
    .get(auth, controller.getById)
    /**
     * @swagger
     * /api/cmms/master/forms/{id}:
     *   put:
     *     summary: Update form (Full)
     *     tags: [SOPForms]
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
     *         description: Form updated
     */
    .put(auth, updateValidator, validate, controller.update)
    /**
     * @swagger
     * /api/cmms/master/forms/{id}:
     *   patch:
     *     summary: Update form (Partial)
     *     tags: [SOPForms]
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
     *         description: Form updated
     */
    .patch(auth, updateValidator, validate, controller.updatePartial)
    /**
     * @swagger
     * /api/cmms/master/forms/{id}:
     *   delete:
     *     summary: Delete form
     *     tags: [SOPForms]
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
     *         description: Form deleted
     */
    .delete(auth, controller.delete);

export default router;
