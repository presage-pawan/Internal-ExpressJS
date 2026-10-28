import { body } from 'express-validator';
import { ROLE } from '../../schemas/users.model.js';

export const createUserValidator = [
    body('firstName').trim().notEmpty().withMessage('First Name is required'),
    body('lastName').optional().trim().isString(),
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').trim().notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
        .matches(/\d/).withMessage('Password must contain a number'),
    body('phone_no').optional().trim().isString(),
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
    body('emailStatus').optional().isBoolean(),
    body('user_role').optional().trim().isIn(ROLE).withMessage(`Role must be one of: ${ROLE.join(', ')}`),
    body('user_status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
    body('jobTitle').optional().trim().isString(),
    body('about').optional().trim().isString(),
    body('visible').optional().isBoolean(),
];

export const updateUserValidator = [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().isString(),
    body('username').optional().trim().notEmpty(),
    body('phone_no').optional().trim().isString(),
    body('email').optional().trim().isEmail(),
    body('emailStatus').optional().isBoolean(),
    body('user_role').optional().trim().isIn(ROLE).withMessage(`Role must be one of: ${ROLE.join(', ')}`),
    body('user_status').optional().isIn(['active', 'inactive']),
    body('jobTitle').optional().trim().isString(),
    body('about').optional().trim().isString(),
    body('visible').optional().isBoolean(),
    body('password').not().exists().withMessage('Use the dedicated password endpoint'),
];

export const passwordChangeValidator = [
    body('currentPassword').optional().isString(),
    body('newPassword').isString()
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
        .matches(/\d/).withMessage('Password must contain a number')
];
