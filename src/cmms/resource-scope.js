export const buildResourceScopeFilter = (id, companyId, field = 'account_id') => ({
  _id: id,
  ...(companyId ? { [field]: companyId } : {})
});

export const applyCompanyScope = (filter = {}, companyId, field = 'account_id') => ({
  ...filter,
  ...(companyId ? { [field]: companyId } : {})
});
