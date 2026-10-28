import { AssignedCompaniesService } from '../internal/assigned-companies/assigned-companies.service.js';
import { isCompanyAccessible } from '../cmms/master/company/company-security.js';

export const requireCompanyAccess = (paramName = 'id') => async (req, _res, next) => {
  try {
    const companyId = req.params?.[paramName];
    if (String(req.user?.user_role || '').toLowerCase() === 'admin') return next();

    const assignments = await new AssignedCompaniesService(req.db_type).getCompByUserId({
      user_id: req.user?._id || req.user?.id,
      db_type: req.db_type
    });

    if (!isCompanyAccessible(req.user, companyId, assignments)) {
      throw Object.assign(new Error('Company access denied'), { status: 403 });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};
