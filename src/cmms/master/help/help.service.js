import { BlogModel } from '../../schemas/help.model.js';
import { getConnection } from '../../../_db/index.js';
import { validateObjectId } from '../../../utils/helper.js';

export class HelpService {
    constructor(dbType = 'production') { this.dbType = dbType; }
    get model() { return BlogModel(getConnection(this.dbType, 'cmms')); }

    async getAll(filter = {}, options = {}) {
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 20;
        const skip = (page - 1) * limit;
        if (options.search) {
            const re = new RegExp(options.search, 'i');
            filter.$or = [{ title: re }, { description: re }];
        }
        const [data, total] = await Promise.all([
            this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            this.model.countDocuments(filter),
        ]);
        return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }
    async getById(id) { return this.model.findOne({ _id: validateObjectId(id), visible: { $ne: false } }).lean(); }
    async create(data) { return new this.model(data).save(); }
    async update(id, data) { return this.model.findByIdAndUpdate(validateObjectId(id), data, { new: true, runValidators: true }); }
    async updatePartial(id, data) { return this.model.findByIdAndUpdate(validateObjectId(id), { $set: data }, { new: true, runValidators: true }); }
    async delete(id, updatedBy) { return this.model.findByIdAndUpdate(validateObjectId(id), { visible: false, updatedBy }, { new: true }); }
}
