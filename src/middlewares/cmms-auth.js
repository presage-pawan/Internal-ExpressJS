import { auth } from '../auth.js';
import { AssignedCompaniesService } from '../internal/assigned-companies/assigned-companies.service.js';
import { isEnvironmentAuthorized, resolveRequestedEnvironment } from './environment-context.js';

export const cmmsAuth = (req, res, next) => {
  let requestedEnvironment;
  try {
    requestedEnvironment = resolveRequestedEnvironment(req);
  } catch (error) {
    return next(error);
  }

  return auth(req, res, async (authError) => {
    if (authError) return next(authError);
    try {
      let assignments = [];
      if (String(req.user?.user_role || '').toLowerCase() !== 'admin') {
        assignments = await new AssignedCompaniesService('production').getCompByUserId({
          user_id: req.user?._id || req.user?.id,
          db_type: requestedEnvironment
        });
      }

      if (!isEnvironmentAuthorized(req.user, requestedEnvironment, assignments)) {
        throw Object.assign(new Error('Environment access denied'), { status: 403 });
      }

      req.db_type = requestedEnvironment;
      return next();
    } catch (error) {
      return next(error);
    }
  });
};
