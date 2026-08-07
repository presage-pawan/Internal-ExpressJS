import { Schema } from 'mongoose';
import { AccountModel } from '../../cmms/schemas/company.model.js';
import { UserModel } from './users.model.js';
import { LocationModel } from './location.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     LocationReport:
 *       type: object
 *       required:
 *         - account_id
 *         - userId
 *         - location_id
 *         - createdBy
 *       properties:
 *         account_id:
 *           type: string
 *         userId:
 *           type: string
 *         location_id:
 *           type: string
 *         asset_condition_summary_data:
 *           type: array
 *           items:
 *             type: object
 *         asset_fault_summary_data:
 *           type: array
 *           items:
 *             type: object
 *         visible:
 *           type: boolean
 */
const rmsSchema = new Schema({
    timestamp: { type: Schema.Types.Mixed },
    rms: { type: Schema.Types.Mixed }
}, { _id: false });

const accelerationVelocitySchema = new Schema({
    Axial: { type: rmsSchema },
    Horizontal: { type: rmsSchema },
    Vertical: { type: rmsSchema }
}, { _id: false });

const RMSDataSchema = new Schema({
    is_linked: Boolean,
    composite_id: { type: String, trim: true },
    point_name: { type: String, trim: true },
    mount_location: { type: String, trim: true },
    mount_type: { type: String, trim: true },
    mount_material: { type: String, trim: true },
    mount_direction: { type: String, trim: true },
    asset_id: Schema.Types.ObjectId,
    org_id: Schema.Types.ObjectId,
    mac_id: { type: String, trim: true },
    image: { type: String, trim: true },
    acceleration: accelerationVelocitySchema,
    velocity: accelerationVelocitySchema,
    asset_name: String
}, { _id: false });

const AssetHealthHistorySchema = new Schema({
    date: { type: String, trim: true },
    status: String
}, { _id: false });

const FaultDataSchema = new Schema({
    name: { type: String, trim: true },
    value: Number
}, { _id: false });

const AssetReportSchema = new Schema({
    asset_id: Schema.Types.ObjectId,
    observations: { type: String, trim: true },
    recommendations: { type: String, trim: true },
    created_on: { type: Date },
    asset_name: { type: String, trim: true },
    location_name: { type: String, trim: true },
    fault_data: [FaultDataSchema],
    endpointRMSData: [RMSDataSchema],
    healthFlag: { type: String, trim: true },
    locationId: { type: String, trim: true },
    asset_health_history: [AssetHealthHistorySchema],
    dummyList: { type: Schema.Types.Mixed }
}, { _id: false });

const SummaryDataSchema = new Schema({
    key: { type: String, trim: true },
    value: {
        value: Number,
        itemStyle: {
            color: String
        }
    }
}, { _id: false });

const FaultSummarySchema = new Schema({
    key: { type: String, trim: true },
    value: Number
}, { _id: false });

const SubLocationAssetSchema = new Schema({
    asset_id: { type: Schema.Types.ObjectId },
    observations: { type: String, trim: true },
    recommendations: { type: String, trim: true },
    created_on: { type: Date },
    asset_name: { type: String, trim: true },
    location_name: { type: String, trim: true },
    fault_data: { type: [FaultDataSchema] },
    endpointRMSData: { type: [RMSDataSchema] },
    healthFlag: { type: String, trim: true },
    locationId: { type: String, trim: true },
    asset_health_history: { type: [AssetHealthHistorySchema] },
    dummyList: { type: Schema.Types.Mixed }
}, { _id: false });

const SubLocationSchema = new Schema({
    sub_location: {
        id: { type: String, trim: true },
        name: { type: String, trim: true }
    },
    asset_data: { type: [SubLocationAssetSchema] },
    sub_location_asset_condition_summary_data: { type: [SummaryDataSchema] },
    sub_location_asset_fault_summary_data: { type: [FaultSummarySchema] }
}, { _id: false });


const LocationReportSchema = new Schema({
    asset_condition_summary_data: { type: [SummaryDataSchema] },
    asset_fault_summary_data: { type: [FaultSummarySchema] },
    asset_report_data: { type: [AssetReportSchema] },
    created_on: { type: Date, default: Date.now },
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    sub_location_data: { type: [SubLocationSchema] },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    user: { type: Schema.Types.Mixed },
    location_id: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    visible: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    collection: 'location-report',
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

export const ReportLocationModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    if (!connection.models.User) UserModel(connection);
    if (!connection.models.Location) LocationModel(connection);

    return connection.models.Schema_ReportLocation || connection.model('Schema_ReportLocation', LocationReportSchema);
};
