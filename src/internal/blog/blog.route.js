import express from 'express';
import { BlogController } from './blog.controller.js';
import { createBlogValidator, updateBlogValidator } from './blog.validator.js';
import { validate } from '../../middlewares/validate.js';

const router = express.Router();
const controller = new BlogController();

/**
 * @swagger
 * tags:
 *   name: InternalBlogs
 *   description: Administrative blog management
 */

/**
 * @swagger
 * /api/internal/blogs:
 *   get:
 *     summary: Get all internal blogs
 *     tags: [InternalBlogs]
 *     responses:
 *       200:
 *         description: List of blogs
 */
router
  .route('/')
  .get(controller.getAll)
  /**
   * @swagger
   * /api/internal/blogs:
   *   post:
   *     summary: Create an internal blog
   *     tags: [InternalBlogs]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Blog'
   *     responses:
   *       201:
   *         description: Blog created
   */
  .post(createBlogValidator, validate, controller.create);

/**
 * @swagger
 * /api/internal/blogs/{id}:
 *   get:
 *     summary: Get internal blog by ID
 *     tags: [InternalBlogs]
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
router
  .route('/:id')
  .get(controller.getById)
  /**
   * @swagger
   * /api/internal/blogs/{id}:
   *   put:
   *     summary: Update internal blog (Full)
   *     tags: [InternalBlogs]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Blog updated
   */
  .put(updateBlogValidator, validate, controller.update)
  /**
   * @swagger
   * /api/internal/blogs/{id}:
   *   patch:
   *     summary: Update internal blog (Partial)
   *     tags: [InternalBlogs]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Blog updated
   */
  .patch(updateBlogValidator, validate, controller.updatePartial)
  /**
   * @swagger
   * /api/internal/blogs/{id}:
   *   delete:
   *     summary: Delete internal blog
   *     tags: [InternalBlogs]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Blog deleted
   */
  .delete(controller.delete);

export default router;