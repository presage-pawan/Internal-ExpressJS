import { Router } from 'express';
import { HelpController } from './help.controller.js';
import { auth } from '../../../auth.js';

const router = Router();
const controller = new HelpController();

/**
 * @swagger
 * tags:
 *   name: Helps
 *   description: Help and support requests
 */

/**
 * @swagger
 * /api/cmms/master/helps:
 *   get:
 *     summary: Get all help requests
 *     tags: [Helps]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of help requests
 */
router.get('/', auth, controller.getAll);

export default router;
