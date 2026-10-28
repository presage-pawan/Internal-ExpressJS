import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { resolveUploadPath } from '../internal/upload/upload-path-policy.js';
import { matchesUploadSignature } from '../internal/upload/upload-signature-policy.js';

const PRIVATE_UPLOAD_ROOT = path.resolve(process.cwd(), 'uploadFiles');
const PUBLIC_UPLOAD_ROOT = path.resolve(process.cwd(), 'blogs');

const ALLOWED_MIME = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];
const MAX_SIZE = 10 * 1024 * 1024;

export class UploadFilesService {

  async uploadBase64Image(base64Image, folderName = '') {
    if (!base64Image || typeof base64Image !== 'string') {
      throw Object.assign(new Error('Base64 image data is required'), { status: 400 });
    }

    const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
    const mimeType = match ? match[1] : 'image/png';
    const base64Data = match ? match[2] : base64Image;

    if (!ALLOWED_MIME.includes(mimeType)) {
      throw Object.assign(new Error('Unsupported file type'), { status: 415 });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > MAX_SIZE) {
      throw Object.assign(new Error('File size exceeds limit'), { status: 413 });
    }

    const extension = mimeType === 'image/jpeg' || mimeType === 'image/jpg' ? 'jpg' : mimeType.split('/')[1];
    if (!matchesUploadSignature(buffer.subarray(0, 16), `.${extension}`)) {
      throw Object.assign(new Error('Base64 file content does not match its declared image type'), { status: 415 });
    }
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const destination = resolveUploadPath(folderName, {
      publicRoot: PUBLIC_UPLOAD_ROOT,
      privateRoot: PRIVATE_UPLOAD_ROOT
    });
    const filePath = path.join(destination, fileName);

    await fs.mkdir(destination, { recursive: true });
    await fs.writeFile(filePath, buffer);

    return {
      originalName: fileName,
      fileName,
      mimeType,
      size: buffer.length,
      folder: folderName,
      visibility: folderName === 'blogs' ? 'public' : 'private'
    };
  }

  async deleteBase64Image(fileName, folderName = '') {
    const destination = resolveUploadPath(folderName, {
      publicRoot: PUBLIC_UPLOAD_ROOT,
      privateRoot: PRIVATE_UPLOAD_ROOT
    });
    const filePath = path.resolve(destination, fileName);
    if (!(filePath === destination || filePath.startsWith(destination + path.sep))) {
      throw Object.assign(new Error('Invalid upload path'), { status: 400 });
    }

    try {
      await fs.unlink(filePath);
      return true;
    } catch (err) {
      if (err.code === 'ENOENT') return false;
      throw err;
    }
  }
}
