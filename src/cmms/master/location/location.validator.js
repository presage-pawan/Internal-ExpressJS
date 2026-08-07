import { body } from 'express-validator';

export const createLocationValidator = [
    body('location_name').trim().notEmpty().withMessage('Location Name is required'),
    body('location_type').trim().notEmpty().withMessage('Location Type is required'),
    body('top_level').isBoolean().withMessage('Top Level must be a boolean'),
    body('account_id').notEmpty().withMessage('Account ID is required').isMongoId().withMessage('Invalid Account ID'),
    body('top_level_location_id').optional().isMongoId(),
    body('parent_id').optional().isMongoId(),
    body('parent_name').optional().trim().isString(),
    body('image_path').optional().trim().isString(),
    body('top_level_location_image').optional().trim().isString(),
    body('visible').optional().isBoolean(),
];

export const updateLocationValidator = [
    body('location_name').optional().trim().notEmpty(),
    body('location_type').optional().trim().notEmpty(),
    body('top_level').optional().isBoolean(),
    body('account_id').optional().isMongoId(),
    body('top_level_location_id').optional().isMongoId(),
    body('parent_id').optional().isMongoId(),
    body('parent_name').optional().trim().isString(),
    body('image_path').optional().trim().isString(),
    body('top_level_location_image').optional().trim().isString(),
    body('visible').optional().isBoolean(),
];
