export const mergeRoleMenuDefaults = (current = {}, defaults = {}) => {
  const merged = { ...(current || {}) };
  for (const [key, value] of Object.entries(defaults || {})) {
    if (!Object.prototype.hasOwnProperty.call(merged, key)) merged[key] = value;
  }
  return merged;
};
