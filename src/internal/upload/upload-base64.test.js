import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { UploadFilesService } from '../../utils/upload.js';

const onePixelPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

test('base64 private upload uses instance API, writes under private root, and can be deleted', async () => {
  const service = new UploadFilesService();
  const folder = 'security-test-private';
  const result = await service.uploadBase64Image(onePixelPng, folder);
  const filePath = path.join(process.cwd(), 'uploadFiles', folder, result.fileName);

  try {
    const stat = await fs.stat(filePath);
    assert.equal(stat.isFile(), true);
    assert.equal(result.visibility, 'private');
    assert.equal(result.mimeType, 'image/png');
  } finally {
    await service.deleteBase64Image(result.fileName, folder);
    await fs.rm(path.join(process.cwd(), 'uploadFiles', folder), { recursive: true, force: true });
  }
});
