import { body } from 'express-validator';

export const createRoleMenuValidator = [
    body('user_role').trim().notEmpty().withMessage('User Role is required')
];

export const updatePartialRoleMenuValidator = [
    body('roleName').optional().trim().notEmpty(),
    body('userId').optional().trim().notEmpty(),
    body('roleMenu').optional().notEmpty(),
];

export const updateRoleMenuValidator = [
    body('roleName').optional().trim().notEmpty(),
    body('userId').optional().trim().notEmpty(),
    body('roleMenu').optional().notEmpty(),
];
