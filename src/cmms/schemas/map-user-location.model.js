import { Schema } from 'mongoose';
import { AccountModel } from './company.model.js';
import { LocationModel } from './location.model.js';
import { AssetModel } from './asset.model.js';
import { UserModel } from './users.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     MapUserLocation:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         account_id:
 *           type: string
 *         userId:
 *           type: string
 *         locationId:
 *           type: string
 *         assetId:
 *           type: string
 *         sendMail:
 *           type: boolean
 *         alert:
 *           type: boolean
 *         danger:
 *           type: boolean
 *         critical:
 *           type: boolean
 */
const MapUserLocationSchema = new Schema({
    account_id: { type: Schema.Types.ObjectId, ref: 'Account' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    assetId: { type: Schema.Types.ObjectId, ref: 'Asset' },
    sendMail: { type: Boolean, default: true },
    alert: { type: Boolean, default: true },
    danger: { type: Boolean, default: true },
    critical: { type: Boolean, default: true }
}, {
    collection: 'location_user_mapping',
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

export const MapUserAssetLocationModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    if (!connection.models.Location) LocationModel(connection);
    if (!connection.models.Asset) AssetModel(connection);
    if (!connection.models.User) UserModel(connection);

    return connection.models.Schema_MapUserLocation || connection.model('Schema_MapUserLocation', MapUserLocationSchema);
};
