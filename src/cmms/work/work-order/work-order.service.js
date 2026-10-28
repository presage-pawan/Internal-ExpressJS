import { WorkOrderModel } from '../../schemas/work-order.model.js';
import { getConnection } from '../../../_db/index.js';
import mongoose from 'mongoose';
import { buildWorkOrderIdentityFilter } from './work-order-scope.js';

export class WorkOrderService {
    constructor(dbType = 'production') {
        this.dbType = dbType;
    }

    get model() {
        const connection = getConnection(this.dbType, 'cmms');
        return WorkOrderModel(connection);
    }

    async getAll(filter = {}, options = {}) {
        let query = this.model.find(filter);
        if (options.include) {
            options.include.split(',').forEach(field => {
                query = query.populate(field.trim());
            });
        }
        return query.exec();
    }

    async getById(id, options = {}) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid ID'), { status: 400 });
        let query = this.model.findOne(buildWorkOrderIdentityFilter(id, options.companyId));
        if (options.include) {
            options.include.split(',').forEach(field => {
                query = query.populate(field.trim());
            });
        }
        return query.exec();
    }

    async create(data) {
        const wo = new this.model(data);
        return wo.save();
    }

    async update(id, data, companyId) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid ID'), { status: 400 });
        return this.model.findOneAndUpdate(
            buildWorkOrderIdentityFilter(id, companyId),
            data,
            { new: true, runValidators: true }
        );
    }

    async updatePartial(id, data, companyId) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid ID'), { status: 400 });
        return this.model.findOneAndUpdate(
            buildWorkOrderIdentityFilter(id, companyId),
            { $set: data },
            { new: true, runValidators: true }
        );
    }

    async delete(id, updatedBy, companyId) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error('Invalid ID'), { status: 400 });
        return this.model.findOneAndUpdate(
            buildWorkOrderIdentityFilter(id, companyId),
            { visible: false, updatedBy },
            { new: true }
        );
    }
}
