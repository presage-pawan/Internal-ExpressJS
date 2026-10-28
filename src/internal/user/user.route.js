import { Router } from 'express';
import { auth } from '../../auth.js';
import { validate } from '../../middlewares/validate.js';
import { createUserValidator, updateUserValidator, passwordChangeValidator } from './user.validator.js';
import { UserController } from './user.controller.js';
import { requireInternalAction, requireSelfOrInternalAction } from '../../middlewares/authorization.js';

const router = Router();
const controller = new UserController();

/**
 * @swagger
 * tags:
 *   name: InternalUsers
 *   description: Internal administrative user management
 */

/**
 * @swagger
 * /api/internal/users:
 *   get:
 *     summary: Get all internal users
 *     tags: [InternalUsers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of internal users
 */
router.get('/', auth, requireInternalAction('internal.users.manage'), controller.getAllUsers);

/**
 * @swagger
 * /api/internal/users/{id}:
 *   get:
 *     summary: Get internal user by ID
 *     tags: [InternalUsers]
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
 *         description: User details
 */
router.get('/:id', auth, requireSelfOrInternalAction('internal.users.manage'), controller.getUserById);

/**
 * @swagger
 * /api/internal/users:
 *   post:
 *     summary: Create an internal user
 *     tags: [InternalUsers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created
 */
router.post('/', auth, requireInternalAction('internal.users.manage'), createUserValidator, validate, controller.createUser);

/**
 * @swagger
 * /api/internal/users/{id}:
 *   put:
 *     summary: Update internal user (Full)
 *     tags: [InternalUsers]
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
 *         description: User updated
 *   patch:
 *     summary: Update internal user (Partial)
 *     tags: [InternalUsers]
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
 *         description: User updated
 *   delete:
 *     summary: Delete internal user
 *     tags: [InternalUsers]
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
 *         description: User deleted
 */
router.patch('/:id/password', auth, requireSelfOrInternalAction('internal.users.manage'), passwordChangeValidator, validate, controller.updatePassword);
router.put('/:id', auth, requireSelfOrInternalAction('internal.users.manage'), updateUserValidator, validate, controller.updateUser);
router.patch('/:id', auth, requireSelfOrInternalAction('internal.users.manage'), updateUserValidator, validate, controller.updatePartial);
router.delete('/:id', auth, requireInternalAction('internal.users.manage'), controller.deleteUser);

export default router;