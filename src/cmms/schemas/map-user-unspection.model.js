import { Schema } from 'mongoose';
import { AccountModel } from '../../cmms/schemas/company.model.js';
import { UserModel } from './users.model.js';
import { InspectionModel } from './work-inspection.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     MapUserInspection:
 *       type: object
 *       required:
 *         - account_id
 *         - user_id
 *         - inspection_id
 *       properties:
 *         account_id:
 *           type: string
 *         user_id:
 *           type: string
 *         inspection_id:
 *           type: string
 */
const MapUserInspectionSchema = new Schema({
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    inspection_id: { type: Schema.Types.ObjectId, ref: 'Schema_Inspection', required: true },
    createdAt: { type: Date, default: Date.now }
}, {
    collection: 'map_user_inspection',
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

export const MapUserInspectionModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    if (!connection.models.User) UserModel(connection);
    if (!connection.models.Schema_Inspection) InspectionModel(connection);

    return connection.models.Schema_MapUserInspection || connection.model('Schema_MapUserInspection', MapUserInspectionSchema);
};
