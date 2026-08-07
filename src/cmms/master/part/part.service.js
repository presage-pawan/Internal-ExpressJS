import { PartModel } from '../../schemas/part.model.js';
import { getConnection } from '../../../_db/index.js';
import mongoose from 'mongoose';

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
        let query = this.model.findById(id);
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

    async update(id, data) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid ID'), { status: 400 });
        return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async updatePartial(id, data) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid ID'), { status: 400 });
        return this.model.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    }

    async delete(id, updatedBy) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid ID'), { status: 400 });
        return this.model.findByIdAndUpdate(id, { visible: false, updatedBy }, { new: true });
    }
}
