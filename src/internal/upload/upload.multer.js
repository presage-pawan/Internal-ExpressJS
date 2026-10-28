import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { resolveUploadPath } from './upload-path-policy.js';

const PUBLIC_UPLOAD_ROOT = path.join(process.cwd(), 'blogs');
const PRIVATE_UPLOAD_ROOT = path.join(process.cwd(), 'uploadFiles');

const ALLOWED_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.webp',
    '.pdf',
    '.doc', '.docx',
    '.xls', '.xlsx'
];

const storage = multer.diskStorage({
    destination(req, file, cb) {
        try {
            const folderName = req.params.folderName || '';
            const targetDir = resolveUploadPath(folderName, {
                publicRoot: PUBLIC_UPLOAD_ROOT,
                privateRoot: PRIVATE_UPLOAD_ROOT
            });

            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            cb(null, targetDir);
        } catch (error) {
            cb(error);
        }
    },

    filename(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        const timestamp = Date.now();
        cb(null, `${timestamp}_${baseName}${ext}`);
    }
});

export const uploadMiddleware = multer({
    storage,
    limits: {
        files: 12,
        fileSize: 10 * 1024 * 1024
    },
    fileFilter(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return cb(Object.assign(new Error('Invalid file type'), { status: 415 }));
        }
        cb(null, true);
    }
});
