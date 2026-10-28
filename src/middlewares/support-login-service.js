import crypto from 'node:crypto';
import { SUPPORT_LOGIN_DETAILS } from '../configDB.js';

export const isValidSupportLoginServiceKey = (provided, expected = SUPPORT_LOGIN_DETAILS.serviceKey) => {
  const left = Buffer.from(String(provided || ''));
  const right = Buffer.from(String(expected || ''));
  return left.length > 0 && left.length === right.length && crypto.timingSafeEqual(left, right);
};

export const requireSupportLoginService = (req, _res, next) => {
  if (!isValidSupportLoginServiceKey(req.headers?.['x-support-login-key'])) {
    return next(Object.assign(new Error('Unauthorized support-login service'), { status: 401 }));
  }
  return next();
};
