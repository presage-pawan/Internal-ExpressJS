import { Schema } from 'mongoose';
import { AccountModel } from './company.model.js';
import { UserModel } from './users.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     FormCategory:
 *       type: object
 *       required:
 *         - name
 *         - account_id
 *         - createdBy
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         account_id:
 *           type: string
 *         visible:
 *           type: boolean
 */
const CategorySchema = new Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    visible: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    collection: 'form_category',
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

export const CategoryModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    if (!connection.models.User) UserModel(connection);

    return connection.models.Schema_Category || connection.model('Schema_Category', CategorySchema);
};
