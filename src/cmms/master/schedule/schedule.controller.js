import { ScheduleService } from './schedule.service.js';

export class ScheduleController {
    getService = (req) => new ScheduleService(req.db_type);

    getAll = async (req, res, next) => {
        try {
            const { companyId, query: { include } } = req;
            const filter = { visible: { $ne: false } };
            if (companyId) filter.account_id = companyId;
            const data = await this.getService(req).getAll(filter, { include });
            res.status(200).json({ status: true, data });
        } catch (err) {
            next(err);
        }
    };

    getById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { include } = req.query;
            const data = await this.getService(req).getById(id, { include, companyId: req.companyId });
            if (!data) throw Object.assign(new Error('Schedule not found'), { status: 404 });
            res.status(200).json({ status: true, data });
        } catch (err) {
            next(err);
        }
    };

    create = async (req, res, next) => {
        try {
            const data = await this.getService(req).create({ ...req.body, createdBy: req.user.id, account_id: req.companyId });
            res.status(201).json({ status: true, message: 'Schedule created', data });
        } catch (err) {
            next(err);
        }
    };

    update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).update(id, { ...req.body, updatedBy: req.user.id }, req.companyId);
            if (!data) throw Object.assign(new Error('Schedule not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Schedule updated', data });
        } catch (err) {
            next(err);
        }
    };

    updatePartial = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).updatePartial(id, { ...req.body, updatedBy: req.user.id }, req.companyId);
            if (!data) throw Object.assign(new Error('Schedule not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Schedule updated', data });
        } catch (err) {
            next(err);
        }
    };

    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).delete(id, req.user.id, req.companyId);
            if (!data) throw Object.assign(new Error('Schedule not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Schedule deleted' });
        } catch (err) {
            next(err);
        }
    };
}
