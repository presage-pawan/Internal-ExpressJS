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

router.get('/', auth, controller.getAll);
router.post('/', auth, controller.create);

// Specific named lookups must be registered before the generic /:id route.
router.get('/user/:userId', auth, controller.getByUserId);

router.get('/:id', auth, controller.getById);
router.put('/:id', auth, controller.update);
router.patch('/:id', auth, controller.updatePartial);
router.delete('/:id', auth, controller.delete);

export default router;
