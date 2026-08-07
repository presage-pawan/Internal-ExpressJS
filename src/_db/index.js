import { createMongoConnection, getDb } from './db.connection.js';
import { STAGING_DATABASE, PRODUCTION_DATABASE } from "../configDB.js";

let staging_cmms_db, production_cmms_db, production_website_db;
const buildMongoUri = (cfg, dbName) => `mongodb://${cfg.userName}:${cfg.password}@${cfg.host}:${cfg.port}/${dbName}?authSource=${cfg.authSource}`;

export const initDbConnections = async () => {
  try {
    const stagingConn = await createMongoConnection('cmms-staging', buildMongoUri(STAGING_DATABASE, STAGING_DATABASE.databaseCMMSName));
    const prodCmmsConn = await createMongoConnection('cmms-production', buildMongoUri(PRODUCTION_DATABASE, PRODUCTION_DATABASE.databaseCMMSName));
    const prodWebsiteConn = await createMongoConnection('website-production', buildMongoUri(PRODUCTION_DATABASE, PRODUCTION_DATABASE.databaseWebsiteName));

    staging_cmms_db = getDb(stagingConn, STAGING_DATABASE.databaseCMMSName);
    production_cmms_db = getDb(prodCmmsConn, PRODUCTION_DATABASE.databaseCMMSName);
    production_website_db = getDb(prodWebsiteConn, PRODUCTION_DATABASE.databaseWebsiteName);

    console.log('✅ All MongoDB connections initialized');
  } catch (err) {
    console.error('❌ MongoDB initialization failed', err);
    process.exit(1);
  }
};

export const staging_cmms_db_conn = () => staging_cmms_db;
export const production_cmms_db_conn = () => production_cmms_db;
export const production_website_db_conn = () => production_website_db;

export const getConnection = (type, category) => {
  if (category === 'website') {
    // Website only has production DB currently.
    // We explicitly return production DB even for staging request, OR throw error.
    // For safety preventing accidental writes to prod from staging logic, we should be careful.
    // However, since we are removing client control, this logic becomes server-controlled.
    return production_website_db;
  }

  if (category === 'cmms') {
    return type === 'staging' ? staging_cmms_db : production_cmms_db;
  }

  throw new Error(`Unknown database category: ${category}`);
};

export { staging_cmms_db, production_cmms_db, production_website_db };