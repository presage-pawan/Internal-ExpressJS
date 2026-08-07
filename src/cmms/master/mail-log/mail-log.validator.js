import { body } from 'express-validator';

export const createValidator = [
    body('account_id').optional().isMongoId().withMessage('Invalid account_id'),
    // Add other required fields here based on schema
];

export const updateValidator = [
    body('account_id').optional().isMongoId(),
];
