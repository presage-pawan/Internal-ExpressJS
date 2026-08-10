import { Schema } from 'mongoose';
import { AccountModel } from '../cmms/schemas/company.model.js';
import { InvoiceModel, INVOICE_TYPES } from './invoice.model.js';

export const REVENUE_TYPES = ['one_time', 'recurring'];
export const REVENUE_SCHEDULE_STATUSES = ['scheduled', 'cancelled'];

const InvoiceRevenueScheduleSchema = new Schema(
  {
    invoice_id: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    account_id: { type: Schema.Types.ObjectId, ref: 'Account' },
    customer_name: { type: String, required: true, trim: true },

    invoice_no: { type: String, required: true, trim: true },
    invoice_date: { type: Date, required: true },
    invoice_month: { type: String, required: true, trim: true },
    invoice_type: { type: String, enum: INVOICE_TYPES, required: true, trim: true },

    revenue_month: { type: String, required: true, trim: true },
    revenue_date: { type: Date, required: true },
    revenue_type: { type: String, enum: REVENUE_TYPES, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },

    status: { type: String, enum: REVENUE_SCHEDULE_STATUSES, default: 'scheduled' },
    visible: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId },
    updatedBy: { type: Schema.Types.ObjectId },
    deletedBy: { type: Schema.Types.ObjectId },
    deletedAt: { type: Date }
  },
  {
    collection: 'invoice_revenue_schedules',
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
  }
);

InvoiceRevenueScheduleSchema.index(
  { invoice_id: 1, revenue_month: 1, revenue_type: 1 },
  { unique: true, partialFilterExpression: { visible: true } }
);
InvoiceRevenueScheduleSchema.index({ revenue_month: 1, status: 1, visible: 1 });
InvoiceRevenueScheduleSchema.index({ account_id: 1, revenue_month: 1 });
InvoiceRevenueScheduleSchema.index({ invoice_no: 1 });

export const InvoiceRevenueScheduleModel = (connection) => {
  if (!connection) throw Object.assign(new Error('Invalid database connection'), { status: 500 });

  if (!connection.models.Account) {
    AccountModel(connection);
  }

  if (!connection.models.Invoice) {
    InvoiceModel(connection);
  }

  return connection.models.InvoiceRevenueSchedule
    || connection.model('InvoiceRevenueSchedule', InvoiceRevenueScheduleSchema);
};
