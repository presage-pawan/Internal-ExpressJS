import { InternalBlogModel } from '../../schemas/blog.model.js';
import { getConnection } from '../../_db/index.js';

export class BlogService {

  constructor(dbType) {
    this.dbType = dbType;
  }

  get model() {
    const connection = getConnection(this.dbType, 'website');
    return InternalBlogModel(connection);
  }

  async getAll(filter = {}) {
    const blogs = await this.model.find(filter).populate({ path: 'user_id', select: 'firstName lastName username email jobTitle' }).lean();
    return blogs.map(this.mapBlogUser);
  }

  async getById(id) {
    const blog = await this.model.findById(id).populate({ path: 'user_id', select: 'firstName lastName username email jobTitle' }).lean();
    return [blog].map(this.mapBlogUser);
  }

  async create(data, userId) {
    return this.model.create({ ...data, user_id: userId });
  }

  async updateById(id, data) {
    return this.model.findOneAndUpdate({ _id: id }, { $set: data }, { new: true });
  }

  async updatePartial(id, data) {
    return this.model.findOneAndUpdate({ _id: id }, { $set: data }, { new: true });
  }

  async delete(id, updatedBy) {
    return this.model.findOneAndUpdate({ _id: id }, { visible: false, updatedBy }, { new: true });
  }

  mapBlogUser = ({ user_id, ...rest }) => ({
    ...rest,
    id: rest._id,
    user: user_id,
    user_id: user_id?._id
  });
}
