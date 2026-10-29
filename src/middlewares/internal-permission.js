import { RoleMenuService } from '../internal/role-menu/role-menu.service.js';

export const hasExplicitInternalPermission = (menu, feature, action = 'view') => {
  if (!menu || !feature || typeof feature !== 'string') return false;
  const grant = menu[feature];
  if (!grant || grant.view !== true || grant[action] !== true) return false;
  return !grant.parent || menu[grant.parent]?.view === true;
};

export const requireAnyInternalPermission = (feature, actions, serviceFactory = dbType => new RoleMenuService(dbType)) =>
  async (req, _res, next) => {
    try {
      if (!req.user || req.user.user_status !== 'active' || req.user.visible === false) {
        throw Object.assign(new Error('Forbidden'), { status: 403 });
      }
      const userId = req.user._id || req.user.id;
      if (!userId) throw Object.assign(new Error('Forbidden'), { status: 403 });
      const roles = await serviceFactory(req.db_type).getRoles({ userId, visible: true });
      const menu = roles?.[0]?.roleMenu;
      if (!actions.some(action => hasExplicitInternalPermission(menu, feature, action))) {
        throw Object.assign(new Error('Forbidden'), { status: 403 });
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };

export const requireInternalPermission = (feature, action, serviceFactory) =>
  requireAnyInternalPermission(feature, [action], serviceFactory);
