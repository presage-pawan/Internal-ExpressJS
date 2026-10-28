import crypto from 'node:crypto';

export const isExactSecretMatch = (provided, expected) => {
  const left = Buffer.from(String(provided || ''));
  const right = Buffer.from(String(expected || ''));
  return left.length > 0 && left.length === right.length && crypto.timingSafeEqual(left, right);
};
