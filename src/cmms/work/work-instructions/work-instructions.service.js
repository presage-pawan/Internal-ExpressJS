import { WorkInstructions as WorkInstructionsModel } from '../../schemas/work-instructions.model.js';
import { getConnection } from '../../../_db/index.js';
import { validateObjectId } from '../../../utils/helper.js';

export class WorkInstructionsService {
    constructor(dbType = 'production') { this.dbType = dbType; }
    get model() { return WorkInstructionsModel(getConnection(this.dbType, 'cmms')); }

    async getAll(filter = {}, options = {}) {
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 20;
        const skip = (page - 1) * limit;
        filter.visible = { $ne: false };
        if (options.search) {
            const re = new RegExp(options.search, 'i');
            filter.$or = [{ title: re }, { description: re }, { name: re }];
        }
        let query = this.model.find(filter);
        if (options.include) options.include.split(',').forEach(f => { query = query.populate(f.trim()); });
        const [data, total] = await Promise.all([
            query.clone().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            this.model.countDocuments(filter),
        ]);
        return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }
    async getById(id, options = {}) {
        const filter = { _id: validateObjectId(id) };
        filter.visible = { $ne: false };
        let query = this.model.findOne(filter);
        if (options.include) options.include.split(',').forEach(f => { query = query.populate(f.trim()); });
        return query.lean();
    }
    async create(data) { return new this.model(data).save(); }
    async update(id, data) { return this.model.findByIdAndUpdate(validateObjectId(id), data, { new: true, runValidators: true }); }
    async updatePartial(id, data) { return this.model.findByIdAndUpdate(validateObjectId(id), { $set: data }, { new: true, runValidators: true }); }
    async delete(id, updatedBy) { return this.model.findByIdAndUpdate(validateObjectId(id), { visible: false, updatedBy }, { new: true }); }
}
