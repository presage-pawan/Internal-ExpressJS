import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesUploadSignature } from './upload-signature-policy.js';

test('accepts supported file signatures for their declared extensions', () => {
  assert.equal(matchesUploadSignature(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), '.png'), true);
  assert.equal(matchesUploadSignature(Buffer.from([0xff,0xd8,0xff,0xe0]), '.jpg'), true);
  assert.equal(matchesUploadSignature(Buffer.from('%PDF-1.7'), '.pdf'), true);
  assert.equal(matchesUploadSignature(Buffer.from([0x50,0x4b,0x03,0x04]), '.docx'), true);
  assert.equal(matchesUploadSignature(Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]), '.xls'), true);
});

test('rejects mismatched or executable content even when the extension is allowed', () => {
  assert.equal(matchesUploadSignature(Buffer.from('MZ fake executable'), '.pdf'), false);
  assert.equal(matchesUploadSignature(Buffer.from('%PDF-1.7'), '.jpg'), false);
  assert.equal(matchesUploadSignature(Buffer.from('not an office container'), '.docx'), false);
});

test('validates WEBP as RIFF with WEBP container marker', () => {
  const valid = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')]);
  const invalid = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVE')]);
  assert.equal(matchesUploadSignature(valid, '.webp'), true);
  assert.equal(matchesUploadSignature(invalid, '.webp'), false);
});
