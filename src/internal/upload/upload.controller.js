import fs from 'fs';
import { uploadService } from './upload.service.js';

class UploadController {

    uploadFiles(req, res, next) {
        try {
            const data = uploadService.uploadFiles(req);
            res.status(200).json({
                status: true,
                message: 'Files uploaded successfully',
                data
            });
        } catch (err) {
            next(err);
        }
    }

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
            const filePath = uploadService.resolvePrivateFile(req.params.folderName || '', req.params.fileName);
            await fs.promises.access(filePath, fs.constants.R_OK);
            res.setHeader('Cache-Control', 'private, no-store');
            return res.sendFile(filePath);
        } catch (err) {
            if (err?.code === 'ENOENT') return next(Object.assign(new Error('File not found'), { status: 404 }));
            return next(err);
        }
    };
}

export const uploadController = new UploadController();
