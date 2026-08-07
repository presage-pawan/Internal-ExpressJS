import { Schema } from 'mongoose';
import { AccountModel } from './company.model.js';
import { UserModel } from './users.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       required:
 *         - location_name
 *         - location_type
 *         - top_level
 *         - account_id
 *         - createdBy
 *       properties:
 *         location_name:
 *           type: string
 *         description:
 *           type: string
 *         location_type:
 *           type: string
 *         top_level:
 *           type: boolean
 *         account_id:
 *           type: string
 *         parent_id:
 *           type: string
 *         visible:
 *           type: boolean
 */
const LocationSchema = new Schema(
  {
    location_name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    location_type: { type: String, trim: true, required: true },
    top_level: { type: Boolean, required: true },
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    top_level_location_id: { type: Schema.Types.ObjectId, ref: 'Location' },
    parent_id: { type: Schema.Types.ObjectId, ref: 'Location' },
    parent_name: { type: String, trim: true },
    image_path: { type: String, trim: true },
    top_level_location_image: { type: String, trim: true },
    visible: { type: Boolean, required: true, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  {
    collection: 'location_master',
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

export const LocationModel = (connection) => {
  if (!connection) throw new Error('Database connection not provided');

  // Register dependencies
  if (!connection.models.Account) AccountModel(connection);
  if (!connection.models.User) UserModel(connection);

  return connection.models.Location || connection.model('Location', LocationSchema);
};
