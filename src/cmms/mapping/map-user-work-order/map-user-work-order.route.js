import { Router } from 'express';
import { MapUserWorkOrderController } from './map-user-work-order.controller.js';
import { validate } from '../../../middlewares/validate.js';
import { createValidator, updateValidator } from './map-user-work-order.validator.js';
import { auth } from '../../../auth.js';

const router = Router();
const controller = new MapUserWorkOrderController();

/**
 * @swagger
 * tags:
 *   name: MapUserWorkOrders
 *   description: MapUserWorkOrders management
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
