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
}

export const uploadController = new UploadController();
