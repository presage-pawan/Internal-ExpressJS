import { MapUserService } from './map-user.service.js';
import { bindCompanyPayload } from '../../tenant-payload.js';

export class MapUserController {
    getService = (req) => new MapUserService(req.db_type);

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
            const data = await this.getService(req).getById(id, { include, companyId: req.companyId });
            if (!data) throw Object.assign(new Error('Record not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Data fetched successfully', data });
        } catch (err) { next(err); }
    };

    create = async (req, res, next) => {
        try {
            const payload = { ...bindCompanyPayload(req.body, req.companyId, 'account_id'), createdBy: req.user?.id };
            const data = await this.getService(req).create(payload);
            res.status(201).json({ status: true, message: 'Created successfully', data });
        } catch (err) { next(err); }
    };

    update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).update(id, { ...bindCompanyPayload(req.body, req.companyId, 'account_id'), updatedBy: req.user?.id }, req.companyId);
            if (!data) throw Object.assign(new Error('Record not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Updated successfully', data });
        } catch (err) { next(err); }
    };

    updatePartial = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).updatePartial(id, { ...bindCompanyPayload(req.body, req.companyId, 'account_id'), updatedBy: req.user?.id }, req.companyId);
            if (!data) throw Object.assign(new Error('Record not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Updated successfully', data });
        } catch (err) { next(err); }
    };

    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).delete(id, req.user?.id, req.companyId);
            if (!data) throw Object.assign(new Error('Record not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Deleted successfully' });
        } catch (err) { next(err); }
    };
}
