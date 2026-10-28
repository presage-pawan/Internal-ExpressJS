import { validateObjectId } from '../../../utils/helper.js';
import { bindCompanyPayload } from '../../tenant-payload.js';
import { LocationService } from './location.service.js';

export class LocationController {

  getService = (req) => new LocationService(req.db_type);

  /* ================= GET ALL ================= */
  getAll = async (req, res, next) => {
    try {
      const { companyId, query: { include } } = req;
      const filter = { visible: { $ne: false } };
      if (companyId) {
        filter.account_id = companyId;
      }
      const locations = await this.getService(req).getAll(filter, { include });
      if (!locations || locations.length === 0) {
        throw Object.assign(new Error('Locations not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Locations fetched successfully', data: locations });
    } catch (err) {
      next(err);
    }
  }

  /* ================= GET BY ID ================= */
  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { include } = req.query;
      const location = await this.getService(req).getById(id, { include, companyId: req.companyId });
      if (!location) {
        throw Object.assign(new Error('Location not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Location fetched successfully', data: location });
    } catch (err) {
      next(err);
    }
  }

  /* ================= CREATE ================= */
  create = async (req, res, next) => {
    try {
      const location = await this.getService(req).create({ ...bindCompanyPayload(req.body, req.companyId, 'account_id'), createdBy: req.user.id });
      if (!location) {
        throw Object.assign(new Error('Location not found'), { status: 404 });
      }
      res.status(201).json({ status: true, message: 'Location created successfully', data: location });
    } catch (err) {
      next(err);
    }
  }

  /* ================= UPDATE ================= */
  update = async (req, res, next) => {
    try {
      const location = await this.getService(req).update(validateObjectId(req.params.id), { ...bindCompanyPayload(req.body, req.companyId, 'account_id'), updatedBy: req.user.id }, req.companyId);
      if (!location) {
        throw Object.assign(new Error('Location not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Location updated successfully', data: location });
    } catch (err) {
      next(err);
    }
  }

  /* ================= PARTIAL UPDATE ================= */
  updatePartial = async (req, res, next) => {
    try {
      const location = await this.getService(req).updatePartial(validateObjectId(req.params.id), { ...bindCompanyPayload(req.body, req.companyId, 'account_id'), updatedBy: req.user.id }, req.companyId);
      if (!location) {
        throw Object.assign(new Error('Location not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Location updated successfully', data: location });
    } catch (err) {
      next(err);
    }
  }

  /* ================= DELETE ================= */
  delete = async (req, res, next) => {
    try {
      const location = await this.getService(req).delete(validateObjectId(req.params.id), req.user.id, req.companyId);
      if (!location) {
        throw Object.assign(new Error('Location not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Location deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
