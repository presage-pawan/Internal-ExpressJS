const SELF_PROFILE_FIELDS = new Set(['firstName', 'lastName', 'phone_no', 'jobTitle', 'about']);
const ADMIN_PROFILE_FIELDS = new Set([
  'firstName', 'lastName', 'username', 'phone_no', 'email', 'emailStatus',
  'user_status', 'user_role', 'jobTitle', 'about', 'visible'
]);
const CREATE_FIELDS = new Set([...ADMIN_PROFILE_FIELDS, 'password']);

const pick = (payload, allowed) => Object.fromEntries(
  Object.entries(payload || {}).filter(([key]) => allowed.has(key))
);

export const pickSelfProfileFields = (payload) => pick(payload, SELF_PROFILE_FIELDS);
export const pickAdminProfileFields = (payload) => pick(payload, ADMIN_PROFILE_FIELDS);
export const pickCreateUserFields = (payload) => pick(payload, CREATE_FIELDS);
