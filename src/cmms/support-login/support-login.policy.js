export const resolveSupportLoginBaseUrl = (dbType, config) => {
  if (dbType === 'production') return config.productionApiUrl;
  if (dbType === 'staging') return config.stagingApiUrl;
  throw Object.assign(new Error('Unsupported CMMS environment'), { status: 400 });
};

export const buildSupportLoginRequest = (input, serviceKey) => {
  if (!serviceKey) throw Object.assign(new Error('Support login service is not configured'), { status: 503 });

  const email = String(input?.email || '').trim().toLowerCase();
  const companyId = String(input?.companyId || '').trim();
  const actorId = String(input?.actorId || '').trim();
  const environment = String(input?.environment || '').trim().toLowerCase();
  const stateChallenge = String(input?.stateChallenge || '').trim();

  if (!email || !companyId || !actorId || !['staging', 'production'].includes(environment) || stateChallenge.length < 32) {
    throw Object.assign(new Error('Complete support login context is required'), { status: 400 });
  }

  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-support-login-key': serviceKey
    },
    body: JSON.stringify({
      email,
      company_id: companyId,
      actor_id: actorId,
      environment,
      state_challenge: stateChallenge
    })
  };
};
