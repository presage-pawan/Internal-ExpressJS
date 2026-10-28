import { validateObjectId } from '../../../utils/helper.js';
import { PartService } from './part.service.js';

export class PartController {

    getService = (req) => new PartService(req.db_type);

    getAll = async (req, res, next) => {
        try {
            const { companyId, query: { include } } = req;
            const filter = { visible: { $ne: false } };
            if (companyId) filter.account_id = companyId;

            const parts = await this.getService(req).getAll(filter, { include });
            if (!parts || parts.length === 0) throw Object.assign(new Error('Parts not found'), { status: 404 });

            res.status(200).json({ status: true, message: 'Parts fetched successfully', data: parts });
        } catch (err) {
            next(err);
        }
    };

    getById = async (req, res, next) => {
        try {
            const { include } = req.query;
            const part = await this.getService(req).getById(req.params.id, { include, companyId: req.companyId });
            if (!part) throw Object.assign(new Error('Part not found'), { status: 404 });

            res.status(200).json({ status: true, message: 'Part fetched successfully', data: part });
        } catch (err) {
            next(err);
        }
    };

    create = async (req, res, next) => {
        try {
            const part = await this.getService(req).create({ ...req.body, createdBy: req.user.id });
            res.status(201).json({ status: true, message: 'Part created successfully', data: part });
        } catch (err) {
            next(err);
        }
    };

    update = async (req, res, next) => {
        try {
            const part = await this.getService(req).update(req.params.id, { ...req.body, updatedBy: req.user.id }, req.companyId);
            if (!part) throw Object.assign(new Error('Part not found'), { status: 404 });

            res.status(200).json({ status: true, message: 'Part updated successfully', data: part });
        } catch (err) {
            next(err);
        }
    };

    updatePartial = async (req, res, next) => {
        try {
            const part = await this.getService(req).updatePartial(req.params.id, { ...req.body, updatedBy: req.user.id }, req.companyId);
            if (!part) throw Object.assign(new Error('Part not found'), { status: 404 });

            res.status(200).json({ status: true, message: 'Part updated successfully', data: part });
        } catch (err) {
            next(err);
        }
    };

    delete = async (req, res, next) => {
        try {
            const part = await this.getService(req).delete(req.params.id, req.user.id, req.companyId);
            if (!part) throw Object.assign(new Error('Part not found'), { status: 404 });

            res.status(200).json({ status: true, message: 'Part deleted successfully' });
        } catch (err) {
            next(err);
        }
    };
}
