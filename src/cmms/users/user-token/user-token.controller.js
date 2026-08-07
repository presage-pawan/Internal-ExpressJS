import { UserTokenService } from './user-token.service.js';

export class UserTokenController {
    getService = (req) => new UserTokenService(req.db_type);

    /* ================= GET ALL ================= */
    getAll = async (req, res, next) => {
        try {
            const { page, limit, userId, principalType } = req.query;
            const filter = {};
            if (userId)        filter.userId        = userId;
            if (principalType) filter.principalType = principalType;

            const result = await this.getService(req).getAll(filter, { page, limit });
            res.status(200).json({
                status: true,
                message: 'User tokens fetched successfully',
                data: result.data,
                pagination: result.pagination,
            });
        } catch (err) {
            next(err);
        }
    };

    /* ================= GET BY TOKEN ID ================= */
    getById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).getById(id);
            if (!data) throw Object.assign(new Error('Token not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Token fetched successfully', data });
        } catch (err) {
            next(err);
        }
    };

    /* ================= GET ALL TOKENS BY USER ================= */
    getByUserId = async (req, res, next) => {
        try {
            const { userId } = req.params;
            const { page, limit } = req.query;
            const result = await this.getService(req).getByUserId(userId, { page, limit });
            res.status(200).json({
                status: true,
                message: 'User tokens fetched successfully',
                data: result.data,
                pagination: result.pagination,
            });
        } catch (err) {
            next(err);
        }
    };

    /* ================= CREATE (issue token) ================= */
    create = async (req, res, next) => {
        try {
            const data = await this.getService(req).create(req.body);
            res.status(201).json({ status: true, message: 'Token created successfully', data });
        } catch (err) {
            next(err);
        }
    };

    /* ================= DELETE (revoke single token) ================= */
    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).delete(id);
            if (!data) throw Object.assign(new Error('Token not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Token revoked successfully' });
        } catch (err) {
            next(err);
        }
    };

    /* ================= REVOKE ALL TOKENS FOR A USER ================= */
    revokeAllByUserId = async (req, res, next) => {
        try {
            const { userId } = req.params;
            const result = await this.getService(req).revokeAllByUserId(userId);
            res.status(200).json({
                status: true,
                message: `Revoked ${result.deletedCount} token(s) for user`,
            });
        } catch (err) {
            next(err);
        }
    };
}

