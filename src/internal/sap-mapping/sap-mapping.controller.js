import { SapMappingService } from './sap-mapping.service.js';

export class SapMappingController {
  getService = (req) => new SapMappingService(req.db_type);

  list = async (req, res, next) => {
    try {
      const result = await this.getService(req).list(req.query);
      res.status(200).json({ status: true, message: 'SAP mappings fetched successfully', ...result });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const data = await this.getService(req).getById(req.params.id);
      if (!data) throw Object.assign(new Error('SAP mapping not found'), { status: 404 });
      res.status(200).json({ status: true, message: 'SAP mapping fetched successfully', data });
    } catch (error) {
      next(error);
    }
  };

  listAccounts = async (req, res, next) => {
    try {
      const data = await this.getService(req).listAccounts(req.query.search || '');
      res.status(200).json({ status: true, message: 'CMMS accounts fetched successfully', data });
    } catch (error) {
      next(error);
    }
  };

  listUsers = async (req, res, next) => {
    try {
      const data = await this.getService(req).listUsers(req.query);
      res.status(200).json({ status: true, message: 'CMMS users fetched successfully', data });
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const data = await this.getService(req).create(req.body, req.user.id);
      res.status(201).json({ status: true, message: 'SAP mapping created successfully', data });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const data = await this.getService(req).update(req.params.id, req.body, req.user.id);
      if (!data) throw Object.assign(new Error('SAP mapping not found'), { status: 404 });
      res.status(200).json({ status: true, message: 'SAP mapping updated successfully', data });
    } catch (error) {
      next(error);
    }
  };

  remove = async (req, res, next) => {
    try {
      const data = await this.getService(req).remove(req.params.id);
      if (!data) throw Object.assign(new Error('SAP mapping not found'), { status: 404 });
      res.status(200).json({ status: true, message: 'SAP mapping deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
