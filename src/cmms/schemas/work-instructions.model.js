import { Schema } from 'mongoose';
import { AccountModel } from '../../cmms/schemas/company.model.js';
import { UserModel } from './users.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     WorkInstructions:
 *       type: object
 *       required:
 *         - account_id
 *         - createdBy
 *       properties:
 *         account_id:
 *           type: string
 *         title:
 *           type: string
 *         tag:
 *           type: string
 *         description:
 *           type: string
 *         visible:
 *           type: boolean
 */
const WorkInstructionsStepsSchema = new Schema({
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true, required: true },
    image: { type: [Object], required: true },
    id: { type: Number, required: true },
    Position: { type: Number, required: true }
}, { _id: false });

const WorkInstructionsSchema = new Schema({
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    title: { type: String, trim: true },
    tag: { type: String, trim: true },
    description: { type: String, trim: true },
    WI_steps: { type: [WorkInstructionsStepsSchema] },
    visible: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    collection: 'work_instructions',
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

export const WorkInstructions = (connection) => {
    if (!connection) throw new Error('Database connection not provided');

    // Register dependencies
    if (!connection.models.Account) AccountModel(connection);
    if (!connection.models.User) UserModel(connection);

    return connection.models.Schema_WorkInstructions || connection.model('Schema_WorkInstructions', WorkInstructionsSchema);
};
