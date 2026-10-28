import { UserLogService } from './user-logs.service.js';
import { bindCompanyPayload } from '../../tenant-payload.js';

export class UserLogController {
    getService = (req) => new UserLogService(req.db_type);

    /* ================= GET ALL (paginated + filtered) ================= */
    getAll = async (req, res, next) => {
        try {
            const { companyId } = req;
            const { include, page, limit, userId, account_id, statusCode, method, module, from, to } = req.query;

            const filter = {};
            if (companyId) filter.account_id = companyId;
            else if (account_id) filter.account_id = account_id;
            if (userId)     filter.userId     = userId;
            if (statusCode) filter.statusCode = Number(statusCode);
            if (method)     filter.method     = method;
            if (module)     filter.module     = module;

            const result = await this.getService(req).getAll(filter, { include, page, limit, from, to });
            res.status(200).json({
                status: true,
                message: 'User logs fetched successfully',
                data: result.data,
                pagination: result.pagination,
            });
        } catch (err) {
            next(err);
        }
    };

    /* ================= GET BY ID ================= */
    getById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { include } = req.query;
            const data = await this.getService(req).getById(id, { include, companyId: req.companyId });
            if (!data) throw Object.assign(new Error('User log not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'User log fetched successfully', data });
        } catch (err) {
            next(err);
        }
    };

    /* ================= GET ALL LOGS FOR A USER ================= */
    getByUserId = async (req, res, next) => {
        try {
            const { userId } = req.params;
            const { page, limit, from, to } = req.query;
            const result = await this.getService(req).getByUserId(userId, { page, limit, from, to, companyId: req.companyId });
            res.status(200).json({
                status: true,
                message: 'User logs fetched successfully',
                data: result.data,
                pagination: result.pagination,
            });
        } catch (err) {
            next(err);
        }
    };

    /* ================= CREATE ================= */
    create = async (req, res, next) => {
        try {
            const payload = bindCompanyPayload(req.body, req.companyId, 'account_id');
            if (req.user?.id) payload.userId = req.user.id;
            const data = await this.getService(req).create(payload);
            res.status(201).json({ status: true, message: 'User log created successfully', data });
        } catch (err) {
            next(err);
        }
    };

    /* ================= DELETE SINGLE ================= */
    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).delete(id, req.companyId);
            if (!data) throw Object.assign(new Error('User log not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'User log deleted successfully' });
        } catch (err) {
            next(err);
        }
    };

    /* ================= BULK DELETE BY USER ================= */
    deleteByUserId = async (req, res, next) => {
        try {
            const { userId } = req.params;
            const result = await this.getService(req).deleteByUserId(userId, req.companyId);
            res.status(200).json({
                status: true,
                message: `Deleted ${result.deletedCount} log(s) for user`,
            });
        } catch (err) {
            next(err);
        }
    };
}

