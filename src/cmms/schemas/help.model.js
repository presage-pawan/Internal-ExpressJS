import { Schema } from 'mongoose';
import { AccountModel } from '../../cmms/schemas/company.model.js';
import { UserModel } from './users.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     Help:
 *       type: object
 *       required:
 *         - description
 *         - account_id
 *         - problemType
 *         - postPriority
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         account_id:
 *           type: string
 *         userId:
 *           type: string
 *         problemType:
 *           type: string
 *         postPriority:
 *           type: string
 *         status:
 *           type: string
 *         visible:
 *           type: boolean
 */
const BlogSchema = new Schema({
    title: { type: String, trim: true },
    description: { type: String, trim: true, required: true },
    createdOn: { type: Date, default: Date.now },
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    user: { type: Object },
    location: { type: [Object] },
    asset: { type: [Object] },
    problemType: { type: String, trim: true, required: true },
    postPriority: { type: String, trim: true, required: true },
    files: { type: [String] },
    status: { type: String, trim: true },
    emailId: { type: String, trim: true },
    tags: { type: Object },
    help: { type: Boolean, default: false },
    comments: { type: [Schema.Types.Mixed] },
    likes: { type: [Schema.Types.Mixed] },
    visible: { type: Boolean, default: true }
}, {
    collection: 'help',
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

export const BlogModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    if (!connection.models.User) UserModel(connection);

    return connection.models.Schema_Blog || connection.model('Schema_Blog', BlogSchema);
};
