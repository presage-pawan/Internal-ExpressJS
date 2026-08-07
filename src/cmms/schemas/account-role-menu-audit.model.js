import { Schema } from 'mongoose';

const AccountRoleMenuAuditSchema = new Schema(
  {
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    before: { type: Object, default: {} },
    after: { type: Object, default: {} },
    changed_by: { type: Schema.Types.ObjectId, ref: 'InternalUser' },
    reason: { type: String, trim: true }
  },
  {
    collection: 'account_role_menu_audit',
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

export const AccountRoleMenuAuditModel = (connection) => {
  if (!connection) throw new Error('Database connection not provided');
  return connection.models.AccountRoleMenuAudit || connection.model('AccountRoleMenuAudit', AccountRoleMenuAuditSchema);
};
