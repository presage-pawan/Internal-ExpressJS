import { Router } from 'express';
import { requireSupportLoginService } from '../middlewares/support-login-service.js';
import { UserService } from '../internal/user/user.service.js';
import { CompanyService } from '../cmms/master/company/company.service.js';
import { hasInternalAction } from '../middlewares/authorization.js';

const router = Router();

router.post('/introspect', requireSupportLoginService, async (req, res, next) => {
  try {
    const actorId = String(req.body?.actor_id || '').trim();
    const companyId = String(req.body?.company_id || '').trim();
    const environment = String(req.body?.environment || '').trim().toLowerCase();

    if (!actorId || !companyId || !['staging', 'production'].includes(environment)) {
      throw Object.assign(new Error('Invalid support-login introspection context'), { status: 400 });
    }

    const users = await new UserService('production').getAllUsers({
      _id: actorId,
      user_status: 'active',
      visible: { $ne: false }
    });
    const actor = users?.[0];
    if (!actor || !hasInternalAction(actor, 'support.login')) {
      throw Object.assign(new Error('Support-login actor is not authorized'), { status: 403 });
    }

    const company = await new CompanyService(environment).findById(companyId);
    if (!company || company.visible === false || company.account_status === 'inactive') {
      throw Object.assign(new Error('Support-login company is unavailable'), { status: 403 });
    }

    return res.status(200).json({ status: true, authorized: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
