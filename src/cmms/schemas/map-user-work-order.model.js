import { Schema } from 'mongoose';
import { WorkOrderModel } from './work-order.model.js';
import { UserModel } from './users.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     MapUserWorkOrder:
 *       type: object
 *       required:
 *         - woId
 *         - userId
 *       properties:
 *         woId:
 *           type: string
 *         userId:
 *           type: string
 */
const workOrderAssigneeSchema = new Schema(
    {
        woId: { type: Schema.Types.ObjectId, ref: 'Schema_WorkOrder', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    {
        collection: 'wo_user_mapping',
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

export const WorkOrderAssigneeModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Schema_WorkOrder) WorkOrderModel(connection);
    if (!connection.models.User) UserModel(connection);

    return connection.models.Schema_WorkOrderAssignee || connection.model('Schema_WorkOrderAssignee', workOrderAssigneeSchema);
};
