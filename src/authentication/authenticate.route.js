import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthenticationController } from './authenticate.controller.js';
import {
  forgotPasswordValidator,
  loginValidator,
  resetPasswordValidator,
  verifyResetOtpValidator
} from './authenticate.validator.js';
import { auth } from '../auth.js';
import { validate } from '../middlewares/validate.js';
import { REQUEST_LIMITS, SECURITY_DETAILS } from '../configDB.js';
import { CookiesService } from '../utils/cookies.service.js';
import { requireInternalCsrf } from '../middlewares/internal-csrf.js';

const router = Router();
const controller = new AuthenticationController();
const loginLimiter = rateLimit({
  windowMs: REQUEST_LIMITS.loginWindowMs,
  max: REQUEST_LIMITS.loginMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: false, message: 'Too many login attempts, please try again later.' }
});

const passwordResetLimiter = rateLimit({
  windowMs: REQUEST_LIMITS.loginWindowMs,
  max: Math.max(5, Math.floor(REQUEST_LIMITS.loginMax / 2)),
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: false, message: 'Too many password reset attempts, please try again later.' }
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
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidator, validate, controller.forgotPassword);
router.post('/verify-reset-otp', passwordResetLimiter, verifyResetOtpValidator, validate, controller.verifyResetOtp);
router.post('/reset-password', passwordResetLimiter, resetPasswordValidator, validate, controller.resetPassword);

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
const requireTrustedLogoutOrigin = (req, res, next) => {
  const origin = req.get('Origin');
  if (origin && !SECURITY_DETAILS.corsOrigins.includes(origin)) {
    return next(Object.assign(new Error('Untrusted logout origin'), { status: 403 }));
  }
  next();
};

// Backwards-compatible bearer-only GET. Browser cookie sessions cannot use
// a state-changing GET: POST is the canonical logout method.
router.get('/logout', (req, res, next) => {
  if (!req.headers.authorization || CookiesService.getAuthTokenFromCookie(req)) {
    return res.status(405).json({ status: false, message: 'Use POST to log out' });
  }
  next();
}, auth, controller.logout);
router.post('/logout', requireTrustedLogoutOrigin, auth, requireInternalCsrf, controller.logout);
router.get('/me', auth, controller.me);

export default router;
