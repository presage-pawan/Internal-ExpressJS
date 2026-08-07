import { Schema } from 'mongoose';

const RoleMenuSchema = new Schema(
  {
    roleName: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'InternalUser', required: true },
    roleMenu: { type: Object, required: true },
    visible: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'InternalUser', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'InternalUser' }
  },
  {
    collection: 'role-menu',
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

const getModel = (db, name) => {
  if (!db) throw Object.assign(new Error('Invalid database connection'), { status: 500 });
  return db.models[name] || db.model(name, RoleMenuSchema);
};

export const InternalUserRoleMenuModel = (connection) => getModel(connection, 'InternalUserRoleMenu');

/**
 * @swagger
 * components:
 *   schemas:
 *     RoleMenu:
 *       type: object
 *       required:
 *         - userId
 *         - roleMenu
 *         - createdBy
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the role menu
 *         userId:
 *           type: string
 *           description: The user ID associated with this role menu
 *         roleMenu:
 *           type: object
 *           description: The menu configuration for the role
 *         visible:
 *           type: boolean
 *           default: true
 *         createdBy:
 *           type: string
 *           description: ID of user who created
 *         updatedBy:
 *           type: string
 *           description: ID of user who last updated
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */