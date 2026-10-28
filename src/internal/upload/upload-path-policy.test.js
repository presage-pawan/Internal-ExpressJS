import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { classifyUploadFolder, resolveUploadPath } from './upload-path-policy.js';

test('only blogs are classified as public uploads', () => {
  assert.equal(classifyUploadFolder('blogs'), 'public');
  assert.equal(classifyUploadFolder('invoices'), 'private');
  assert.equal(classifyUploadFolder(''), 'private');
});

test('upload paths stay inside their configured roots', () => {
  const roots = { publicRoot: '/srv/blogs', privateRoot: '/srv/uploadFiles' };
  assert.equal(resolveUploadPath('blogs', roots), path.join('/srv/blogs'));
  assert.equal(resolveUploadPath('invoices', roots), path.join('/srv/uploadFiles', 'invoices'));
  assert.throws(() => resolveUploadPath('../secret', roots), /Invalid upload folder/);
});

test('nested file reads reject traversal', () => {
  const roots = { publicRoot: '/srv/blogs', privateRoot: '/srv/uploadFiles' };
  assert.equal(resolveUploadPath('invoices/report.pdf', roots, true), path.join('/srv/uploadFiles', 'invoices', 'report.pdf'));
  assert.throws(() => resolveUploadPath('../etc/passwd', roots, true), /Invalid upload path/);
});
