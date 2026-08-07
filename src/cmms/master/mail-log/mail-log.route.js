import { Router } from 'express';
import { MailLogController } from './mail-log.controller.js';
import { validate } from '../../../middlewares/validate.js';
import { createValidator, updateValidator } from './mail-log.validator.js';
import { auth } from '../../../auth.js';

const router = Router();
const controller = new MailLogController();

/**
 * @swagger
 * tags:
 *   name: MailLogs
 *   description: MailLogs management
 */

router.route('/')
    .get(auth, controller.getAll)
    .post(auth, createValidator, validate, controller.create);

router.route('/:id')
    .get(auth, controller.getById)
    .put(auth, updateValidator, validate, controller.update)
    .patch(auth, updateValidator, validate, controller.updatePartial)
    .delete(auth, controller.delete);

export default router;
