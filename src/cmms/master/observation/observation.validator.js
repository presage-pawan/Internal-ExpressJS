import { body } from 'express-validator';

export const createValidator = [
    body('account_id').optional().isMongoId().withMessage('Invalid account_id'),
];

export const updateValidator = [
    body('account_id').optional().isMongoId(),
];
