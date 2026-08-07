import express from 'express';
import usersRoutes from './user/user.route.js';
import blogsRoutes from './blog/blog.route.js';
import uploadRoutes from './upload/upload.routes.js';
import roleMenuRoutes from './role-menu/role-menu.route.js';
import assignedCompanyRoutes from './assigned-companies/assigned-companies.route.js';

export default () => {
    const router = express.Router();
    router.use('/users', usersRoutes);
    router.use('/blogs', blogsRoutes)
    router.use('/uploads', uploadRoutes);
    router.use('/role-menu', roleMenuRoutes);
    router.use('/assigned-companies', assignedCompanyRoutes);
    return router;
};
