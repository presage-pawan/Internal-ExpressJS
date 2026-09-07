import { UserTokenService } from './user-token.service.js';

export class UserTokenController {
    getService = (req) => new UserTokenService(req.db_type);

    /* ================= GET ALL ================= */
    getAll = async (req, res, next) => {
        try {
            const { page, limit, userId, accountId, account_id, principalType, tokenType } = req.query;
            const filter = {};
            if (userId)        filter.userId        = userId;
            const accId = accountId || account_id;
            if (accId)         filter.account_id    = accId;
            if (principalType) filter.principalType = principalType;
            if (tokenType)     filter.tokenType     = tokenType;

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

    /* ================= GET ACTIVE DOWNLOAD TOKENS ================= */
    getActiveDownloadTokens = async (req, res, next) => {
        try {
            const { accountId, account_id } = req.query;
            const filter = {};
            const accId = accountId || account_id;
            if (accId) filter.account_id = accId;
            const data = await this.getService(req).getActiveDownloadTokens(filter);
            res.status(200).json({
                status: true,
                message: 'Active download tokens fetched successfully',
                data,
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

    /* ================= GET ALL TOKENS BY ACCOUNT ================= */
    getByAccountId = async (req, res, next) => {
        try {
            const { accountId } = req.params;
            const { page, limit, principalType } = req.query;
            const result = await this.getService(req).getByAccountId(accountId, { page, limit, principalType });
            res.status(200).json({
                status: true,
                message: 'Account tokens fetched successfully',
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

    /* ================= REVOKE ALL TOKENS FOR AN ACCOUNT ================= */
    revokeAllByAccountId = async (req, res, next) => {
        try {
            const { accountId } = req.params;
            const { principalType } = req.query;
            const result = await this.getService(req).revokeAllByAccountId(accountId, principalType);
            res.status(200).json({
                status: true,
                message: `Revoked ${result.deletedCount} token(s) for account`,
            });
        } catch (err) {
            next(err);
        }
    };
}


