import { Schema } from 'mongoose';

export const STATUS = ['active', 'inactive'];
export const ROLE = ['admin', 'manager', 'employee'];

const UserSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false, maxlength: 200 },
    phone_no: { type: String, trim: true, unique: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    emailStatus: { type: Boolean, default: false },
    user_status: { type: String, default: 'active', enum: STATUS },
    user_role: { type: String, default: 'employee', enum: ROLE, lowercase: true, trim: true },
    jobTitle: { type: String },
    about: { type: String },
    blogs: [{ type: Schema.Types.ObjectId, ref: 'InternalBlogSchema' }],
    accessTokens: [{ type: Schema.Types.ObjectId, ref: 'CustomAccessToken' }],
    visible: { type: Boolean, default: true }
  },
  {
    collection: 'User',
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

UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 });

const getModel = (db, name) => {
  if (!db) throw Object.assign(new Error('Invalid database connection'), { status: 500 });
  return db.models[name] || db.model(name, UserSchema);
};

export const InternalUserModel = (connection) => getModel(connection, 'InternalUser');