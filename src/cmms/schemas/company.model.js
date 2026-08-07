import { Schema } from 'mongoose';
import { production_cmms_db, staging_cmms_db } from '../../_db/index.js';

export const ACCOUNT_STATUS = ['active', 'inactive'];
export const EXPERIENCE_PROFILES = ['standard_account', 'oem'];
export const ACCOUNT_FEATURE_STATUS = ['enabled', 'disabled'];
export const ACCOUNT_SUBSCRIPTION_TYPE = ['free', 'trial', 'monthly', 'yearly', 'one_time', 'lifetime'];
export const ACCOUNT_SUBSCRIPTION_STATUS = ['active', 'inactive', 'expired', 'cancelled', 'suspended'];

export const defaultSubscriptionLimitData = {
  trial: { user_limit: 5, location_limit: 5, asset_limit: 5 },
  monthly: { user_limit: 25, location_limit: 25, asset_limit: 25 },
  yearly: { user_limit: 100, location_limit: 100, asset_limit: 100 },
  free: { user_limit: 0, location_limit: 0, asset_limit: 0 },
  one_time: { user_limit: 0, location_limit: 0, asset_limit: 0 },
  lifetime: { user_limit: 0, location_limit: 0, asset_limit: 0 }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Account:
 *       type: object
 *       required:
 *         - account_name
 *       properties:
 *         account_name:
 *           type: string
 *         account_status:
 *           type: string
 *           enum: [active, inactive]
 *         type:
 *           type: string
 *         description:
 *           type: string
 *         experience_profile:
 *           type: string
 *           enum: [standard_account, oem]
 *         cookie_status:
 *           type: string
 *           enum: [enabled, disabled]
 *         redis_status:
 *           type: string
 *           enum: [enabled, disabled]
 *         encrypt_payload:
 *           type: string
 *           enum: [enabled, disabled]
 *         encrypt_response:
 *           type: string
 *           enum: [enabled, disabled]
 *         account_role_menu:
 *           type: object
 *         account_permission_version:
 *           type: number
 *         subscription_plan:
 *           type: string
 *         subscription_type:
 *           type: string
 *           enum: [free, trial, monthly, yearly, one_time, lifetime]
 *         subscription_start_date:
 *           type: string
 *           format: date-time
 *         subscription_end_date:
 *           type: string
 *           format: date-time
 *         subscription_status:
 *           type: string
 *           enum: [active, inactive, expired, cancelled, suspended]
 *         user_limit:
 *           type: number
 *         location_limit:
 *           type: number
 *         asset_limit:
 *           type: number
 *         fileName:
 *           type: string
 *         visible:
 *           type: boolean
 */
const AccountSchema = new Schema(
  {
    account_name: { type: String, required: true, trim: true },
    account_status: { type: String, enum: ACCOUNT_STATUS, default: 'active' },
    type: { type: String, trim: true, required: true },
    experience_profile: { type: String, trim: true, enum: EXPERIENCE_PROFILES, default: 'standard_account' },
    description: { type: String, trim: true },
    fileName: { type: String, trim: true },
    default_language: { type: String, trim: true, default: 'en' },
    cookie_status: { type: String, trim: true, enum: ACCOUNT_FEATURE_STATUS, default: 'enabled' },
    redis_status: { type: String, trim: true, enum: ACCOUNT_FEATURE_STATUS, default: 'enabled' },
    encrypt_payload: { type: String, trim: true, enum: ACCOUNT_FEATURE_STATUS, default: 'enabled' },
    encrypt_response: { type: String, trim: true, enum: ACCOUNT_FEATURE_STATUS, default: 'enabled' },
    account_role_menu: { type: Object, default: {} },
    account_permission_version: { type: Number, default: 1 },
    account_role_menu_schema_version: { type: Number, default: 2 },
    account_role_menu_updated_by: { type: Schema.Types.ObjectId, ref: 'InternalUser' },
    account_role_menu_updated_at: { type: Date },
    subscription_plan: { type: String, trim: true },
    subscription_type: { type: String, trim: true, enum: ACCOUNT_SUBSCRIPTION_TYPE, default: ACCOUNT_SUBSCRIPTION_TYPE[0] },
    subscription_start_date: { type: Date },
    subscription_end_date: { type: Date },
    subscription_status: { type: String, trim: true, enum: ACCOUNT_SUBSCRIPTION_STATUS, default: ACCOUNT_SUBSCRIPTION_STATUS[0] },
    user_limit: { type: Number, default: 0 },
    location_limit: { type: Number, default: 0 },
    asset_limit: { type: Number, default: 0 },
    visible: { type: Boolean, default: true }
  },
  {
    collection: 'account_master',
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

AccountSchema.index({ account_name: 1 });
AccountSchema.index({ account_status: 1, subscription_status: 1, subscription_type: 1 });

export const AccountModel = (connection) => {
  if (!connection) throw new Error('❌ Database connection not provided');
  return connection.models.Account || connection.model('Account', AccountSchema);
};
