import express from 'express';
import { uploadController } from './upload.controller.js';
import { uploadMiddleware } from './upload.multer.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: File upload management
 */

/**
 * @swagger
 * /api/internal/uploads:
 *   post:
 *     summary: Upload multiple files
 *     tags: [Uploads]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded
 */
router.post('/', uploadMiddleware.array('files', 12), uploadController.uploadFiles);

/**
 * @swagger
 * /api/internal/uploads/{folderName}:
 *   post:
 *     summary: Upload files to a specific folder
 *     tags: [Uploads]
 *     parameters:
 *       - in: path
 *         name: folderName
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded to folder
 */
/**
 * @swagger
 * /api/internal/uploads/base64:
 *   post:
 *     summary: Upload base64 encoded image
 *     tags: [Uploads]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Base64 image uploaded
 */
router.post('/base64', uploadController.uploadBase64);

router.post('/:folderName', uploadMiddleware.array('files', 12), uploadController.uploadFiles);

export default router;
