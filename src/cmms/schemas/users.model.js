import { Schema } from 'mongoose';
import { staging_cmms_db, production_cmms_db } from '../../_db/index.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - firstName
 *         - username
 *         - password
 *         - email
 *         - account_id
 *         - phone_no
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         user_status:
 *           type: string
 *           enum: [active, inactive]
 *         user_role:
 *           type: string
 *           enum: [admin, manager, employee, customer, user]
 *         account_id:
 *           type: string
 *         visible:
 *           type: boolean
 */
export const STATUS = ['active', 'inactive'];
export const ROLE = ['admin', 'manager', 'employee', 'customer', 'user'];

const UserSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    user_status: { type: String, enum: STATUS, default: 'active' },
    user_role: { type: String, enum: ROLE, default: 'employee', lowercase: true, trim: true },
    account_id: { type: Schema.Types.ObjectId, required: true },
    phone_no: { type: Object, required: true },
    visible: { type: Boolean, default: true }
  },
  {
    collection: 'users',
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

export const UserModel = (connection) => {
  if (!connection) throw new Error('Invalid database connection');
  return connection.models.User || connection.model('User', UserSchema);
};
