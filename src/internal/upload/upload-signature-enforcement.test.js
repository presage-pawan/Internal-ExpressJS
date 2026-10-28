import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { uploadService } from './upload.service.js';

test('validates persisted upload bytes before returning success', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'internal-upload-signature-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));

  const goodPath = path.join(dir, 'good.pdf');
  await fs.writeFile(goodPath, Buffer.from('%PDF-1.7\nfixture'));
  await assert.doesNotReject(() => uploadService.validateUploadedFiles([
    { path: goodPath, originalname: 'report.pdf', filename: 'good.pdf' }
  ]));
});

test('rejects extension-only spoofed uploads', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'internal-upload-signature-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));

  const fakePath = path.join(dir, 'fake.pdf');
  await fs.writeFile(fakePath, Buffer.from('MZ fake executable'));
  await assert.rejects(
    () => uploadService.validateUploadedFiles([
      { path: fakePath, originalname: 'report.pdf', filename: 'fake.pdf' }
    ]),
    (error) => error?.status === 415
  );
});
