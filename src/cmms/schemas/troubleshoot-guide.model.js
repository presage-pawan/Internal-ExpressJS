import { Schema } from 'mongoose';
import { AccountModel } from '../../cmms/schemas/company.model.js';
import { AssetModel } from './asset.model.js';
import { LocationModel } from './location.model.js';
import { UserModel } from './users.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     TroubleshootGuide:
 *       type: object
 *       required:
 *         - account_id
 *         - title
 *         - troubleshooting_steps
 *         - createdBy
 *       properties:
 *         account_id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         tags:
 *           type: string
 *         type:
 *           type: string
 *         assetId:
 *           type: string
 *         locationId:
 *           type: string
 *         troubleshooting_steps:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               files: { type: array, items: { type: object } }
 *         visible:
 *           type: boolean
 */
const TroubleshootingStepsSchema = new Schema({
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true, required: true },
    files: { type: [Object], required: true },
    id: { type: Number, required: true },
    Position: { type: Number, required: true }
}, { _id: false });

const troubleshootGuideSchema = new Schema({
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true },
    tags: { type: String, trim: true },
    type: { type: String, trim: true },
    assetId: { type: Schema.Types.ObjectId, ref: 'Asset' },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    troubleshooting_steps: { type: [TroubleshootingStepsSchema], required: true },
    visible: { type: Boolean, required: true, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    collection: 'troubleshoot_guide',
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

export const TroubleshootGuideModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    if (!connection.models.Asset) AssetModel(connection);
    if (!connection.models.Location) LocationModel(connection);
    if (!connection.models.User) UserModel(connection);

    return connection.models.Schema_TroubleshootGuide || connection.model('Schema_TroubleshootGuide', troubleshootGuideSchema);
};
