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

  assert.equal(standardMenu.master_admin_panel, true);
  assert.equal(standardMenu.master_asset, true);
  assert.equal(standardMenu.master_dashboard, true);
  assert.equal(standardMenu.master_report, true);
  assert.equal(standardMenu.master_alarm, true);
  assert.equal(standardMenu.master_work_order, true);
  assert.equal(standardMenu.master_work_request, true);
  assert.equal(standardMenu.master_preventive, true);
  assert.equal(standardMenu.master_posts, true);
  assert.equal(standardMenu.master_inventory, true);
  assert.equal(standardMenu.master_devices, true);
  assert.equal(standardMenu.master_inspections, true);
  assert.equal(standardMenu.master_library, true);

  assert.equal(oemMenu.master_admin_panel, false);
  assert.equal(oemMenu.master_asset, true);
  assert.equal(oemMenu.master_report, true);
});

test('account role menu template exposes every account-controlled CMMS module', () => {
  const menu = getAccountRoleMenuTemplate('standard_account');

  assert.equal(ACCOUNT_ROLE_MENU_SCHEMA_VERSION, 2);
  assert.equal(menu.master_alarm, true);
  assert.equal(menu.master_asset, true);
  assert.equal(menu.master_dashboard, true);
  assert.equal(menu.master_devices, true);
  assert.equal(menu.master_inspections, true);
  assert.equal(menu.master_inventory, true);
  assert.equal(menu.master_library, true);
  assert.equal(menu.master_location, true);
  assert.equal(menu.master_posts, true);
  assert.equal(menu.master_preventive, true);
  assert.equal(menu.master_report, true);
  assert.equal(menu.master_work_order, true);
  assert.equal(menu.master_work_request, true);
});

test('account role menu merge preserves explicit disabled values and adds new defaults', () => {
  const menu = mergeWithAccountRoleMenuTemplate({
    master_asset: false,
    master_alarm: { view: false }
  });

  assert.equal(menu.master_asset, false);
  assert.equal(menu.master_alarm, false);
  assert.equal(menu.master_library, true);
  assert.equal(menu.master_dashboard, true);
});

test('updateAccountRoleMenuValidator accepts valid account permission payloads', async () => {
  const errors = await runValidations(updateAccountRoleMenuValidator, {
    account_role_menu: {
      master_admin_panel: true,
      master_alarm: true,
      master_asset: false,
      master_dashboard: true,
      master_devices: true,
      master_inspections: true,
      master_inventory: true,
      master_library: true,
      master_location: true,
      master_posts: true,
      master_preventive: true,
      master_report: true,
      master_work_order: true,
      master_work_request: true
    },
    reason: 'Disable asset view'
  });

  assert.deepEqual(errors, []);
});

test('updateAccountRoleMenuValidator rejects unknown modules and non-boolean actions', async () => {
  const errors = await runValidations(updateAccountRoleMenuValidator, {
    account_role_menu: {
      master_asset: true,
      unknown_module: true,
      master_alarm: 'yes'
    }
  });
  const errorMessage = errors.map((error) => error.msg).join(', ');

  assert.match(errorMessage, /Unknown permission module: unknown_module/);
  assert.match(errorMessage, /master_alarm must be boolean/);
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
  assert.deepEqual(account.subscription.limits.toObject(), {
    asset_limit: 0,
    location_limit: 0,
    user_limit: 0
  });
  assert.equal(account.subscription.subscription_type, 'free');
  assert.equal(account.subscription.subscription_status, 'active');
  assert.deepEqual(account.account_role_menu, {});
  assert.equal(account.account_permission_version, 1);
  assert.equal(account.account_role_menu_schema_version, ACCOUNT_ROLE_MENU_SCHEMA_VERSION);

  account.encrypt_payload = 'invalid';
  await assert.rejects(() => account.validate(), /`invalid` is not a valid enum value/);

  account.subscription.subscription_status = 'invalid_status';
  await assert.rejects(() => account.validate(), /`invalid_status` is not a valid enum value/);

  await connection.close();
});

test('CompanyService builds nested subscription structure for new and updated accounts', () => {
  const service = new CompanyService();

  const createPayload = service.buildAccountPayload({
    account_name: 'Presage Insights',
    type: 'Predictive Maintenance',
    subscription: {
      subscription_type: 'monthly',
      limits: { user_limit: 25, location_limit: 25, asset_limit: 25 }
    }
  }, { isCreate: true });

  assert.deepEqual(createPayload.subscription, {
    limits: {
      asset_limit: 25,
      location_limit: 25,
      user_limit: 25
    },
    subscription_type: 'monthly',
    subscription_status: 'active',
    subscription_start_date: null,
    subscription_end_date: null,
    subscription_plan: ''
  });

  const subPayload = service.buildSubscriptionPayload({
    subscription: {
      subscription_type: 'yearly',
      subscription_status: 'active',
      subscription_plan: 'Enterprise',
      limits: { user_limit: 100, location_limit: 100, asset_limit: 100 }
    }
  });

  assert.deepEqual(subPayload.subscription, {
    limits: {
      asset_limit: 100,
      location_limit: 100,
      user_limit: 100
    },
    subscription_type: 'yearly',
    subscription_status: 'active',
    subscription_start_date: null,
    subscription_end_date: null,
    subscription_plan: 'Enterprise'
  });
});

