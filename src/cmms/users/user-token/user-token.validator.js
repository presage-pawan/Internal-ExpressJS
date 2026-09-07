import { body, param, query } from 'express-validator';

export const createTokenValidator = [
    body('_id').trim().notEmpty().withMessage('Token ID (_id) is required'),
    body('ttl').optional().isInt({ min: 1 }).withMessage('ttl must be a positive integer'),
    body('userId').optional().isMongoId().withMessage('Invalid userId'),
    body('account_id').optional().isMongoId().withMessage('Invalid account_id'),
    body('principalType').trim().notEmpty().withMessage('principalType is required'),
    body('tokenType').optional().isIn(['access', 'refresh']).withMessage('tokenType must be access or refresh'),
    body('created').optional().isISO8601().withMessage('created must be a valid date'),
    body('expiresAt').optional().isISO8601().withMessage('expiresAt must be a valid date'),
];

export const listTokensValidator = [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
    query('userId').optional().isMongoId().withMessage('Invalid userId'),
    query('accountId').optional().isMongoId().withMessage('Invalid accountId'),
    query('account_id').optional().isMongoId().withMessage('Invalid account_id'),
    query('principalType').optional().trim().isString(),
    query('tokenType').optional().trim().isString(),
];

export const accountParamValidator = [
    param('accountId').notEmpty().withMessage('accountId is required').isMongoId().withMessage('Invalid accountId'),
];

