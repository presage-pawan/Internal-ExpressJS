import { Schema } from 'mongoose';
import { AccountModel } from './company.model.js';
import { LocationModel } from './location.model.js';
import { CategoryModel } from './form-category.model.js';
import { UserModel } from './users.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     SOPForm:
 *       type: object
 *       required:
 *         - name
 *         - account_id
 *         - locationId
 *         - categoryId
 *         - createdBy
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         account_id:
 *           type: string
 *         locationId:
 *           type: string
 *         categoryId:
 *           type: string
 *         json_temp:
 *           type: object
 *           description: Form template structure
 *         visible:
 *           type: boolean
 */
const SopsMasterSchema = new Schema(
    {
        name: { type: String, trim: true, required: true },
        description: { type: String, trim: true },
        account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
        locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
        categoryId: { type: Schema.Types.ObjectId, ref: 'Schema_Category', required: true },
        json_temp: { type: Schema.Types.Mixed },
        visible: { type: Boolean, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    {
        collection: "sops",
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

export const SOPsModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    if (!connection.models.Location) LocationModel(connection);
    if (!connection.models.Schema_Category) CategoryModel(connection);
    if (!connection.models.User) UserModel(connection);

    return connection.models.Schema_SOPs || connection.model('Schema_SOPs', SopsMasterSchema);
};