test('updateSubscriptionValidator validates subscription details in flat and nested formats', async () => {
  const errors = await runValidations(updateSubscriptionValidator, {
    subscription: {
      subscription_type: 'yearly',
      subscription_status: 'active',
      limits: { user_limit: 100 },
      subscription_start_date: '2026-01-01',
      subscription_end_date: '2027-01-01'
    }
  });

  assert.deepEqual(errors, []);

  const flatErrors = await runValidations(updateSubscriptionValidator, {
    subscription_type: 'yearly',
    subscription_status: 'active',
    user_limit: 100,
    subscription_start_date: '2026-01-01',
    subscription_end_date: '2027-01-01'
  });

  assert.deepEqual(flatErrors, []);

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

test('CompanyService.findAllWithTokens executes aggregation pipeline with lookup for CustomAccessToken', async () => {
  const service = new CompanyService('test');
  let capturedPipeline = null;
  service._model = {
    aggregate(pipeline) {
      capturedPipeline = pipeline;
      return {
        exec: async () => [
          {
            _id: new mongoose.Types.ObjectId(),
            account_name: 'Acme Test',
            downloadToken: 'token-abc',
            hasExistingToken: true
          }
        ]
      };
    }
  };
  Object.defineProperty(service, 'model', { get() { return this._model; } });

  const results = await service.findAllWithTokens({ visible: true });
  assert.equal(results.length, 1);
  assert.equal(results[0].downloadToken, 'token-abc');
  assert.equal(results[0].hasExistingToken, true);
  assert.ok(capturedPipeline.some((stage) => stage.$lookup && stage.$lookup.from === 'CustomAccessToken'));
  assert.ok(capturedPipeline.some((stage) => stage.$lookup && stage.$lookup.from === 'account_api_key'));
});

test('CompanyService API key management via account_api_key (getApiKey, generateApiKey, removeApiKey, toggleApiKeyStatus)', async () => {
  const service = new CompanyService('test');
  const accountId = new mongoose.Types.ObjectId();
  const mockDoc = {
    _id: accountId,
    account_name: 'Acme Test Corp',
    download_api_key: 'existing-key-123',
    async save() { return this; }
  };

  let apiKeyRecord = {
    _id: new mongoose.Types.ObjectId(),
    account_id: accountId,
    download_api_key: 'existing-key-123',
    type: 'download_api_key',
    visible: true,
    async save() { return this; }
  };

  service._model = {
    findById(id) {
      return {
        select(fields) {
          return mockDoc;
        }
      };
    }
  };
  service._apiKeyModel = {
    findOne({ account_id }) {
      return {
        sort() {
          return apiKeyRecord;
        }
      };
    },
    findOneAndUpdate(filter, update, options) {
      if (update.$set) {
        Object.assign(apiKeyRecord, update.$set);
      }
      return apiKeyRecord;
    },
    updateOne(filter, update) {
      if (update.$set) {
        Object.assign(apiKeyRecord, update.$set);
      }
      return { acknowledged: true };
    }
  };
  Object.defineProperty(service, 'model', { get() { return this._model; } });
  Object.defineProperty(service, 'apiKeyModel', { get() { return this._apiKeyModel; } });

  // 1. Get
  const fetched = await service.getApiKey(accountId);
  assert.equal(fetched.account_id, accountId);
  assert.equal(fetched.api_key, 'existing-key-123');
  assert.equal(fetched.download_api_key, 'existing-key-123');
  assert.equal(fetched.visible, true);
  assert.equal(fetched.is_active, true);
  assert.equal(fetched.type, 'download_api_key');

  // Also test backward-compatible alias
  const fetchedLegacy = await service.getDownloadApiKey(accountId);
  assert.equal(fetchedLegacy.api_key, 'existing-key-123');

  // 2. Generate
  service._model.findById = (id) => mockDoc;
  const generated = await service.generateApiKey(accountId);
  assert.equal(generated.account_id, accountId);
  assert.ok(generated.api_key && generated.api_key.length > 20);
  assert.equal(generated.visible, true);
  assert.equal(generated.is_active, true);
  assert.equal(apiKeyRecord.download_api_key, generated.api_key);
  assert.equal(mockDoc.download_api_key, generated.api_key);

  // 3. Remove (soft deactivate: sets visible = false, does not delete)
  const removed = await service.removeApiKey(accountId);
  assert.equal(removed.account_id, accountId);
  assert.equal(removed.visible, false);
  assert.equal(removed.is_active, false);
  assert.equal(apiKeyRecord.visible, false);
  // Verify key string is still preserved and not deleted
  assert.ok(apiKeyRecord.download_api_key);

  // 4. Toggle status (activate back)
  const reactivated = await service.toggleApiKeyStatus(accountId, true);
  assert.equal(reactivated.visible, true);
  assert.equal(reactivated.is_active, true);
  assert.equal(apiKeyRecord.visible, true);

  // 5. Toggle status without boolean argument (inverts to false)
  const inverted = await service.toggleApiKeyStatus(accountId);
  assert.equal(inverted.visible, false);
  assert.equal(inverted.is_active, false);
  assert.equal(apiKeyRecord.visible, false);
});



