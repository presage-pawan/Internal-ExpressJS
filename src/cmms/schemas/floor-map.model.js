import { Schema } from 'mongoose';
import { AccountModel } from '../../cmms/schemas/company.model.js';
import { LocationModel } from './location.model.js';
import { UserModel } from './users.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     FloorMap:
 *       type: object
 *       required:
 *         - coordinate
 *         - locationId
 *         - account_id
 *         - data_type
 *         - createdBy
 *       properties:
 *         coordinate:
 *           type: object
 *           properties:
 *             x: { type: number }
 *             y: { type: number }
 *         locationId:
 *           type: string
 *         account_id:
 *           type: string
 *         data_type:
 *           type: string
 *           enum: [location, asset, kpi]
 *         end_point:
 *           type: object
 */
export const FLOOR_MAP_DATA_TYPES = ['location', 'asset', 'kpi'];

const coordinateSchema = new Schema({
    x: { type: Number, required: true },
    y: { type: Number, required: true },
}, { _id: false });

const endPointSchema = new Schema({
    is_linked: { type: Boolean },
    composite_id: { type: String, trim: true },
    point_name: { type: String, trim: true, required: true },
    mount_location: { type: String, trim: true },
    mount_type: { type: String, trim: true },
    mount_material: { type: String, trim: true },
    mount_direction: { type: String, trim: true },
    asset_id: { type: Schema.Types.Mixed },
    asset_name: { type: String, trim: true, required: true },
    org_id: { type: Schema.Types.Mixed, required: true },
    mac_id: { type: String, trim: true },
    image: { type: String, trim: true },
    online: { type: String, trim: true },
    id: { type: Number, required: true },
    selected: { type: Boolean }
}, { _id: false });

const endpointLocationSchema = new Schema({
    coordinate: { type: coordinateSchema, required: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    data_type: { type: String, trim: true, enum: FLOOR_MAP_DATA_TYPES, required: true },
    createdOn: { type: Date, default: Date.now },
    end_point_id: { type: Number },
    end_point: { type: endPointSchema },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    collection: 'floor_map',
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

export const EndpointLocationModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    if (!connection.models.Location) LocationModel(connection);
    if (!connection.models.User) UserModel(connection);

    return connection.models.Schema_EndPoints || connection.model('Schema_EndPoints', endpointLocationSchema);
};
