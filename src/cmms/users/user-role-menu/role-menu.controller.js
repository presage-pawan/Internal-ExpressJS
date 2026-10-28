import { RoleMenuService } from './role-menu.service.js';
import { bindCompanyPayload } from '../../tenant-payload.js';

export class RoleMenuController {
    getService = (req) => new RoleMenuService(req.db_type);

    /* ================= GET ALL ================= */
    getAll = async (req, res, next) => {
        try {
            const { companyId } = req;
            const { page, limit, user_id, account_id } = req.query;

            const filter = {};
            if (companyId) filter.account_id = companyId;
            else if (account_id) filter.account_id = account_id;
            if (user_id) filter.user_id = user_id;

            const result = await this.getService(req).getAll(filter, { page, limit });
            res.status(200).json({
                status: true,
                message: 'Role menus fetched successfully',
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
            const data = await this.getService(req).getById(id, req.companyId);
            if (!data) throw Object.assign(new Error('Role menu not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Role menu fetched successfully', data });
        } catch (err) {
            next(err);
        }
    };

    /* ================= GET BY USER ID ================= */
    getByUserId = async (req, res, next) => {
        try {
            const { userId } = req.params;
            const { page, limit } = req.query;
            const result = await this.getService(req).getByUserId(userId, { page, limit, companyId: req.companyId });
            res.status(200).json({
                status: true,
                message: 'Role menus fetched successfully',
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
            const payload = {
                ...bindCompanyPayload(req.body, req.companyId, 'account_id'),
                createdBy: req.user?.id,
                updatedBy: req.user?.id,
            };
            const data = await this.getService(req).create(payload);
            res.status(201).json({ status: true, message: 'Role menu created successfully', data });
        } catch (err) {
            next(err);
        }
    };

    /* ================= FULL UPDATE (PUT) ================= */
    update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const payload = { ...bindCompanyPayload(req.body, req.companyId, 'account_id'), updatedBy: req.user?.id };
            const data = await this.getService(req).update(id, payload, req.companyId);
            if (!data) throw Object.assign(new Error('Role menu not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Role menu updated successfully', data });
        } catch (err) {
            next(err);
        }
    };

    /* ================= PARTIAL UPDATE (PATCH) ================= */
    updatePartial = async (req, res, next) => {
        try {
            const { id } = req.params;
            const payload = { ...bindCompanyPayload(req.body, req.companyId, 'account_id'), updatedBy: req.user?.id };
            const data = await this.getService(req).updatePartial(id, payload, req.companyId);
            if (!data) throw Object.assign(new Error('Role menu not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Role menu updated successfully', data });
        } catch (err) {
            next(err);
        }
    };

    /* ================= DELETE ================= */
    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).delete(id, req.companyId);
            if (!data) throw Object.assign(new Error('Role menu not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Role menu deleted successfully' });
        } catch (err) {
            next(err);
        }
    };
}

