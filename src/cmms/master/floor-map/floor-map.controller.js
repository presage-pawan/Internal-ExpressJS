import { FloorMapService } from './floor-map.service.js';

export class FloorMapController {
    getService = (req) => new FloorMapService(req.db_type);

    getAll = async (req, res, next) => {
        try {
            const { companyId } = req;
            const filter = {};
            if (companyId) filter.account_id = companyId;
            const data = await this.getService(req).getAll(filter);
            if (!data) {
                throw Object.assign(new Error('Floor map not found'), { status: 404 });
            }
            res.status(200).json({ status: true, message: 'Floor map fetched successfully', data });
        } catch (err) {
            next(err);
        }
    };

    create = async (req, res, next) => {
        try {
            const data = await this.getService(req).create(req.body);
            if (!data) {
                throw Object.assign(new Error('Floor map not found'), { status: 404 });
            }
            res.status(201).json({ status: true, message: 'Floor map created successfully', data });
        } catch (err) {
            next(err);
        }
    };

    update = async (req, res, next) => {
        try {
            const data = await this.getService(req).update(validateObjectId(req.params.id), req.body);
            if (!data) {
                throw Object.assign(new Error('Floor map not found'), { status: 404 });
            }
            res.status(200).json({ status: true, message: 'Floor map updated successfully', data });
        } catch (err) {
            next(err);
        }
    };

    updatePartial = async (req, res, next) => {
        try {
            const data = await this.getService(req).updatePartial(validateObjectId(req.params.id), req.body);
            if (!data) {
                throw Object.assign(new Error('Floor map not found'), { status: 404 });
            }
            res.status(200).json({ status: true, message: 'Floor map updated successfully', data });
        } catch (err) {
            next(err);
        }
    };

    delete = async (req, res, next) => {
        try {
            const data = await this.getService(req).delete(validateObjectId(req.params.id), req.user?.id);
            if (!data) {
                throw Object.assign(new Error('Floor map not found'), { status: 404 });
            }
            res.status(200).json({ status: true, message: 'Floor map deleted successfully' });
        } catch (err) {
            next(err);
        }
    };
}
