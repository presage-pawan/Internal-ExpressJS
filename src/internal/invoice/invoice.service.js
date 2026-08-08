import { getConnection } from '../../_db/index.js';
import { validateObjectId } from '../../utils/helper.js';
import { InvoiceModel } from '../../schemas/invoice.model.js';
import { InvoiceRevenueScheduleModel } from '../../schemas/invoice-revenue-schedule.model.js';

const MONTH_FORMAT_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const MONEY_DECIMALS = 2;

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isRecurringType = (invoiceType) => invoiceType === 'recurring' || invoiceType === 'mixed';

const toNumber = (value, defaultValue = 0) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : defaultValue;
};

const roundMoney = (value) => Number(Number(value || 0).toFixed(MONEY_DECIMALS));

const toDate = (value, fieldName) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw Object.assign(new Error(`${fieldName} must be a valid date`), { status: 400 });
  }

  return date;
};

const toMonthKey = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const monthStart = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const monthEnd = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));

const addMonths = (date, months) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));

const monthsInclusive = (startDate, endDate) => {
  const start = monthStart(startDate);
  const end = monthStart(endDate);
  const diff = ((end.getUTCFullYear() - start.getUTCFullYear()) * 12) + (end.getUTCMonth() - start.getUTCMonth());

  if (diff < 0) {
    throw Object.assign(new Error('Contract end date must be on or after contract start date'), { status: 400 });
  }

  const anniversaryAdjustedMonths = diff + 1 - (diff > 0 && endDate.getUTCDate() < startDate.getUTCDate() ? 1 : 0);
  return Math.max(anniversaryAdjustedMonths, 1);
};

export class InvoiceService {
  constructor(dbType = 'production') {
    this.dbType = dbType;
  }

  get connection() {
    return getConnection(this.dbType, 'cmms');
  }

  get invoiceModel() {
    return InvoiceModel(this.connection);
  }

  get scheduleModel() {
    return InvoiceRevenueScheduleModel(this.connection);
  }

  async create(payload, userId) {
    const invoicePayload = this.buildInvoicePayload(payload, { userId, isCreate: true });
    const invoice = await this.invoiceModel.create(invoicePayload);
    const schedules = await this.regenerateSchedules(invoice, userId);
    return this.mapInvoiceWithSchedules(invoice, schedules);
  }

  async bulkCreate(rows = [], userId) {
    if (!Array.isArray(rows) || !rows.length) {
      throw Object.assign(new Error('Invoices array is required'), { status: 400 });
    }

    const results = [];

    for (const [index, row] of rows.entries()) {
      try {
        const createdInvoice = await this.create(row, userId);
        results.push({
          row: index + 1,
          status: 'created',
          invoice_id: createdInvoice.id || createdInvoice._id,
          invoice_no: createdInvoice.invoice_no,
          customer_name: createdInvoice.customer_name
        });
      } catch (error) {
        results.push({
          row: index + 1,
          status: 'failed',
          invoice_no: row?.invoice_no,
          customer_name: row?.customer_name,
          message: error?.message || 'Invoice import failed'
        });
      }
    }

    const createdCount = results.filter((row) => row.status === 'created').length;

    return {
      total_count: rows.length,
      created_count: createdCount,
      failed_count: rows.length - createdCount,
      results
    };
  }

  async findAll(query = {}) {
    const filter = this.buildListFilter(query);
    return this.invoiceModel.find(filter).sort({ invoice_date: -1, createdAt: -1 }).lean();
  }

  async findById(id) {
    const invoice = await this.invoiceModel.findOne({ _id: validateObjectId(id), visible: true }).lean();
    if (!invoice) {
      return null;
    }

    const schedules = await this.scheduleModel.find({
      invoice_id: invoice._id,
      visible: true,
      status: 'scheduled'
    }).sort({ revenue_month: 1, revenue_type: 1 }).lean();

    return this.mapInvoiceWithSchedules(invoice, schedules);
  }

  async update(id, payload, userId) {
    const invoiceId = validateObjectId(id);
    const existingInvoice = await this.invoiceModel.findOne({ _id: invoiceId, visible: true });

    if (!existingInvoice) {
      return null;
    }

    const mergedPayload = {
      ...existingInvoice.toObject(),
      ...payload
    };
    const updatePayload = this.buildInvoicePayload(mergedPayload, { userId, isCreate: false });

    Object.assign(existingInvoice, updatePayload);
    await existingInvoice.save();

    const schedules = await this.regenerateSchedules(existingInvoice, userId);
    return this.mapInvoiceWithSchedules(existingInvoice, schedules);
  }

