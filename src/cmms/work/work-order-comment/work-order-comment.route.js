import { Router } from 'express';
import { WorkOrderCommentController } from './work-order-comment.controller.js';
import { validate } from '../../../middlewares/validate.js';
import { createValidator, updateValidator } from './work-order-comment.validator.js';
import { auth } from '../../../auth.js';

const router = Router();
const controller = new WorkOrderCommentController();

/**
 * @swagger
 * tags:
 *   name: WorkOrderComments
 *   description: WorkOrderComments management
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
