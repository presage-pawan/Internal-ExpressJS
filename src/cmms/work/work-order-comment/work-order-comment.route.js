import { Router } from 'express';
import { WorkOrderCommentController } from './work-order-comment.controller.js';
import { validate } from '../../../middlewares/validate.js';
import { createValidator, updateValidator } from './work-order-comment.validator.js';
import { auth } from '../../../auth.js';
import { canonicalWorkflowRequired } from '../../../middlewares/canonical-workflow.js';

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
    .post(auth, canonicalWorkflowRequired, createValidator, validate, controller.create);

router.route('/:id')
    .get(auth, controller.getById)
    .put(auth, canonicalWorkflowRequired, updateValidator, validate, controller.update)
    .patch(auth, canonicalWorkflowRequired, updateValidator, validate, controller.updatePartial)
    .delete(auth, canonicalWorkflowRequired, controller.delete);

export default router;
