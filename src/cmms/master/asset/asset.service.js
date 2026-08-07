import mongoose from 'mongoose';
import { AssetModel } from '../../schemas/asset.model.js';
import { AccountModel } from '../../schemas/company.model.js';
import { LocationModel } from '../../schemas/location.model.js';
import { MapUserAssetLocationModel } from '../../schemas/map-user-location.model.js';
import { UserModel } from '../../schemas/users.model.js';
import { getConnection } from '../../../_db/index.js';

const ASSET_DETAIL_FIELDS = [
  'asset_name',
  'asset_id',
  'asset_type',
  'asset_model',
  'asset_timezone',
  'asset_build_type',
  'specificFrequency',
  'top_level',
  'locationId',
  'account_id',
  'top_level_asset_id',
  'parent_id',
  'description',
  'manufacturer',
  'year',
  'assigned_to',
  'visible',
  'isBuzzerActive',
  'createdBy',
  'updatedBy',
  'createdAt',
  'updatedAt'
].join(' ');

const RELATED_ASSET_FIELDS = 'asset_name asset_id asset_type asset_model top_level parent_id visible';
const USER_DETAIL_FIELDS = 'firstName lastName username email user_role user_status visible createdAt updatedAt';
const ACCOUNT_DETAIL_FIELDS = [
  'account_name',
  'account_status',
  'type',
  'experience_profile',
  'description',
  'default_language',
  'subscription_plan',
  'subscription_type',
  'subscription_status',
  'subscription_start_date',
  'subscription_end_date',
  'user_limit',
  'location_limit',
  'asset_limit',
  'visible',
  'createdAt',
  'updatedAt'
].join(' ');
const LOCATION_DETAIL_FIELDS = [
  'location_name',
  'description',
  'location_type',
  'top_level',
  'account_id',
  'top_level_location_id',
  'parent_id',
  'parent_name',
  'image_path',
  'top_level_location_image',
  'visible',
  'createdAt',
  'updatedAt'
].join(' ');

const documentId = (document) => document?._id ? String(document._id) : '';
const withStringId = (document) => document ? { ...document, id: documentId(document) } : null;
const indexById = (documents) => new Map(documents.map((document) => [documentId(document), withStringId(document)]));

export class AssetService {

  constructor(dbType = 'production') {
    this.dbType = dbType;
  }

  get connection() {
    return getConnection(this.dbType, 'cmms');
  }

  get model() {
    return AssetModel(this.connection);
  }

  /* ================= CREATE ================= */
  async create(data) {
    const asset = new this.model(data);
    return asset.save();
  }

  /* ================= GET ALL ================= */
  async getAll(filter = {}, options = {}) {
    let query = this.model.find(filter);
    if (options.include) {
      options.include.split(',').forEach(field => {
        query = query.populate(field.trim());
      });
    }
    return query.exec();
  }

