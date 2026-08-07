import { Schema } from 'mongoose';
import { UserModel } from './users.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     UserToken:
 *       type: object
 *       required:
 *         - _id
 *         - ttl
 *         - userId
 *         - principalType
 *       properties:
 *         _id:
 *           type: string
 *           description: Access token ID
 *         ttl:
 *           type: number
 *           description: Time to live
 *         userId:
 *           type: string
 *         principalType:
 *           type: string
 */
const userTokenSchema = new Schema({
    _id: { type: String, trim: true, required: true },
    ttl: { type: Number, required: true },
    created: {
        type: Date,
        required: true,
        default: Date.now
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    principalType: {
        type: String,
        required: true
    }
}, {
    collection: 'CustomAccessToken',
    versionKey: false,
    toJSON: {
        virtuals: true,
        transform(doc, ret) {
            ret.id = ret._id;
            return ret;
        }
    }
});

export const TokenModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.User) UserModel(connection);

    return connection.models.Schema_UserToken || connection.model('Schema_UserToken', userTokenSchema);
};
