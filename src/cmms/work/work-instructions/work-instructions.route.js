import { Router } from 'express';
import { WorkInstructionsController } from './work-instructions.controller.js';
import { validate } from '../../../middlewares/validate.js';
import { createValidator, updateValidator } from './work-instructions.validator.js';
import { auth } from '../../../auth.js';

const router = Router();
const controller = new WorkInstructionsController();

/**
 * @swagger
 * tags:
 *   name: WorkInstructions
 *   description: WorkInstructions management
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
