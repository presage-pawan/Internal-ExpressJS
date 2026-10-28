import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCredentialAuditInput } from './company-credential-audit.js';

test('credential audit input binds actor, company, environment and request id without the secret value', () => {
  const input = buildCredentialAuditInput({
    action: 'company.api-key.generated',
    actorId: 'admin-1',
    companyId: 'company-1',
    environment: 'production',
    requestId: 'request-1',
    reason: 'rotation',
    metadata: { visible: true, api_key: 'must-not-survive' }
  });

  assert.equal(input.action, 'company.api-key.generated');
  assert.equal(input.actorId, 'admin-1');
  assert.equal(input.companyId, 'company-1');
  assert.equal(input.requestId, 'request-1');
  assert.equal(input.outcome, 'success');
  assert.deepEqual(input.metadata, { visible: true });
  assert.equal(JSON.stringify(input).includes('must-not-survive'), false);
});
