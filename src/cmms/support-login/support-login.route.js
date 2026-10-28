import { Router } from 'express';
import { requireInternalAction } from '../../middlewares/authorization.js';
import { SupportLoginController } from './support-login.controller.js';

const router = Router();
const controller = new SupportLoginController();

router.post('/', requireInternalAction('support.login'), controller.createGrant);

export default router;
