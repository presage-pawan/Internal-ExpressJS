import { body, param } from 'express-validator';

export const uploadBase64Validator = [
    body('baseImage').trim().notEmpty().withMessage('Base64 image string is required'),
    body('folderName').trim().notEmpty().withMessage('Folder name is required').isString(),
];

export const uploadFilesValidator = [
    param('folderName').optional().trim().isString(),
];
