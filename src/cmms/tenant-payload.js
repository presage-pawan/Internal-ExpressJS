export const bindCompanyPayload = (payload = {}, companyId, field = 'account_id') => {
  const bound = { ...(payload || {}) };
  if (companyId) bound[field] = companyId;
  return bound;
};
