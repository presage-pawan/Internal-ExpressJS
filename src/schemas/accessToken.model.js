import { Schema } from 'mongoose';

const AccessTokenSchema = new Schema(
  {
    _id: { type: String, required: true, trim: true },
    ttl: { type: Number, required: true },
    created: { type: Date, required: true, default: Date.now },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  },
  {
    collection: 'AccessToken',
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
  return db.models[name] || db.model(name, AccessTokenSchema);
};

export const WebsiteAccessTokenModel = (connection) => {
  if (!connection) throw new Error('DB connection not provided to WebsiteAccessTokenModel');
  return getModel(connection, 'AccessTokenSchema');
};

const getModelInstance = (connection) => WebsiteAccessTokenModel(connection);

export const getAccessTokenByToken = (token, connection) => {
  return getModelInstance(connection).findById(token).lean().exec();
};

export const createAccessToken = async (payload, connection) => {
  const AccessToken = getModelInstance(connection);
  return AccessToken.create(payload);
};

export const deleteAccessTokenByToken = (token, connection) => {
  return getModelInstance(connection).deleteOne({ _id: token });
};

export const deleteAccessTokenByUserId = (userId, connection) => {
  return getModelInstance(connection).deleteMany({ userId });
};