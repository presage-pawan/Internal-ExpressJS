import express from 'express';
import masterRoutes from './master/master.routes.js';
import workRoutes from './work/work.routes.js';
import usersRoutes from './users/users.routes.js';
import mappingRoutes from './mapping/mapping.routes.js';
import supportLoginRoutes from './support-login/support-login.route.js';

export default () => {
    const router = express.Router();
    router.use('/master', masterRoutes());
    router.use('/work', workRoutes());
    router.use('/users', usersRoutes());
    router.use('/mapping', mappingRoutes());
    router.use('/support-login', supportLoginRoutes);
    return router;
};
