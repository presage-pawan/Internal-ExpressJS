import { Schema } from 'mongoose';
import { AccountModel } from '../../cmms/schemas/company.model.js';
import { UserModel } from './users.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     UserLog:
 *       type: object
 *       required:
 *         - method
 *         - module
 *         - description
 *         - statusCode
 *         - requestUrl
 *         - host
 *         - hostName
 *         - protocol
 *         - port
 *         - ipAddress
 *         - userAgent
 *       properties:
 *         account_id:
 *           type: string
 *         userId:
 *           type: string
 *         method:
 *           type: string
 *         module:
 *           type: string
 *         description:
 *           type: string
 *         statusCode:
 *           type: number
 *         requestUrl:
 *           type: string
 */
const userLogSchema = new Schema({
    account_id: { type: Schema.Types.ObjectId, ref: 'Account' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    pageUrl: { type: String, trim: true },
    moduleName: { type: String, trim: true },
    userName: { type: String, trim: true },
    method: { type: String, trim: true, required: true },
    module: { type: String, trim: true, required: true },
    description: { type: String, trim: true, required: true },
    statusCode: { type: Number, required: true },
    requestUrl: { type: String, trim: true, required: true },
    host: { type: String, trim: true, required: true },
    hostName: { type: String, trim: true, required: true },
    protocol: { type: String, trim: true, required: true },
    port: { type: Number, required: true },
    ipAddress: { type: String, trim: true, required: true },
    userAgent: { type: String, trim: true, required: true },

    systemInfo: {
        platform: String,
        os: String,
        architecture: String
    },
    browserInfo: {
        name: String,
        version: String,
        engine: String
    },
    deviceInfo: {
        isMobile: Boolean,
        isTablet: Boolean,
        isDesktop: Boolean,
        userAgent: String
    },
    networkInfo: {
        origin: String,
        referer: String,
        host: String,
        connection: String,
        contentLength: Number,
        encoding: [String],
        language: [String]
    },
    requestMeta: {
        contentType: String,
        accept: [String],
        fetchMode: String,
        fetchSite: String,
        fetchDest: String,
        dnt: Boolean,
        secCHUA: [String]
    },
    additionalData: {
        params: Schema.Types.Mixed,
        body: Schema.Types.Mixed,
        query: Schema.Types.Mixed,
        durationMs: Number
    }
}, {
    collection: 'user_logs',
    versionKey: false,
    timestamps: true,
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

// Virtual field: isSuccess
userLogSchema.virtual('isSuccess').get(function () {
    return this.statusCode >= 200 && this.statusCode < 300;
});

// Instance method
userLogSchema.methods.isFromMobile = function () {
    return this.deviceInfo?.isMobile || false;
};

// Static method
userLogSchema.statics.findByUserId = function (userId) {
    return this.find({ userId: userId });
};

export const UserLogModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    if (!connection.models.User) UserModel(connection);

    return connection.models.Schema_UserLog || connection.model('Schema_UserLog', userLogSchema);
};
