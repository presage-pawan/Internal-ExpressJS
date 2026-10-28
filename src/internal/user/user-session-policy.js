export const shouldRevokeSessions = (payload = {}, resultingUser = null) => {
  const sensitiveKeys = ['password', 'user_role', 'userrole', 'user_status', 'userstatus', 'visible'];
  if (sensitiveKeys.some((key) => Object.prototype.hasOwnProperty.call(payload, key))) {
    return true;
  }
  return resultingUser?.user_status === 'inactive' || resultingUser?.visible === false;
};
