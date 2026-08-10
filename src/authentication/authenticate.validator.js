import { body } from 'express-validator';

export const loginValidator = [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').trim().notEmpty().withMessage('Password is required'),
];

export const forgotPasswordValidator = [
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').normalizeEmail(),
];

export const verifyResetOtpValidator = [
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('otp').trim().matches(/^\d{6}$/).withMessage('OTP must be a 6 digit number'),
];

export const resetPasswordValidator = [
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('otp').trim().matches(/^\d{6}$/).withMessage('OTP must be a 6 digit number'),
    body('password')
        .trim()
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
        .matches(/\d/).withMessage('Password must contain a number'),
];
