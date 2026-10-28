import test from 'node:test';
import assert from 'node:assert/strict';
import { validationResult } from 'express-validator';
import { createUserValidator, passwordChangeValidator } from './user.validator.js';

const validate = async (validators, body) => {
  const req = { body };
  for (const validator of validators) await validator.run(req);
  return validationResult(req).array().map(error => error.msg);
};

test('create-user password requires a real numeric digit', async () => {
  const valid = await validate(createUserValidator, {
    firstName: 'Test',
    username: 'test-user',
    password: 'Secure123',
    email: 'test@example.com'
  });
  assert.equal(valid.includes('Password must contain a number'), false);

  const invalid = await validate(createUserValidator, {
    firstName: 'Test',
    username: 'test-user',
    password: 'Secureddd',
    email: 'test@example.com'
  });
  assert.equal(invalid.includes('Password must contain a number'), true);
});

test('password-change rule requires a real numeric digit', async () => {
  const valid = await validate(passwordChangeValidator, { newPassword: 'Changed123' });
  assert.equal(valid.includes('Password must contain a number'), false);

  const invalid = await validate(passwordChangeValidator, { newPassword: 'Changedddd' });
  assert.equal(invalid.includes('Password must contain a number'), true);
});
