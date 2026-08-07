import { body, query } from 'express-validator';

export const createVerificationValidator = [
    body('email')
        .trim().notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('firstName')
        .trim().notEmpty().withMessage('First name is required'),
    body('lastName')
        .optional().trim().isString(),
    body('code')
        .trim().notEmpty().withMessage('Verification code is required'),
];

export const verifyCodeValidator = [
    body('email')
        .trim().notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('code')
        .trim().notEmpty().withMessage('Verification code is required'),
];

export const listVerificationsValidator = [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('email').optional().trim().isEmail().normalizeEmail(),
];
