import { Schema } from 'mongoose';
import { AccountModel } from './company.model.js';
import { UserModel } from './users.model.js';
import { LocationModel } from './location.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     Asset:
 *       type: object
 *       required:
 *         - asset_name
 *         - asset_id
 *         - asset_type
 *         - locationId
 *         - account_id
 *         - createdBy
 *       properties:
 *         asset_name:
 *           type: string
 *         asset_id:
 *           type: string
 *         asset_type:
 *           type: string
 *         asset_model:
 *           type: string
 *         asset_timezone:
 *           type: string
 *         locationId:
 *           type: string
 *         account_id:
 *           type: string
 *         description:
 *           type: string
 *         visible:
 *           type: boolean
 */
const AssetSchema = new Schema(
  {
    asset_name: { type: String, required: true, trim: true },
    asset_id: { type: String, required: true, trim: true, index: true },
    asset_type: { type: String, required: true },
    asset_model: { type: String, default: '' },
    asset_timezone: { type: String, default: 'Asia/Calcutta' },
    asset_build_type: { type: String },
    specificFrequency: { type: [Number], default: [] },

    top_level: { type: Boolean, default: false },

    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true },

    top_level_asset_id: { type: Schema.Types.ObjectId, ref: 'Asset', default: null },
    parent_id: { type: Schema.Types.ObjectId, ref: 'Asset', default: null },

    description: { type: String, default: '' },
    manufacturer: { type: String, default: '' },
    year: { type: String, default: '' },

    assigned_to: { type: Number, default: 0 },

    visible: { type: Boolean, default: true },
    isBuzzerActive: { type: Boolean, default: false },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  {
    collection: 'asset_master',
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

/* ================= MODEL FACTORY ================= */
export const AssetModel = (connection) => {
  if (!connection) throw new Error('Invalid database connection');

  // Register dependencies
  if (!connection.models.Account) AccountModel(connection);
  if (!connection.models.User) UserModel(connection);
  if (!connection.models.Location) LocationModel(connection);

  return connection.models.Asset || connection.model('Asset', AssetSchema);
};