  /* ================= GET ENRICHED DETAILS ================= */
  async getDetails(filter = {}) {
    const assets = await this.model.find(filter).select(ASSET_DETAIL_FIELDS).lean().exec();
    if (assets.length === 0) {
      return [];
    }

    const assetIds = assets.map((asset) => asset._id);
    const accountIds = assets.map((asset) => asset.account_id).filter(Boolean);
    const locationIds = assets.map((asset) => asset.locationId).filter(Boolean);
    const relatedAssetIds = assets
      .flatMap((asset) => [asset.parent_id, asset.top_level_asset_id])
      .filter(Boolean);
    const auditUserIds = assets
      .flatMap((asset) => [asset.createdBy, asset.updatedBy])
      .filter(Boolean);

    const [accounts, locations, relatedAssets, childAssets, userMappings, auditUsers] = await Promise.all([
      AccountModel(this.connection).find({ _id: { $in: accountIds } }).select(ACCOUNT_DETAIL_FIELDS).lean().exec(),
      LocationModel(this.connection).find({ _id: { $in: locationIds } }).select(LOCATION_DETAIL_FIELDS).lean().exec(),
      this.model.find({ _id: { $in: relatedAssetIds } }).select(RELATED_ASSET_FIELDS).lean().exec(),
      this.model.find({ parent_id: { $in: assetIds }, visible: { $ne: false } }).select(RELATED_ASSET_FIELDS).lean().exec(),
      MapUserAssetLocationModel(this.connection)
        .find({ assetId: { $in: assetIds }, userId: { $exists: true } })
        .select('assetId userId sendMail alert danger critical createdAt updatedAt')
        .populate({
          path: 'userId',
          select: USER_DETAIL_FIELDS,
          match: { visible: { $ne: false } }
        })
        .lean()
        .exec(),
      UserModel(this.connection).find({ _id: { $in: auditUserIds } }).select(USER_DETAIL_FIELDS).lean().exec()
    ]);

    const accountsById = indexById(accounts);
    const locationsById = indexById(locations);
    const relatedAssetsById = indexById(relatedAssets);
    const auditUsersById = indexById(auditUsers);
    const childAssetsByParent = new Map();
    const mappingsByAsset = new Map();

    childAssets.forEach((childAsset) => {
      const parentId = String(childAsset.parent_id || '');
      const children = childAssetsByParent.get(parentId) || [];
      children.push(withStringId(childAsset));
      childAssetsByParent.set(parentId, children);
    });

    userMappings.forEach((mapping) => {
      if (!mapping.userId) {
        return;
      }
      const assetId = String(mapping.assetId || '');
      const mappings = mappingsByAsset.get(assetId) || [];
      mappings.push({
        id: documentId(mapping),
        user: withStringId(mapping.userId),
        sendMail: mapping.sendMail === true,
        alert: mapping.alert === true,
        danger: mapping.danger === true,
        critical: mapping.critical === true,
        createdAt: mapping.createdAt,
        updatedAt: mapping.updatedAt
      });
      mappingsByAsset.set(assetId, mappings);
    });

    return assets.map((asset) => {
      const id = documentId(asset);
      const user = mappingsByAsset.get(id) || [];
      return {
        ...asset,
        id,
        account: accountsById.get(String(asset.account_id || '')) || null,
        location: locationsById.get(String(asset.locationId || '')) || null,
        parentAsset: relatedAssetsById.get(String(asset.parent_id || '')) || null,
        topLevelAsset: relatedAssetsById.get(String(asset.top_level_asset_id || '')) || null,
        childAssets: childAssetsByParent.get(id) || [],
        user,
        createdByUser: auditUsersById.get(String(asset.createdBy || '')) || null,
        updatedByUser: auditUsersById.get(String(asset.updatedBy || '')) || null
      };
    });
  }

  /* ================= GET BY ID ================= */
  async getById(id, options = {}) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Object.assign(new Error('Invalid asset id'), { status: 400 });
    }

    let query = this.model.findById(id);
    if (options.include) {
      options.include.split(',').forEach(field => {
        query = query.populate(field.trim());
      });
    } else {
      // Default populates for backward compatibility or core needs
      query = query.populate('locationId').populate('parent_id');
    }
    return query.exec();
  }

  /* ================= UPDATE ================= */
  async update(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Object.assign(new Error('Invalid asset id'), { status: 400 });
    }

    return this.model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });
  }

  /* ================= PARTIAL UPDATE ================= */
  async updatePartial(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Object.assign(new Error('Invalid asset id'), { status: 400 });
    }

    return this.model.findByIdAndUpdate(id, { $set: data }, {
      new: true,
      runValidators: true
    });
  }

  /* ================= DELETE (SOFT) ================= */
  async delete(id, updatedBy) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Object.assign(new Error('Invalid asset id'), { status: 400 });
    }

    return this.model.findByIdAndUpdate(
      id,
      { visible: false, updatedBy },
      { new: true }
    );
  }
}
