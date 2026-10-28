import mongoose from 'mongoose';
import { CompanyService } from '../cmms/master/company/company.service.js';
import { AssignedCompaniesService } from '../internal/assigned-companies/assigned-companies.service.js';
import { isCompanyAccessible } from '../cmms/master/company/company-security.js';

export const companyContext = async (req, res, next) => {
    try {
        const getDbType = (request) => request.db_type || 'production';
        const { companyId } = req.params;
        if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({ status: false, message: 'Invalid company id' });
        }

        const service = new CompanyService(getDbType(req));
        const company = await service.findById(companyId);
        if (!company) {
            return res.status(404).json({ status: false, message: 'Company not found' });
        }

        if (String(req.user?.user_role || '').toLowerCase() !== 'admin') {
            const assignments = await new AssignedCompaniesService(getDbType(req)).getCompByUserId({
                user_id: req.user?._id || req.user?.id,
                db_type: getDbType(req)
            });
            if (!isCompanyAccessible(req.user, companyId, assignments)) {
                return res.status(403).json({ status: false, message: 'Company access denied' });
            }
        }

        req.companyId = new mongoose.Types.ObjectId(companyId);
        return next();
    } catch (error) {
        return next(error);
    }
};
