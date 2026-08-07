import { Router } from 'express';
import blogsRoutes from './blogs.route.js';

const router = Router();

router.use('/blogs', blogsRoutes);

export default router;
