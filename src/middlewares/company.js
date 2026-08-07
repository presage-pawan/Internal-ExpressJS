import mongoose from 'mongoose';
import { CompanyService } from '../cmms/master/company/company.service.js';

export const companyContext = async (req, res, next) => {
    const getDbType = (req) => {
        return req.db_type || 'production';
    }
    const { companyId } = req.params;
    console.log(companyId);
    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({ status: false, message: 'Invalid company id' });
    }
    const service = new CompanyService(getDbType(req));
    const company = await service.findById(companyId);
    if (!company) {
        return res.status(404).json({ status: false, message: 'Company not found' });
    }
    req.companyId = new mongoose.Types.ObjectId(companyId);
    next();
};
