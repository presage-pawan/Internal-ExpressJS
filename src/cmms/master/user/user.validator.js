import { body } from 'express-validator';
import { normalizeExpiryUpdate } from './password-expiry.js';

export const createMasterUserValidator = [
    body('firstName').trim().notEmpty().withMessage('First Name is required'),
    body('lastName').optional().trim().isString(),
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').trim().notEmpty().withMessage('Password is required'),
    body('email').trim().notEmpty().withMessage('Email is required').isEmail(),
    body('account_id').notEmpty().withMessage('Account ID is required').isMongoId(),
    body('user_status').optional().isIn(['active', 'inactive']),
    body('user_role').optional().isIn(['admin', 'manager', 'employee', 'customer', 'user']),
    body('phone_no').notEmpty().withMessage('Phone number object is required').isObject(),
    body('phone_no.countryCode').optional().isString(),
    body('phone_no.number').optional().isString(),
];

export const updateMasterUserValidator = [
    body().custom(value => { normalizeExpiryUpdate(value); return true; }),
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().isString(),
    body('username').optional().trim().notEmpty(),
    body('password').optional().trim().notEmpty(),
    body('email').optional().trim().isEmail(),
    body('account_id').optional().isMongoId(),
    body('user_status').optional().isIn(['active', 'inactive']),
    body('user_role').optional().isIn(['admin', 'manager', 'employee', 'customer', 'user']),
    body('phone_no').optional().isObject(),
];
