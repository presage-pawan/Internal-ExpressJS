import { TokenModel } from '../../schemas/user-token.model.js';
import { AccountModel } from '../../schemas/company.model.js';
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

    get accountModel() {
        try {
            const connection = getConnection(this.dbType, 'cmms');
            return AccountModel(connection);
        } catch {
            return null;
        }
    }

    // ─── GET ALL (paginated + filtered) ──────────────────────────────────────
    async getAll(filter = {}, options = {}) {
        const page  = parseInt(options.page)  || 1;
        const limit = parseInt(options.limit) || 20;
        const skip  = (page - 1) * limit;

        const normalizedFilter = { ...filter };
        if (normalizedFilter.userId && typeof normalizedFilter.userId === 'string' && mongoose.Types.ObjectId.isValid(normalizedFilter.userId)) {
            normalizedFilter.userId = new mongoose.Types.ObjectId(normalizedFilter.userId);
        }
        if (normalizedFilter.accountId) {
            if (mongoose.Types.ObjectId.isValid(normalizedFilter.accountId)) {
                normalizedFilter.account_id = new mongoose.Types.ObjectId(normalizedFilter.accountId);
            }
            delete normalizedFilter.accountId;
        }
        if (normalizedFilter.account_id && typeof normalizedFilter.account_id === 'string' && mongoose.Types.ObjectId.isValid(normalizedFilter.account_id)) {
            normalizedFilter.account_id = new mongoose.Types.ObjectId(normalizedFilter.account_id);
        }

        const [data, total] = await Promise.all([
            this.model.find(normalizedFilter).sort({ created: -1 }).skip(skip).limit(limit).lean(),
            this.model.countDocuments(normalizedFilter),
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

    // ─── GET ALL TOKENS FOR AN ACCOUNT ────────────────────────────────────────
    async getByAccountId(accountId, options = {}) {
        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            throw Object.assign(new Error('Invalid accountId'), { status: 400 });
        }
        const filter = { account_id: new mongoose.Types.ObjectId(accountId) };
        if (options.principalType) {
            filter.principalType = options.principalType;
        }
        return this.getAll(filter, options);
    }

    // ─── GET ACTIVE DOWNLOAD TOKENS ──────────────────────────────────────────
    async getActiveDownloadTokens(filter = {}) {
        const now = new Date();
        const query = {
            principalType: 'download_data',
            $or: [
                { expiresAt: { $gt: now } },
                { expiresAt: { $exists: false } }
            ],
            revokedAt: { $exists: false },
            ...filter
        };
        if (query.account_id && typeof query.account_id === 'string' && mongoose.Types.ObjectId.isValid(query.account_id)) {
            query.account_id = new mongoose.Types.ObjectId(query.account_id);
        }
        return this.model.find(query).sort({ created: -1 }).lean();
    }

    // ─── CREATE (enforces 1 token per account for download tokens) ─────────────
    async create(data) {
        if (data.account_id && (data.principalType === 'download_data' || data.principalType === 'account')) {
            await this.model.deleteMany({
                account_id: new mongoose.Types.ObjectId(data.account_id),
                principalType: data.principalType
            });
        }
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

    // ─── REVOKE ALL TOKENS FOR AN ACCOUNT ────────────────────────────────────
    async revokeAllByAccountId(accountId, principalType = null) {
        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            throw Object.assign(new Error('Invalid accountId'), { status: 400 });
        }
        const filter = { account_id: new mongoose.Types.ObjectId(accountId) };
        if (principalType) {
            filter.principalType = principalType;
        }
        const result = await this.model.deleteMany(filter);
        if (!principalType || principalType === 'download_data') {
            try {
                const accModel = this.accountModel;
                if (accModel && typeof accModel.updateOne === 'function') {
                    await accModel.updateOne(
                        { _id: new mongoose.Types.ObjectId(accountId) },
                        { $unset: { download_api_key: '' } }
                    );
                }
            } catch {
                // Non-blocking fallback if connection or model is not initialized
            }
        }
        return result;
    }
}


