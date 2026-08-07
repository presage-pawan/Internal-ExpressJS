import { Router } from 'express';
import { FormCategoryController } from './form-category.controller.js';
import { auth } from '../../../auth.js';
import { validate } from '../../../middlewares/validate.js';
import { createValidator, updateValidator } from './form-category.validator.js';

const router = Router();
const controller = new FormCategoryController();

/**
 * @swagger
 * tags:
 *   name: FormCategories
 *   description: Categories for digital SOP forms
 */

/**
 * @swagger
 * /api/cmms/master/form-categories:
 *   get:
 *     summary: Get all form categories
 *     tags: [FormCategories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.route('/')
    .get(auth, controller.getAll)
    /**
     * @swagger
     * /api/cmms/master/form-categories:
     *   post:
     *     summary: Create a form category
     *     tags: [FormCategories]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/FormCategory'
     *     responses:
     *       201:
     *         description: Category created
     */
    .post(auth, createValidator, validate, controller.create);

/**
 * @swagger
 * /api/cmms/master/form-categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [FormCategories]
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
 *         description: Category details
 */
router.route('/:id')
    .get(auth, controller.getById)
    /**
     * @swagger
     * /api/cmms/master/form-categories/{id}:
     *   put:
     *     summary: Update category (Full)
     *     tags: [FormCategories]
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
     *         description: Category updated
     */
    .put(auth, updateValidator, validate, controller.update)
    /**
     * @swagger
     * /api/cmms/master/form-categories/{id}:
     *   patch:
     *     summary: Update category (Partial)
     *     tags: [FormCategories]
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
     *         description: Category updated
     */
    .patch(auth, updateValidator, validate, controller.updatePartial)
    /**
     * @swagger
     * /api/cmms/master/form-categories/{id}:
     *   delete:
     *     summary: Delete category
     *     tags: [FormCategories]
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
     *         description: Category deleted
     */
    .delete(auth, controller.delete);

export default router;
