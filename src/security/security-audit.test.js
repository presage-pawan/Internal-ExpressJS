import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSecurityAuditEvent } from './security-audit.js';

test('security audit records actor, target, environment and request context without secrets', () => {
  const event = buildSecurityAuditEvent({
    action: 'support.login.issued',
    actorId: 'actor-1',
    targetType: 'user',
    targetId: 'user@example.com',
    companyId: 'company-1',
    environment: 'staging',
    requestId: 'request-1',
    reason: 'Support investigation',
    metadata: {
      visible: true,
      api_key: 'secret',
      external_token: 'secret-token',
      nested: { password: 'secret-password', count: 2 }
    }
  });

  assert.equal(event.action, 'support.login.issued');
  assert.equal(event.actor_id, 'actor-1');
  assert.equal(event.target_id, 'user@example.com');
  assert.equal(event.company_id, 'company-1');
  assert.equal(event.environment, 'staging');
  assert.equal(event.request_id, 'request-1');
  assert.deepEqual(event.metadata, {
    visible: true,
    nested: { count: 2 }
  });
});

test('unknown environments are normalized to production-safe metadata', () => {
  const event = buildSecurityAuditEvent({ action: 'company.key.generated', environment: 'other' });
  assert.equal(event.environment, 'unknown');
});
