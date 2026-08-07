import { VerificationCodeModel } from '../../schemas/user-verification.model.js';
import { getConnection } from '../../../_db/index.js';

export class UserVerificationService {
    constructor(dbType = 'production') {
        this.dbType = dbType;
    }

    get model() {
        const connection = getConnection(this.dbType, 'cmms');
        return VerificationCodeModel(connection);
    }

    // ─── GET ALL (paginated + filter by email) ────────────────────────────────
    async getAll(filter = {}, options = {}) {
        const page  = parseInt(options.page)  || 1;
        const limit = parseInt(options.limit) || 20;
        const skip  = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            this.model.countDocuments(filter),
        ]);

        return {
            data,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ─── GET BY ID ────────────────────────────────────────────────────────────
    async getById(id) {
        return this.model.findById(id).lean();
    }

    // ─── GET BY EMAIL ─────────────────────────────────────────────────────────
    async getByEmail(email) {
        return this.model.findOne({ email: email.toLowerCase() }).lean();
    }

    // ─── CREATE ───────────────────────────────────────────────────────────────
    async create(data) {
        // Upsert: replace any existing code for this email (TTL handles expiry)
        return this.model.findOneAndUpdate(
            { email: data.email.toLowerCase() },
            { ...data, email: data.email.toLowerCase() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }

    // ─── VERIFY (check code matches) ─────────────────────────────────────────
    async verify(email, code) {
        const record = await this.model.findOne({
            email: email.toLowerCase(),
            code,
        }).lean();
        return record; // null means invalid/expired
    }

    // ─── DELETE (after verified or manual cleanup) ────────────────────────────
    async delete(id) {
        return this.model.findByIdAndDelete(id);
    }

    // ─── DELETE BY EMAIL (after successful verification) ─────────────────────
    async deleteByEmail(email) {
        return this.model.deleteOne({ email: email.toLowerCase() });
    }
}

