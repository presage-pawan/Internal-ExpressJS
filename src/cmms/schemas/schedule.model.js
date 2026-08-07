import { Schema } from "mongoose";
import { AccountModel } from './company.model.js';
import { AssetModel } from './asset.model.js';
import { LocationModel } from './location.model.js';
import { UserModel } from './users.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     ScheduleMaster:
 *       type: object
 *       required:
 *         - account_id
 *         - title
 *         - schedule
 *         - work_order
 *         - createdBy
 *       properties:
 *         account_id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         schedule:
 *           type: object
 *           properties:
 *             mode:
 *               type: string
 *               enum: [daily, weekly, monthly]
 *             enabled:
 *               type: boolean
 *             start_date:
 *               type: string
 *         work_order:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *             status:
 *               type: string
 *             priority:
 *               type: string
 */
const TaskSchema = new Schema({
    title: { type: String, trim: true, required: true },
    type: { type: String, trim: true, required: true },
    fieldValue: { type: String, trim: true },
    options: [{ key: String, value: Schema.Types.Mixed }]
}, { _id: false });

const PartSchema = new Schema({
    part_id: { type: String, required: true },
    part_name: { type: String, trim: true, required: true },
    part_type: { type: String, trim: true, required: true },
    estimatedQuantity: { type: Number, required: true },
    unit: { type: String, trim: true }
}, { _id: false });

const WorkOrderSchema = new Schema({
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true },
    type: { type: String, trim: true, required: true },
    status: { type: String, trim: true, required: true },
    priority: { type: String, trim: true, required: true },
    estimated_time: Number,
    wo_location_id: { type: Schema.Types.ObjectId, ref: "Location", required: true },
    wo_asset_id: { type: Schema.Types.ObjectId, ref: "Asset", required: true },
    sop_form_id: { type: Schema.Types.ObjectId, ref: "SopFormModel" },
    userIdList: { type: [String], required: true },
    tasks: { type: [TaskSchema], default: [] },
    parts: { type: [PartSchema], default: [] },
    createdFrom: { type: String, trim: true }
}, { _id: false });

const ScheduleRepeatDailySchema = new Schema({
    everyNDays: { type: Number, default: 1 }
}, { _id: false });

const ScheduleRepeatWeeklySchema = new Schema({
    everyNWeeks: { type: Number, default: 1 },
    days: { type: [String], default: [] }
}, { _id: false });

const ScheduleRepeatMonthlySchema = new Schema({
    everyNMonths: { type: Number, default: 1 },
    monthDays: { type: [Number], default: [] }
}, { _id: false });

const ScheduleSchema = new Schema({
    mode: { type: String, enum: ["daily", "weekly", "monthly"], required: true },
    enabled: { type: Boolean, default: true },
    start_date: { type: String, required: true },
    end_date: { type: String },
    no_of_repetition: { type: Number },
    no_of_execution: { type: Number, default: 0 },
    skipWeekends: { type: Boolean, default: false },
    skipWeekendSaturday: { type: Boolean, default: false },
    skipWeekendSunday: { type: Boolean, default: false },
    skipDates: { type: [String], default: [] },
    daily: { type: ScheduleRepeatDailySchema, default: {} },
    weekly: { type: ScheduleRepeatWeeklySchema, default: {} },
    monthly: { type: ScheduleRepeatMonthlySchema, default: {} },
    last_execution_date: { type: Date }
}, { _id: false });

const ScheduleMasterSchema = new Schema(
    {
        account_id: { type: Schema.Types.ObjectId, ref: "Account", required: true },
        title: { type: String, trim: true, required: true },
        description: { type: String, trim: true },
        schedule: { type: ScheduleSchema, required: true },
        work_order: { type: WorkOrderSchema, required: true },
        visible: { type: Boolean, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: "User" }
    },
    {
        collection: "schedule_master",
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
    }
);

export const SchedulerModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    if (!connection.models.User) UserModel(connection);
    if (!connection.models.Asset) AssetModel(connection);
    if (!connection.models.Location) LocationModel(connection);

    return connection.models.Schema_Schedule || connection.model("Schema_Schedule", ScheduleMasterSchema);
};
