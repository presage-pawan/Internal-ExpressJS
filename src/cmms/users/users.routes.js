import express from 'express';
import { Router } from 'express';
import { companyContext } from '../../middlewares/company.js';
import { validate } from '../../middlewares/validate.js';
import roleMenuRoutes from './user-role-menu/role-menu.route.js';
import userLogsRoutes from './user-logs/user-logs.route.js';
import userTokenRoutes from './user-token/user-token.route.js';
import userVerificationRoutes from './user-verification/user-verification.route.js';
import { UserController } from './user.controller.js';
import {
    createUserValidator,
    updateUserValidator,
    patchUserValidator,
    listUsersValidator,
} from './user.validator.js';

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: CMMS user management (CRUD)
 */

const controller = new UserController();

/**
 * Build a sub-router with all User CRUD routes.
 * Mounted at the given router's base path.
 */
const buildUserCrudRouter = (mergeParams = false) => {
    const r = Router({ mergeParams });

    /**
     * @swagger
     * /api/cmms/users:
     *   get:
     *     summary: List all users (paginated + filterable)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema: { type: integer, default: 1 }
     *       - in: query
     *         name: limit
     *         schema: { type: integer, default: 20 }
     *       - in: query
     *         name: user_status
     *         schema: { type: string, enum: [active, inactive] }
     *       - in: query
     *         name: user_role
     *         schema: { type: string, enum: [admin, manager, employee, customer, user] }
     *       - in: query
     *         name: search
     *         schema: { type: string }
     *         description: Search by firstName, lastName, username or email
     *     responses:
     *       200:
     *         description: Paginated list of users
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
     *         description: User created successfully
     */
    r.route('/')
        .get(listUsersValidator, validate, controller.getAll)
        .post(createUserValidator, validate, controller.create);

    /**
     * @swagger
     * /api/cmms/users/{id}:
     *   get:
     *     summary: Get a single user by ID
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string }
     *     responses:
     *       200:
     *         description: User record
     *       404:
     *         description: User not found
     *   put:
     *     summary: Full update of a user record
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/User'
     *     responses:
     *       200:
     *         description: User updated successfully
     *   patch:
     *     summary: Partial update of a user record
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string }
     *     responses:
     *       200:
     *         description: User partially updated
     *   delete:
     *     summary: Soft-delete a user (sets visible=false)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string }
     *     responses:
     *       200:
     *         description: User soft-deleted successfully
     */
    r.route('/:id')
        .get(controller.getById)
        .put(updateUserValidator, validate, controller.update)
        .patch(patchUserValidator, validate, controller.updatePartial)
        .delete(controller.delete);

    return r;
};

export default () => {
    const router = express.Router();

    /* ── User CRUD (flat, no company scope) ───────────────────────────────── */
    router.use('/', buildUserCrudRouter());

    /* ── Sub-module routes (flat) ─────────────────────────────────────────── */
    router.use('/logs', userLogsRoutes);
    router.use('/tokens', userTokenRoutes);
    router.use('/role-menus', roleMenuRoutes);
    router.use('/verifications', userVerificationRoutes);

    /* ── Company-scoped routes ────────────────────────────────────────────── */
    const companyRouter = express.Router({ mergeParams: true });

    // User CRUD under /:companyId
    companyRouter.use('/', buildUserCrudRouter(true));

    // Sub-module routes under /:companyId
    companyRouter.use('/logs', userLogsRoutes);
    companyRouter.use('/tokens', userTokenRoutes);
    companyRouter.use('/role-menus', roleMenuRoutes);
    companyRouter.use('/verifications', userVerificationRoutes);

    router.use('/:companyId', companyContext, companyRouter);

    return router;
};

