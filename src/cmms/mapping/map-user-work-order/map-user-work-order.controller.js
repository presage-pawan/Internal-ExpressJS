import { MapUserWorkOrderService } from './map-user-work-order.service.js';

export class MapUserWorkOrderController {
    getService = (req) => new MapUserWorkOrderService(req.db_type);

    getAll = async (req, res, next) => {
        try {
            const { companyId, query: { include, page, limit, search } } = req;
            const filter = {};
            const data = await this.getService(req).getAll(filter, { include, page, limit, search, companyId });
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
            const payload = { ...req.body, createdBy: req.user?.id };
            const data = await this.getService(req).create(payload, req.companyId);
            res.status(201).json({ status: true, message: 'Created successfully', data });
        } catch (err) { next(err); }
    };

    update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).update(id, { ...req.body, updatedBy: req.user?.id }, req.companyId);
            if (!data) throw Object.assign(new Error('Record not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Updated successfully', data });
        } catch (err) { next(err); }
    };

    updatePartial = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).updatePartial(id, { ...req.body, updatedBy: req.user?.id }, req.companyId);
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
