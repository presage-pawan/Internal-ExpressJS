import { SalesLeadService } from './sales-lead.service.js';

export class SalesLeadController {
  getService = (req) => new SalesLeadService(req.db_type);

  getAll = async (req, res, next) => {
    try {
      const data = await this.getService(req).findAll(req.user, req.query);
      res.status(200).json({ status: true, message: 'Sales leads fetched successfully', data });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const data = await this.getService(req).findById(req.params.id, req.user);
      if (!data) throw Object.assign(new Error('Sales lead not found'), { status: 404 });
      res.status(200).json({ status: true, message: 'Sales lead fetched successfully', data });
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const data = await this.getService(req).create(req.body, req.user);
      res.status(201).json({ status: true, message: 'Sales lead created successfully', data });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const data = await this.getService(req).update(req.params.id, req.body, req.user);
      if (!data) throw Object.assign(new Error('Sales lead not found'), { status: 404 });
      res.status(200).json({ status: true, message: 'Sales lead updated successfully', data });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const data = await this.getService(req).delete(req.params.id, req.user);
      if (!data) throw Object.assign(new Error('Sales lead not found'), { status: 404 });
      res.status(200).json({ status: true, message: 'Sales lead deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
