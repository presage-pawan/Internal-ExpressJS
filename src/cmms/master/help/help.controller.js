import { HelpService } from './help.service.js';

export class HelpController {
    getService = (req) => new HelpService(req.db_type);

    getAll = async (req, res, next) => {
        try {
            const { companyId } = req;
            const filter = {};
            if (companyId) filter.account_id = companyId;
            const data = await this.getService(req).getAll(filter);
            res.status(200).json({ status: true, data });
        } catch (err) {
            next(err);
        }
    };
}
