import { RoleMenuModel } from '../../schemas/role-menu.model.js';
import { getConnection } from '../../../_db/index.js';
import mongoose from 'mongoose';
import { buildResourceScopeFilter } from '../../resource-scope.js';

export class RoleMenuService {
    constructor(dbType = 'production') {
        this.dbType = dbType;
    }

    get model() {
        const connection = getConnection(this.dbType, 'cmms');
        return RoleMenuModel(connection);
    }

    // ─── GET ALL (paginated + filtered) ──────────────────────────────────────
    async getAll(filter = {}, options = {}) {
        const page  = parseInt(options.page)  || 1;
        const limit = parseInt(options.limit) || 20;
        const skip  = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
                .populate({ path: 'user_id',    model: 'User',    select: 'id firstName lastName email user_role user_status' })
                .populate({ path: 'account_id', model: 'Account', select: 'id account_name' })
                .lean(),
            this.model.countDocuments(filter),
        ]);

        return {
            data,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ─── GET BY ID ────────────────────────────────────────────────────────────
    async getById(id, companyId) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw Object.assign(new Error('Invalid ID'), { status: 400 });
        }
        return this.model.findOne(buildResourceScopeFilter(id, companyId, 'account_id'))
            .populate({ path: 'user_id',    model: 'User',    select: 'id firstName lastName email user_role user_status' })
            .populate({ path: 'account_id', model: 'Account', select: 'id account_name' })
            .lean();
    }

    // ─── GET BY USER ID ───────────────────────────────────────────────────────
    async getByUserId(userId, options = {}) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw Object.assign(new Error('Invalid userId'), { status: 400 });
        }
        return this.getAll({
            user_id: new mongoose.Types.ObjectId(userId),
            ...(options.companyId ? { account_id: options.companyId } : {})
        }, options);
    }

    // ─── CREATE ───────────────────────────────────────────────────────────────
    async create(data) {
        const doc = new this.model(data);
        return doc.save();
    }

    // ─── FULL UPDATE (PUT) ────────────────────────────────────────────────────
    async update(id, data, companyId) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw Object.assign(new Error('Invalid ID'), { status: 400 });
        }
        return this.model.findOneAndUpdate(buildResourceScopeFilter(id, companyId, 'account_id'), data, { new: true, runValidators: true });
    }

    // ─── PARTIAL UPDATE (PATCH) ───────────────────────────────────────────────
    async updatePartial(id, data, companyId) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw Object.assign(new Error('Invalid ID'), { status: 400 });
        }
        return this.model.findOneAndUpdate(buildResourceScopeFilter(id, companyId, 'account_id'), { $set: data }, { new: true, runValidators: true });
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────
    async delete(id, companyId) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw Object.assign(new Error('Invalid ID'), { status: 400 });
        }
        return this.model.findOneAndDelete(buildResourceScopeFilter(id, companyId, 'account_id'));
    }
}

