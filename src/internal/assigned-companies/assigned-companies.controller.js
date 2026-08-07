import { AssignedCompaniesService } from "./assigned-companies.service.js";
import { CompanyService } from "../../cmms/master/company/company.service.js";

export class AssignedCompaniesController {

    getService = (req) => new AssignedCompaniesService(req.db_type);
    getCmmsService = (req) => new CompanyService(req.db_type);

    getByUserId = async (req, res, next) => {
        try {
            let filter = {};
            filter.user_id = req.params.id;
            filter.db_type = req.db_type;
            const companyList = await this.getService(req).getCompByUserId(filter);
            const cmmsService = this.getCmmsService(req);
            const cmmsFilter = cmmsService.buildListFilter(req.query);
            const cmmsCompanyList = await cmmsService.findAll(cmmsFilter, null, { sort: { account_name: 1 } });
            const finalRes = cmmsCompanyList.map(item => {
                const company = item.toObject ? item.toObject() : item;

                const isAssigned = companyList[0]?.company_ids?.some(
                    comp => String(comp) === String(company.id || company._id)
                ) ?? false;
                return {
                    ...company,
                    assigned: isAssigned
                };
            });

            if (!companyList) {
                throw Object.assign(new Error('Company not found'), { status: 404 });
            }
            res.json({ status: true, message: 'Company fetched successfully', data: finalRes });
        } catch (error) {
            next(error)
        }
    }

    AssignedCompaniesByUserId = async (req, res, next) => {
        try {
            const assignedComp = await this.getService(req).upsertByUserId(req.body, req.user.id);
            if (!assignedComp) {
                throw Object.assign(new Error('User not found'), { status: 404 });
            }
            res.status(201).json({ status: true, message: 'Companies assigned successfully', data: assignedComp });
        } catch (error) {
            next(error)
        }
    }

}