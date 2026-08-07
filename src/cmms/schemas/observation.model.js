import { Schema } from 'mongoose';
import { AccountModel } from './company.model.js';
import { AssetModel } from './asset.model.js';
import { LocationModel } from './location.model.js';
import { UserModel } from './users.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     Observation:
 *       type: object
 *       required:
 *         - observation
 *         - recommendation
 *         - assetId
 *         - accountId
 *         - status
 *         - locationId
 *         - top_level_asset_id
 *         - userId
 *         - createdBy
 *       properties:
 *         observation:
 *           type: string
 *         recommendation:
 *           type: string
 *         faults:
 *           type: array
 *           items:
 *             type: string
 *         assetId:
 *           type: string
 *         accountId:
 *           type: string
 *         status:
 *           type: string
 *         locationId:
 *           type: string
 *         top_level_asset_id:
 *           type: string
 *         userId:
 *           type: string
 *         visible:
 *           type: boolean
 */
const ObservationSchema = new Schema({
    observation: { type: String, trim: true, required: true },
    recommendation: { type: String, trim: true, required: true },
    faults: { type: [String] },
    files: { type: [Object] },
    createdOn: { type: Date, default: Date.now },
    assetId: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    status: { type: String, trim: true, required: true },
    alarmId: { type: Number },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    top_level_asset_id: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    visible: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    collection: 'observation',
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

export const ObservationModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    if (!connection.models.Asset) AssetModel(connection);
    if (!connection.models.Location) LocationModel(connection);
    if (!connection.models.User) UserModel(connection);

    return connection.models.Schema_Observation || connection.model('Schema_Observation', ObservationSchema);
};
