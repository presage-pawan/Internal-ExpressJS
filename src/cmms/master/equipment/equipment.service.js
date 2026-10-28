import { EquipmentSetModel } from '../../schemas/equipment.model.js';
import { LocationModel } from '../../schemas/location.model.js';
import { getConnection } from '../../../_db/index.js';
import { buildEquipmentMutationFilter, equipmentBelongsToAllowedLocations } from './equipment-scope.js';

export class EquipmentService {
    constructor(dbType = 'production') {
        this.dbType = dbType;
    }

    get connection() {
        return getConnection(this.dbType, 'cmms');
    }

    get model() {
        return EquipmentSetModel(this.connection);
    }

    async allowedLocationIds(companyId) {
        if (!companyId) return null;
        const locations = await LocationModel(this.connection)
            .find({ account_id: companyId, visible: { $ne: false } })
            .select('_id')
            .lean();
        return locations.map(location => location._id);
    }

    async assertCompanyScope(data, companyId) {
        if (!companyId) return;
        const allowed = await this.allowedLocationIds(companyId);
        if (!equipmentBelongsToAllowedLocations(data, allowed)) {
            throw Object.assign(new Error('Equipment locations are outside the selected company'), { status: 403 });
        }
    }

    async getAll(filter = {}, options = {}) {
        let query = this.model.find(filter);
        if (options.include) {
            options.include.split(',').forEach(field => {
                query = query.populate(field.trim());
            });
        }
        const data = await query.lean();
        if (!options.companyId) return data;
        const allowed = await this.allowedLocationIds(options.companyId);
        return data.filter(item => equipmentBelongsToAllowedLocations(item, allowed));
    }

    async getById(id, options = {}) {
        let query = this.model.findById(id);
        if (options.include) {
            options.include.split(',').forEach(field => {
                query = query.populate(field.trim());
            });
        }
        const data = await query.lean();
        if (!data || !options.companyId) return data;
        const allowed = await this.allowedLocationIds(options.companyId);
        return equipmentBelongsToAllowedLocations(data, allowed) ? data : null;
    }

    async create(data, companyId) {
        await this.assertCompanyScope(data, companyId);
        const doc = new this.model(data);
        return doc.save();
    }

    async update(id, data, companyId) {
        const allowed = companyId ? await this.allowedLocationIds(companyId) : null;
        const filter = buildEquipmentMutationFilter(id, allowed);
        const existing = await this.model.findOne(filter).lean();
        if (!existing) return null;
        const candidate = { ...existing, ...data };
        await this.assertCompanyScope(candidate, companyId);
        return this.model.findOneAndUpdate(filter, data, { new: true, runValidators: true });
    }

    async updatePartial(id, data, companyId) {
        const allowed = companyId ? await this.allowedLocationIds(companyId) : null;
        const filter = buildEquipmentMutationFilter(id, allowed);
        const existing = await this.model.findOne(filter).lean();
        if (!existing) return null;
        const candidate = { ...existing, ...data };
        await this.assertCompanyScope(candidate, companyId);
        return this.model.findOneAndUpdate(filter, { $set: data }, { new: true, runValidators: true });
    }

    async delete(id, companyId) {
        const allowed = companyId ? await this.allowedLocationIds(companyId) : null;
        return this.model.findOneAndUpdate(
            buildEquipmentMutationFilter(id, allowed),
            { visible: false },
            { new: true }
        );
    }
}
