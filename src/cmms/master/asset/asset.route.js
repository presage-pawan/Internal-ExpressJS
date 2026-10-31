import { Router } from 'express';
import { AssetController } from './asset.controller.js';
import { auth } from '../../../auth.js';
import { validate } from '../../../middlewares/validate.js';
import { createAssetValidator, updateAssetValidator } from './asset.validator.js';

const router = Router();
const controller = new AssetController();

/**
 * @swagger
 * tags:
 *   name: Assets
 *   description: Asset management (Master)
 */

/**
 * @swagger
 * /api/cmms/master/assets:
 *   get:
 *     summary: Get all assets
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assetIds
 *         schema:
 *           type: string
 *         description: Comma-separated asset IDs. When supplied, related account, location, hierarchy and assigned-user details are included.
 *     responses:
 *       200:
 *         description: List of assets
 */
router.route('/')
  .get(auth, controller.getAll)
  /**
   * @swagger
   * /api/cmms/master/assets:
   *   post:
   *     summary: Create a new asset
   *     tags: [Assets]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Asset'
   *     responses:
   *       201:
   *         description: Asset created
   */
  .post(auth, createAssetValidator, validate, controller.create);

/**
 * @swagger
 * /api/cmms/master/assets/{id}:
 *   get:
 *     summary: Get asset by ID
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Asset details
 */
router.get('/:id/reliability',auth,controller.getReliability);

router.route('/:id')
  .get(auth, controller.getById)
  /**
   * @swagger
   * /api/cmms/master/assets/{id}:
   *   put:
   *     summary: Update asset (Full)
   *     tags: [Assets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Asset updated
   */
  .put(auth, updateAssetValidator, validate, controller.update)
  /**
   * @swagger
   * /api/cmms/master/assets/{id}:
   *   patch:
   *     summary: Update asset (Partial)
   *     tags: [Assets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Asset updated
   */
  .patch(auth, updateAssetValidator, validate, controller.updatePartial)
  /**
   * @swagger
   * /api/cmms/master/assets/{id}:
   *   delete:
   *     summary: Delete asset
   *     tags: [Assets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Asset deleted
   */
  .delete(auth, controller.delete);

export default router;
