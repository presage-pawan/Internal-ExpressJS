export const buildWorkOrderIdentityFilter = (id, companyId) => ({
  _id: id,
  ...(companyId ? { account_id: companyId } : {})
});
