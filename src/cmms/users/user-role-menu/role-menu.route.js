import { Router } from 'express';
import { RoleMenuController } from './role-menu.controller.js';
import { auth } from '../../../auth.js';

const router = Router();
const controller = new RoleMenuController();

/**
 * @swagger
 * tags:
 *   name: RoleMenus
 *   description: UI menu control based on user roles
 */

/**
 * @swagger
 * /api/cmms/users/role-menus:
 *   get:
 *     summary: Get all role-menu configurations
 *     tags: [RoleMenus]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of role-menu configurations
 */
router.get('/', auth, controller.getAll);
router.post('/', auth, controller.create);
router.get('/:id', auth, controller.getById);
router.put('/:id', auth, controller.update);
router.patch('/:id', auth, controller.updatePartial);
router.delete('/:id', auth, controller.delete);
router.get('/user/:userId', auth, controller.getByUserId);

export default router;
