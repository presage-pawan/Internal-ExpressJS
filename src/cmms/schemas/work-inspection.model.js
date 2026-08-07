import { Schema } from 'mongoose';
import { AccountModel } from '../../cmms/schemas/company.model.js';
import { SOPsModel } from './form.model.js';
import { LocationModel } from './location.model.js';
import { AssetModel } from './asset.model.js';
import { UserModel } from './users.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     WorkInspection:
 *       type: object
 *       required:
 *         - account_id
 *         - title
 *         - start_date
 *         - form_id
 *         - location_id
 *         - asset_id
 *         - status
 *         - month
 *         - createdFrom
 *         - createdBy
 *       properties:
 *         account_id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         start_date:
 *           type: string
 *         form_id:
 *           type: string
 *         location_id:
 *           type: string
 *         asset_id:
 *           type: string
 *         status:
 *           type: string
 *         month:
 *           type: string
 *         createdFrom:
 *           type: string
 *         visible:
 *           type: boolean
 */
const InspectionSchema = new Schema(
    {
        account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        start_date: { type: String, required: true, trim: true },
        form_id: { type: Schema.Types.ObjectId, ref: 'Schema_SOPs', required: true },
        inspection_report: { type: Object },
        location_id: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
        asset_id: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
        status: { type: String, required: true, trim: true },
        month: { type: String, required: true, trim: true },
        createdFrom: { type: String, required: true, trim: true },
        no_of_actions: { type: Number, required: true, default: 0 },
        visible: { type: Boolean, required: true, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    {
        collection: 'mst_inspection',
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

export const InspectionModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    if (!connection.models.Schema_SOPs) SOPsModel(connection);
    if (!connection.models.Location) LocationModel(connection);
    if (!connection.models.Asset) AssetModel(connection);
    if (!connection.models.User) UserModel(connection);

    return connection.models.Schema_Inspection || connection.model('Schema_Inspection', InspectionSchema);
};
