import { Schema } from 'mongoose';
import { AccountModel } from '../../cmms/schemas/company.model.js';
import { UserModel } from './users.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     RoleMenu:
 *       type: object
 *       required:
 *         - account_id
 *         - user_id
 *         - data
 *         - roleMenu
 *         - createdBy
 *       properties:
 *         account_id:
 *           type: string
 *         user_id:
 *           type: string
 *         data:
 *           type: object
 *         roleMenu:
 *           type: object
 */
const userRoleMenuSchema = new Schema({
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    data: { type: Object, required: true },
    roleMenu: { type: Object, required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    collection: 'platform-control',
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

export const RoleMenuModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    if (!connection.models.User) UserModel(connection);

    return connection.models.Schema_RoleMenu || connection.model('Schema_RoleMenu', userRoleMenuSchema);
};
