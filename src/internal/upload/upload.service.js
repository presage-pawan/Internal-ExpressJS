import fs from 'node:fs/promises';
import path from 'path';
import { UploadFilesService } from '../../utils/upload.js';
import { getConnection } from '../../_db/index.js';
import { PrivateUploadModel } from '../../schemas/private-upload.model.js';
import { AssignedCompaniesService } from '../assigned-companies/assigned-companies.service.js';
import { classifyUploadFolder, resolveUploadPath } from './upload-path-policy.js';
import { extensionForUploadedFile, matchesUploadSignature } from './upload-signature-policy.js';
import { canAccessPrivateUpload, normalizePrivateUploadContext } from './private-file-access.js';

const PUBLIC_UPLOAD_ROOT = path.join(process.cwd(), 'blogs');
const PRIVATE_UPLOAD_ROOT = path.join(process.cwd(), 'uploadFiles');
const SIGNATURE_READ_BYTES = 16;
const uploadFilesService = new UploadFilesService();

class UploadService {
    get metadataModel() {
        return PrivateUploadModel(getConnection('production', 'website'));
    }

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

    async recordPrivateUploads(req, files = []) {
        const privateFiles = files.filter(file => file?.visibility !== 'public');
        if (!privateFiles.length) return [];

        const ownerUserId = req.user?._id || req.user?.id;
        if (!ownerUserId) {
            throw Object.assign(new Error('Authenticated upload owner is required'), { status: 401 });
        }

        const folderName = String(req.params?.folderName || req.body?.folderName || '').trim();
        const companyId = req.body?.company_id || req.body?.companyId || undefined;
        const environment = req.db_type === 'staging' ? 'staging' : 'production';
        const docs = privateFiles.map(file => normalizePrivateUploadContext({
            fileName: file.name,
            folderName,
            ownerUserId,
            companyId,
            environment,
            mimeType: file.type,
            size: file.size
        }));

        return this.metadataModel.insertMany(docs, { ordered: true });
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

        const data = await uploadFilesService.uploadBase64Image(baseImage, folderName);
        if (data.visibility === 'public') return data;

        try {
            await this.recordPrivateUploads(req, [{
                name: data.fileName,
                type: data.mimeType,
                size: data.size,
                container: folderName,
                visibility: 'private'
            }]);
            return data;
        } catch (error) {
            await uploadFilesService.deleteBase64Image(data.fileName, folderName);
            throw error;
        }
    }

    async authorizePrivateDownload(req, folderName, fileName) {
        const metadata = await this.metadataModel.findOne({
            folder_name: String(folderName || '').trim(),
            file_name: String(fileName || '').trim(),
            visible: true,
            visibility: 'private'
        });

        if (!metadata) {
            throw Object.assign(new Error('Private file metadata not found'), { status: 404 });
        }

        let assignedCompanyIds = [];
        if (metadata.company_id && String(req.user?.user_role || '').toLowerCase() !== 'admin') {
            const assignments = await new AssignedCompaniesService('production').getCompByUserId({
                user_id: req.user?._id || req.user?.id,
                db_type: metadata.environment || 'production'
            });
            assignedCompanyIds = assignments.flatMap(item => Array.isArray(item.company_ids) ? item.company_ids : []);
        }

        if (!canAccessPrivateUpload(req.user, metadata, assignedCompanyIds)) {
            throw Object.assign(new Error('Private file access denied'), { status: 403 });
        }

        return metadata;
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
