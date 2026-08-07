import { Schema } from 'mongoose';
import { InternalUserModel } from './users.model.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     Blog:
 *       type: object
 *       required:
 *         - title
 *         - user_id
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *         feature:
 *           type: boolean
 *         visible:
 *           type: boolean
 *         files:
 *           type: array
 *           items:
 *             type: object
 *         user_id:
 *           type: string
 */
const InternalBlogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String },
    feature: { type: Boolean, default: false },
    visible: { type: Boolean, default: false },
    files: { type: Array },
    user_id: { type: Schema.Types.ObjectId, ref: 'InternalUser', required: true },
    createdOn: { type: Date, default: Date.now }
  },
  {
    collection: 'blogs',
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

export const InternalBlogModel = (connection) => {
  if (!connection) throw new Error('DB connection not provided to InternalBlogModel');

  // Explicitly register InternalUser to ensure validation/population works
  if (!connection.models.InternalUser) {
    InternalUserModel(connection);
  }

  return connection.models.InternalBlog || connection.model('InternalBlog', InternalBlogSchema);
};
