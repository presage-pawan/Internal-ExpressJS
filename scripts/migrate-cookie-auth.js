#!/usr/bin/env node
/**
 * Dry-run-first one-time account cookie-auth compatibility backfill.
 *
 * Supply STAGING_CMMS_MONGODB_URI or PRODUCTION_CMMS_MONGODB_URI securely
 * through the runtime environment. This utility never connects to both
 * environments implicitly and never logs connection credentials.
 *
 * Usage:
 *   node scripts/migrate-cookie-auth.js --environment=staging
 *   node scripts/migrate-cookie-auth.js --environment=staging --apply --confirm=staging
 */
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';

export const COOKIE_AUTH_ENABLED_FILTER = { cookie_status: { $ne: 'enabled' } };

export function parseMigrationOptions(args = []) {
  const environment = args.find(value => value.startsWith('--environment='))?.split('=')[1];
  if (!['staging', 'production'].includes(environment)) {
    throw new Error('Explicit --environment=staging or --environment=production is required');
  }
  const apply = args.includes('--apply');
  if (apply && !args.includes(`--confirm=${environment}`)) {
    throw new Error('Applying a migration requires a matching --confirm=<environment>');
  }
  if (args.some(value => !['--apply', `--environment=${environment}`, `--confirm=${environment}`].includes(value))) {
    throw new Error('Unexpected migration option');
  }
  return { environment, apply };
}

export async function inspectAndMigrateCookieAuth(collection, apply = false) {
  const [total, enabled, disabled, missing, legacyAlias] = await Promise.all([
    collection.countDocuments({}),
    collection.countDocuments({ cookie_status: 'enabled' }),
    collection.countDocuments({ cookie_status: 'disabled' }),
    collection.countDocuments({ cookie_status: { $exists: false } }),
    collection.countDocuments({ cookies_status: { $exists: true } })
  ]);
  const report = {
    total, enabled, disabled, missing,
    other: total - enabled - disabled - missing,
    legacyAlias, changeRequired: total - enabled, dryRun: !apply
  };
  if (apply && report.changeRequired > 0) {
    const result = await collection.updateMany(COOKIE_AUTH_ENABLED_FILTER, {
      $set: { cookie_status: 'enabled' }
    });
    report.modified = result.modifiedCount;
  }
  return report;
}

async function main() {
  const options = parseMigrationOptions(process.argv.slice(2));
  const key = options.environment === 'production'
    ? 'PRODUCTION_CMMS_MONGODB_URI'
    : 'STAGING_CMMS_MONGODB_URI';
  const uri = process.env[key];
  if (!uri) throw new Error(`Missing ${key}; no database connection attempted`);
  const connection = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 10000 }).asPromise();
  try {
    const report = await inspectAndMigrateCookieAuth(connection.db.collection('account_master'), options.apply);
    process.stdout.write(JSON.stringify({ environment: options.environment, ...report }) + '\n');
  } finally {
    await connection.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
