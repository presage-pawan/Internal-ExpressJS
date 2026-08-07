import express from 'express';
import masterRoutes from './master/master.routes.js';
import workRoutes from './work/work.routes.js';
import usersRoutes from './users/users.routes.js';
import mappingRoutes from './mapping/mapping.routes.js';

export default () => {
    const router = express.Router();
    router.use('/master', masterRoutes());
    router.use('/work', workRoutes());
    router.use('/users', usersRoutes());
    router.use('/mapping', mappingRoutes());
    return router;
};
