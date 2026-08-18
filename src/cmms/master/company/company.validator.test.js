import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';

import {
  createCompanyValidator,
  listCompanyValidator,
  resetAccountRoleMenuValidator,
  updateAccountRoleMenuValidator,
  updateCompanyValidator,
  updateSubscriptionValidator
} from './company.validator.js';
import {
  ACCOUNT_ROLE_MENU_SCHEMA_VERSION,
  getAccountRoleMenuTemplate,
  mergeWithAccountRoleMenuTemplate
} from './account-role-menu.js';
import { AccountModel } from '../../schemas/company.model.js';
import { CompanyService } from './company.service.js';

async function runValidations(validators, body) {
  const req = { body };
  for (const validator of validators) {
    await validator.run(req);
  }
  return validationResult(req).array();
}

async function runQueryValidations(validators, query) {
  const req = { query };
  for (const validator of validators) {
    await validator.run(req);
  }
  return validationResult(req).array();
}

test('createCompanyValidator accepts CMMS account feature flags', async () => {
  const errors = await runValidations(createCompanyValidator, {
    account_name: 'Presage Insights',
    type: 'Predictive Maintenance',
    description: 'Internal account controls',
    account_status: 'active',
    experience_profile: 'oem',
    cookie_status: 'enabled',
    encrypt_payload: 'enabled',
    encrypt_response: 'disabled',
    visible: true
  });

  assert.deepEqual(errors, []);
});

test('updateCompanyValidator rejects invalid account feature flag values', async () => {
  const errors = await runValidations(updateCompanyValidator, {
    cookie_status: 'yes',
    encrypt_payload: 'enabled',
    encrypt_response: 'no'
  });
  const invalidFields = errors.map((error) => error.path).sort();

  assert.deepEqual(invalidFields, ['cookie_status', 'encrypt_response']);
});

test('account role menu template supports standard and OEM account profiles', () => {
  const standardMenu = getAccountRoleMenuTemplate('standard_account');
  const oemMenu = getAccountRoleMenuTemplate('oem');

  assert.equal(standardMenu.master_admin_panel.view, true);
  assert.equal(standardMenu.asset.add, true);
  assert.equal(oemMenu.master_admin_panel.view, false);
  assert.equal(oemMenu.asset.view, true);
  assert.equal(oemMenu.asset.add, false);
});

test('account role menu template exposes every account-controlled CMMS module', () => {
  const menu = getAccountRoleMenuTemplate('standard_account');

  assert.equal(ACCOUNT_ROLE_MENU_SCHEMA_VERSION, 2);
  assert.equal(menu.master_alarm.view, true);
  assert.equal(menu.alarm_overview.parent, 'master_alarm');
  assert.equal(menu.alarm_configuration.parent, 'master_alarm');
  assert.equal(menu.master_library.view, true);
  assert.equal(menu.work_order_templates.parent, 'master_library');
  assert.equal(menu.procedures.parent, 'master_library');
  assert.equal(menu.asset_alarms.parent, 'master_asset');
  assert.equal(menu.ai_chatbot.parent, 'master_asset');

  for (const [key, permission] of Object.entries(menu)) {
    if (permission.level === 1) {
      assert.ok(menu[permission.parent], `${key} must reference an existing parent`);
    }
  }
});

test('account role menu merge preserves explicit disabled values and adds new defaults', () => {
  const menu = mergeWithAccountRoleMenuTemplate({
    master_asset: { level: 0, view: false },
    asset: { level: 1, parent: 'master_asset', view: false, add: false }
  });

  assert.equal(menu.master_asset.view, false);
  assert.equal(menu.asset.view, false);
  assert.equal(menu.asset.add, false);
  assert.equal(menu.master_library.view, true);
  assert.equal(menu.alarm_overview.view, true);
});

test('updateAccountRoleMenuValidator accepts valid account permission payloads', async () => {
  const errors = await runValidations(updateAccountRoleMenuValidator, {
    account_role_menu: {
      master_asset: { level: 0, view: true },
      asset: { level: 1, parent: 'master_asset', view: true, add: false, edit: false, delete: false, import: false, export: true }
    },
    reason: 'Disable asset mutation'
  });

  assert.deepEqual(errors, []);
});

