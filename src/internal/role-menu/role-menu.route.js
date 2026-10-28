import { Router } from 'express';
import { auth } from '../../auth.js';
import { validate } from '../../middlewares/validate.js';
import { createRoleMenuValidator, updateRoleMenuValidator, updatePartialRoleMenuValidator } from './role-menu.validator.js';
import { RoleMenuController } from './role-menu.controller.js';
import { requireInternalAction } from '../../middlewares/authorization.js';

const router = Router();
const controller = new RoleMenuController();

/**
 * @swagger
 * tags:
 *   name: InternalRoleMenu
 *   description: Internal administrative role menu management
 */

/**
 * @swagger
 * /api/internal/role-menu:
 *   get:
 *     summary: Get all internal role menu
 *     tags: [InternalRoleMenu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of internal role menu
 */
router.get('/', auth, controller.getAllRoles);

/**
 * @swagger
 * /api/internal/role-menu/{id}:
 *   get:
 *     summary: Get internal role menu by ID
 *     tags: [InternalRoleMenu]
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
 *         description: Role details
 */
router.get('/:id', auth, controller.getRoleById);

/**
 * @swagger
 * /api/internal/role-menu:
 *   post:
 *     summary: Create an internal role menu
 *     tags: [InternalRoleMenu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleMenu'
 *     responses:
 *       201:
 *         description: Role menu created
 */
router.post('/', auth, requireInternalAction('internal.roles.manage'), createRoleMenuValidator, validate, controller.createRole);

/**
 * @swagger
 * /api/internal/role-menu/{id}:
 *   put:
 *     summary: Update internal role menu (Full)
 *     tags: [InternalRoleMenu]
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
 *             $ref: '#/components/schemas/RoleMenu'
 *     responses:
 *       200:
 *         description: Role updated
 *   patch:
 *     summary: Update internal role menu (Partial)
 *     tags: [InternalRoleMenu]
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
 *             $ref: '#/components/schemas/RoleMenu'
 *     responses:
 *       200:
 *         description: Role updated
 *   delete:
 *     summary: Delete internal role menu
 *     tags: [InternalRoleMenu]
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
 *         description: Role deleted
 */
router.put('/:id', auth, requireInternalAction('internal.roles.manage'), updateRoleMenuValidator, validate, controller.updateRole);
router.patch('/:id', auth, requireInternalAction('internal.roles.manage'), updatePartialRoleMenuValidator, validate, controller.updatePartialRole);
router.delete('/:id', auth, requireInternalAction('internal.roles.manage'), controller.deleteRole);

export default router;