import { WorkRequestModel } from '../../schemas/work-request.model.js';
import { getConnection } from '../../../_db/index.js';
import { buildResourceScopeFilter } from '../../resource-scope.js';

export class WorkRequestService {
    constructor(dbType = 'production') {
        this.dbType = dbType;
    }

    get model() {
        const connection = getConnection(this.dbType, 'cmms');
        return WorkRequestModel(connection);
    }

    async getAll(filter = {}, options = {}) {
        let query = this.model.find(filter);
        if (options.include) {
            options.include.split(',').forEach(field => {
                query = query.populate(field.trim());
            });
        }
        return query.lean();
    }

    async getById(id, options = {}) {
        let query = this.model.findOne(buildResourceScopeFilter(id, options.companyId, 'account_id'));
        if (options.include) {
            options.include.split(',').forEach(field => {
                query = query.populate(field.trim());
            });
        }
        return query.exec();
    }

    async create(data) {
        const doc = new this.model(data);
        return doc.save();
    }

    async update(id, data, companyId) {
        return this.model.findOneAndUpdate(buildResourceScopeFilter(id, companyId, 'account_id'), data, { new: true, runValidators: true });
    }

    async updatePartial(id, data, companyId) {
        return this.model.findOneAndUpdate(buildResourceScopeFilter(id, companyId, 'account_id'), { $set: data }, { new: true, runValidators: true });
    }

    async delete(id, companyId) {
        return this.model.findOneAndUpdate(buildResourceScopeFilter(id, companyId, 'account_id'), { visible: false }, { new: true });
    }
}
