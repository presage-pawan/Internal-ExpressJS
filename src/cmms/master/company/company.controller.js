import { validateObjectId } from '../../../utils/helper.js';
import { RoleMenuService } from '../../../internal/role-menu/role-menu.service.js';
import { CompanyService } from './company.service.js';
import { AssignedCompaniesService } from '../../../internal/assigned-companies/assigned-companies.service.js';
import { stripCompanySecrets } from './company-security.js';
import { requestAuditContext, writeSecurityAudit } from '../../../security/security-audit.service.js';
import { buildCredentialAuditInput } from './company-credential-audit.js';

export class CompanyController {

  getService = (req) => new CompanyService(req.db_type);
  getInternalService = (req) => new AssignedCompaniesService(req.db_type);

  getRoleMenuService = (req) => new RoleMenuService(req.db_type);

  credentialAuditInput = (req, action, companyId, metadata = {}) =>
    buildCredentialAuditInput({
      action,
      actorId: req.user?.id || req.user?._id,
      companyId,
      environment: req.db_type,
      requestId: req.headers?.['x-request-id'] || req.headers?.['x-correlation-id'],
      reason: req.body?.reason,
      metadata
    });

  auditCredentialAction = (req, action, companyId, outcome = 'success', metadata = {}) =>
    writeSecurityAudit({
      ...requestAuditContext(req),
      action,
      targetType: 'company-credential',
      targetId: companyId,
      companyId,
      reason: req.body?.reason,
      outcome,
      metadata
    });

