import { Schema } from 'mongoose';

const PrivateUploadSchema = new Schema({
  file_name: { type: String, required: true, trim: true },
  folder_name: { type: String, default: '', trim: true },
  owner_user_id: { type: Schema.Types.ObjectId, ref: 'InternalUser', required: true, index: true },
  company_id: { type: Schema.Types.ObjectId, index: true },
  environment: { type: String, enum: ['production', 'staging'], default: 'production', index: true },
  mime_type: { type: String, trim: true },
  size: { type: Number, min: 0, default: 0 },
  visibility: { type: String, enum: ['private'], default: 'private' },
  visible: { type: Boolean, default: true }
}, {
  collection: 'internal_private_upload',
  timestamps: true,
  versionKey: false
});

PrivateUploadSchema.index(
  { folder_name: 1, file_name: 1 },
  { unique: true, partialFilterExpression: { visible: true } }
);

export const PrivateUploadModel = (connection) => {
  if (!connection) throw new Error('Database connection not provided');
  return connection.models.InternalPrivateUpload
    || connection.model('InternalPrivateUpload', PrivateUploadSchema);
};
