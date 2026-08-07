import { body } from 'express-validator';

export const createAssetValidator = [
    body('asset_name').trim().notEmpty().withMessage('Asset Name is required'),
    body('asset_id').trim().notEmpty().withMessage('Asset ID is required'),
    body('asset_type').trim().notEmpty().withMessage('Asset Type is required'),
    body('locationId').notEmpty().withMessage('Location ID is required').isMongoId(),
    body('account_id').notEmpty().withMessage('Account ID is required').isMongoId(),
    body('top_level').optional().isBoolean(),
    body('parent_id').optional().isMongoId(),
    body('description').optional().trim().isString(),
    body('manufacturer').optional().trim().isString(),
    body('year').optional().trim().isString(),
    body('assigned_to').optional().isNumeric(),
    body('isBuzzerActive').optional().isBoolean(),
    body('visible').optional().isBoolean(),
];

export const updateAssetValidator = [
    body('asset_name').optional().trim().notEmpty(),
    body('asset_id').optional().trim().notEmpty(),
    body('asset_type').optional().trim().notEmpty(),
    body('locationId').optional().isMongoId(),
    body('account_id').optional().isMongoId(),
    body('top_level').optional().isBoolean(),
    body('parent_id').optional().isMongoId(),
    body('description').optional().trim().isString(),
    body('manufacturer').optional().trim().isString(),
    body('year').optional().trim().isString(),
    body('assigned_to').optional().isNumeric(),
    body('isBuzzerActive').optional().isBoolean(),
    body('visible').optional().isBoolean(),
];
