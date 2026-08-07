import { body, query } from 'express-validator';

export const createUserLogValidator = [
    body('method').trim().notEmpty().withMessage('method is required'),
    body('module').trim().notEmpty().withMessage('module is required'),
    body('description').trim().notEmpty().withMessage('description is required'),
    body('statusCode').isInt({ min: 100, max: 599 }).withMessage('statusCode must be a valid HTTP status code'),
    body('requestUrl').trim().notEmpty().withMessage('requestUrl is required'),
    body('host').trim().notEmpty().withMessage('host is required'),
    body('hostName').trim().notEmpty().withMessage('hostName is required'),
    body('protocol').trim().notEmpty().withMessage('protocol is required'),
    body('port').isInt({ min: 1, max: 65535 }).withMessage('port must be a valid port number'),
    body('ipAddress').trim().notEmpty().withMessage('ipAddress is required'),
    body('userAgent').trim().notEmpty().withMessage('userAgent is required'),
    body('account_id').optional().isMongoId().withMessage('Invalid account_id'),
    body('userId').optional().isMongoId().withMessage('Invalid userId'),
];

export const listUserLogsValidator = [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
    query('userId').optional().isMongoId().withMessage('Invalid userId'),
    query('account_id').optional().isMongoId().withMessage('Invalid account_id'),
    query('statusCode').optional().isInt({ min: 100, max: 599 }).toInt(),
    query('method').optional().trim().isString(),
    query('module').optional().trim().isString(),
    query('from').optional().isISO8601().withMessage('from must be a valid date (ISO 8601)'),
    query('to').optional().isISO8601().withMessage('to must be a valid date (ISO 8601)'),
];
