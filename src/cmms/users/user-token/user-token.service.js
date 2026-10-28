import { TokenModel } from '../../schemas/user-token.model.js';
import { AccountModel } from '../../schemas/company.model.js';
import { getConnection } from '../../../_db/index.js';
import mongoose from 'mongoose';
import { buildResourceScopeFilter } from '../../resource-scope.js';

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
    async getById(id, companyId) {
        return this.model.findOne(buildResourceScopeFilter(id, companyId, 'account_id')).lean();
    }

    // ─── GET ALL TOKENS FOR A USER ────────────────────────────────────────────
    async getByUserId(userId, options = {}) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw Object.assign(new Error('Invalid userId'), { status: 400 });
        }
        return this.getAll({
            userId: new mongoose.Types.ObjectId(userId),
            ...(options.companyId ? { account_id: options.companyId } : {})
        }, options);
    }

    // ─── GET ALL TOKENS FOR AN ACCOUNT ────────────────────────────────────────
    async getByAccountId(accountId, options = {}) {
        const effectiveAccountId = options.companyId || accountId;
        if (options.companyId && String(options.companyId) !== String(accountId)) {
            throw Object.assign(new Error('Account access denied'), { status: 403 });
        }
        if (!mongoose.Types.ObjectId.isValid(effectiveAccountId)) {
            throw Object.assign(new Error('Invalid accountId'), { status: 400 });
        }
        const filter = { account_id: new mongoose.Types.ObjectId(effectiveAccountId) };
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
    async create(data, companyId) {
        const payload = { ...data, ...(companyId ? { account_id: companyId } : {}) };
        if (payload.account_id && (payload.principalType === 'download_data' || payload.principalType === 'account')) {
            await this.model.deleteMany({
                account_id: new mongoose.Types.ObjectId(payload.account_id),
                principalType: payload.principalType
            });
        }
        const token = new this.model(payload);
        return token.save();
    }

    // ─── DELETE SINGLE (revoke one token) ────────────────────────────────────
    async delete(id, companyId) {
        return this.model.findOneAndDelete(buildResourceScopeFilter(id, companyId, 'account_id'));
    }

    // ─── REVOKE ALL TOKENS FOR A USER ────────────────────────────────────────
    async revokeAllByUserId(userId, companyId) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw Object.assign(new Error('Invalid userId'), { status: 400 });
        }
        return this.model.deleteMany({
            userId: new mongoose.Types.ObjectId(userId),
            ...(companyId ? { account_id: companyId } : {})
        });
    }

    // ─── REVOKE ALL TOKENS FOR AN ACCOUNT ────────────────────────────────────
    async revokeAllByAccountId(accountId, principalType = null, companyId = null) {
        const effectiveAccountId = companyId || accountId;
        if (companyId && String(companyId) !== String(accountId)) {
            throw Object.assign(new Error('Account access denied'), { status: 403 });
        }
        if (!mongoose.Types.ObjectId.isValid(effectiveAccountId)) {
            throw Object.assign(new Error('Invalid accountId'), { status: 400 });
        }
        const filter = { account_id: new mongoose.Types.ObjectId(effectiveAccountId) };
        if (principalType) {
            filter.principalType = principalType;
        }
        const result = await this.model.deleteMany(filter);
        if (!principalType || principalType === 'download_data') {
            try {
                const accModel = this.accountModel;
                if (accModel && typeof accModel.updateOne === 'function') {
                    await accModel.updateOne(
                        { _id: new mongoose.Types.ObjectId(effectiveAccountId) },
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


