import { SUPPORT_LOGIN_DETAILS } from '../../configDB.js';
import { buildSupportLoginRequest, resolveSupportLoginBaseUrl } from './support-login.policy.js';

export class SupportLoginService {
  async createGrant({ email, companyId, actorId, dbType, stateChallenge }) {
    const baseUrl = resolveSupportLoginBaseUrl(dbType, SUPPORT_LOGIN_DETAILS);
    const request = buildSupportLoginRequest({
      email,
      companyId,
      actorId,
      environment: dbType,
      stateChallenge
    }, SUPPORT_LOGIN_DETAILS.serviceKey);
    const response = await fetch(`${baseUrl}/api/users/create_external_token`, request);

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok || !payload?.status || !payload?.data?.external_token) {
      throw Object.assign(new Error('CMMS support login grant request failed'), {
        status: response.status >= 400 && response.status < 500 ? response.status : 502
      });
    }

    return payload;
  }
}
