import { Schema } from 'mongoose';

export const uploadSchema = new Schema({
    originalName: { type: String, trim: true, select: false },
    type: { type: String, trim: true },
    destination: { type: String, trim: true, select: false },
    folderName: { type: String, trim: true },
    fileName: { type: String, trim: true },
    filePath: { type: String, trim: true, select: false },
    fileURL: { type: String, trim: true },
    size: { type: Number }
}, {
    _id: false,
    timestamps: true,
    versionKey: false
});

export const UploadModel = (connection) => {
    if (!connection) throw new Error('Database connection not provided');
    return connection.models.Schema_Upload || connection.model('Schema_Upload', uploadSchema);
};
