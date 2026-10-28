const SECRET_METADATA_FIELDS = new Set([
  'api_key',
  'apiKey',
  'download_api_key',
  'downloadToken',
  'external_token',
  'token',
  'secret'
]);

const sanitizeMetadata = (metadata = {}) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(metadata || {})) {
    if (!SECRET_METADATA_FIELDS.has(key)) sanitized[key] = value;
  }
  return sanitized;
};

export const buildCredentialAuditInput = ({
  action,
  actorId,
  companyId,
  environment,
  requestId,
  reason,
  metadata
} = {}) => ({
  action: String(action || '').trim(),
  actorId: actorId ? String(actorId) : '',
  targetType: 'company-credential',
  targetId: companyId ? String(companyId) : '',
  companyId: companyId ? String(companyId) : '',
  environment: ['production', 'staging'].includes(environment) ? environment : 'unknown',
  requestId: requestId ? String(requestId) : '',
  reason: reason ? String(reason) : '',
  outcome: 'success',
  metadata: sanitizeMetadata(metadata)
});
