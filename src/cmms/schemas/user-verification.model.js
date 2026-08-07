import { Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     UserVerification:
 *       type: object
 *       required:
 *         - email
 *         - firstName
 *         - code
 *       properties:
 *         email:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         code:
 *           type: string
 */
const verificationCodeSchema = new Schema({
    email: { type: String, trim: true, required: true },
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true },
    code: { type: String, trim: true, required: true },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 }
}, {
    collection: 'user_verification_code',
    timestamps: true,
    versionKey: false,
    toJSON: {
        virtuals: true,
        transform(doc, ret) {
            ret.id = ret._id;
            return ret;
        }
    }
});

export const VerificationCodeModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');
    return connection.models.Schema_VerificationCode || connection.model('Schema_VerificationCode', verificationCodeSchema);
};
