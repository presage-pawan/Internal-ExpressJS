import { Schema } from 'mongoose';
import { AccountModel } from '../../cmms/schemas/company.model.js';
import { AssetModel } from './asset.model.js';
import { WorkOrderModel } from './work-order.model.js';
import { UserModel } from './users.model.js';
import { LocationModel } from './location.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     AssetReport:
 *       type: object
 *       required:
 *         - accountId
 *         - top_level_asset_id
 *         - files
 *         - createdBy
 *       properties:
 *         accountId:
 *           type: string
 *         top_level_asset_id:
 *           type: string
 *         assetId:
 *           type: string
 *         work_order_id:
 *           type: string
 *         Observations:
 *           type: string
 *         Recommendations:
 *           type: string
 *         FaultDetected:
 *           type: string
 *         Severity:
 *           type: string
 *         EquipmentHealth:
 *           type: string
 *         files:
 *           type: array
 *           items:
 *             type: object
 *         visible:
 *           type: boolean
 */
const reportAssetSchema = new Schema({
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    top_level_asset_id: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    assetId: { type: Schema.Types.ObjectId, ref: 'Asset' },
    work_order_id: { type: Schema.Types.ObjectId, ref: 'Schema_WorkOrder' },
    Observations: { type: String, trim: true },
    Recommendations: { type: String, trim: true },
    CreateWorkRequest: { type: String, trim: true },
    FaultDetected: { type: String, trim: true },
    Severity: { type: String, trim: true },
    NewFault: { type: String, trim: true },
    ISO: { type: Schema.Types.Mixed },
    TrendOfAlarm: { type: String, trim: true },
    EquipmentHealth: { type: String, trim: true },
    files: { type: [Object], required: true },
    user: { type: Schema.Types.Mixed },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    createdOn: { type: Date, default: Date.now },
    assetName: { type: String, trim: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    locationName: { type: String, trim: true },
    faultData: [{
        value: { type: Number },
        name: { type: String, trim: true }
    }],
    assetImage: { type: String, trim: true },
    asset_health_history: [{
        date: { type: String, trim: true },
        status: { type: String, trim: true }
    }],
    endpointRMSData: [{
        is_linked: { type: Boolean },
        composite_id: { type: String, trim: true },
        point_name: { type: String, trim: true },
        mount_location: { type: String, trim: true },
        mount_type: { type: String, trim: true, default: null },
        mount_material: { type: String, trim: true, default: null },
        mount_direction: { type: String, trim: true },
        asset_id: { type: String, trim: true },
        org_id: { type: String, trim: true },
        mac_id: { type: String, trim: true },
        image: { type: String, trim: true, default: null },
        online: { type: Boolean, default: null },
        asset_type: { type: String, trim: true },
        acceleration: {
            Axial: {
                timestamp: Schema.Types.Mixed,
                rms: Schema.Types.Mixed
            },
            Horizontal: {
                timestamp: Schema.Types.Mixed,
                rms: Schema.Types.Mixed
            },
            Vertical: {
                timestamp: Schema.Types.Mixed,
                rms: Schema.Types.Mixed
            }
        },
        velocity: {
            Axial: {
                timestamp: Schema.Types.Mixed,
                rms: Schema.Types.Mixed
            },
            Horizontal: {
                timestamp: Schema.Types.Mixed,
                rms: Schema.Types.Mixed
            },
            Vertical: {
                timestamp: Schema.Types.Mixed,
                rms: Schema.Types.Mixed
            }
        },
        asset_name: { type: String, trim: true }
    }],
    visible: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    collection: 'assets-report',
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

export const ReportAssetModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    if (!connection.models.Asset) AssetModel(connection);
    if (!connection.models.Schema_WorkOrder) WorkOrderModel(connection);
    if (!connection.models.User) UserModel(connection);
    if (!connection.models.Location) LocationModel(connection);

    return connection.models.Schema_ReportAsset || connection.model('Schema_ReportAsset', reportAssetSchema);
};
