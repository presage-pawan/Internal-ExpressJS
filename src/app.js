import express, { Router } from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { errorMiddleware } from "./middlewares/error.js";
import { fileURLToPath } from 'url';
import { auth } from './auth.js';
import { cmmsAuth } from './middlewares/cmms-auth.js';
import { Logger } from './middlewares/logger.js';
import publicRoutes from './routes/index.route.js';
import authenticationRoutes from './authentication/authenticate.route.js'
import internalRoutes from './internal/internal.routes.js'
import cmmsRoutes from './cmms/cmms.routes.js';
import { setupSwagger } from './utils/swagger.js';
import { REQUEST_LIMITS, SECURITY_DETAILS } from './configDB.js';
import supportLoginServiceRoutes from './service/support-login.route.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const allowedOrigins = new Set(SECURITY_DETAILS.corsOrigins);
const corsOptions = {
  credentials: true,
  methods: SECURITY_DETAILS.corsMethods,
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(Object.assign(new Error('CORS origin not allowed'), { status: 403 }));
  }
};
const sanitizeMongoPayload = (req, res, next) => {
  ['body', 'params'].forEach(key => {
    if (req[key]) {
      mongoSanitize.sanitize(req[key]);
    }
  });
  if (req.query) {
    mongoSanitize.sanitize(req.query);
  }
  next();
};

app.set('trust proxy', 1);
app.use(cookieParser());
app.use(Logger.middleware());
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(express.json({ limit: SECURITY_DETAILS.jsonBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: SECURITY_DETAILS.formBodyLimit }));
app.use(sanitizeMongoPayload);
app.use('/blogs', express.static(path.join(process.cwd(), 'blogs'), {
  setHeaders(res) {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));
app.use(rateLimit({
  windowMs: REQUEST_LIMITS.apiWindowMs,
  max: REQUEST_LIMITS.apiMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: false, message: 'Too many requests, please try again later.' }
}));
app.use(compression({
  level: 9,
  threshold: 0,
  filter: (req, res) => {
    return !req.headers['x-no-compression'];
  }
}));

app.get('/', (req, res) => {
  res.status(200).json({ status: true, message: 'Welcome to internal API' });
});

setupSwagger(app);

const apiRouter = Router();
apiRouter.use('/users', authenticationRoutes);
apiRouter.use('/public', publicRoutes);
apiRouter.use('/service/support-login', supportLoginServiceRoutes);
apiRouter.use('/internal', auth, internalRoutes());
apiRouter.use('/cmms', cmmsAuth, cmmsRoutes());
app.use('/api', apiRouter);

app.use((req, res, next) => {
  throw Object.assign(new Error('Requested resource not found'), { status: 404 });
});

app.use(errorMiddleware);

export default app;
