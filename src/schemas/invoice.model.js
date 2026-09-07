import { Schema } from 'mongoose';
import { AccountModel } from '../cmms/schemas/company.model.js';

export const INVOICE_TYPES = ['one_time', 'other', 'recurring', 'mixed'];
export const INVOICE_STATUSES = ['active', 'cancelled'];

const requiresRecurringDates = function () {
  return this.invoice_type === 'recurring' || this.invoice_type === 'mixed';
};

const InvoiceSchema = new Schema(
  {
    account_id: { type: Schema.Types.ObjectId, ref: 'Account' },
    customer_name: { type: String, required: true, trim: true },
    gst_no: { type: String, trim: true },
    place_of_supply: { type: String, trim: true },

    invoice_no: { type: String, required: true, trim: true },
    invoice_date: { type: Date, required: true },
    invoice_month: { type: String, required: true, trim: true },
    invoice_type: { type: String, enum: INVOICE_TYPES, required: true, trim: true },

    currency: { type: String, trim: true, default: 'INR' },
    exchange_rate: { type: Number, default: 1, min: 0.000001 },
    original_invoice_value: { type: Number, min: 0 },
    invoice_value: { type: Number, required: true, min: 0 },
    taxable_value: { type: Number, min: 0 },
    gst_percentage: { type: Number, min: 0, default: 0 },
    gst_amount: { type: Number, min: 0, default: 0 },

    one_time_amount: { type: Number, min: 0, default: 0 },
    recurring_amount: { type: Number, min: 0, default: 0 },
    edgepulse_quantity: { type: Number, min: 0, default: 0 },
    edgepulse_unit_price: { type: Number, min: 0, default: 5500 },
    edgepulse_amount: { type: Number, min: 0, default: 0 },
    vibo_quantity: { type: Number, min: 0, default: 0 },
    vibo_unit_price: { type: Number, min: 0, default: 7000 },
    vibo_amount: { type: Number, min: 0, default: 0 },
    misc_items: [{
      item_name: { type: String, trim: true },
      quantity: { type: Number, min: 0, default: 0 },
      unit_price: { type: Number, min: 0, default: 0 },
      amount: { type: Number, min: 0, default: 0 }
    }],
    contract_start_date: { type: Date, required: requiresRecurringDates },
    contract_end_date: { type: Date, required: requiresRecurringDates },

    notes: { type: String, trim: true },
    status: { type: String, enum: INVOICE_STATUSES, default: 'active' },
    visible: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId },
    updatedBy: { type: Schema.Types.ObjectId },
    deletedBy: { type: Schema.Types.ObjectId },
    deletedAt: { type: Date }
  },
  {
    collection: 'invoices',
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

InvoiceSchema.index(
  { invoice_no: 1 },
  { unique: true, partialFilterExpression: { visible: true } }
);
InvoiceSchema.index({ invoice_month: 1, invoice_type: 1, visible: 1 });
InvoiceSchema.index({ account_id: 1, invoice_month: 1 });
InvoiceSchema.index({ customer_name: 1 });

export const InvoiceModel = (connection) => {
  if (!connection) throw Object.assign(new Error('Invalid database connection'), { status: 500 });

  if (!connection.models.Account) {
    AccountModel(connection);
  }

  return connection.models.Invoice || connection.model('Invoice', InvoiceSchema);
};
