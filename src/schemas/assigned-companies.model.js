import { Schema } from "mongoose";


const AssignedCompaniesSchema = new Schema(
    {
        user_id: { type: Schema.Types.ObjectId, ref: 'InternalUser' },
        company_ids: { type: Array },
        db_type: { type: String, enum: ['production', 'staging'], default: 'production' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'InternalUser', required: true },
    }, {
    collection: 'assigned_companies',
    timestamps: true,
    versionKey: false,
    toJSON: {
        virtuals: true,
        transform(doc, ret) {
            ret.id = ret._id;
            return ret;
        }
    },
    toObject: {
        virtuals: true,
        transform(doc, ret) {
            ret.id = ret._id;
            return ret;
        }
    }
});

const getModel = (db, name) => {
    if (!db) throw Object.assign(new Error('Invalid database connection'), { status: 500 });
    return db.models[name] || db.model(name, AssignedCompaniesSchema);
};

export const AssignedCompaniesModel = (connection) => getModel(connection, 'AssignedCompanies');