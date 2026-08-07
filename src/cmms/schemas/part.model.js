import { Schema } from 'mongoose';
import { AccountModel } from './company.model.js';
import { LocationModel } from './location.model.js';
import { UserModel } from './users.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     Part:
 *       type: object
 *       required:
 *         - account_id
 *         - part_name
 *         - part_number
 *         - part_type
 *         - unit
 *         - quantity
 *         - min_quantity
 *         - cost
 *         - location_id
 *         - createdBy
 *       properties:
 *         account_id:
 *           type: string
 *         part_name:
 *           type: string
 *         part_number:
 *           type: string
 *         part_type:
 *           type: string
 *         unit:
 *           type: string
 *         description:
 *           type: string
 *         quantity:
 *           type: number
 *         min_quantity:
 *           type: number
 *         cost:
 *           type: number
 *         location_id:
 *           type: string
 *         visible:
 *           type: boolean
 */
const PartSchema = new Schema(
    {
        account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
        part_name: { type: String, required: true, trim: true },
        part_number: { type: String, required: true, trim: true },
        part_type: { type: String, trim: true, required: true },
        unit: { type: String, trim: true, required: true },
        description: { type: String, trim: true },
        quantity: { type: Number, required: true },
        min_quantity: { type: Number, required: true },
        cost: { type: Number, required: true },
        location_id: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
        visible: { type: Boolean, required: true, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    {
        collection: 'parts',
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

export const PartModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    if (!connection.models.Location) LocationModel(connection);
    if (!connection.models.User) UserModel(connection);

    return connection.models.Part || connection.model('Part', PartSchema);
};
