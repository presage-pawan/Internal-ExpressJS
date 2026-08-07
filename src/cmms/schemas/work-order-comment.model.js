import { Schema } from 'mongoose';
import { AccountModel } from '../../cmms/schemas/company.model.js';
import { WorkOrderModel } from './work-order.model.js';
import { UserModel } from './users.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     WorkOrderComment:
 *       type: object
 *       required:
 *         - account_id
 *         - order_id
 *         - comments
 *         - createdBy
 *       properties:
 *         account_id:
 *           type: string
 *         order_id:
 *           type: string
 *         comments:
 *           type: string
 *         parentCommentId:
 *           type: string
 *         visible:
 *           type: boolean
 */
const CommentsSchema = new Schema(
    {
        account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
        order_id: { type: Schema.Types.ObjectId, ref: 'Schema_WorkOrder', required: true },
        comments: { type: String, required: true, trim: true },
        parentCommentId: { type: Schema.Types.ObjectId, ref: 'Schema_Comments', default: null },
        visible: { type: Boolean, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    {
        collection: 'work_order_comment',
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

export const CommentsModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    if (!connection.models.Schema_WorkOrder) WorkOrderModel(connection);
    if (!connection.models.User) UserModel(connection);

    return connection.models.Schema_Comments || connection.model('Schema_Comments', CommentsSchema);
};
