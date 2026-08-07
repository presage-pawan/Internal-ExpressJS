import { Router } from 'express';
import { UserLogController } from './user-logs.controller.js';
import { validate } from '../../../middlewares/validate.js';
import { createUserLogValidator, listUserLogsValidator } from './user-logs.validator.js';

const router = Router();
const controller = new UserLogController();

/**
 * @swagger
 * tags:
 *   name: UserLogs
 *   description: Audit logs of user activities
 */

/**
 * @swagger
 * /api/cmms/users/logs:
 *   get:
 *     summary: Get all user logs (paginated, filterable)
 *     tags: [UserLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: page,        schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,       schema: { type: integer, default: 50 } }
 *       - { in: query, name: userId,      schema: { type: string } }
 *       - { in: query, name: statusCode,  schema: { type: integer } }
 *       - { in: query, name: method,      schema: { type: string } }
 *       - { in: query, name: module,      schema: { type: string } }
 *       - { in: query, name: from,        schema: { type: string, format: date-time } }
 *       - { in: query, name: to,          schema: { type: string, format: date-time } }
 *     responses:
 *       200:
 *         description: Paginated list of user logs
 *   post:
 *     summary: Create a new user log entry
 *     tags: [UserLogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLog'
 *     responses:
 *       201:
 *         description: User log created
 */
router.route('/')
    .get(listUserLogsValidator, validate, controller.getAll)
    .post(createUserLogValidator, validate, controller.create);

/**
 * @swagger
 * /api/cmms/users/logs/user/{userId}:
 *   get:
 *     summary: Get all logs for a specific user
 *     tags: [UserLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: string } }
 *       - { in: query, name: page,  schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *       - { in: query, name: from,  schema: { type: string, format: date-time } }
 *       - { in: query, name: to,    schema: { type: string, format: date-time } }
 *     responses:
 *       200:
 *         description: Logs for the specified user
 *   delete:
 *     summary: Delete ALL logs for a specific user
 *     tags: [UserLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Bulk deletion result
 */
router.route('/user/:userId')
    .get(controller.getByUserId)
    .delete(controller.deleteByUserId);

/**
 * @swagger
 * /api/cmms/users/logs/{id}:
 *   get:
 *     summary: Get a single user log by ID
 *     tags: [UserLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: User log record
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete a single user log by ID
 *     tags: [UserLogs]
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

