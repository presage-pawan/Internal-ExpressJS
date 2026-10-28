import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalWorkflowRequired } from './canonical-workflow.js';

test('direct Internal workflow mutation fails closed with a stable conflict code', async () => {
  const error = await new Promise(resolve => canonicalWorkflowRequired({}, {}, resolve));
  assert.equal(error.status, 409);
  assert.equal(error.code, 'CMMS_CANONICAL_WORKFLOW_REQUIRED');
});
