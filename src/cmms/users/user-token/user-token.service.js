import { TokenModel } from '../../schemas/user-token.model.js';
import { getConnection } from '../../../_db/index.js';
import mongoose from 'mongoose';

export class UserTokenService {
    constructor(dbType = 'production') {
        this.dbType = dbType;
    }

    get model() {
        const connection = getConnection(this.dbType, 'cmms');
        return TokenModel(connection);
    }

    // ─── GET ALL (paginated + filtered) ──────────────────────────────────────
    async getAll(filter = {}, options = {}) {
        const page  = parseInt(options.page)  || 1;
        const limit = parseInt(options.limit) || 20;
        const skip  = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.model.find(filter).sort({ created: -1 }).skip(skip).limit(limit).lean(),
            this.model.countDocuments(filter),
        ]);

        return {
            data,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ─── GET BY TOKEN ID ──────────────────────────────────────────────────────
    async getById(id) {
        return this.model.findById(id).lean();
    }

    // ─── GET ALL TOKENS FOR A USER ────────────────────────────────────────────
    async getByUserId(userId, options = {}) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw Object.assign(new Error('Invalid userId'), { status: 400 });
        }
        return this.getAll({ userId: new mongoose.Types.ObjectId(userId) }, options);
    }

    // ─── CREATE ───────────────────────────────────────────────────────────────
    async create(data) {
        const token = new this.model(data);
        return token.save();
    }

    // ─── DELETE SINGLE (revoke one token) ────────────────────────────────────
    async delete(id) {
        return this.model.findByIdAndDelete(id);
    }

    // ─── REVOKE ALL TOKENS FOR A USER ────────────────────────────────────────
    async revokeAllByUserId(userId) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw Object.assign(new Error('Invalid userId'), { status: 400 });
        }
        return this.model.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
    }
}

