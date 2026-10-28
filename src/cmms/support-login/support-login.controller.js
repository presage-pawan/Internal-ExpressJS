import { SupportLoginService } from './support-login.service.js';
import { requestAuditContext, writeSecurityAudit } from '../../security/security-audit.service.js';

export class SupportLoginController {
  constructor() {
    this.service = new SupportLoginService();
  }

  createGrant = async (req, res, next) => {
    const auditBase = {
      ...requestAuditContext(req),
      action: 'support.login.issued',
      targetType: 'user',
      targetId: req.body?.email,
      companyId: req.body?.company_id,
      reason: req.body?.reason,
      metadata: { purpose: 'support-login' }
    };

    try {
      const data = await this.service.createGrant({
        email: req.body?.email,
        companyId: req.body?.company_id,
        actorId: req.user?.id || req.user?._id,
        dbType: req.db_type,
        stateChallenge: req.body?.state_challenge
      });
      await writeSecurityAudit({ ...auditBase, outcome: 'success' });
      return res.status(200).json(data);
    } catch (error) {
      await writeSecurityAudit({
        ...auditBase,
        action: 'support.login.denied',
        outcome: 'failure',
        metadata: { purpose: 'support-login', error_code: error?.code || error?.status || 'failed' }
      });
      return next(error);
    }
  };
}