  async delete(id, userId) {
    const invoiceId = validateObjectId(id);
    const invoice = await this.invoiceModel.findOneAndUpdate(
      { _id: invoiceId, visible: true },
      { $set: { visible: false, status: 'cancelled', updatedBy: userId } },
      { new: true }
    );

    if (!invoice) {
      return null;
    }

    await this.cancelSchedules(invoiceId, userId);
    return invoice;
  }

  async getSchedules(invoiceId) {
    return this.scheduleModel.find({
      invoice_id: validateObjectId(invoiceId),
      visible: true,
      status: 'scheduled'
    }).sort({ revenue_month: 1, revenue_type: 1 }).lean();
  }

  async getMonthlyReport(month) {
    if (!MONTH_FORMAT_REGEX.test(String(month || ''))) {
      throw Object.assign(new Error('Month must use YYYY-MM format'), { status: 400 });
    }

    const schedules = await this.scheduleModel.find({
      revenue_month: month,
      visible: true,
      status: 'scheduled'
    }).sort({ customer_name: 1, invoice_no: 1, revenue_type: 1 }).lean();

    return this.buildMonthlyReport(schedules, month);
  }

  async regenerateSchedules(invoice, userId) {
    await this.cancelSchedules(invoice._id, userId);
    const rows = this.buildScheduleRows(invoice, userId);

    if (!rows.length) {
      return [];
    }

    return this.scheduleModel.insertMany(rows);
  }

  async cancelSchedules(invoiceId, userId) {
    return this.scheduleModel.updateMany(
      { invoice_id: invoiceId, visible: true },
      { $set: { visible: false, status: 'cancelled', updatedBy: userId } }
    );
  }

