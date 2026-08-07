import mongoose from 'mongoose';

export const validateObjectId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw Object.assign(new Error('Invalid ID'), { status: 400 });
    }
    return new mongoose.Types.ObjectId(id);
};