  assertCanManageAccountPermissions = async (req) => {
    if (req.user?.user_role === 'admin') {
      return;
    }

    const roleMenus = await this.getRoleMenuService(req).getRoles({
      userId: req.user?._id || req.user?.id,
      roleName: req.user?.user_role,
      visible: true
    });
    const roleMenu = roleMenus?.[0]?.roleMenu || {};
    const canEdit = Boolean(roleMenu.account_management?.edit);

    if (!canEdit) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }
  };

  create = async (req, res, next) => {
    try {
      const data = await this.getService(req).create(req.body);
      if (!data) {
        throw Object.assign(new Error('Account not found'), { status: 404 });
      }
      res.status(201).json({ status: true, message: 'Account created successfully', data });
    } catch (err) {
      next(err);
    }
  };

  getAll = async (req, res, next) => {
    try {
      const service = this.getService(req);
      const filter = service.buildListFilter(req.query);
      const data = await service.findAllWithTokens(filter, { sort: { account_name: 1 } });

      let finalRes = data;

      if (req.user?.user_role !== 'admin') {
        const internalFilter = {
          user_id: req.user.id,
          db_type: req.db_type
        };

        const assignedCompList = await this.getInternalService(req).getCompByUserId(internalFilter);
        const assignedIds = assignedCompList[0]?.company_ids?.map(id => String(id)) || [];

        finalRes = data.filter(item =>
          assignedIds.includes(String(item._id || item.id))
        );
      }

      res.status(200).json({ status: true, message: 'Accounts fetched successfully', data: finalRes.map(stripCompanySecrets) });

    } catch (err) {
      next(err);
    }
  };

  getById = async (req, res, next) => {
    try {
      const data = await this.getService(req).findByIdWithTokens(validateObjectId(req.params.id));
      if (!data) {
        throw Object.assign(new Error('Account not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Account fetched successfully', data: stripCompanySecrets(data) });
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const data = await this.getService(req).update(validateObjectId(req.params.id), req.body);
      if (!data) {
        throw Object.assign(new Error('Account not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Account updated successfully', data });
    } catch (err) {
      next(err);
    }
  };

  updatePartial = async (req, res, next) => {
    try {
      const data = await this.getService(req).updatePartial(validateObjectId(req.params.id), req.body);
      if (!data) {
        throw Object.assign(new Error('Account not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Account updated successfully', data });
    } catch (err) {
      next(err);
    }
  };

  updateSubscription = async (req, res, next) => {
    try {
      const data = await this.getService(req).updateSubscription(validateObjectId(req.params.id), req.body);
      if (!data) {
        throw Object.assign(new Error('Account not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Account subscription updated successfully', data });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      const data = await this.getService(req).delete(validateObjectId(req.params.id), req.user?.id);
      if (!data) {
        throw Object.assign(new Error('Account not found'), { status: 404 });
      }
      res.status(200).json({ status: true, message: 'Account deleted successfully' });
    } catch (err) {
      next(err);
    }
  };

  getAccountRoleMenu = async (req, res, next) => {
    try {
      await this.assertCanManageAccountPermissions(req);
      const data = await this.getService(req).getAccountRoleMenu(validateObjectId(req.params.id));
      res.status(200).json({ status: true, message: 'Account permissions fetched successfully', data });
    } catch (err) {
      next(err);
    }
  };

  updateAccountRoleMenu = async (req, res, next) => {
    try {
      await this.assertCanManageAccountPermissions(req);
      const data = await this.getService(req).updateAccountRoleMenu(
        validateObjectId(req.params.id),
        req.body,
        req.user?._id || req.user?.id
      );
      res.status(200).json({ status: true, message: 'Account permissions updated successfully', data });
    } catch (err) {
      next(err);
    }
  };

  resetAccountRoleMenu = async (req, res, next) => {
    try {
      await this.assertCanManageAccountPermissions(req);
      const data = await this.getService(req).resetAccountRoleMenu(
        validateObjectId(req.params.id),
        req.body,
        req.user?._id || req.user?.id
      );
      res.status(200).json({ status: true, message: 'Account permissions reset successfully', data });
    } catch (err) {
      next(err);
    }
  };

  getApiKey = async (req, res, next) => {
    try {
      const id = validateObjectId(req.params.id);
      const data = await this.getService(req).getApiKey(id);
      await this.auditCredentialAction(req, 'company.api-key.read', String(id));
      res.status(200).json({ status: true, message: 'Account API key fetched successfully', data });
    } catch (err) {
      next(err);
    }
  };

  generateApiKey = async (req, res, next) => {
    try {
      const id = validateObjectId(req.params.id);
      const data = await this.getService(req).generateApiKey(
        id,
        this.credentialAuditInput(req, 'company.api-key.generated', String(id))
      );
      res.status(200).json({ status: true, message: 'Account API key generated successfully', data });
    } catch (err) {
      next(err);
    }
  };

  removeApiKey = async (req, res, next) => {
    try {
      const id = validateObjectId(req.params.id);
      const data = await this.getService(req).removeApiKey(
        id,
        this.credentialAuditInput(req, 'company.api-key.deactivated', String(id))
      );
      res.status(200).json({ status: true, message: 'Account API key deactivated successfully', data });
    } catch (err) {
      next(err);
    }
  };

  toggleApiKeyStatus = async (req, res, next) => {
    try {
      const id = validateObjectId(req.params.id);
      const visible = req.body?.visible !== undefined ? Boolean(req.body.visible) : undefined;
      const service = this.getService(req);
      const data = await service.toggleApiKeyStatus(
        id,
        visible,
        this.credentialAuditInput(req, 'company.api-key.status-changed', String(id), { visible })
      );
      const action = data.visible ? 'activated' : 'deactivated';
      res.status(200).json({ status: true, message: `Account API key ${action} successfully`, data });
    } catch (err) {
      next(err);
    }
  };

  getDownloadApiKey = async (req, res, next) => {
    try {
      const id = validateObjectId(req.params.id);
      const data = await this.getService(req).getDownloadApiKey(id);
      await this.auditCredentialAction(req, 'company.download-key.read', String(id));
      res.status(200).json({ status: true, message: 'Account download API key fetched successfully', data });
    } catch (err) {
      next(err);
    }
  };

  generateDownloadApiKey = async (req, res, next) => {
    try {
      const id = validateObjectId(req.params.id);
      const data = await this.getService(req).generateDownloadApiKey(
        id,
        this.credentialAuditInput(req, 'company.download-key.generated', String(id))
      );
      res.status(200).json({ status: true, message: 'Account download API key generated successfully', data });
    } catch (err) {
      next(err);
    }
  };

  removeDownloadApiKey = async (req, res, next) => {
    try {
      const id = validateObjectId(req.params.id);
      const data = await this.getService(req).removeDownloadApiKey(
        id,
        this.credentialAuditInput(req, 'company.download-key.revoked', String(id))
      );
      res.status(200).json({ status: true, message: 'Account download API key deleted successfully', data });
    } catch (err) {
      next(err);
    }
  };
}
