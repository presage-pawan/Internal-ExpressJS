import fs from 'fs';
import { uploadService } from './upload.service.js';

class UploadController {

    uploadFiles = async (req, res, next) => {
        const files = Array.isArray(req.files) ? req.files : [];
        try {
            await uploadService.validateUploadedFiles(files);
            const data = uploadService.uploadFiles(req);
            await uploadService.recordPrivateUploads(req, data);
            return res.status(200).json({
                status: true,
                message: 'Files uploaded successfully',
                data
            });
        } catch (err) {
            await uploadService.cleanupUploadedFiles(files);
            return next(err);
        }
    };

    async uploadBase64(req, res, next) {
        try {
            const data = await uploadService.uploadBase64(req);
            res.status(200).json({
                status: true,
                message: 'Base64 file uploaded',
                data
            });
        } catch (err) {
            next(err);
        }
    }

    downloadPrivate = async (req, res, next) => {
        try {
            const folderName = req.params.folderName || '';
            const fileName = req.params.fileName;
            await uploadService.authorizePrivateDownload(req, folderName, fileName);
            const filePath = uploadService.resolvePrivateFile(folderName, fileName);
            await fs.promises.access(filePath, fs.constants.R_OK);
            res.setHeader('Cache-Control', 'private, no-store');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            return res.sendFile(filePath);
        } catch (err) {
            if (err?.code === 'ENOENT') return next(Object.assign(new Error('File not found'), { status: 404 }));
            return next(err);
        }
    };
}

export const uploadController = new UploadController();
