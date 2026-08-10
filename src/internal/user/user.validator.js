import { body } from 'express-validator';
import { ROLE } from '../../schemas/users.model.js';

export const createUserValidator = [
    body('firstName').trim().notEmpty().withMessage('First Name is required'),
    body('lastName').optional().trim().isString(),
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').trim().notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
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
    body('password').optional().trim().isLength({ min: 6 }),
    body('email').optional().trim().isEmail(),
    body('user_role').optional().trim().isIn(ROLE).withMessage(`Role must be one of: ${ROLE.join(', ')}`),
    body('user_status').optional().isIn(['active', 'inactive']),
    body('jobTitle').optional().trim().isString(),
    body('about').optional().trim().isString(),
    body('visible').optional().isBoolean(),
];
