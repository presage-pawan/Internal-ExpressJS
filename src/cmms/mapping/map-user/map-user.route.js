import { Router } from 'express';
import { MapUserController } from './map-user.controller.js';
import { validate } from '../../../middlewares/validate.js';
import { createValidator, updateValidator } from './map-user.validator.js';
import { auth } from '../../../auth.js';

const router = Router();
const controller = new MapUserController();

/**
 * @swagger
 * tags:
 *   name: MapUsers
 *   description: MapUsers management
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
