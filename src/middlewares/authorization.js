const INTERNAL_ACTION_ROLES = Object.freeze({
  'internal.users.manage': new Set(['admin']),
  'internal.roles.manage': new Set(['admin']),
  'internal.assignments.manage': new Set(['admin']),
  'support.login': new Set(['admin'])
});

const principalId = (user = {}) => String(user.id || user._id || '');

export const hasInternalAction = (user, action) => {
  if (!user || user.user_status !== 'active' || user.visible === false) return false;
  const roles = INTERNAL_ACTION_ROLES[action];
  if (!roles) return false;
  return roles.has(String(user.user_role || '').trim().toLowerCase());
};

export const requireInternalAction = (action) => (req, _res, next) => {
  if (!hasInternalAction(req.user, action)) {
    return next(Object.assign(new Error('Forbidden'), { status: 403 }));
  }
  return next();
};

export const requireSelfOrInternalAction = (action, paramName = 'id') => (req, _res, next) => {
  const targetId = String(req.params?.[paramName] || '');
  if (targetId && principalId(req.user) === targetId) return next();
  if (hasInternalAction(req.user, action)) return next();
  return next(Object.assign(new Error('Forbidden'), { status: 403 }));
};
