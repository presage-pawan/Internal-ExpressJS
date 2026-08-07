import { Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     MailLog:
 *       type: object
 *       required:
 *         - to
 *         - subject
 *         - html
 *         - status
 *       properties:
 *         to:
 *           type: string
 *         subject:
 *           type: string
 *         html:
 *           type: string
 *         status:
 *           type: string
 *           enum: [success, failed]
 *         messageId:
 *           type: string
 *         error:
 *           type: string
 */
export const MAIL_LOG_STATUSES = ['success', 'failed'];
const mailLogSchema = new Schema({
    to: { type: String, trim: true, required: true },
    subject: { type: String, trim: true, required: true },
    html: { type: String, trim: true, required: true },
    status: { type: String, trim: true, enum: MAIL_LOG_STATUSES, required: true },
    messageId: { type: String, trim: true },
    mailInfo: { type: Object },
    error: { type: String, trim: true },
}, {
    collection: 'mail_logs',
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

export const MailLogModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');
    return connection.models.Schema_MailLog || connection.model('Schema_MailLog', mailLogSchema);
};

export const createMailLog = async (connection, mailLog) => {
    // Helper function to create log, requires connection now
    const Model = MailLogModel(connection);
    return new Model(mailLog).save();
};
