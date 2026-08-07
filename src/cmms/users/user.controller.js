import { validateObjectId } from '../../utils/helper.js';
import { UserService } from './user.service.js';

export class UserController {

    getService = (req) => new UserService(req.db_type);

    /* ================= GET ALL ================= */
    getAll = async (req, res, next) => {
        try {
            const { companyId } = req;
            const { page, limit, user_status, user_role, search } = req.query;

            // Always filter out soft-deleted records
            const filter = { visible: true };
            if (companyId)   filter.account_id  = companyId;
            if (user_status) filter.user_status  = user_status;
            if (user_role)   filter.user_role    = user_role;

            const result = await this.getService(req).getAll(filter, { page, limit, search });

            res.status(200).json({
                status: true,
                message: 'Users fetched successfully',
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
            const user = await this.getService(req).getById(validateObjectId(req.params.id));
            if (!user) {
                throw Object.assign(new Error('User not found'), { status: 404 });
            }
            res.status(200).json({ status: true, message: 'User fetched successfully', data: user });
        } catch (err) {
            next(err);
        }
    };

    /* ================= CREATE ================= */
    create = async (req, res, next) => {
        try {
            const payload = { ...req.body };

            // Attach audit fields from authenticated user
            if (req.user?.id) {
                payload.createdBy = req.user.id;
                payload.updatedBy = req.user.id;
            }

            // If companyId comes from route context, use it as account_id
            if (req.companyId && !payload.account_id) {
                payload.account_id = req.companyId;
            }

            const user = await this.getService(req).create(payload);
            res.status(201).json({ status: true, message: 'User created successfully', data: user });
        } catch (err) {
            next(err);
        }
    };

    /* ================= FULL UPDATE (PUT) ================= */
    update = async (req, res, next) => {
        try {
            const payload = { ...req.body };
            if (req.user?.id) payload.updatedBy = req.user.id;

            const user = await this.getService(req).update(validateObjectId(req.params.id), payload);
            if (!user) {
                throw Object.assign(new Error('User not found'), { status: 404 });
            }
            res.status(200).json({ status: true, message: 'User updated successfully', data: user });
        } catch (err) {
            next(err);
        }
    };

    /* ================= PARTIAL UPDATE (PATCH) ================= */
    updatePartial = async (req, res, next) => {
        try {
            const payload = { ...req.body };
            if (req.user?.id) payload.updatedBy = req.user.id;

            const user = await this.getService(req).updatePartial(validateObjectId(req.params.id), payload);
            if (!user) {
                throw Object.assign(new Error('User not found'), { status: 404 });
            }
            res.status(200).json({ status: true, message: 'User updated successfully', data: user });
        } catch (err) {
            next(err);
        }
    };

    /* ================= SOFT DELETE ================= */
    delete = async (req, res, next) => {
        try {
            const user = await this.getService(req).delete(
                validateObjectId(req.params.id),
                req.user?.id
            );
            if (!user) {
                throw Object.assign(new Error('User not found'), { status: 404 });
            }
            res.status(200).json({ status: true, message: 'User deleted successfully' });
        } catch (err) {
            next(err);
        }
    };
}
