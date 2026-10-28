export const resolveSupportLoginBaseUrl = (dbType, config) => {
  if (dbType === 'production') return config.productionApiUrl;
  if (dbType === 'staging') return config.stagingApiUrl;
  throw Object.assign(new Error('Unsupported CMMS environment'), { status: 400 });
};

export const buildSupportLoginRequest = (email, companyId, serviceKey) => {
  if (!serviceKey) throw Object.assign(new Error('Support login service is not configured'), { status: 503 });
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-support-login-key': serviceKey
    },
    body: JSON.stringify({ email: String(email || '').trim().toLowerCase(), company_id: String(companyId || '').trim() })
  };
};
