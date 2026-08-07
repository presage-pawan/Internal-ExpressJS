import { body, query } from 'express-validator';

// ─── Enums (must match users.model.js) ────────────────────────────────────────
const STATUS_VALUES = ['active', 'inactive'];
const ROLE_VALUES   = ['admin', 'manager', 'employee', 'customer', 'user'];

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createUserValidator = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required'),

    body('lastName')
        .optional()
        .trim()
        .isString(),

    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isAlphanumeric().withMessage('Username must be alphanumeric'),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('phone_no')
        .notEmpty().withMessage('Phone number is required'),

    body('account_id')
        .notEmpty().withMessage('Account ID is required')
        .isMongoId().withMessage('Invalid Account ID format'),

    body('user_status')
        .optional()
        .isIn(STATUS_VALUES).withMessage(`Status must be one of: ${STATUS_VALUES.join(', ')}`),

    body('user_role')
        .optional()
        .isIn(ROLE_VALUES).withMessage(`Role must be one of: ${ROLE_VALUES.join(', ')}`),
];

// ─── FULL UPDATE (PUT) ────────────────────────────────────────────────────────
export const updateUserValidator = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required'),

    body('lastName')
        .optional()
        .trim()
        .isString(),

    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isAlphanumeric().withMessage('Username must be alphanumeric'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('phone_no')
        .notEmpty().withMessage('Phone number is required'),

    body('account_id')
        .notEmpty().withMessage('Account ID is required')
        .isMongoId().withMessage('Invalid Account ID format'),

    body('user_status')
        .optional()
        .isIn(STATUS_VALUES).withMessage(`Status must be one of: ${STATUS_VALUES.join(', ')}`),

    body('user_role')
        .optional()
        .isIn(ROLE_VALUES).withMessage(`Role must be one of: ${ROLE_VALUES.join(', ')}`),
];

// ─── PARTIAL UPDATE (PATCH) ───────────────────────────────────────────────────
export const patchUserValidator = [
    body('firstName')
        .optional()
        .trim()
        .notEmpty().withMessage('First name cannot be empty'),

    body('lastName')
        .optional()
        .trim()
        .isString(),

    body('username')
        .optional()
        .trim()
        .notEmpty()
        .isAlphanumeric().withMessage('Username must be alphanumeric'),

    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('phone_no')
        .optional(),

    body('account_id')
        .optional()
        .isMongoId().withMessage('Invalid Account ID format'),

    body('user_status')
        .optional()
        .isIn(STATUS_VALUES).withMessage(`Status must be one of: ${STATUS_VALUES.join(', ')}`),

    body('user_role')
        .optional()
        .isIn(ROLE_VALUES).withMessage(`Role must be one of: ${ROLE_VALUES.join(', ')}`),

    body('visible')
        .optional()
        .isBoolean().withMessage('visible must be a boolean'),
];

// ─── LIST QUERY PARAMS ────────────────────────────────────────────────────────
export const listUsersValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100').toInt(),

    query('user_status')
        .optional()
        .isIn(STATUS_VALUES).withMessage(`Status must be one of: ${STATUS_VALUES.join(', ')}`),

    query('user_role')
        .optional()
        .isIn(ROLE_VALUES).withMessage(`Role must be one of: ${ROLE_VALUES.join(', ')}`),

    query('search')
        .optional()
        .trim()
        .isString(),
];
