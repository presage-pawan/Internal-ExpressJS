import { getConnection } from '../_db/index.js';
import { SecurityAuditModel } from '../schemas/security-audit.model.js';
import { buildSecurityAuditEvent } from './security-audit.js';

export const writeSecurityAudit = async (input) => {
  try {
    const connection = getConnection('production', 'website');
    return await SecurityAuditModel(connection).create(buildSecurityAuditEvent(input));
  } catch (error) {
    // Audit failure must be visible to protected logs without leaking action secrets.
    console.error('Security audit persistence failed', {
      action: String(input?.action || ''),
      request_id: String(input?.requestId || ''),
      error: error?.name || 'Error'
    });
    return null;
  }
};

export const requestAuditContext = (req = {}) => ({
  actorId: req.user?.id || req.user?._id,
  environment: req.db_type,
  requestId: req.headers?.['x-request-id'] || req.headers?.['x-correlation-id']
});
