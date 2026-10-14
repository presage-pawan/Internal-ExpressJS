import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { Types } from 'mongoose';
import { SapMappingService } from './sap-mapping.service.js';

const leanResult = (value) => ({ lean: async () => value });

class TestSapMappingService extends SapMappingService {
  constructor({ dbType = 'staging', account, user, existing = null } = {}) {
    super(dbType);
    this.account = account;
    this.user = user;
    this.existing = existing;
  }

  get accountModel() {
    return { findOne: () => leanResult(this.account) };
  }

  get userModel() {
    return { findOne: () => leanResult(this.user) };
  }

  get model() {
    return { exists: async () => this.existing };
  }
}

describe('SapMappingService', () => {
  test('builds an environment-scoped mapping with CMMS display snapshots', async () => {
    const accountId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const actorId = new Types.ObjectId();
    const service = new TestSapMappingService({
      dbType: 'staging',
      account: { _id: accountId, account_name: 'Presage Staging' },
      user: {
        _id: userId,
        account_id: accountId,
        firstName: 'CMMS',
        lastName: 'Operator',
        username: 'operator',
        email: 'operator@example.com'
      }
    });

    const result = await service.buildPayload({
      sapAccountId: 'SAP-100',
      sapUserId: 'SAP-USER-1',
      cmmsAccountId: String(accountId),
      cmmsUserId: String(userId)
    }, actorId);

    assert.equal(result.dbType, 'staging');
    assert.equal(result.cmmsAccountName, 'Presage Staging');
    assert.equal(result.cmmsUserName, 'CMMS Operator');
    assert.equal(result.cmmsUserEmail, 'operator@example.com');
    assert.equal(result.updatedBy, actorId);
  });

  test('rejects a CMMS user from a different account', async () => {
    const accountId = new Types.ObjectId();
    const service = new TestSapMappingService({
      account: { _id: accountId, account_name: 'Selected account' },
      user: { _id: new Types.ObjectId(), account_id: new Types.ObjectId(), username: 'wrong-account' }
    });

    await assert.rejects(
      service.buildPayload({
        sapAccountId: 'SAP-100',
        sapUserId: 'SAP-USER-1',
        cmmsAccountId: String(accountId),
        cmmsUserId: String(new Types.ObjectId())
      }, new Types.ObjectId()),
      (error) => error.status === 400 && /does not belong/.test(error.message)
    );
  });

  test('rejects a duplicate SAP account and user pair', async () => {
    const service = new TestSapMappingService({ existing: { _id: new Types.ObjectId() } });

    await assert.rejects(
      service.assertUniqueSapUser({ sapAccountId: 'SAP-100', sapUserId: 'SAP-USER-1' }),
      (error) => error.status === 409 && /already mapped/.test(error.message)
    );
  });
});
