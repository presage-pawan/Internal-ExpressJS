import { Schema } from 'mongoose';
import { AssetModel } from './asset.model.js';
import { LocationModel } from './location.model.js';
import { PartModel } from './part.model.js';
import { UserModel } from './users.model.js';
import { AccountModel } from './company.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     WorkOrder:
 *       type: object
 *       required:
 *         - account_id
 *         - order_no
 *         - title
 *         - wo_asset_id
 *         - wo_location_id
 *         - createdBy
 *       properties:
 *         account_id:
 *           type: string
 *         order_no:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [Open, Pending, On-Hold, In-Progress, Approved, Rejected, Completed]
 *         priority:
 *           type: string
 *           enum: [None, Low, Medium, High]
 *         wo_asset_id:
 *           type: string
 *         wo_location_id:
 *           type: string
 *         visible:
 *           type: boolean
 */

export const WORK_ORDER_STATUSES = ['Open', 'Pending', 'On-Hold', 'In-Progress', 'Approved', 'Rejected', 'Completed'];
export const WORK_ORDER_PRIORITIES = ['None', 'Low', 'Medium', 'High'];

const PartsSchema = new Schema({
    part_id: { type: Schema.Types.ObjectId, ref: 'Schema_Part', required: true },
    part_name: { type: String, trim: true, required: true },
    part_type: { type: String, trim: true, required: true },
    estimatedQuantity: { type: Number, required: true },
    actualQuantity: { type: Number },
    unit: { type: String, trim: true },
}, { _id: false, versionKey: false });

const StatusDetailsSchema = new Schema({
    status: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, required: true, default: Date.now }
}, { _id: false, versionKey: false });

const WorkOrderSchema = new Schema({
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    order_no: { type: String, trim: true, required: true },
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true },
    estimated_time: { type: Number },
    createdFrom: { type: String, trim: true, enum: ['Asset Report', 'Work Request', 'Work Order', 'Preventive'], default: "Work Order" },
    priority: { type: String, trim: true, enum: WORK_ORDER_PRIORITIES, default: "None" },
    status: { type: String, trim: true, enum: WORK_ORDER_STATUSES, default: "Open" },
    status_details: { type: [StatusDetailsSchema], default: [] },
    type: { type: String, trim: true },
    nature_of_work: { type: String, trim: true },
    wo_asset_id: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    wo_location_id: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    start_date: { type: Date },
    end_date: { type: Date },
    sop_form_id: { type: Schema.Types.ObjectId, ref: 'SOPFormModel' },
    sop_form_submitted: { type: Boolean, default: false },
    sop_form_data: { type: Schema.Types.Mixed },
    parts: { type: [PartsSchema] },
    tasks: { type: [Object] },
    task_submitted: { type: Boolean, default: false },
    asset_report_id: { type: Schema.Types.ObjectId, ref: 'AssetReportModel' },
    work_request_id: { type: Schema.Types.ObjectId, ref: 'WorkRequestModel' },
    files: { type: [Object] },
    visible: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    collection: 'work_orders',
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

export const WorkOrderModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    if (!connection.models.User) UserModel(connection);
    if (!connection.models.Asset) AssetModel(connection);
    if (!connection.models.Location) LocationModel(connection);
    if (!connection.models.Schema_Part) PartModel(connection);

    return connection.models.Schema_WorkOrder || connection.model('Schema_WorkOrder', WorkOrderSchema);
};