  buildListFilter(query = {}) {
    const filter = { visible: true };

    if (query.month) {
      if (!MONTH_FORMAT_REGEX.test(String(query.month))) {
        throw Object.assign(new Error('Month must use YYYY-MM format'), { status: 400 });
      }
      filter.invoice_month = query.month;
    }

    if (query.invoice_type) {
      filter.invoice_type = query.invoice_type;
    }

    const search = String(query.search || '').trim();
    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { invoice_no: pattern },
        { customer_name: pattern },
        { gst_no: pattern },
        { place_of_supply: pattern }
      ];
    }

    return filter;
  }

  buildInvoicePayload(payload, options = {}) {
    const invoiceDate = toDate(payload.invoice_date, 'Invoice date');
    const invoiceType = payload.invoice_type;
    const invoiceValue = roundMoney(toNumber(payload.invoice_value));
    const exchangeRate = toNumber(payload.exchange_rate, 1);
    const gstAmount = roundMoney(toNumber(payload.gst_amount, 0));
    const taxableValue = payload.taxable_value === undefined || payload.taxable_value === null || payload.taxable_value === ''
      ? invoiceValue
      : roundMoney(toNumber(payload.taxable_value));

    if (!invoiceDate) {
      throw Object.assign(new Error('Invoice date is required'), { status: 400 });
    }

    if (!['one_time', 'recurring', 'mixed'].includes(invoiceType)) {
      throw Object.assign(new Error('Invalid invoice type'), { status: 400 });
    }

    if (invoiceValue <= 0) {
      throw Object.assign(new Error('Invoice value must be greater than 0'), { status: 400 });
    }

    let oneTimeAmount = roundMoney(toNumber(payload.one_time_amount, invoiceType === 'one_time' ? invoiceValue : 0));
    let recurringAmount = roundMoney(toNumber(payload.recurring_amount, invoiceType === 'recurring' ? invoiceValue : 0));
    let contractStartDate = toDate(payload.contract_start_date, 'Contract start date');
    let contractEndDate = toDate(payload.contract_end_date, 'Contract end date');

    if (invoiceType === 'one_time') {
      oneTimeAmount = invoiceValue;
      recurringAmount = 0;
      contractStartDate = null;
      contractEndDate = null;
    }

    if (invoiceType === 'recurring') {
      oneTimeAmount = 0;
      recurringAmount = recurringAmount || invoiceValue;
    }

    if (invoiceType === 'mixed') {
      if (oneTimeAmount <= 0 || recurringAmount <= 0) {
        throw Object.assign(new Error('Mixed invoice requires one-time and recurring amounts greater than 0'), { status: 400 });
      }

      if (Math.abs((oneTimeAmount + recurringAmount) - invoiceValue) > 0.01) {
        throw Object.assign(new Error('One-time amount and recurring amount must equal invoice value'), { status: 400 });
      }
    }

    if (isRecurringType(invoiceType)) {
      if (!contractStartDate || !contractEndDate) {
        throw Object.assign(new Error('Recurring invoices require contract start and end dates'), { status: 400 });
      }

      if (contractEndDate < contractStartDate) {
        throw Object.assign(new Error('Contract end date must be on or after contract start date'), { status: 400 });
      }
    }

    const invoicePayload = {
      account_id: payload.account_id ? validateObjectId(payload.account_id) : undefined,
      customer_name: String(payload.customer_name || '').trim(),
      gst_no: payload.gst_no ? String(payload.gst_no).trim() : undefined,
      place_of_supply: payload.place_of_supply ? String(payload.place_of_supply).trim() : undefined,
      invoice_no: String(payload.invoice_no || '').trim(),
      invoice_date: invoiceDate,
      invoice_month: toMonthKey(invoiceDate),
      invoice_type: invoiceType,
      currency: payload.currency ? String(payload.currency).trim().toUpperCase() : 'INR',
      exchange_rate: exchangeRate,
      invoice_value: invoiceValue,
      taxable_value: taxableValue,
      gst_amount: gstAmount,
      one_time_amount: oneTimeAmount,
      recurring_amount: recurringAmount,
      contract_start_date: contractStartDate,
      contract_end_date: contractEndDate,
      notes: payload.notes ? String(payload.notes).trim() : undefined,
      status: 'active',
      visible: true
    };

    if (!invoicePayload.customer_name) {
      throw Object.assign(new Error('Customer name is required'), { status: 400 });
    }

    if (!invoicePayload.invoice_no) {
      throw Object.assign(new Error('Invoice no is required'), { status: 400 });
    }

    if (options.isCreate) {
      invoicePayload.createdBy = options.userId;
    }

    invoicePayload.updatedBy = options.userId;

    return invoicePayload;
  }

  buildScheduleRows(invoice, userId) {
    const rows = [];
    const invoiceObject = typeof invoice.toObject === 'function' ? invoice.toObject() : invoice;

    if (invoiceObject.invoice_type === 'one_time' || invoiceObject.invoice_type === 'mixed') {
      rows.push(this.buildScheduleRow(invoiceObject, {
        revenueDate: monthEnd(invoiceObject.invoice_date),
        revenueType: 'one_time',
        amount: invoiceObject.one_time_amount,
        userId
      }));
    }

    if (isRecurringType(invoiceObject.invoice_type)) {
      const months = monthsInclusive(invoiceObject.contract_start_date, invoiceObject.contract_end_date);
      const monthlyAmount = roundMoney(invoiceObject.recurring_amount / months);
      let scheduledTotal = 0;

      for (let index = 0; index < months; index += 1) {
        const revenueDate = monthEnd(addMonths(monthStart(invoiceObject.contract_start_date), index));
        const isLastMonth = index === months - 1;
        const amount = isLastMonth
          ? roundMoney(invoiceObject.recurring_amount - scheduledTotal)
          : monthlyAmount;

        scheduledTotal = roundMoney(scheduledTotal + amount);

        rows.push(this.buildScheduleRow(invoiceObject, {
          revenueDate,
          revenueType: 'recurring',
          amount,
          userId
        }));
      }
    }

    return rows.filter((row) => row.amount > 0);
  }

  buildScheduleRow(invoice, { revenueDate, revenueType, amount, userId }) {
    return {
      invoice_id: invoice._id,
      account_id: invoice.account_id,
      customer_name: invoice.customer_name,
      invoice_no: invoice.invoice_no,
      invoice_date: invoice.invoice_date,
      invoice_month: invoice.invoice_month,
      invoice_type: invoice.invoice_type,
      revenue_month: toMonthKey(revenueDate),
      revenue_date: revenueDate,
      revenue_type: revenueType,
      amount: roundMoney(amount),
      status: 'scheduled',
      visible: true,
      createdBy: userId,
      updatedBy: userId
    };
  }

  buildMonthlyReport(schedules = [], month) {
    const summary = {
      selected_month: month,
      one_time_revenue: 0,
      recurring_current_month_revenue: 0,
      recurring_previous_invoice_revenue: 0,
      recurring_future_invoice_revenue: 0,
      recurring_revenue: 0,
      total_revenue: 0,
      row_count: schedules.length
    };

    const customerMap = new Map();
    const invoiceMap = new Map();
    const revenueTypeMap = new Map();

    const detail = schedules.map((schedule) => {
      const amount = roundMoney(schedule.amount);
      const sourceType = this.getReportSourceType(schedule, month);
      const normalized = {
        id: schedule._id,
        invoice_id: schedule.invoice_id,
        invoice_no: schedule.invoice_no,
        invoice_date: schedule.invoice_date,
        invoice_month: schedule.invoice_month,
        customer_name: schedule.customer_name,
        invoice_type: schedule.invoice_type,
        revenue_month: schedule.revenue_month,
        revenue_date: schedule.revenue_date,
        revenue_type: schedule.revenue_type,
        source_type: sourceType,
        amount
      };

      this.addToSummary(summary, sourceType, amount);
      this.addToGroupedMap(customerMap, schedule.customer_name || 'Unknown Customer', sourceType, amount, {
        customer_name: schedule.customer_name || 'Unknown Customer'
      });
      this.addToGroupedMap(invoiceMap, String(schedule.invoice_id || schedule.invoice_no), sourceType, amount, {
        invoice_id: schedule.invoice_id,
        invoice_no: schedule.invoice_no,
        invoice_date: schedule.invoice_date,
        invoice_month: schedule.invoice_month,
        customer_name: schedule.customer_name,
        invoice_type: schedule.invoice_type
      });
      this.addToGroupedMap(revenueTypeMap, sourceType, sourceType, amount, {
        revenue_type: sourceType
      });

      return normalized;
    });

    this.finalizeSummary(summary);

    return {
      selected_month: month,
      summary,
      customer_breakup: this.finalizeGroupedRows(customerMap),
      invoice_breakup: this.finalizeGroupedRows(invoiceMap),
      revenue_type_breakup: this.finalizeGroupedRows(revenueTypeMap),
      rows: detail
    };
  }

  getReportSourceType(schedule, month) {
    if (schedule.revenue_type === 'one_time') {
      return 'one_time';
    }

    if (schedule.invoice_month === month) {
      return 'recurring_current_month_invoice';
    }

    if (String(schedule.invoice_month || '') < month) {
      return 'recurring_previous_invoice';
    }

    return 'recurring_future_invoice';
  }

  addToSummary(summary, sourceType, amount) {
    if (sourceType === 'one_time') {
      summary.one_time_revenue = roundMoney(summary.one_time_revenue + amount);
    }

    if (sourceType === 'recurring_current_month_invoice') {
      summary.recurring_current_month_revenue = roundMoney(summary.recurring_current_month_revenue + amount);
    }

    if (sourceType === 'recurring_previous_invoice') {
      summary.recurring_previous_invoice_revenue = roundMoney(summary.recurring_previous_invoice_revenue + amount);
    }

    if (sourceType === 'recurring_future_invoice') {
      summary.recurring_future_invoice_revenue = roundMoney(summary.recurring_future_invoice_revenue + amount);
    }
  }

  addToGroupedMap(groupedMap, key, sourceType, amount, baseFields = {}) {
    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        ...baseFields,
        one_time_revenue: 0,
        recurring_current_month_revenue: 0,
        recurring_previous_invoice_revenue: 0,
        recurring_future_invoice_revenue: 0,
        recurring_revenue: 0,
        total_revenue: 0
      });
    }

    const row = groupedMap.get(key);

    if (sourceType === 'one_time') {
      row.one_time_revenue = roundMoney(row.one_time_revenue + amount);
    }

    if (sourceType === 'recurring_current_month_invoice') {
      row.recurring_current_month_revenue = roundMoney(row.recurring_current_month_revenue + amount);
    }

    if (sourceType === 'recurring_previous_invoice') {
      row.recurring_previous_invoice_revenue = roundMoney(row.recurring_previous_invoice_revenue + amount);
    }

    if (sourceType === 'recurring_future_invoice') {
      row.recurring_future_invoice_revenue = roundMoney(row.recurring_future_invoice_revenue + amount);
    }

    row.recurring_revenue = roundMoney(
      row.recurring_current_month_revenue
      + row.recurring_previous_invoice_revenue
      + row.recurring_future_invoice_revenue
    );
    row.total_revenue = roundMoney(row.one_time_revenue + row.recurring_revenue);
  }

  finalizeSummary(summary) {
    summary.recurring_revenue = roundMoney(
      summary.recurring_current_month_revenue
      + summary.recurring_previous_invoice_revenue
      + summary.recurring_future_invoice_revenue
    );
    summary.total_revenue = roundMoney(summary.one_time_revenue + summary.recurring_revenue);
  }

  finalizeGroupedRows(groupedMap) {
    return Array.from(groupedMap.values())
      .map((row) => ({
        ...row,
        recurring_revenue: roundMoney(row.recurring_revenue),
        total_revenue: roundMoney(row.total_revenue)
      }))
      .sort((a, b) => String(a.customer_name || a.invoice_no || a.revenue_type || '')
        .localeCompare(String(b.customer_name || b.invoice_no || b.revenue_type || ''), undefined, { sensitivity: 'base' }));
  }

  mapInvoiceWithSchedules(invoice, schedules = []) {
    const invoiceObject = typeof invoice.toObject === 'function' ? invoice.toObject() : invoice;
    return {
      ...invoiceObject,
      id: invoiceObject._id,
      schedules
    };
  }
}
