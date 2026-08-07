import { TroubleshootGuideService } from './troubleshoot-guide.service.js';

export class TroubleshootGuideController {
    getService = (req) => new TroubleshootGuideService(req.db_type);

    getAll = async (req, res, next) => {
        try {
            const { companyId, query: { include, page, limit, search } } = req;
            const filter = {};
            if (companyId) filter.account_id = companyId;
            const data = await this.getService(req).getAll(filter, { include, page, limit, search });
            res.status(200).json({ status: true, message: 'Data fetched successfully', data: data.data, pagination: data.pagination });
        } catch (err) { next(err); }
    };

    getById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { include } = req.query;
            const data = await this.getService(req).getById(id, { include });
            if (!data) throw Object.assign(new Error('Record not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Data fetched successfully', data });
        } catch (err) { next(err); }
    };

    create = async (req, res, next) => {
        try {
            const payload = { ...req.body, createdBy: req.user?.id };
            if (req.companyId) payload.account_id = req.companyId;
            const data = await this.getService(req).create(payload);
            res.status(201).json({ status: true, message: 'Created successfully', data });
        } catch (err) { next(err); }
    };

    update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).update(id, { ...req.body, updatedBy: req.user?.id });
            if (!data) throw Object.assign(new Error('Record not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Updated successfully', data });
        } catch (err) { next(err); }
    };

    updatePartial = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).updatePartial(id, { ...req.body, updatedBy: req.user?.id });
            if (!data) throw Object.assign(new Error('Record not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Updated successfully', data });
        } catch (err) { next(err); }
    };

    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).delete(id, req.user?.id);
            if (!data) throw Object.assign(new Error('Record not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Deleted successfully' });
        } catch (err) { next(err); }
    };
}
