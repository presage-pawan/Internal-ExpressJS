import { body } from 'express-validator';

export const createPartValidator = [
    body('account_id').notEmpty().withMessage('Account ID is required').isMongoId(),
    body('part_name').trim().notEmpty().withMessage('Part Name is required'),
    body('part_number').trim().notEmpty().withMessage('Part Number is required'),
    body('part_type').trim().notEmpty().withMessage('Part Type is required'),
    body('unit').trim().notEmpty().withMessage('Unit is required'),
    body('description').optional().trim().isString(),
    body('quantity').isNumeric().withMessage('Quantity must be a number'),
    body('min_quantity').isNumeric().withMessage('Min Quantity must be a number'),
    body('cost').isNumeric().withMessage('Cost must be a number'),
    body('location_id').notEmpty().withMessage('Location ID is required').isMongoId(),
    body('visible').optional().isBoolean(),
];

export const updatePartValidator = [
    body('account_id').optional().isMongoId(),
    body('part_name').optional().trim().notEmpty(),
    body('part_number').optional().trim().notEmpty(),
    body('part_type').optional().trim().notEmpty(),
    body('unit').optional().trim().notEmpty(),
    body('description').optional().trim().isString(),
    body('quantity').optional().isNumeric(),
    body('min_quantity').optional().isNumeric(),
    body('cost').optional().isNumeric(),
    body('location_id').optional().isMongoId(),
    body('visible').optional().isBoolean(),
];
