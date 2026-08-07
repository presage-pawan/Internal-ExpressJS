import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_UPLOAD_DIR = path.resolve(__dirname, '../../uploadFiles');
const ALLOWED_MIME = [
  /* ===== Images ===== */
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',

  /* ===== PDF ===== */
  'application/pdf',

  /* ===== Word ===== */
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx

  /* ===== Excel ===== */
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export class UploadFilesService {

  async uploadBase64Image(base64Image, folderName = '') {
    if (!base64Image || typeof base64Image !== 'string') {
      throw Object.assign(new Error('Base64 image data is required'), { status: 400 });
    }

    /* ===== Parse base64 ===== */
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

    /* ===== File naming ===== */
    const extension = mimeType.split('/')[1];
    const fileName = `${crypto.randomUUID()}.${extension}`;

    const destination = path.join(BASE_UPLOAD_DIR, folderName);
    const filePath = path.join(destination, fileName);

    /* ===== Write file ===== */
    await fs.mkdir(destination, { recursive: true });
    await fs.writeFile(filePath, buffer);

    /* ===== Return metadata ===== */
    return {
      originalName: fileName,
      fileName,
      mimeType,
      size: buffer.length,
      path: filePath,
      folder: folderName
    };
  }

  async deleteBase64Image(fileName, folderName = '') {
    const filePath = path.join(BASE_UPLOAD_DIR, folderName, fileName);

    try {
      await fs.unlink(filePath);
      return true;
    } catch (err) {
      if (err.code === 'ENOENT') return false;
      throw err;
    }
  }
}
