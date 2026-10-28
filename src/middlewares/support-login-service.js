import { SUPPORT_LOGIN_DETAILS } from '../configDB.js';
import { isExactSecretMatch } from './support-login-secret.js';

export const isValidSupportLoginServiceKey = (provided, expected = SUPPORT_LOGIN_DETAILS.serviceKey) =>
  isExactSecretMatch(provided, expected);

export const requireSupportLoginService = (req, _res, next) => {
  if (!isValidSupportLoginServiceKey(req.headers?.['x-support-login-key'])) {
    return next(Object.assign(new Error('Unauthorized support-login service'), { status: 401 }));
  }
  return next();
};
