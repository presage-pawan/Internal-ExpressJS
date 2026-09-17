import { Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     AccountApiKey:
 *       type: object
 *       required:
 *         - account_id
 *         - download_api_key
 *       properties:
 *         account_id:
 *           type: string
 *           description: ID of the account / company
 *         download_api_key:
 *           type: string
 *           description: Download API Key string
 *         type:
 *           type: string
 *           default: download_api_key
 *         visible:
 *           type: boolean
 *           default: true
 *           description: Active (true) or Deactive/Inactive (false)
 */
const accountApiKeySchema = new Schema(
  {
    account_id: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      index: true
    },
    download_api_key: {
      type: String,
      trim: true,
      required: true
    },
    type: {
      type: String,
      trim: true,
      default: 'download_api_key'
    },
    visible: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    collection: 'account_api_key',
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

accountApiKeySchema.index({ account_id: 1, visible: 1 });
accountApiKeySchema.index({ download_api_key: 1 });

export const AccountApiKeyModel = (connection) => {
  if (!connection) throw new Error('Database connection not provided');
  return connection.models.AccountApiKey || connection.model('AccountApiKey', accountApiKeySchema);
};
