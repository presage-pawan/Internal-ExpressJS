import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Types } from 'mongoose';
import { UserTokenService } from './user-token.service.js';

class MockUserTokenService extends UserTokenService {
    constructor(mockModel) {
        super('production');
        this._mockModel = mockModel;
    }

    get model() {
        return this._mockModel;
    }
}

describe('UserTokenService and single download token per account', () => {
    it('deletes existing download tokens before creating a new download token for an account', async () => {
        const accountId = new Types.ObjectId();
        const deletedQueries = [];
        const savedTokens = [];

        class MockModelInstance {
            constructor(doc) {
                Object.assign(this, doc);
            }
            async save() {
                savedTokens.push(this);
                return this;
            }
        }

        MockModelInstance.deleteMany = async (query) => {
            deletedQueries.push(query);
            return { deletedCount: 1 };
        };

        const service = new MockUserTokenService(MockModelInstance);
        const payload = {
            _id: 'ext-download-token-1',
            account_id: accountId.toString(),
            principalType: 'download_data',
            ttl: 86400,
            tokenType: 'access',
            isExternal: true,
            isInternal: false
        };

        const created = await service.create(payload);

        assert.equal(deletedQueries.length, 1);
        assert.equal(String(deletedQueries[0].account_id), String(accountId));
        assert.equal(deletedQueries[0].principalType, 'download_data');
        assert.equal(created._id, 'ext-download-token-1');
        assert.equal(savedTokens.length, 1);
    });

    it('does not delete existing tokens if creating a standard user token without account download type', async () => {
        const userId = new Types.ObjectId();
        const deletedQueries = [];
        const savedTokens = [];

        class MockModelInstance {
            constructor(doc) {
                Object.assign(this, doc);
            }
            async save() {
                savedTokens.push(this);
                return this;
            }
        }

        MockModelInstance.deleteMany = async (query) => {
            deletedQueries.push(query);
            return { deletedCount: 0 };
        };

        const service = new MockUserTokenService(MockModelInstance);
        const payload = {
            _id: 'user-token-1',
            userId: userId.toString(),
            principalType: 'user',
            ttl: 86400
        };

        const created = await service.create(payload);

        assert.equal(deletedQueries.length, 0);
        assert.equal(created._id, 'user-token-1');
        assert.equal(savedTokens.length, 1);
    });

    it('revokes all download tokens for a given account', async () => {
        const accountId = new Types.ObjectId();
        let executedQuery = null;

        const mockModel = {
            deleteMany: async (query) => {
                executedQuery = query;
                return { deletedCount: 2 };
            }
        };

        const service = new MockUserTokenService(mockModel);
        const result = await service.revokeAllByAccountId(accountId.toString(), 'download_data');

        assert.equal(result.deletedCount, 2);
        assert.equal(String(executedQuery.account_id), String(accountId));
        assert.equal(executedQuery.principalType, 'download_data');
    });

    it('fetches active unexpired download tokens', async () => {
        const accountId = new Types.ObjectId();
        let queryPassed = null;

        const mockModel = {
            find: (query) => {
                queryPassed = query;
                return {
                    sort: () => ({
                        lean: async () => [
                            { _id: 'active-token-1', account_id: accountId, principalType: 'download_data' }
                        ]
                    })
                };
            }
        };

        const service = new MockUserTokenService(mockModel);
        const tokens = await service.getActiveDownloadTokens({ account_id: accountId.toString() });

        assert.equal(tokens.length, 1);
        assert.equal(tokens[0]._id, 'active-token-1');
        assert.equal(queryPassed.principalType, 'download_data');
        assert.equal(String(queryPassed.account_id), String(accountId));
        assert.deepEqual(queryPassed.revokedAt, { $exists: false });
    });

    it('normalizes accountId and userId filters in getAll', async () => {
        const accountId = new Types.ObjectId();
        const userId = new Types.ObjectId();
        let queryPassed = null;

        const mockModel = {
            find: (query) => {
                queryPassed = query;
                return {
                    sort: () => ({
                        skip: () => ({
                            limit: () => ({
                                lean: async () => []
                            })
                        })
                    })
                };
            },
            countDocuments: async (query) => 0
        };

        const service = new MockUserTokenService(mockModel);
        await service.getAll({ accountId: accountId.toString(), userId: userId.toString(), principalType: 'download_data' });

        assert.equal(String(queryPassed.account_id), String(accountId));
        assert.equal(String(queryPassed.userId), String(userId));
        assert.equal(queryPassed.principalType, 'download_data');
        assert.equal(queryPassed.accountId, undefined);
    });
});
