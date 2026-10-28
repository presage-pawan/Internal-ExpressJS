const SECRET_FIELDS = new Set([
  'apiKey',
  'api_key',
  'download_api_key',
  'downloadToken',
  'external_token',
  'downloadTokenDetails',
  'apiKeyRecord'
]);

export const isCompanyAccessible = (user, companyId, assignments = []) => {
  if (!user || user.user_status !== 'active' || user.visible === false || !companyId) return false;
  if (String(user.user_role || '').trim().toLowerCase() === 'admin') return true;
  const target = String(companyId);
  return assignments.some((assignment) => Array.isArray(assignment.company_ids)
    && assignment.company_ids.some((id) => String(id) === target));
};

export const stripCompanySecrets = (value = {}) => {
  const source = value?.toObject ? value.toObject() : value;
  const sanitized = { ...source };
  for (const field of SECRET_FIELDS) delete sanitized[field];
  return sanitized;
};
