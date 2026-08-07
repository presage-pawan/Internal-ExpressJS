import { Schema } from 'mongoose';
import { UserModel } from './users.model.js';
import { AccountModel } from '../../cmms/schemas/company.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     MapUser:
 *       type: object
 *       required:
 *         - user_id
 *         - username
 *         - account_id
 *       properties:
 *         user_id:
 *           type: string
 *         username:
 *           type: string
 *         account_id:
 *           type: string
 *         visible:
 *           type: boolean
 */
const userSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, trim: true, required: true },
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    visible: { type: Boolean, default: true }
}, {
    collection: 'map_users',
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

export const ExternalUserModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.User) UserModel(connection);
    if (!connection.models.Account) AccountModel(connection);

    return connection.models.Schema_External_User || connection.model('Schema_External_User', userSchema);
};
