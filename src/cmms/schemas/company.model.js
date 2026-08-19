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
 *         encrypt_payload:
 *           type: string
 *           enum: [enabled, disabled]
 *         encrypt_response:
 *           type: string
 *           enum: [enabled, disabled]
 *         subscription:
 *           type: object
 *         fileName:
 *           type: string
 *         visible:
 *           type: boolean
 */
const SubscriptionLimitsSchema = new Schema(
  {
    asset_limit: { type: Number, default: 0 },
    location_limit: { type: Number, default: 0 },
    user_limit: { type: Number, default: 0 }
  },
  { _id: false }
);

const SubscriptionSchema = new Schema(
  {
    limits: {
      type: SubscriptionLimitsSchema,
      default: () => ({ asset_limit: 0, location_limit: 0, user_limit: 0 })
    },
    subscription_type: {
      type: String,
      trim: true,
      enum: ACCOUNT_SUBSCRIPTION_TYPE,
      default: 'free'
    },
    subscription_status: {
      type: String,
      trim: true,
      enum: ACCOUNT_SUBSCRIPTION_STATUS,
      default: 'active'
    },
    subscription_start_date: { type: Date, default: null },
    subscription_end_date: { type: Date, default: null },
    subscription_plan: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

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
    encrypt_payload: { type: String, trim: true, enum: ACCOUNT_FEATURE_STATUS, default: 'enabled' },
    encrypt_response: { type: String, trim: true, enum: ACCOUNT_FEATURE_STATUS, default: 'enabled' },
    account_role_menu: { type: Object, default: {} },
    subscription: {
      type: SubscriptionSchema,
      default: () => ({
        limits: { asset_limit: 0, location_limit: 0, user_limit: 0 },
        subscription_type: 'free',
        subscription_status: 'active',
        subscription_start_date: null,
        subscription_end_date: null,
        subscription_plan: ''
      })
    },
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
AccountSchema.index({ account_status: 1, 'subscription.subscription_status': 1, 'subscription.subscription_type': 1 });

export const AccountModel = (connection) => {
  if (!connection) throw new Error('❌ Database connection not provided');
  return connection.models.Account || connection.model('Account', AccountSchema);
};
