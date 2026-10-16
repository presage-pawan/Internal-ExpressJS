import { Schema } from 'mongoose';

const SapUserMappingSchema = new Schema(
  {
    sapAccountId: { type: String, required: true, trim: true, maxlength: 200 },
    sapAccountName: { type: String, trim: true, maxlength: 300, default: '' },
    sapUserId: { type: String, required: true, trim: true, maxlength: 200 },
    sapUserName: { type: String, trim: true, maxlength: 300, default: '' },
    sapUserEmail: { type: String, trim: true, lowercase: true, maxlength: 320, default: '' },
    cmmsAccountId: { type: Schema.Types.ObjectId, required: true },
    cmmsAccountName: { type: String, trim: true, maxlength: 300, default: '' },
    cmmsUserId: { type: Schema.Types.ObjectId, required: true },
    cmmsUserName: { type: String, trim: true, maxlength: 300, default: '' },
    cmmsUserEmail: { type: String, trim: true, lowercase: true, maxlength: 320, default: '' },
    dbType: { type: String, enum: ['staging', 'production'], required: true },
    active: { type: Boolean, default: true },
    notes: { type: String, trim: true, maxlength: 1000, default: '' },
    createdBy: { type: Schema.Types.ObjectId, required: true },
    updatedBy: { type: Schema.Types.ObjectId, required: true }
  },
  {
    collection: 'sap_user_mappings',
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

SapUserMappingSchema.index(
  { sapAccountId: 1, sapUserId: 1 },
  { unique: true, name: 'unique_sap_account_user' }
);
SapUserMappingSchema.index({ cmmsAccountId: 1, cmmsUserId: 1 });
SapUserMappingSchema.index({ active: 1, updatedAt: -1 });

export const SapUserMappingModel = (connection) => {
  if (!connection) throw new Error('Invalid database connection');
  return connection.models.SapUserMapping
    || connection.model('SapUserMapping', SapUserMappingSchema);
};
