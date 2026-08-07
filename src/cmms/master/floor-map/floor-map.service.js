import { EndpointLocationModel } from '../../schemas/floor-map.model.js';
import { getConnection } from '../../../_db/index.js';

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

    async update(id, data) {
        return this.model.findByIdAndUpdate(id, data, { new: true }).lean();
    }

    async updatePartial(id, data) {
        return this.model.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
    }

    async delete(id, userId) {
        return this.model.findByIdAndUpdate(id, { deleted_at: new Date(), deleted_by: userId }, { new: true }).lean();
    }
}
