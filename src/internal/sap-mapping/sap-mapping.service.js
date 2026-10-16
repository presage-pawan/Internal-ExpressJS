import { getConnection } from '../../_db/index.js';
import { AccountModel } from '../../cmms/schemas/company.model.js';
import { UserModel } from '../../cmms/schemas/users.model.js';
import { SapUserMappingModel } from '../../schemas/sap-user-mapping.model.js';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class SapMappingService {
  constructor(dbType = 'staging') {
    this.dbType = dbType === 'production' ? 'production' : 'staging';
  }

  get connection() {
    return getConnection(this.dbType, 'cmms');
  }

  get model() {
    return SapUserMappingModel(this.connection);
  }

  get accountModel() {
    return AccountModel(this.connection);
  }

  get userModel() {
    return UserModel(this.connection);
  }

  async list(query = {}) {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 50, 1), 500);
    const filter = {};

    if (query.cmmsAccountId) filter.cmmsAccountId = query.cmmsAccountId;
    if (query.active !== undefined) filter.active = String(query.active) === 'true';
    if (query.search?.trim()) {
      const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
      filter.$or = [
        { sapAccountId: regex },
        { sapAccountName: regex },
        { sapUserId: regex },
        { sapUserName: regex },
        { sapUserEmail: regex },
        { cmmsAccountName: regex },
        { cmmsUserName: regex },
        { cmmsUserEmail: regex }
      ];
    }

    const [data, total] = await Promise.all([
      this.model.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(filter)
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async getById(id) {
    return this.model.findById(id).lean();
  }

  async listAccounts(search = '') {
    const filter = { visible: { $ne: false } };
    if (search.trim()) filter.account_name = new RegExp(escapeRegex(search.trim()), 'i');
    return this.accountModel
      .find(filter, { account_name: 1, account_status: 1 })
      .sort({ account_name: 1 })
      .limit(1000)
      .lean();
  }

  async listUsers(query = {}) {
    const filter = { visible: { $ne: false } };
    if (query.accountId) filter.account_id = query.accountId;
    if (query.search?.trim()) {
      const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { username: regex },
        { email: regex }
      ];
    }

    return this.userModel
      .find(filter, { firstName: 1, lastName: 1, username: 1, email: 1, account_id: 1, user_status: 1 })
      .sort({ firstName: 1, lastName: 1 })
      .limit(Math.min(Number.parseInt(query.limit, 10) || 1000, 1000))
      .lean();
  }

  async buildPayload(payload, actorId) {
    const [account, user] = await Promise.all([
      this.accountModel.findOne({ _id: payload.cmmsAccountId, visible: { $ne: false } }).lean(),
      this.userModel.findOne({ _id: payload.cmmsUserId, visible: { $ne: false } }).lean()
    ]);

    if (!account) throw Object.assign(new Error('CMMS account not found in the selected database'), { status: 404 });
    if (!user) throw Object.assign(new Error('CMMS user not found in the selected database'), { status: 404 });
    if (String(user.account_id) !== String(account._id)) {
      throw Object.assign(new Error('Selected CMMS user does not belong to the selected CMMS account'), { status: 400 });
    }

    return {
      sapAccountId: payload.sapAccountId,
      sapAccountName: payload.sapAccountName || '',
      sapUserId: payload.sapUserId,
      sapUserName: payload.sapUserName || '',
      sapUserEmail: payload.sapUserEmail || '',
      cmmsAccountId: account._id,
      cmmsAccountName: account.account_name,
      cmmsUserId: user._id,
      cmmsUserName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username,
      cmmsUserEmail: user.email || '',
      dbType: this.dbType,
      active: payload.active !== false,
      notes: payload.notes || '',
      updatedBy: actorId
    };
  }

  async assertUniqueSapUser(payload, excludedId = null) {
    const filter = {
      sapAccountId: payload.sapAccountId,
      sapUserId: payload.sapUserId
    };
    if (excludedId) filter._id = { $ne: excludedId };
    const existing = await this.model.exists(filter);
    if (existing) {
      throw Object.assign(new Error('This SAP account and user are already mapped in the selected database'), { status: 409 });
    }
  }

  async create(payload, actorId) {
    await this.assertUniqueSapUser(payload);
    const data = await this.buildPayload(payload, actorId);
    return this.model.create({ ...data, createdBy: actorId });
  }

  async update(id, payload, actorId) {
    await this.assertUniqueSapUser(payload, id);
    const data = await this.buildPayload(payload, actorId);
    return this.model.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async remove(id) {
    return this.model.findByIdAndDelete(id);
  }
}
