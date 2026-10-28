import path from 'node:path';

const SAFE_FOLDER_PATTERN = /^[a-zA-Z0-9_-]+$/;

export const classifyUploadFolder = (folderName = '') => folderName === 'blogs' ? 'public' : 'private';

export const resolveUploadPath = (relativeName = '', roots, allowNested = false) => {
  const publicRoot = path.resolve(roots.publicRoot);
  const privateRoot = path.resolve(roots.privateRoot);

  if (!allowNested) {
    if (relativeName && !SAFE_FOLDER_PATTERN.test(relativeName)) {
      throw Object.assign(new Error('Invalid upload folder'), { status: 400 });
    }
    return relativeName === 'blogs'
      ? publicRoot
      : path.resolve(privateRoot, relativeName || '');
  }

  const normalized = String(relativeName || '').replace(/\\/g, '/');
  if (!normalized || normalized.startsWith('/') || normalized.split('/').some(part => !part || part === '.' || part === '..')) {
    throw Object.assign(new Error('Invalid upload path'), { status: 400 });
  }
  const resolved = path.resolve(privateRoot, normalized);
  if (!(resolved === privateRoot || resolved.startsWith(privateRoot + path.sep))) {
    throw Object.assign(new Error('Invalid upload path'), { status: 400 });
  }
  return resolved;
};
