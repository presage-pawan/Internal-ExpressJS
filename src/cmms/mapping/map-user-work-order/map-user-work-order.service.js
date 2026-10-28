import { WorkOrderAssigneeModel as MapUserWorkOrderModel } from '../../schemas/map-user-work-order.model.js';
import { WorkOrderModel } from '../../schemas/work-order.model.js';
import { getConnection } from '../../../_db/index.js';
import { validateObjectId } from '../../../utils/helper.js';
import { restrictIdsToCompany } from './map-user-work-order-scope.js';

export class MapUserWorkOrderService {
    constructor(dbType = 'production') { this.dbType = dbType; }
    get connection() { return getConnection(this.dbType, 'cmms'); }
    get model() { return MapUserWorkOrderModel(this.connection); }

    async allowedWorkOrderIds(companyId) {
        if (!companyId) return null;
        const rows = await WorkOrderModel(this.connection)
            .find({ account_id: companyId, visible: { $ne: false } })
            .select('_id')
            .lean();
        return rows.map(row => row._id);
    }

    async assertWorkOrderScope(woId, companyId) {
        if (!companyId) return;
        const exists = await WorkOrderModel(this.connection).exists({
            _id: validateObjectId(woId),
            account_id: companyId,
            visible: { $ne: false }
        });
        if (!exists) {
            throw Object.assign(new Error('Work order is outside the selected company'), { status: 403 });
        }
    }

    async getAll(filter = {}, options = {}) {
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 20;
        const skip = (page - 1) * limit;
        const scopedFilter = { ...filter };

        if (options.companyId) {
            const allowedIds = await this.allowedWorkOrderIds(options.companyId);
            scopedFilter.woId = restrictIdsToCompany(allowedIds);
        }

        let query = this.model.find(scopedFilter);
        if (options.include) options.include.split(',').forEach(f => { query = query.populate(f.trim()); });
        const [data, total] = await Promise.all([
            query.clone().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            this.model.countDocuments(scopedFilter),
        ]);
        return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    async getById(id, options = {}) {
        const filter = { _id: validateObjectId(id) };
        if (options.companyId) {
            const allowedIds = await this.allowedWorkOrderIds(options.companyId);
            filter.woId = restrictIdsToCompany(allowedIds);
        }
        let query = this.model.findOne(filter);
        if (options.include) options.include.split(',').forEach(f => { query = query.populate(f.trim()); });
        return query.lean();
    }

    async create(data, companyId) {
        await this.assertWorkOrderScope(data.woId, companyId);
        return new this.model(data).save();
    }

    async update(id, data, companyId) {
        const existing = await this.getById(id, { companyId });
        if (!existing) return null;
        await this.assertWorkOrderScope(data.woId || existing.woId, companyId);
        return this.model.findByIdAndUpdate(validateObjectId(id), data, { new: true, runValidators: true });
    }

    async updatePartial(id, data, companyId) {
        const existing = await this.getById(id, { companyId });
        if (!existing) return null;
        await this.assertWorkOrderScope(data.woId || existing.woId, companyId);
        return this.model.findByIdAndUpdate(validateObjectId(id), { $set: data }, { new: true, runValidators: true });
    }

    async delete(id, updatedBy, companyId) {
        const existing = await this.getById(id, { companyId });
        if (!existing) return null;
        return this.model.findByIdAndDelete(validateObjectId(id));
    }
}
