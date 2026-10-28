import { PartModel } from '../../schemas/part.model.js';
import { getConnection } from '../../../_db/index.js';
import mongoose from 'mongoose';
import { buildResourceScopeFilter } from '../../resource-scope.js';

export class PartService {

    constructor(dbType = 'production') {
        this.dbType = dbType;
    }

    get model() {
        const connection = getConnection(this.dbType, 'cmms');
        return PartModel(connection);
    }

    async getAll(filter = {}, options = {}) {
        let query = this.model.find(filter);
        if (options.include) {
            options.include.split(',').forEach(field => {
                query = query.populate(field.trim());
            });
        } else {
            query = query.populate('location_id');
        }
        return query.exec();
    }

    async getById(id, options = {}) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid ID'), { status: 400 });
        let query = this.model.findOne(buildResourceScopeFilter(id, options.companyId, 'account_id'));
        if (options.include) {
            options.include.split(',').forEach(field => {
                query = query.populate(field.trim());
            });
        } else {
            query = query.populate('location_id');
        }
        return query.exec();
    }

    async create(data) {
        const part = new this.model(data);
        return part.save();
    }

    async update(id, data, companyId) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid ID'), { status: 400 });
        return this.model.findOneAndUpdate(buildResourceScopeFilter(id, companyId, 'account_id'), data, { new: true, runValidators: true });
    }

    async updatePartial(id, data, companyId) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid ID'), { status: 400 });
        return this.model.findOneAndUpdate(buildResourceScopeFilter(id, companyId, 'account_id'), { $set: data }, { new: true, runValidators: true });
    }

    async delete(id, updatedBy, companyId) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid ID'), { status: 400 });
        return this.model.findOneAndUpdate(buildResourceScopeFilter(id, companyId, 'account_id'), { visible: false, updatedBy }, { new: true });
    }
}
