import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthenticationController } from './authenticate.controller.js';
import { loginValidator } from './authenticate.validator.js';
import { auth } from '../auth.js';
import { validate } from '../middlewares/validate.js';
import { REQUEST_LIMITS } from '../configDB.js';

const router = Router();
const controller = new AuthenticationController();
const loginLimiter = rateLimit({
  windowMs: REQUEST_LIMITS.loginWindowMs,
  max: REQUEST_LIMITS.loginMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: false, message: 'Too many login attempts, please try again later.' }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */
router.post('/login', loginLimiter, loginValidator, validate, controller.login);

/**
 * @swagger
 * /api/users/logout:
 *   get:
 *     summary: User logout
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.get('/logout', auth, controller.logout);

export default router;
