import { validateObjectId } from '../../utils/helper.js';
import { BlogService } from './blog.service.js';

export class BlogController {

  getService = (req) => new BlogService(req.db_type);

  getAll = async (req, res, next) => {
    try {
      let filter = {};
      if (req.originalUrl.includes('public')) {
        filter.visible = true;
      }
      const blogs = await this.getService(req).getAll(filter);
      if (!blogs || blogs.length === 0) {
        throw Object.assign(new Error('Blogs not found'), { status: 404 });
      }
      res.json({ status: true, message: 'Blogs fetched successfully', data: blogs });
    } catch (err) {
      next(err);
    }
  }

  getById = async (req, res, next) => {
    try {
      let filter = {};
      if (req.originalUrl.includes('public')) {
        filter.visible = true;
      }
      filter._id = validateObjectId(req.params.id);
      const blog = await this.getService(req).getAll(filter);
      if (!blog) {
        throw Object.assign(new Error('Blog not found'), { status: 404 });
      }
      res.json({ status: true, message: 'Blog fetched successfully', data: blog });
    } catch (err) {
      next(err);
    }
  }

  create = async (req, res, next) => {
    try {
      const blog = await this.getService(req).create(req.body, req.user.id);
      if (!blog) {
        throw Object.assign(new Error('Blog not found'), { status: 404 });
      }
      res.status(201).json({ status: true, message: 'Blog created successfully', data: blog });
    } catch (err) {
      next(err);
    }
  }

  update = async (req, res, next) => {
    try {
      const blog = await this.getService(req).updateById(validateObjectId(req.params.id), req.body);
      if (!blog) {
        throw Object.assign(new Error('Blog not found'), { status: 404 });
      }
      res.json({ status: true, message: 'Blog updated successfully', data: blog });
    } catch (err) {
      next(err);
    }
  }

  updatePartial = async (req, res, next) => {
    try {
      const blog = await this.getService(req).updatePartial(validateObjectId(req.params.id), req.body);
      res.json({ status: true, message: 'Blog updated successfully', data: blog });
    } catch (err) {
      next(err);
    }
  }

  delete = async (req, res, next) => {
    try {
      const blog = await this.getService(req).delete(validateObjectId(req.params.id), req.user?.id);
      if (!blog) {
        throw Object.assign(new Error('Blog not found'), { status: 404 });
      }
      res.json({ status: true, message: 'Blog deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
