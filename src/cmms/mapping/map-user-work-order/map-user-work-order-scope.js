export const restrictIdsToCompany = (ids = []) => ({
  $in: ids
});

export const buildScopedMappingFilter = (mappingId, allowedWorkOrderIds = null) => ({
  _id: mappingId,
  ...(Array.isArray(allowedWorkOrderIds)
    ? { woId: restrictIdsToCompany(allowedWorkOrderIds) }
    : {})
});

export const mappingUsesAllowedWorkOrder = (mapping, allowedWorkOrderIds = []) => {
  const allowed = new Set(allowedWorkOrderIds.map(value => String(value?._id || value || '')).filter(Boolean));
  return allowed.has(String(mapping?.woId?._id || mapping?.woId || ''));
};
