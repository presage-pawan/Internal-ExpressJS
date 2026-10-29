# Cookie-authentication account backfill

This is a **manual, controlled migration**, not a deployment startup hook.

1. Check that all older CMMS and Internal server versions have been replaced with versions that always issue cookie sessions regardless of legacy cookie_status.
2. Read the staging and production DB topology; the Internal server has a shared CMMS account_master collection and separate environment databases. Verify each URI targets the intended account_master collection.
3. Run `node scripts/migrate-cookie-auth.js --environment=staging` with STAGING_CMMS_MONGODB_URI supplied through a secure environment. Inspect totals for enabled, disabled, missing and other values.
4. Record a database backup and maintenance/change approval. Apply only by rerunning with `--apply --confirm=staging` and verify a subsequent dry-run reports changeRequired = 0.
5. Repeat with PRODUCTION_CMMS_MONGODB_URI **only after** staging validation and explicit operational approval.

The script never logs URI credentials or individual account data. It is idempotent and does not delete the legacy cookie_status schema or the alias field until consumer migration is complete. Rollback requires a protected backup or recorded per-account previous values, not blindly setting every account to disabled. Cookie acceptance still depends on browser policy and TLS/first-party delivery.
