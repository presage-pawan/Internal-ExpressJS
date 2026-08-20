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
    tokenType: {
        type: String,
        enum: ['access', 'refresh'],
        default: 'access'
    },
    token_id: {
        type: Schema.Types.ObjectId
    },
    ttl: {
        type: Number
    },
    created: {
        type: Date,
        required: true,
        default: Date.now
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: 'User'
    },
    account_id: {
        type: Schema.Types.ObjectId,
        ref: 'Company'
    },
    principalType: {
        type: String,
        required: true
    },
    isExternal: {
        type: Boolean,
        default: false
    },
    isInternal: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date
    },
    revokedAt: {
        type: Date
    },
    replacedByTokenHash: {
        type: String
    },
    userAgent: {
        type: String
    },
    ipAddress: {
        type: String
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

userTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
userTokenSchema.index({ account_id: 1, principalType: 1, revokedAt: 1 });
userTokenSchema.index({ tokenType: 1, userId: 1, account_id: 1, revokedAt: 1 });
userTokenSchema.index({ principalType: 1, userId: 1, account_id: 1, revokedAt: 1 });

export const TokenModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.User) UserModel(connection);

    return connection.models.Schema_UserToken || connection.model('Schema_UserToken', userTokenSchema);
};

