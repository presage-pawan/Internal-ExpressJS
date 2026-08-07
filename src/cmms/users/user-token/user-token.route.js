import { Router } from 'express';
import { UserTokenController } from './user-token.controller.js';
import { validate } from '../../../middlewares/validate.js';
import { createTokenValidator, listTokensValidator } from './user-token.validator.js';

const router = Router();
const controller = new UserTokenController();

/**
 * @swagger
 * tags:
 *   name: UserTokens
 *   description: User access token management
 */

/**
 * @swagger
 * /api/cmms/users/tokens:
 *   get:
 *     summary: Get all user tokens (paginated + filterable)
 *     tags: [UserTokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: page,          schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,         schema: { type: integer, default: 20 } }
 *       - { in: query, name: userId,        schema: { type: string } }
 *       - { in: query, name: principalType, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Paginated list of tokens
 *   post:
 *     summary: Issue a new access token
 *     tags: [UserTokens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserToken'
 *     responses:
 *       201:
 *         description: Token created
 */
router.route('/')
    .get(listTokensValidator, validate, controller.getAll)
    .post(createTokenValidator, validate, controller.create);

/**
 * @swagger
 * /api/cmms/users/tokens/user/{userId}:
 *   get:
 *     summary: Get all tokens for a specific user
 *     tags: [UserTokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: List of tokens
 *   delete:
 *     summary: Revoke ALL tokens for a user (logout all sessions)
 *     tags: [UserTokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: All tokens revoked
 */
router.route('/user/:userId')
    .get(controller.getByUserId)
    .delete(controller.revokeAllByUserId);

/**
 * @swagger
 * /api/cmms/users/tokens/{id}:
 *   get:
 *     summary: Get a token by ID
 *     tags: [UserTokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Token record
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Revoke a single token
 *     tags: [UserTokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Token revoked
 */
router.route('/:id')
    .get(controller.getById)
    .delete(controller.delete);

export default router;

