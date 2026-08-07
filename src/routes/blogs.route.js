import express from 'express';
import { BlogController } from '../internal/blog/blog.controller.js';

const router = express.Router();
const controller = new BlogController();

/**
 * @swagger
 * tags:
 *   name: Blogs
 *   description: Public blog content
 */

/**
 * @swagger
 * /api/public/blogs:
 *   get:
 *     summary: Get all blogs
 *     tags: [Blogs]
 *     responses:
 *       200:
 *         description: List of blogs
 */
router.route('/').get(controller.getAll)

/**
 * @swagger
 * /api/public/blogs/{id}:
 *   get:
 *     summary: Get blog by ID
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog details
 */
router.route('/:id').get(controller.getById)

export default router;