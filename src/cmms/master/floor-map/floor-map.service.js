import { EndpointLocationModel } from '../../schemas/floor-map.model.js';
import { getConnection } from '../../../_db/index.js';
import { buildResourceScopeFilter } from '../../resource-scope.js';

export class FloorMapService {
    constructor(dbType = 'production') {
        this.dbType = dbType;
    }

    get model() {
        const connection = getConnection(this.dbType, 'cmms');
        return EndpointLocationModel(connection);
    }

    async getAll(filter = {}) {
        return this.model.find(filter).lean();
    }

    async create(data) {
        return this.model.create(data);
    }

    async update(id, data, companyId) {
        return this.model.findOneAndUpdate(buildResourceScopeFilter(id, companyId, 'account_id'), data, { new: true }).lean();
    }

    async updatePartial(id, data, companyId) {
        return this.model.findOneAndUpdate(buildResourceScopeFilter(id, companyId, 'account_id'), { $set: data }, { new: true }).lean();
    }

    async delete(id, userId, companyId) {
        return this.model.findOneAndUpdate(buildResourceScopeFilter(id, companyId, 'account_id'), { deleted_at: new Date(), deleted_by: userId }, { new: true }).lean();
    }
}
