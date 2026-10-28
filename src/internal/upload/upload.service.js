import fs from 'node:fs/promises';
import path from 'path';
import { UploadFilesService } from '../../utils/upload.js';
import { classifyUploadFolder, resolveUploadPath } from './upload-path-policy.js';
import { extensionForUploadedFile, matchesUploadSignature } from './upload-signature-policy.js';

const PUBLIC_UPLOAD_ROOT = path.join(process.cwd(), 'blogs');
const PRIVATE_UPLOAD_ROOT = path.join(process.cwd(), 'uploadFiles');
const SIGNATURE_READ_BYTES = 16;

class UploadService {

    uploadFiles(req) {
        const files = Array.isArray(req.files) ? req.files : [];
        const folderName = req.params?.folderName || '';

        if (!files.length) {
            throw Object.assign(new Error('No files uploaded'), { status: 400 });
        }
        return files.map(file => ({
            name: file.filename,
            type: file.mimetype,
            originalFilename: file.originalname,
            size: file.size,
            container: folderName || null,
            visibility: classifyUploadFolder(folderName)
        }));
    }

    async validateUploadedFiles(files = []) {
        for (const file of files) {
            if (!file?.path) {
                throw Object.assign(new Error('Uploaded file path is unavailable'), { status: 500 });
            }
            const handle = await fs.open(file.path, 'r');
            try {
                const buffer = Buffer.alloc(SIGNATURE_READ_BYTES);
                const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
                const extension = extensionForUploadedFile(file);
                if (!matchesUploadSignature(buffer.subarray(0, bytesRead), extension)) {
                    throw Object.assign(new Error('Uploaded file content does not match its declared type'), { status: 415 });
                }
            } finally {
                await handle.close();
            }
        }
    }

    async cleanupUploadedFiles(files = []) {
        await Promise.allSettled(
            files
                .map(file => file?.path)
                .filter(Boolean)
                .map(filePath => fs.unlink(filePath))
        );
    }

    async uploadBase64(req) {
        const { baseImage, folderName } = req.body || {};
        if (!baseImage) {
            throw Object.assign(new Error('Base64 image is required'), { status: 400 });
        }
        if (!folderName) {
            throw Object.assign(new Error('Folder name is required'), { status: 400 });
        }
        return UploadFilesService.uploadBase64Image(baseImage, folderName);
    }

    resolvePrivateFile(folderName, fileName) {
        const relativePath = folderName ? `${folderName}/${fileName}` : fileName;
        return resolveUploadPath(relativePath, {
            publicRoot: PUBLIC_UPLOAD_ROOT,
            privateRoot: PRIVATE_UPLOAD_ROOT
        }, true);
    }
}

export const uploadService = new UploadService();
