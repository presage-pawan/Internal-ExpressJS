import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { SapMappingController } from './sap-mapping.controller.js';
import { RoleMenuService } from '../role-menu/role-menu.service.js';
import {
  createSapMappingValidator,
  listMappingUsersValidator,
  listSapMappingsValidator,
  sapMappingIdValidator,
  updateSapMappingValidator
} from './sap-mapping.validator.js';

const router = Router();
const controller = new SapMappingController();

const requireSapMappingPermission = (permission) => async (req, res, next) => {
  try {
    if (!req.user) throw Object.assign(new Error('Forbidden'), { status: 403 });
    if (req.user.user_role === 'admin') return next();

    const userId = req.user?._id || req.user?.id;
    const roles = await new RoleMenuService(req.db_type).getRoles({ userId, visible: true });
    const permissions = roles[0]?.roleMenu?.sap_mapping;
    if (!permissions?.[permission]) throw Object.assign(new Error('Forbidden'), { status: 403 });
    return next();
  } catch (error) {
    return next(error);
  }
};

router.get('/options/accounts', requireSapMappingPermission('view'), controller.listAccounts);
router.get('/options/users', requireSapMappingPermission('view'), listMappingUsersValidator, validate, controller.listUsers);
router.get('/', requireSapMappingPermission('view'), listSapMappingsValidator, validate, controller.list);
router.post('/', requireSapMappingPermission('add'), createSapMappingValidator, validate, controller.create);
router.get('/:id', requireSapMappingPermission('view'), sapMappingIdValidator, validate, controller.getById);
router.put('/:id', requireSapMappingPermission('edit'), updateSapMappingValidator, validate, controller.update);
router.delete('/:id', requireSapMappingPermission('delete'), sapMappingIdValidator, validate, controller.remove);

export default router;