test('updateAccountRoleMenuValidator rejects unknown modules and non-boolean actions', async () => {
  const errors = await runValidations(updateAccountRoleMenuValidator, {
    account_role_menu: {
      master_asset: { level: 0, view: true },
      unknown_module: { level: 1, parent: 'master_asset', view: true },
      asset: { level: 1, parent: 'master_asset', view: 'yes' }
    }
  });
  const errorMessage = errors.map((error) => error.msg).join(', ');

  assert.match(errorMessage, /Unknown permission module: unknown_module/);
  assert.match(errorMessage, /asset.view must be boolean/);
});

test('account permission changes require an audit reason', async () => {
  const updateErrors = await runValidations(updateAccountRoleMenuValidator, {
    account_role_menu: getAccountRoleMenuTemplate('standard_account'),
    reason: '   '
  });
  const resetErrors = await runValidations(resetAccountRoleMenuValidator, {
    experience_profile: 'standard_account'
  });

  assert.match(updateErrors.map((error) => error.msg).join(', '), /Reason is required/);
  assert.match(resetErrors.map((error) => error.msg).join(', '), /Reason is required/);
});

test('generic company updates cannot bypass audited account permission endpoints', () => {
  const service = new CompanyService('production');
  const payload = service.buildAccountPayload({
    account_name: 'Updated account',
    account_role_menu: { master_asset: { level: 0, view: false } }
  });

  assert.equal(payload.account_name, 'Updated account');
  assert.equal(payload.account_role_menu, undefined);
});

test('AccountModel persists CMMS-compatible feature defaults and validates enums', async () => {
  const connection = mongoose.createConnection();
  const Account = AccountModel(connection);

  const account = new Account({
    account_name: 'Presage Insights',
    type: 'Predictive Maintenance'
  });

  assert.equal(account.cookie_status, 'enabled');
  assert.equal(account.encrypt_payload, 'enabled');
  assert.equal(account.encrypt_response, 'enabled');
  assert.equal(account.experience_profile, 'standard_account');
  assert.equal(account.default_language, 'en');
  assert.equal(account.subscription_type, 'free');
  assert.equal(account.subscription_status, 'active');
  assert.equal(account.user_limit, 0);
  assert.deepEqual(account.account_role_menu, {});
  assert.equal(account.account_permission_version, 1);
  assert.equal(account.account_role_menu_schema_version, ACCOUNT_ROLE_MENU_SCHEMA_VERSION);

  account.encrypt_payload = 'invalid';
  await assert.rejects(() => account.validate(), /`invalid` is not a valid enum value/);

  account.subscription_status = 'invalid_status';
  await assert.rejects(() => account.validate(), /`invalid_status` is not a valid enum value/);

  await connection.close();
});

test('updateSubscriptionValidator validates subscription details', async () => {
  const errors = await runValidations(updateSubscriptionValidator, {
    subscription_type: 'yearly',
    subscription_status: 'active',
    user_limit: 100,
    subscription_start_date: '2026-01-01',
    subscription_end_date: '2027-01-01'
  });

  assert.deepEqual(errors, []);

  const invalidErrors = await runValidations(updateSubscriptionValidator, {
    subscription_type: 'invalid_type',
    user_limit: -5,
    subscription_start_date: 'wrong-date-format'
  });

  const invalidFields = invalidErrors.map((error) => error.path).sort();
  assert.deepEqual(invalidFields, ['subscription_start_date', 'subscription_type', 'user_limit']);
});

test('updateSubscriptionValidator rejects empty payloads and invalid date ranges', async () => {
  const emptyErrors = await runValidations(updateSubscriptionValidator, {});
  assert.match(emptyErrors.map((error) => error.msg).join(', '), /At least one subscription field is required/);

  const dateErrors = await runValidations(updateSubscriptionValidator, {
    subscription_start_date: '2027-01-01',
    subscription_end_date: '2026-01-01'
  });
  assert.match(dateErrors.map((error) => error.msg).join(', '), /Subscription end date must be on or after start date/);
});

test('listCompanyValidator accepts internal account filters and rejects invalid filters', async () => {
  const errors = await runQueryValidations(listCompanyValidator, {
    search: 'presage',
    account_status: 'active',
    experience_profile: 'standard_account',
    subscription_type: 'trial',
    subscription_status: 'active',
    visible: 'true'
  });
  assert.deepEqual(errors, []);

  const invalidErrors = await runQueryValidations(listCompanyValidator, {
    account_status: 'blocked',
    subscription_type: 'forever',
    visible: 'maybe'
  });
  const invalidFields = invalidErrors.map((error) => error.path).sort();
  assert.deepEqual(invalidFields, ['account_status', 'subscription_type', 'visible']);
});
