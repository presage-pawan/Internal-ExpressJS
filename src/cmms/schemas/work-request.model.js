import { Schema } from 'mongoose';
import { AccountModel } from '../../cmms/schemas/company.model.js';
import { LocationModel } from './location.model.js';
import { AssetModel } from './asset.model.js';
import { UserModel } from './users.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     WorkRequest:
 *       type: object
 *       required:
 *         - account_id
 *         - problemType
 *         - location_id
 *         - asset_id
 *         - createdBy
 *       properties:
 *         account_id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         problemType:
 *           type: string
 *         status:
 *           type: string
 *           enum: [Open, Pending, On-Hold, In-Progress, Approved, Rejected]
 *         priority:
 *           type: string
 *           enum: [None, Low, Medium, High]
 *         location_id:
 *           type: string
 *         asset_id:
 *           type: string
 *         visible:
 *           type: boolean
 */

export const WORK_REQUEST_STATUSES = ['Open', 'Pending', 'On-Hold', 'In-Progress', 'Approved', 'Rejected'];
export const WORK_REQUEST_PRIORITIES = ['None', 'Low', 'Medium', 'High'];

const WorkRequestSchema = new Schema({
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    problemType: { type: String, trim: true, required: true },
    priority: { type: String, trim: true, enum: WORK_REQUEST_PRIORITIES, default: 'None' },
    files: { type: [Object], default: [] },
    status: { type: String, trim: true, enum: WORK_REQUEST_STATUSES, default: 'Open' },
    location_id: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    asset_id: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    tags: { type: [String] },
    remarks: { type: String, trim: true },
    visible: { type: Boolean, default: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    collection: 'work_request',
    timestamps: true,
    versionKey: false,
    toJSON: {
        virtuals: true,
        transform(doc, ret) {
            ret.id = ret._id;
            return ret;
        }
    }
});

export const WorkRequestModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    if (!connection.models.Location) LocationModel(connection);
    if (!connection.models.Asset) AssetModel(connection);
    if (!connection.models.User) UserModel(connection);

    return connection.models.Schema_WorkRequest || connection.model('Schema_WorkRequest', WorkRequestSchema);
};
