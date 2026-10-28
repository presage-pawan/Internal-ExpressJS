import { validateObjectId } from '../../../utils/helper.js';
import { bindCompanyPayload } from '../../tenant-payload.js';
import { AssetService } from './asset.service.js';

export class AssetController {

  getService = (req) => {
    return new AssetService(req.db_type);
  };

  getAll = async (req, res, next) => {
    try {
      const filter = {};
      const { companyId, query: { assetIds, include } } = req;
      if (companyId) {
        filter.account_id = validateObjectId(companyId);
      }
      if (assetIds) {
        filter._id = {
          $in: assetIds
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
            .map((id) => validateObjectId(id))
        };
      }
      const service = this.getService(req);
      const assets = assetIds
        ? await service.getDetails(filter)
        : await service.getAll(filter, { include });
      if (!assets || assets.length === 0) {
        throw Object.assign(new Error('Assets not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Assets fetched successfully', data: assets });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { include } = req.query;
      const asset = await this.getService(req).getById(id, { include, companyId: req.companyId });
      if (!asset) {
        throw Object.assign(new Error('Asset not found'), { status: 404 });
      }
      res.status(200).json({ status: true, data: asset });
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const asset = await this.getService(req).create({ ...bindCompanyPayload(req.body, req.companyId, 'account_id'), createdBy: req.user.id });
      if (!asset) {
        throw Object.assign(new Error('Asset not found'), { status: 404 });
      }
      res.status(201).json({ status: true, message: 'Asset created successfully', data: asset });
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const asset = await this.getService(req).update(validateObjectId(req.params.id), { ...bindCompanyPayload(req.body, req.companyId, 'account_id'), updatedBy: req.user.id }, req.companyId);
      if (!asset) {
        throw Object.assign(new Error('Asset not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Asset updated successfully', data: asset });
    } catch (err) {
      next(err);
    }
  };

  updatePartial = async (req, res, next) => {
    try {
      const asset = await this.getService(req).updatePartial(validateObjectId(req.params.id), { ...bindCompanyPayload(req.body, req.companyId, 'account_id'), updatedBy: req.user.id }, req.companyId);
      if (!asset) {
        throw Object.assign(new Error('Asset not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Asset updated successfully', data: asset });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      const asset = await this.getService(req).delete(validateObjectId(req.params.id), req.user.id, req.companyId);
      if (!asset) {
        throw Object.assign(new Error('Asset not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Asset deleted successfully' });
    } catch (err) {
      next(err);
    }
  };
}
