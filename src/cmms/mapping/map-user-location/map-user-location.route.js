import { Router } from 'express';
import { MapUserLocationController } from './map-user-location.controller.js';
import { validate } from '../../../middlewares/validate.js';
import { createValidator, updateValidator } from './map-user-location.validator.js';
import { auth } from '../../../auth.js';

const router = Router();
const controller = new MapUserLocationController();

/**
 * @swagger
 * tags:
 *   name: MapUserLocations
 *   description: MapUserLocations management
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
