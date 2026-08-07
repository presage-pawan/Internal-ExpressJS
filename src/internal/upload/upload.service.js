import { UploadFilesService } from '../../utils/upload.js';

class UploadService {

    uploadFiles(req) {
        const files = Array.isArray(req.files) ? req.files : [];
        const folderName = req.params?.folderName || null;

        if (!files.length) {
            throw Object.assign(new Error('No files uploaded'), { status: 400 });
        }
        return files.map(file => ({
            name: file.filename,
            type: file.mimetype,
            destination: file.destination,
            field: file.fieldname,
            originalFilename: file.originalname,
            size: file.size,
            container: folderName
        }));
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
}

export const uploadService = new UploadService();
