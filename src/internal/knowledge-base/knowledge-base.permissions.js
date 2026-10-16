import { RoleMenuService } from '../role-menu/role-menu.service.js';

const unauthorized = () => Object.assign(new Error('An active internal login is required.'), { status: 401 });
const forbidden = () => Object.assign(new Error('Your role does not allow this knowledge-base action.'), { status: 403 });

export function guideRolePermissions(roleMenu, role) {
  const enabled = role === 'admin';
  const parent = roleMenu?.master_knowledge_base === undefined
    ? { view: enabled }
    : roleMenu.master_knowledge_base;
  const child = roleMenu?.knowledge_base === undefined
    ? { view: enabled, add: enabled, edit: enabled, delete: enabled }
    : roleMenu.knowledge_base;
  const view = parent?.view === true && child?.view === true;
  return {
    view,
    add: view && child?.add === true,
    edit: view && child?.edit === true,
    delete: view && child?.delete === true
  };
}

export const createGuidePublisherMiddleware = (
  roleMenuServiceFactory = req => new RoleMenuService(req.db_type)
) => async (req, _res, next) => {
  try {
    const id = String(req.user?.id || req.user?._id || '');
    const role = String(req.user?.user_role || '');
    if (!/^[a-f0-9]{24}$/i.test(id) || !role) {
      throw unauthorized();
    }
    const roles = await roleMenuServiceFactory(req).getRoles({
      userId: id,
      roleName: role,
      visible: { $ne: false }
    });
    const currentRole = roles.find(record =>
      String(record.userId) === id && record.roleName === role && record.visible !== false
    );
    if (!currentRole) {
      throw forbidden();
    }
    req.guidePublisher = {
      id,
      permissions: guideRolePermissions(currentRole.roleMenu, role)
    };
    next();
  } catch (error) {
    next(error);
  }
};

export const requireGuidePermission = action => (req, _res, next) => {
  const permissions = req.guidePublisher?.permissions;
  if (!permissions?.view || !permissions[action]) {
    next(forbidden());
    return;
  }
  next();
};
