import { body, query } from 'express-validator';

export const createRoleMenuValidator = [
    body('account_id')
        .notEmpty().withMessage('account_id is required')
        .isMongoId().withMessage('Invalid account_id'),
    body('user_id')
        .notEmpty().withMessage('user_id is required')
        .isMongoId().withMessage('Invalid user_id'),
    body('data')
        .notEmpty().withMessage('data is required')
        .isObject().withMessage('data must be an object'),
    body('roleMenu')
        .notEmpty().withMessage('roleMenu is required')
        .isObject().withMessage('roleMenu must be an object'),
];

export const updateRoleMenuValidator = [
    body('data')
        .optional()
        .isObject().withMessage('data must be an object'),
    body('roleMenu')
        .optional()
        .isObject().withMessage('roleMenu must be an object'),
];

export const listRoleMenusValidator = [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('user_id').optional().isMongoId().withMessage('Invalid user_id'),
    query('account_id').optional().isMongoId().withMessage('Invalid account_id'),
];
