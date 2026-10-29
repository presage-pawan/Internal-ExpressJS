/**
 * Legacy account-flag compatibility: account operators may no longer disable
 * cookie authentication. Existing enabled values are accepted but not stored.
 */
export function assertCookieAuthEnabled(payload) {
  if (!payload || typeof payload !== 'object') return;

  for (const field of ['cookie_status', 'cookies_status']) {
    if (!Object.prototype.hasOwnProperty.call(payload, field)) continue;
    const value = payload[field];
    if (value === true || (typeof value === 'string' && value.trim().toLowerCase() === 'enabled')) continue;

    const error = new Error('Cookie authentication cannot be disabled');
    error.status = 400;
    error.code = 'INVALID_ACCOUNT_AUTH_MODE';
    throw error;
  }
}
