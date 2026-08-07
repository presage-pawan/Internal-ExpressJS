import { Schema } from 'mongoose';
import { AccountModel } from '../../cmms/schemas/company.model.js';
import { uploadSchema } from './upload.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - postType
 *         - relatedTo
 *         - description
 *         - account_id
 *         - user
 *       properties:
 *         postType:
 *           type: string
 *         relatedTo:
 *           type: string
 *         description:
 *           type: string
 *         account_id:
 *           type: string
 *         user:
 *           type: object
 *         help:
 *           type: boolean
 *         publishTo:
 *           type: array
 *           items:
 *             type: string
 */
// Minimal User Schema for embedding (from users.model.js)
const userSchema = new Schema(
    {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, trim: true },
        username: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        user_status: { type: String, default: 'active' },
        user_role: { type: String, default: 'employee', lowercase: true, trim: true },
        account_id: { type: Schema.Types.ObjectId, required: true },
        phone_no: { type: Object, required: true },
        visible: { type: Boolean, default: true }
    },
    { _id: true, timestamps: true, versionKey: false }
);

const PostSchema = new Schema({
    postType: { type: String, trim: true, required: true },
    relatedTo: { type: String, trim: true, required: true },
    description: { type: String, trim: true, required: true },
    files: { type: Map, of: [uploadSchema] },
    createdOn: { type: Date, default: Date.now },
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    user: { type: userSchema, required: true },
    help: { type: Boolean, default: false },
    publishTo: { type: [String] },
    comments: { type: [String] },
    likes: { type: [String] },
}, {
    collection: 'posts',
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

export const PostModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    // User schema is embedded, so no need to register UserModel for it specifically, 
    // but good practice if we ever start referencing it later.

    return connection.models.Schema_Post || connection.model('Schema_Post', PostSchema);
};
