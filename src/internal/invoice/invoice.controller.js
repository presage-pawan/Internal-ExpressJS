import { validateObjectId } from '../../utils/helper.js';
import { InvoiceService } from './invoice.service.js';

export class InvoiceController {
  getService = (req) => new InvoiceService(req.db_type);

  create = async (req, res, next) => {
    try {
      const data = await this.getService(req).create(req.body, req.user?._id || req.user?.id);
      res.status(201).json({ status: true, message: 'Invoice created successfully', data });
    } catch (err) {
      next(err);
    }
  };

  getAll = async (req, res, next) => {
    try {
      const data = await this.getService(req).findAll(req.query);
      res.status(200).json({ status: true, message: 'Invoices fetched successfully', data });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req, res, next) => {
    try {
      const data = await this.getService(req).findById(req.params.id);
      if (!data) {
        throw Object.assign(new Error('Invoice not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Invoice fetched successfully', data });
    } catch (err) {
      next(err);
    }
  };

  getSchedules = async (req, res, next) => {
    try {
      validateObjectId(req.params.id);
      const data = await this.getService(req).getSchedules(req.params.id);
      res.status(200).json({ status: true, message: 'Invoice schedule fetched successfully', data });
    } catch (err) {
      next(err);
    }
  };

  getMonthlyReport = async (req, res, next) => {
    try {
      const data = await this.getService(req).getMonthlyReport(req.query.month);
      res.status(200).json({ status: true, message: 'Monthly revenue report fetched successfully', data });
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const data = await this.getService(req).update(req.params.id, req.body, req.user?._id || req.user?.id);
      if (!data) {
        throw Object.assign(new Error('Invoice not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Invoice updated successfully', data });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      const data = await this.getService(req).delete(req.params.id, req.user?._id || req.user?.id);
      if (!data) {
        throw Object.assign(new Error('Invoice not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Invoice deleted successfully' });
    } catch (err) {
      next(err);
    }
  };
}
