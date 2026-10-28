import { ObservationService } from './observation.service.js';
import { bindCompanyPayload } from '../../tenant-payload.js';

export class ObservationController {
    getService = (req) => new ObservationService(req.db_type);

    getAll = async (req, res, next) => {
        try {
            const { companyId, query: { include } } = req;
            const filter = { visible: { $ne: false } };
            if (companyId) filter.accountId = companyId;
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
            if (!data) throw Object.assign(new Error('Observation not found'), { status: 404 });
            res.status(200).json({ status: true, data });
        } catch (err) {
            next(err);
        }
    };

    create = async (req, res, next) => {
        try {
            const data = await this.getService(req).create({ ...bindCompanyPayload(req.body, req.companyId, 'accountId'), createdBy: req.user.id });
            res.status(201).json({ status: true, message: 'Observation created', data });
        } catch (err) {
            next(err);
        }
    };

    update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).update(id, { ...bindCompanyPayload(req.body, req.companyId, 'accountId'), updatedBy: req.user.id }, req.companyId);
            if (!data) throw Object.assign(new Error('Observation not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Observation updated', data });
        } catch (err) {
            next(err);
        }
    };

    updatePartial = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).updatePartial(id, { ...bindCompanyPayload(req.body, req.companyId, 'accountId'), updatedBy: req.user.id }, req.companyId);
            if (!data) throw Object.assign(new Error('Observation not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Observation updated', data });
        } catch (err) {
            next(err);
        }
    };

    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).delete(id, req.companyId);
            if (!data) throw Object.assign(new Error('Observation not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Observation deleted' });
        } catch (err) {
            next(err);
        }
    };
}
