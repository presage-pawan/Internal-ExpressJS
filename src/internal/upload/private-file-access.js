const id = (value) => String(value?._id ?? value?.id ?? value ?? '');

export const canAccessPrivateUpload = (user, metadata, assignedCompanyIds = []) => {
  if (!user || user.user_status !== 'active' || user.visible === false || !metadata) return false;
  if (String(user.user_role || '').trim().toLowerCase() === 'admin') return true;

  const userId = id(user);
  if (userId && id(metadata.owner_user_id) === userId) return true;

  const companyId = id(metadata.company_id);
  if (!companyId) return false;
  return assignedCompanyIds.some((assignedId) => id(assignedId) === companyId);
};

export const normalizePrivateUploadContext = ({
  fileName,
  folderName = '',
  ownerUserId,
  companyId,
  environment = 'production',
  mimeType,
  size
} = {}) => ({
  file_name: String(fileName || '').trim(),
  folder_name: String(folderName || '').trim(),
  owner_user_id: id(ownerUserId),
  ...(companyId ? { company_id: id(companyId) } : {}),
  environment: environment === 'staging' ? 'staging' : 'production',
  mime_type: String(mimeType || '').trim(),
  size: Number(size || 0),
  visibility: 'private'
});
