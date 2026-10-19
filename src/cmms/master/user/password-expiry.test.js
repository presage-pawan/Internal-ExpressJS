import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import { UserModel } from '../../schemas/users.model.js';
import { UserService } from './user.service.js';
import { updateMasterUserValidator } from './user.validator.js';
import { normalizeExpiryUpdate, withPasswordExpiry } from './password-expiry.js';

const now = new Date('2026-10-19T05:00:00Z');
test('password status matches India calendar boundaries and distinguishes missing dates', () => {
  for (const [date, expired, status] of [
    ['2026-10-19T18:29:59Z', true, 'expired'], ['2020-01-01', true, 'expired'],
    ['2026-10-19T18:30:00Z', false, 'active'], [null, false, 'not-set'], ['invalid', false, 'not-set']
  ]) {
    const user = withPasswordExpiry({ passwordExpiredAt: date, password: 'secret-hash' }, now);
    assert.equal(user.passwordExpired, expired); assert.equal(user.passwordExpiryStatus, status);
    assert.equal(user.password, undefined);
  }
});

test('custom dates use India midnight and preserve untouched fields without mutating input', () => {
  const input = { firstName: 'Test', passwordExpiredAt: '2026-12-31' };
  const update = normalizeExpiryUpdate(input, now);
  assert.equal(update.passwordExpiredAt.toISOString(), '2026-12-30T18:30:00.000Z');
  assert.equal(input.passwordExpiredAt, '2026-12-31');
  assert.deepEqual(normalizeExpiryUpdate({ firstName: 'Test' }, now), { firstName: 'Test' });
});

test('server renewal is three calendar months from today with month-end clamping', () => {
  const input = { passwordExpiryAction: 'extend-three-months' };
  assert.deepEqual(Object.keys(normalizeExpiryUpdate(input, now)), ['passwordExpiredAt']);
  assert.equal(normalizeExpiryUpdate(input, now).passwordExpiredAt.toISOString(), '2027-01-19T05:00:00.000Z');
  assert.equal(normalizeExpiryUpdate(input, new Date('2026-01-31T05:00:00Z')).passwordExpiredAt.toISOString(), '2026-04-30T05:00:00.000Z');
});

test('invalid, cleared, conflicting and unsafe expiry updates are rejected', () => {
  for (const value of [null, '', 'invalid', '2026-02-30', 123, {}, [], '2026-13-01']) {
    assert.throws(() => normalizeExpiryUpdate({ passwordExpiredAt: value }, now), error => error.status === 400);
  }
  for (const input of [
    { passwordExpiryAction: 'invalid' }, { passwordExpiryAction: null },
    { passwordExpiryAction: 'extend-three-months', passwordExpiredAt: '2026-12-31' },
    { passwordExpiryAction: 'extend-three-months', password: 'changed' },
    { passwordExpiredAt: '2026-12-31', password: 'changed' }
  ]) assert.throws(() => normalizeExpiryUpdate(input, now), error => error.status === 400);
});

test('existing model maps the expiry Date without a default, extra index or password exposure', () => {
  const connection = mongoose.createConnection();
  const model = UserModel(connection);
  assert.equal(model.schema.path('passwordExpiredAt').instance, 'Date');
  assert.equal(model.schema.path('passwordExpiredAt').defaultValue, undefined);
  assert.ok(!model.schema.indexes().some(([keys]) => 'passwordExpiredAt' in keys));
});

for (const method of ['updateUser', 'updatePartial']) {
  test(`${method} persists only expiry for renewal, scoped to its user and environment`, async () => {
    const service = new UserService('staging');
    const id = '64a000000000000000000001';
    let writes = 0;
    Object.defineProperty(service, 'model', { get: () => ({ findByIdAndUpdate(userId, update, options) {
      assert.equal(service.dbType, 'staging'); assert.equal(userId, id);
      assert.deepEqual(Object.keys(update.$set), ['passwordExpiredAt']);
      assert.ok(update.$set.passwordExpiredAt instanceof Date);
      assert.equal(options.runValidators, true);
      writes++; return { exec: async () => ({ _id: id, passwordExpiredAt: update.$set.passwordExpiredAt }) };
    } }) });
    const result = await service[method](id, { passwordExpiryAction: 'extend-three-months' });
    assert.equal(writes, 1); assert.equal(result.passwordExpired, false);
    await assert.rejects(async () => service[method](id, { passwordExpiredAt: null }));
    assert.equal(writes, 1);
  });
}

test('PUT/PATCH validators reject bad expiry inputs before services run', async () => {
  for (const body of [{ passwordExpiredAt: null }, { passwordExpiredAt: '2026-02-30' }, { passwordExpiryAction: 'never' }]) {
    const req = { body };
    for (const rule of updateMasterUserValidator) await rule.run(req);
    assert.ok(validationResult(req).array().length > 0);
  }
});
