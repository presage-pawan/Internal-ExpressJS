import { UserLogModel } from '../../schemas/user-logs.model.js';
import { getConnection } from '../../../_db/index.js';
import mongoose from 'mongoose';
import { buildResourceScopeFilter } from '../../resource-scope.js';

export class UserLogService {
    constructor(dbType = 'production') {
        this.dbType = dbType;
    }

    get model() {
        const connection = getConnection(this.dbType, 'cmms');
        return UserLogModel(connection);
    }

    // ─── GET ALL (paginated + filtered) ──────────────────────────────────────
    async getAll(filter = {}, options = {}) {
        const page  = parseInt(options.page)  || 1;
        const limit = parseInt(options.limit) || 50;
        const skip  = (page - 1) * limit;

        // Date range filter
        if (options.from || options.to) {
            filter.createdAt = {};
            if (options.from) filter.createdAt.$gte = new Date(options.from);
            if (options.to)   filter.createdAt.$lte = new Date(options.to);
        }

        let query = this.model.find(filter);
        if (options.include) {
            options.include.split(',').forEach(field => {
                query = query.populate(field.trim());
            });
        }

        const [data, total] = await Promise.all([
            query.clone().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            this.model.countDocuments(filter),
        ]);

        return {
            data,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ─── GET BY ID ────────────────────────────────────────────────────────────
    async getById(id, options = {}) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw Object.assign(new Error('Invalid ID'), { status: 400 });
        }
        let query = this.model.findOne(buildResourceScopeFilter(id, options.companyId, 'account_id'));
        if (options.include) {
            options.include.split(',').forEach(field => {
                query = query.populate(field.trim());
            });
        }
        return query.exec();
    }

    // ─── GET ALL BY USER ──────────────────────────────────────────────────────
    async getByUserId(userId, options = {}) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw Object.assign(new Error('Invalid userId'), { status: 400 });
        }
        return this.getAll({
            userId: new mongoose.Types.ObjectId(userId),
            ...(options.companyId ? { account_id: options.companyId } : {})
        }, options);
    }

    // ─── CREATE ───────────────────────────────────────────────────────────────
    async create(data) {
        const doc = new this.model(data);
        return doc.save();
    }

    // ─── HARD DELETE (audit logs — permanent removal allowed) ────────────────
    async delete(id, companyId) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw Object.assign(new Error('Invalid ID'), { status: 400 });
        }
        return this.model.findOneAndDelete(buildResourceScopeFilter(id, companyId, 'account_id'));
    }

    // ─── BULK DELETE by userId ────────────────────────────────────────────────
    async deleteByUserId(userId, companyId) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw Object.assign(new Error('Invalid userId'), { status: 400 });
        }
        return this.model.deleteMany({
            userId: new mongoose.Types.ObjectId(userId),
            ...(companyId ? { account_id: companyId } : {})
        });
    }
}

