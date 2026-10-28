import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const controllers = [
  ['master/asset-report/asset-report.controller.js', 'accountId'],
  ['master/asset/asset.controller.js', 'account_id'],
  ['master/floor-map/floor-map.controller.js', 'account_id'],
  ['master/form-category/form-category.controller.js', 'account_id'],
  ['master/form/form.controller.js', 'account_id'],
  ['master/location-report/location-report.controller.js', 'account_id'],
  ['master/location/location.controller.js', 'account_id'],
  ['master/mail-log/mail-log.controller.js', 'account_id'],
  ['master/observation/observation.controller.js', 'accountId'],
  ['master/part/part.controller.js', 'account_id'],
  ['master/post/post.controller.js', 'account_id'],
  ['master/schedule/schedule.controller.js', 'account_id'],
  ['master/troubleshoot-guide/troubleshoot-guide.controller.js', 'account_id'],
  ['master/user/user.controller.js', 'account_id'],
  ['mapping/map-user-inspection/map-user-inspection.controller.js', 'account_id'],
  ['mapping/map-user-location/map-user-location.controller.js', 'account_id'],
  ['mapping/map-user/map-user.controller.js', 'account_id'],
  ['work/work-inspection/work-inspection.controller.js', 'account_id'],
  ['work/work-instructions/work-instructions.controller.js', 'account_id'],
  ['work/work-order-comment/work-order-comment.controller.js', 'account_id'],
  ['work/work-request/work-request.controller.js', 'account_id'],
  ['work/work-order/work-order.controller.js', 'account_id']
];

for (const [path, field] of controllers) {
  test(`${path} binds tenant field on scoped writes`, () => {
    const source = fs.readFileSync(new URL(`./${path}`, import.meta.url), 'utf8');
    assert.match(source, /bindCompanyPayload/, 'controller must use shared tenant payload binding');
    assert.match(source, new RegExp(`bindCompanyPayload\\([^)]*req\\.companyId[^)]*['"]${field}['"]`), 'controller must bind the correct tenant field');
  });
}
