import dotenv from "dotenv";
dotenv.config();

export const ENVIRONMENT = process.env.NODE_ENV || "development";

/* ===================== DATABASE 1 ===================== */
export const STAGING_DATABASE = {
  host: process.env.STAGING_DB_HOST,
  port: parseInt(process.env.DB_PORT || "27017"),
  userName: process.env.STAGING_DB_USERNAME,
  password: process.env.STAGING_DB_PASSWORD,
  databaseCMMSName: process.env.CMMS_DB_NAME,
  authSource: process.env.DB_AUTH_SOURCE || "admin"
};

/* ===================== DATABASE 2 ===================== */
export const PRODUCTION_DATABASE = {
  host: process.env.PRODUCTION_DB_HOST,
  port: parseInt(process.env.DB_PORT || "27017"),
  userName: process.env.PRODUCTION_DB_USERNAME,
  password: process.env.PRODUCTION_DB_PASSWORD,
  databaseCMMSName: process.env.CMMS_DB_NAME,
  databaseWebsiteName: process.env.WEBSITE_DB_NAME,
  databaseOpcuaName: process.env.OPCUA_DB_NAME,
  authSource: process.env.DB_AUTH_SOURCE || "admin"
};

/* ===================== SERVER ===================== */
export const SERVER_DETAILS = {
  port: parseInt(process.env.SERVER_PORT || "3009"),
  host: process.env.SERVER_HOST || "localhost",
  protocol: process.env.SERVER_PROTOCOL || "http",
  environment: process.env.NODE_ENV || "development"
};

export const CONFIG_DETAILS = {
  authSecretString: process.env.AUTH_SECRET,
  authExpiresIn: process.env.AUTH_EXPIRES_IN,
  authAlgorithm: process.env.AUTH_ALGORITHM,
  authIssuer: process.env.AUTH_ISSUER,
  authAudience: process.env.AUTH_AUDIENCE
};

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:4200',
  'http://localhost:4300',
  'https://app.presageinsights.ai',
  'https://new.presageinsights.ai',
  'https://www.presageinsights.ai'
];

const parseList = (value) => {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
};

/* ===================== SECURITY / MIDDLEWARE ===================== */
export const SECURITY_DETAILS = {
  corsOrigins: [
    ...DEFAULT_CORS_ORIGINS,
    ...parseList(process.env.CORS_ORIGINS)
  ],
  corsMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '10mb',
  formBodyLimit: process.env.FORM_BODY_LIMIT || '10mb'
};

export const REQUEST_LIMITS = {
  apiWindowMs: 15 * 60 * 1000,
  apiMax: Number(process.env.RATE_LIMIT_MAX || 500),
  loginWindowMs: 15 * 60 * 1000,
  loginMax: Number(process.env.LOGIN_RATE_LIMIT_MAX || 20)
};

export const MAIL_DETAILS = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
  user: process.env.SMTP_USER,
  password: process.env.SMTP_PASSWORD,
  from: process.env.SMTP_FROM || process.env.SMTP_USER
};
