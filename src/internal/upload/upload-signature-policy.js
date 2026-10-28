import path from 'node:path';

const startsWith = (buffer, signature) =>
  Buffer.isBuffer(buffer)
  && buffer.length >= signature.length
  && signature.every((byte, index) => buffer[index] === byte);

const ZIP_SIGNATURES = [
  [0x50, 0x4b, 0x03, 0x04],
  [0x50, 0x4b, 0x05, 0x06],
  [0x50, 0x4b, 0x07, 0x08]
];

const OLE_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

export const matchesUploadSignature = (buffer, extension) => {
  const ext = String(extension || '').toLowerCase();
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return false;

  if (ext === '.png') return startsWith(buffer, [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  if (ext === '.jpg' || ext === '.jpeg') return startsWith(buffer, [0xff,0xd8,0xff]);
  if (ext === '.pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (ext === '.webp') {
    return buffer.length >= 12
      && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
      && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  if (ext === '.doc' || ext === '.xls') return startsWith(buffer, OLE_SIGNATURE);
  if (ext === '.docx' || ext === '.xlsx') return ZIP_SIGNATURES.some(signature => startsWith(buffer, signature));
  return false;
};

export const extensionForUploadedFile = (file = {}) =>
  path.extname(String(file.originalname || file.filename || '')).toLowerCase();
