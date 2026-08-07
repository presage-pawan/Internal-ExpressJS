import { Router } from 'express';
import { UserController } from './user.controller.js';
import { auth } from '../../../auth.js';
import { validate } from '../../../middlewares/validate.js';
import { createMasterUserValidator, updateMasterUserValidator } from './user.validator.js';

const router = Router({ mergeParams: true });
const controller = new UserController();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User account management
 */

/**
 * @swagger
 * /api/cmms/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router
  .route('/')
  .get(auth, controller.getAllUsers)
  /**
   * @swagger
   * /api/cmms/users:
   *   post:
   *     summary: Create a new user
   *     tags: [Users]
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
  .post(auth, createMasterUserValidator, validate, controller.createUser);

/**
 * @swagger
 * /api/cmms/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
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
router
  .route('/:id')
  .get(auth, controller.getUserById)
  /**
   * @swagger
   * /api/cmms/users/{id}:
   *   put:
   *     summary: Update user (Full)
   *     tags: [Users]
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
   */
  .put(auth, updateMasterUserValidator, validate, controller.updateUser)
  /**
   * @swagger
   * /api/cmms/users/{id}:
   *   patch:
   *     summary: Update user (Partial)
   *     tags: [Users]
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
   */
  .patch(auth, updateMasterUserValidator, validate, controller.updatePartial)
  /**
   * @swagger
   * /api/cmms/users/{id}:
   *   delete:
   *     summary: Delete user
   *     tags: [Users]
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
  .delete(auth, controller.deleteUser);

router.patch(
  '/:id/reset-password',
  auth,
  controller.resetPassword
);

export default router;
