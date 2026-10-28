import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessPrivateUpload, normalizePrivateUploadContext } from './private-file-access.js';

const admin = { _id: 'admin-1', user_role: 'admin', user_status: 'active', visible: true };
const worker = { _id: 'worker-1', user_role: 'worker', user_status: 'active', visible: true };

test('admin can access metadata-backed private files', () => {
  assert.equal(canAccessPrivateUpload(admin, { owner_user_id: 'other-1' }, []), true);
});

test('uploader can access own private file', () => {
  assert.equal(canAccessPrivateUpload(worker, { owner_user_id: 'worker-1' }, []), true);
});

test('assigned company member can access a company-scoped private file', () => {
  assert.equal(canAccessPrivateUpload(worker, { owner_user_id: 'other-1', company_id: 'company-1' }, ['company-1']), true);
});

test('foreign user and missing metadata are denied', () => {
  assert.equal(canAccessPrivateUpload(worker, { owner_user_id: 'other-1', company_id: 'company-2' }, ['company-1']), false);
  assert.equal(canAccessPrivateUpload(worker, null, ['company-1']), false);
});

test('normalizes metadata from authenticated request context', () => {
  assert.deepEqual(normalizePrivateUploadContext({
    fileName: 'file.pdf', folderName: 'invoices', ownerUserId: 'worker-1',
    companyId: 'company-1', environment: 'production', mimeType: 'application/pdf', size: 12
  }), {
    file_name: 'file.pdf', folder_name: 'invoices', owner_user_id: 'worker-1',
    company_id: 'company-1', environment: 'production', mime_type: 'application/pdf', size: 12,
    visibility: 'private'
  });
});
