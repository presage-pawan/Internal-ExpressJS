import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploadFiles');
const SAFE_FOLDER_PATTERN = /^[a-zA-Z0-9_-]+$/;

const ALLOWED_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.webp',
    '.pdf',
    '.doc', '.docx',
    '.xls', '.xlsx'
];

const storage = multer.diskStorage({
    destination(req, file, cb) {
        const folderName = req.params.folderName || '';
        if (folderName && !SAFE_FOLDER_PATTERN.test(folderName)) {
            return cb(Object.assign(new Error('Invalid upload folder'), { status: 400 }));
        }
        const targetDir = path.join(UPLOAD_ROOT, folderName);
        if (!targetDir.startsWith(UPLOAD_ROOT)) {
            return cb(Object.assign(new Error('Invalid upload path'), { status: 400 }));
        }

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        cb(null, targetDir);
    },

    filename(req, file, cb) {
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        const timestamp = Date.now();
        cb(null, `${timestamp}_${baseName}${ext}`);
    }
});

export const uploadMiddleware = multer({
    storage,
    limits: {
        files: 12,
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return cb(Object.assign(new Error('Invalid file type'), { status: 415 }));
        }
        cb(null, true);
    }
});
