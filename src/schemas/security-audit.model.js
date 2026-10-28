import { Schema } from 'mongoose';

const SecurityAuditSchema = new Schema(
  {
    action: { type: String, required: true, trim: true, index: true },
    actor_id: { type: String, trim: true, index: true },
    target_type: { type: String, trim: true },
    target_id: { type: String, trim: true, index: true },
    company_id: { type: String, trim: true, index: true },
    environment: { type: String, enum: ['production', 'staging', 'unknown'], default: 'unknown', index: true },
    request_id: { type: String, trim: true, index: true },
    reason: { type: String, trim: true },
    outcome: { type: String, enum: ['success', 'failure'], default: 'success', index: true },
    metadata: { type: Object, default: {} }
  },
  {
    collection: 'internal_security_audit',
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

export const SecurityAuditModel = (connection) => {
  if (!connection) throw new Error('Database connection not provided');
  return connection.models.InternalSecurityAudit
    || connection.model('InternalSecurityAudit', SecurityAuditSchema);
};
