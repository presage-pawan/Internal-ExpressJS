import bcrypt from 'bcryptjs';
import { UserModel } from '../schemas/users.model.js';
import { getConnection } from '../../_db/index.js';

const SALT_ROUNDS = 12;

// Safe projection — never expose password
const USER_PROJECTION = {
    password: 0,
};

export class UserService {

    constructor(dbType = 'production') {
        this.dbType = dbType;
    }

    get model() {
        const connection = getConnection(this.dbType, 'cmms');
        return UserModel(connection);
    }

    // ─── GET ALL (with pagination + filtering) ────────────────────────────────
    async getAll(filter = {}, options = {}) {
        const page  = parseInt(options.page)  || 1;
        const limit = parseInt(options.limit) || 20;
        const skip  = (page - 1) * limit;

        // Text search across firstName, lastName, username, email
        if (options.search) {
            const regex = new RegExp(options.search, 'i');
            filter.$or = [
                { firstName: regex },
                { lastName:  regex },
                { username:  regex },
                { email:     regex },
            ];
        }

        const [data, total] = await Promise.all([
            this.model
                .find(filter, USER_PROJECTION)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.model.countDocuments(filter),
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ─── GET BY ID ────────────────────────────────────────────────────────────
    async getById(id) {
        return this.model.findOne({ _id: id, visible: true }, USER_PROJECTION).lean();
    }

    // ─── CREATE ───────────────────────────────────────────────────────────────
    async create(payload) {
        const hashedPassword = await bcrypt.hash(payload.password, SALT_ROUNDS);
        const user = new this.model({ ...payload, password: hashedPassword });
        const saved = await user.save();
        // Strip password before returning
        const obj = saved.toObject();
        delete obj.password;
        return obj;
    }

    // ─── FULL UPDATE (PUT) ────────────────────────────────────────────────────
    async update(id, payload) {
        // Hash password if it was included in PUT body
        if (payload.password) {
            payload.password = await bcrypt.hash(payload.password, SALT_ROUNDS);
        }
        return this.model.findByIdAndUpdate(
            id,
            payload,
            { new: true, runValidators: true, projection: USER_PROJECTION }
        );
    }

    // ─── PARTIAL UPDATE (PATCH) ───────────────────────────────────────────────
    async updatePartial(id, payload) {
        if (payload.password) {
            payload.password = await bcrypt.hash(payload.password, SALT_ROUNDS);
        }
        return this.model.findByIdAndUpdate(
            id,
            { $set: payload },
            { new: true, runValidators: true, projection: USER_PROJECTION }
        );
    }

    // ─── SOFT DELETE ──────────────────────────────────────────────────────────
    async delete(id, updatedBy) {
        return this.model.findByIdAndUpdate(
            id,
            { visible: false, updatedBy },
            { new: true }
        );
    }
}
