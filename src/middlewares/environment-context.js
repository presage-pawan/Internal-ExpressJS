const ENVIRONMENTS = new Set(['production', 'staging']);

const isCmmsRoute = (req = {}) => String(req.baseUrl || req.originalUrl || '').includes('/cmms');

export const resolveRequestedEnvironment = (req = {}) => {
  if (!isCmmsRoute(req)) return 'production';
  const requested = String(req.headers?.['x-db-type'] || '').trim().toLowerCase();
  if (!ENVIRONMENTS.has(requested)) {
    throw Object.assign(new Error('A valid CMMS environment is required'), { status: 400 });
  }
  return requested;
};

export const isEnvironmentAuthorized = (user, environment, assignments = []) => {
  if (!user || user.user_status !== 'active' || user.visible === false || !ENVIRONMENTS.has(environment)) return false;
  if (String(user.user_role || '').trim().toLowerCase() === 'admin') return true;
  const userId = String(user.id || user._id || '');
  return assignments.some((assignment) => {
    const assignmentUserId = String(assignment.user_id || userId);
    return assignmentUserId === userId
      && assignment.db_type === environment
      && Array.isArray(assignment.company_ids)
      && assignment.company_ids.length > 0;
  });
};
