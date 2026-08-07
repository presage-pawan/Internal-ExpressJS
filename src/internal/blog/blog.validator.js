import { body } from 'express-validator';

export const createBlogValidator = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim().isString(),
    body('category').optional().trim().isString(),
    body('feature').optional().isBoolean().withMessage('Feature must be a boolean'),
    body('visible').optional().isBoolean().withMessage('Visible must be a boolean'),
    body('files').optional().isArray().withMessage('Files must be an array'),
];

export const updateBlogValidator = [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim().isString(),
    body('category').optional().trim().isString(),
    body('feature').optional().isBoolean(),
    body('visible').optional().isBoolean(),
    body('files').optional().isArray(),
];
