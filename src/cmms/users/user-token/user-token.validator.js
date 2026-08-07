import { body, query } from 'express-validator';

export const createTokenValidator = [
    body('_id').trim().notEmpty().withMessage('Token ID (_id) is required'),
    body('ttl').isInt({ min: 1 }).withMessage('ttl must be a positive integer'),
    body('userId').notEmpty().withMessage('userId is required').isMongoId().withMessage('Invalid userId'),
    body('principalType').trim().notEmpty().withMessage('principalType is required'),
    body('created').optional().isISO8601().withMessage('created must be a valid date'),
];

export const listTokensValidator = [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('userId').optional().isMongoId().withMessage('Invalid userId'),
    query('principalType').optional().trim().isString(),
];
