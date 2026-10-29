import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { SapMappingController } from './sap-mapping.controller.js';
import { requireInternalPermission } from '../../middlewares/internal-permission.js';
import {
  createSapMappingValidator,
  listMappingUsersValidator,
  listSapMappingsValidator,
  sapMappingIdValidator,
  updateSapMappingValidator
} from './sap-mapping.validator.js';

const router = Router();
const controller = new SapMappingController();

const requireSapMappingPermission = permission => requireInternalPermission('sap_mapping', permission);

router.get('/options/accounts', requireSapMappingPermission('view'), controller.listAccounts);
router.get('/options/users', requireSapMappingPermission('view'), listMappingUsersValidator, validate, controller.listUsers);
router.get('/', requireSapMappingPermission('view'), listSapMappingsValidator, validate, controller.list);
router.post('/', requireSapMappingPermission('add'), createSapMappingValidator, validate, controller.create);
router.get('/:id', requireSapMappingPermission('view'), sapMappingIdValidator, validate, controller.getById);
router.put('/:id', requireSapMappingPermission('edit'), updateSapMappingValidator, validate, controller.update);
router.delete('/:id', requireSapMappingPermission('delete'), sapMappingIdValidator, validate, controller.remove);

export default router;
