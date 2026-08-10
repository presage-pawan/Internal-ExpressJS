import { Schema } from 'mongoose';

const passwordResetOtpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    otpHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    verifiedAt: { type: Date },
    used: { type: Boolean, default: false, index: true },
    usedAt: { type: Date },
    attempts: { type: Number, default: 0 }
  },
  {
    collection: 'PasswordResetOtp',
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret.otpHash;
        return ret;
      }
    }
  }
);

passwordResetOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
passwordResetOtpSchema.index({ email: 1, used: 1, expiresAt: -1 });

export const PasswordResetOtpModel = (connection) => {
  if (!connection) throw Object.assign(new Error('Invalid database connection'), { status: 500 });
  return connection.models.PasswordResetOtp || connection.model('PasswordResetOtp', passwordResetOtpSchema);
};
