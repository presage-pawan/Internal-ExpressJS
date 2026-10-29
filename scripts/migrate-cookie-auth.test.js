import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMigrationOptions, inspectAndMigrateCookieAuth, COOKIE_AUTH_ENABLED_FILTER } from './migrate-cookie-auth.js';

test('migration defaults to dry run and requires a matching apply confirmation', () => {
  assert.deepEqual(parseMigrationOptions(['--environment=staging']), { environment: 'staging', apply: false });
  assert.throws(() => parseMigrationOptions([]), /Explicit/);
  assert.throws(() => parseMigrationOptions(['--environment=production', '--apply']), /matching/);
  assert.throws(() => parseMigrationOptions(['--environment=staging', '--apply', '--confirm=production']), /matching/);
  assert.deepEqual(parseMigrationOptions(['--environment=production', '--apply', '--confirm=production']), {
    environment: 'production', apply: true
  });
});

function fixture() {
  const calls = [];
  return {
    calls,
    countDocuments: async (query) => {
      if (Object.keys(query).length === 0) return 9;
      if (query.cookie_status === 'enabled') return 3;
      if (query.cookie_status === 'disabled') return 2;
      if (query.cookie_status?.$exists === false) return 3;
      if (query.cookies_status?.$exists === true) return 1;
      throw new Error('Unexpected query');
    },
    updateMany: async (...args) => {
      calls.push(args);
      return { modifiedCount: 6 };
    }
  };
}

test('inventory reports no secrets and makes no writes without --apply', async () => {
  const collection = fixture();
  const report = await inspectAndMigrateCookieAuth(collection, false);
  assert.deepEqual(report, {
    total: 9, enabled: 3, disabled: 2, missing: 3,
    other: 1, legacyAlias: 1, changeRequired: 6, dryRun: true
  });
  assert.equal(collection.calls.length, 0);
});

test('apply only enables disabled/missing values and is idempotent', async () => {
  const collection = fixture();
  const report = await inspectAndMigrateCookieAuth(collection, true);
  assert.equal(report.modified, 6);
  assert.deepEqual(collection.calls, [[COOKIE_AUTH_ENABLED_FILTER, { $set: { cookie_status: 'enabled' } }]]);
});
