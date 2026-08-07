import test from 'node:test';
import assert from 'node:assert/strict';
import { AssetController } from './asset.controller.js';

const createResponse = () => {
  const response = {
    statusCode: 0,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
  return response;
};

test('assetIds lookup uses enriched details and preserves the response envelope', async () => {
  const assetId = '63a1492110c33e75c8232931';
  let receivedFilter;
  const service = {
    async getDetails(filter) {
      receivedFilter = filter;
      return [{ id: assetId, account: { account_name: 'Example' } }];
    },
    async getAll() {
      assert.fail('getAll should not be called for an assetIds lookup');
    }
  };
  const controller = new AssetController();
  controller.getService = () => service;
  const response = createResponse();
  let nextError;

  await controller.getAll(
    { db_type: 'production', query: { assetIds: ` ${assetId} ` } },
    response,
    (error) => { nextError = error; }
  );

  assert.equal(nextError, undefined);
  assert.equal(String(receivedFilter._id.$in[0]), assetId);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    status: true,
    message: 'Assets fetched successfully',
    data: [{ id: assetId, account: { account_name: 'Example' } }]
  });
});

test('general asset listing keeps using getAll with include support', async () => {
  let receivedOptions;
  const service = {
    async getDetails() {
      assert.fail('getDetails should only be called when assetIds is supplied');
    },
    async getAll(_filter, options) {
      receivedOptions = options;
      return [{ id: 'asset-1' }];
    }
  };
  const controller = new AssetController();
  controller.getService = () => service;
  const response = createResponse();

  await controller.getAll(
    { db_type: 'production', query: { include: 'locationId' } },
    response,
    (error) => { throw error; }
  );

  assert.deepEqual(receivedOptions, { include: 'locationId' });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data.length, 1);
});

test('company-scoped listing filters by the asset account_id field', async () => {
  const companyId = '63a1492110c33e75c8232932';
  let receivedFilter;
  const controller = new AssetController();
  controller.getService = () => ({
    async getAll(filter) {
      receivedFilter = filter;
      return [{ id: 'asset-1' }];
    }
  });

  await controller.getAll(
    { companyId, db_type: 'production', query: {} },
    createResponse(),
    (error) => { throw error; }
  );

  assert.equal(String(receivedFilter.account_id), companyId);
  assert.equal('companyId' in receivedFilter, false);
});
