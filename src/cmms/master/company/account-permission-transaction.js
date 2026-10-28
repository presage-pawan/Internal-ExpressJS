export const buildPermissionVersionFilter = (accountId, observedVersion) => ({
  _id: accountId,
  account_permission_version: observedVersion === undefined || observedVersion === null
    ? { $exists: false }
    : Number(observedVersion)
});
