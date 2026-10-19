const INDIA_OFFSET_MS = 330 * 60_000;
const badRequest = message => Object.assign(new Error(message), { status: 400 });
const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export function parseExpiryDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) {
    throw badRequest('Password expiry must be a valid date, not empty or null.');
  }
  const day = value.slice(0, 10);
  const calendar = new Date(`${day}T00:00:00Z`);
  const date = new Date(value.length === 10 ? `${day}T00:00:00+05:30` : value);
  if (!Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== day || !Number.isFinite(date.getTime())) {
    throw badRequest('Password expiry must be a valid calendar date.');
  }
  return date;
}

export function normalizeExpiryUpdate(data, now = new Date()) {
  const payload = { ...data };
  const hasDate = owns(payload, 'passwordExpiredAt');
  const hasAction = owns(payload, 'passwordExpiryAction');
  if (!hasDate && !hasAction) return payload;
  if (hasAction) {
    if (payload.passwordExpiryAction !== 'extend-three-months' || Object.keys(payload).length !== 1) {
      throw badRequest('Use either a password expiry date or the standalone extend-three-months action.');
    }
    const local = new Date(now.getTime() + INDIA_OFFSET_MS);
    const day = local.getUTCDate();
    local.setUTCDate(1);
    local.setUTCMonth(local.getUTCMonth() + 3);
    const lastDay = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 0)).getUTCDate();
    local.setUTCDate(Math.min(day, lastDay));
    return { passwordExpiredAt: new Date(local.getTime() - INDIA_OFFSET_MS) };
  }
  const editable = new Set(['firstName', 'lastName', 'username', 'email', 'phone_no', 'user_role', 'user_status', 'passwordExpiredAt']);
  if (Object.keys(payload).some(key => !editable.has(key))) {
    throw badRequest('Password expiry changes can only include editable profile fields, never password or account ownership.');
  }
  payload.passwordExpiredAt = parseExpiryDate(payload.passwordExpiredAt);
  return payload;
}

export function withPasswordExpiry(user, now = new Date()) {
  if (!user) return user;
  const data = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete data.password;
  const date = data.passwordExpiredAt ? new Date(data.passwordExpiredAt) : null;
  const valid = date && Number.isFinite(date.getTime());
  const expired = !!valid && new Date(date.getTime() + INDIA_OFFSET_MS).toISOString().slice(0, 10) <=
    new Date(now.getTime() + INDIA_OFFSET_MS).toISOString().slice(0, 10);
  return { ...data, passwordExpiredAt: valid ? date.toISOString() : null,
    passwordExpired: expired, passwordExpiryStatus: valid ? (expired ? 'expired' : 'active') : 'not-set' };
}
