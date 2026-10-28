import { getConnection } from '../_db/index.js';
import { SecurityAuditModel } from '../schemas/security-audit.model.js';
import { buildAuditPersistenceError, buildSecurityAuditEvent } from './security-audit.js';

export const writeSecurityAudit = async (input, options = {}) => {
  try {
    const connection = options.connection || getConnection('production', 'website');
    const model = SecurityAuditModel(connection);
    const event = buildSecurityAuditEvent(input);
    if (options.session) {
      const created = await model.create([event], { session: options.session });
      return created?.[0] || null;
    }
    return await model.create(event);
  } catch (error) {
    console.error('Security audit persistence failed', {
      action: String(input?.action || ''),
      request_id: String(input?.requestId || ''),
      error: error?.name || 'Error'
    });
    if (options.required) {
      throw buildAuditPersistenceError(error);
    }
    return null;
  }
};

export const requestAuditContext = (req = {}) => ({
  actorId: req.user?.id || req.user?._id,
  environment: req.db_type,
  requestId: req.headers?.['x-request-id'] || req.headers?.['x-correlation-id']
});
