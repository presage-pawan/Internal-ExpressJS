import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pairs = [
  ['master/asset-report/asset-report', 'accountId'],
  ['master/asset/asset', 'account_id'],
  ['master/floor-map/floor-map', 'account_id'],
  ['master/form-category/form-category', 'account_id'],
  ['master/form/form', 'account_id'],
  ['master/location-report/location-report', 'account_id'],
  ['master/location/location', 'account_id'],
  ['master/mail-log/mail-log', 'account_id'],
  ['master/observation/observation', 'accountId'],
  ['master/part/part', 'account_id'],
  ['master/post/post', 'account_id'],
  ['master/schedule/schedule', 'account_id'],
  ['master/troubleshoot-guide/troubleshoot-guide', 'account_id'],
  ['master/user/user', 'account_id'],
  ['mapping/map-user-inspection/map-user-inspection', 'account_id'],
  ['mapping/map-user-location/map-user-location', 'account_id'],
  ['mapping/map-user/map-user', 'account_id'],
  ['work/work-inspection/work-inspection', 'account_id'],
  ['work/work-instructions/work-instructions', 'account_id'],
  ['work/work-order-comment/work-order-comment', 'account_id'],
  ['work/work-request/work-request', 'account_id'],
  ['work/work-order/work-order', 'account_id']
];

for (const [base, field] of pairs) {
  test(`${base} binds ID operations to company scope`, () => {
    const service = fs.readFileSync(new URL(`./${base}.service.js`, import.meta.url), 'utf8');
    const controller = fs.readFileSync(new URL(`./${base}.controller.js`, import.meta.url), 'utf8');

    assert.match(service, /buildResourceScopeFilter|buildWorkOrderIdentityFilter/, 'service must build a scoped identity filter');
    assert.match(service, new RegExp(field), 'service must use the module tenant field');
    assert.match(controller, /companyId:\s*req\.companyId|,\s*req\.companyId\)/, 'controller must pass company context');
  });
}
