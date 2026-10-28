import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('raw uploadFiles directory is not mounted at the application root', () => {
  const app = read('../app.js');
  assert.doesNotMatch(app, /app\.use\(\s*['"]\/['"]\s*,\s*express\.static\([^\n]*uploadFiles/);
});

test('flat CMMS master and mapping aliases require global admin authority', () => {
  const master = read('../cmms/master/master.routes.js');
  const mapping = read('../cmms/mapping/mapping.routes.js');
  for (const route of [
    'users','assets','parts','equipments','schedules','observations','forms','form-categories',
    'asset-reports','location-reports','floor-maps','helps','mail-logs','posts','troubleshoot-guides'
  ]) {
    assert.match(master, new RegExp(`router\\.use\\('/${route}',\\s*requireInternalAction\\('cmms\\.global\\.manage'\\)`), route);
  }
  for (const route of ['map-user','map-user-inspection','map-user-location','map-user-work-orders']) {
    assert.match(mapping, new RegExp(`router\\.use\\('/${route}',\\s*requireInternalAction\\('cmms\\.global\\.manage'\\)`), route);
  }
});

test('CMMS user routes have an unambiguous company namespace and specific routes precede generic CRUD', () => {
  const users = read('../cmms/users/users.routes.js');
  assert.match(users, /router\.use\('\/company\/:companyId',\s*companyContext,\s*companyRouter\)/);
  assert.doesNotMatch(users, /router\.use\('\/:companyId',\s*companyContext/);

  const logs = users.indexOf("router.use('/logs'");
  const tokens = users.indexOf("router.use('/tokens'");
  const roles = users.indexOf("router.use('/role-menus'");
  const verifications = users.indexOf("router.use('/verifications'");
  const generic = users.indexOf("router.use('/', requireInternalAction('cmms.global.manage')");
  assert.ok(logs >= 0 && tokens >= 0 && roles >= 0 && verifications >= 0 && generic >= 0);
  assert.ok(logs < generic && tokens < generic && roles < generic && verifications < generic);
});
