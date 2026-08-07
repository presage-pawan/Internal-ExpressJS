import { Router } from 'express';
import { UserVerificationController } from './user-verification.controller.js';
import { validate } from '../../../middlewares/validate.js';
import {
    createVerificationValidator,
    verifyCodeValidator,
    listVerificationsValidator,
} from './user-verification.validator.js';

const router = Router();
const controller = new UserVerificationController();

/**
 * @swagger
 * tags:
 *   name: UserVerifications
 *   description: User registration email verification codes
 */

/**
 * @swagger
 * /api/cmms/users/verifications:
 *   get:
 *     summary: Get all verification records (paginated)
 *     tags: [UserVerifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: page,  schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *       - { in: query, name: email, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Paginated list of verification records
 *   post:
 *     summary: Create a verification code for an email
 *     tags: [UserVerifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserVerification'
 *     responses:
 *       201:
 *         description: Verification code created/replaced
 */
router.route('/')
    .get(listVerificationsValidator, validate, controller.getAll)
    .post(createVerificationValidator, validate, controller.create);

/**
 * @swagger
 * /api/cmms/users/verifications/verify:
 *   post:
 *     summary: Verify an email code (consumes and deletes the code on success)
 *     tags: [UserVerifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: string }
 *               code:  { type: string }
 *     responses:
 *       200:
 *         description: Code verified and consumed
 *       400:
 *         description: Invalid or expired code
 */
router.post('/verify', verifyCodeValidator, validate, controller.verify);

/**
 * @swagger
 * /api/cmms/users/verifications/email/{email}:
 *   get:
 *     summary: Get verification record by email address
 *     tags: [UserVerifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: email, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Verification record
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete all verification records for an email
 *     tags: [UserVerifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: email, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Deleted successfully
 */
router.route('/email/:email')
    .get(controller.getByEmail)
    .delete(controller.deleteByEmail);

/**
 * @swagger
 * /api/cmms/users/verifications/{id}:
 *   get:
 *     summary: Get a verification record by ID
 *     tags: [UserVerifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Verification record
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete a verification record by ID
 *     tags: [UserVerifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Deleted successfully
 */
router.route('/:id')
    .get(controller.getById)
    .delete(controller.delete);

export default router;

