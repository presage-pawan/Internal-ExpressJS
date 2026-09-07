import { Schema } from 'mongoose';
import { InternalUserModel } from './users.model.js';

export const SALES_LEAD_INDUSTRIES = [
  'Automotive',
  'Cement',
  'Chemical',
  'Engineering',
  'FMCG',
  'Food & Beverage',
  'Infrastructure',
  'Manufacturing',
  'Metals & Mining',
  'Oil & Gas',
  'Pharmaceutical',
  'Power & Energy',
  'Textile',
  'Other'
];

export const SALES_LEAD_STAGES = [
  'New Lead',
  'Contacted',
  'Qualified',
  'Meeting/Demo',
  'Proposal/Quote',
  'Negotiation',
  'Won',
  'Lost',
  'On Hold'
];

export const QUOTED_OPTIONS = ['yes', 'no'];
export const SALES_LEAD_INTERACTION_TYPES = [
  'First Contact',
  'Call',
  'Email',
  'Meeting',
  'Demo',
  'Proposal',
  'Follow-up',
  'Note'
];

const ContactSchema = new Schema({
  contact_person: { type: String, required: true, trim: true },
  designation: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  is_primary: { type: Boolean, default: false }
}, { _id: true });

const InteractionSchema = new Schema({
  interaction_date: { type: Date, required: true },
  interaction_type: { type: String, enum: SALES_LEAD_INTERACTION_TYPES, required: true, trim: true },
  notes: { type: String, required: true, trim: true },
  discussion_stage: { type: String, enum: SALES_LEAD_STAGES, required: true, trim: true },
  next_action: { type: String, trim: true },
  next_action_date: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'InternalUser', required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const SalesLeadSchema = new Schema({
  first_contact_date: { type: Date, required: true },
  last_interaction_date: {
    type: Date,
    required: true,
    validate: {
      validator(value) {
        return !this.first_contact_date || !value || value >= this.first_contact_date;
      },
      message: 'Last interaction cannot be before first contact'
    }
  },
  prospective_company: { type: String, required: true, trim: true },
  industry: { type: String, enum: SALES_LEAD_INDUSTRIES, required: true, trim: true },
  city_region: { type: String, required: true, trim: true },
  contacts: {
    type: [ContactSchema],
    required: true,
    validate: {
      validator: (contacts) => Array.isArray(contacts) && contacts.length > 0,
      message: 'At least one contact person is required'
    }
  },
  discussion_stage: { type: String, enum: SALES_LEAD_STAGES, required: true, trim: true },
  deal_value: { type: Number, min: 0, default: 0 },
  quoted: { type: String, enum: QUOTED_OPTIONS, default: 'no' },
  next_action: { type: String, required: true, trim: true },
  next_action_date: { type: Date },
  remarks: { type: String, trim: true },
  interactions: { type: [InteractionSchema], default: [] },
  company_key: { type: String, required: true, trim: true },
  owner_user_id: { type: Schema.Types.ObjectId, ref: 'InternalUser', required: true },
  visible: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'InternalUser', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'InternalUser' },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'InternalUser' },
  deletedAt: { type: Date }
}, {
  collection: 'sales-leads',
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform(doc, ret) {
      ret.id = ret._id;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform(doc, ret) {
      ret.id = ret._id;
      return ret;
    }
  }
});

SalesLeadSchema.index({ owner_user_id: 1, visible: 1, last_interaction_date: -1 });
SalesLeadSchema.index({ prospective_company: 1, visible: 1 });
SalesLeadSchema.index({ discussion_stage: 1, visible: 1 });
SalesLeadSchema.index({ next_action_date: 1, visible: 1 });
SalesLeadSchema.index(
  { company_key: 1 },
  { unique: true, partialFilterExpression: { visible: true } }
);

export const SalesLeadModel = (connection) => {
  if (!connection) throw Object.assign(new Error('Invalid database connection'), { status: 500 });
  if (!connection.models.InternalUser) {
    InternalUserModel(connection);
  }
  return connection.models.SalesLead || connection.model('SalesLead', SalesLeadSchema);
};
