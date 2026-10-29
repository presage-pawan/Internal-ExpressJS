import { CookiesService } from '../utils/cookies.service.js';
import { SECURITY_DETAILS } from '../configDB.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const requireInternalCsrf = (req, _res, next) => {
  if (SAFE_METHODS.has(String(req.method).toUpperCase())) return next();

  // Machine-to-machine bearer calls do not automatically carry browser
  // cookies. They remain governed by independent token and role validation.
  if (!CookiesService.getAuthTokenFromCookie(req)) return next();

  const origin = req.get?.('Origin');
  if (origin && !SECURITY_DETAILS.corsOrigins.includes(origin)) {
    return next(Object.assign(new Error('Untrusted request origin'), { status: 403 }));
  }
  if (!CookiesService.verifyCsrfRequest(req)) {
    return next(Object.assign(new Error('Invalid CSRF token'), { status: 403 }));
  }
  return next();
};
