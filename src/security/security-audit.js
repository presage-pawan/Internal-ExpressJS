const SECRET_KEY = /(password|secret|token|api[_-]?key|authorization|cookie)/i;

const sanitizeMetadata = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeMetadata);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SECRET_KEY.test(key))
      .map(([key, child]) => [key, sanitizeMetadata(child)])
  );
};

export const buildSecurityAuditEvent = ({
  action,
  actorId,
  targetType,
  targetId,
  companyId,
  environment,
  requestId,
  reason,
  outcome = 'success',
  metadata = {}
} = {}) => ({
  action: String(action || '').trim(),
  actor_id: actorId ? String(actorId) : undefined,
  target_type: targetType ? String(targetType) : undefined,
  target_id: targetId ? String(targetId) : undefined,
  company_id: companyId ? String(companyId) : undefined,
  environment: ['production', 'staging'].includes(String(environment || '').toLowerCase())
    ? String(environment).toLowerCase()
    : 'unknown',
  request_id: requestId ? String(requestId) : undefined,
  reason: reason ? String(reason).trim().slice(0, 500) : undefined,
  outcome: outcome === 'failure' ? 'failure' : 'success',
  metadata: sanitizeMetadata(metadata || {})
});
