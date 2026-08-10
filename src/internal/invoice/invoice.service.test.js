import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Types } from 'mongoose';
import { InvoiceService } from './invoice.service.js';

const service = new InvoiceService('production');

class BulkImportTestInvoiceService extends InvoiceService {
  async create(payload) {
    if (payload.invoice_no === 'FAIL') {
      throw new Error('Simulated duplicate invoice');
    }

    return {
      _id: new Types.ObjectId(),
      id: new Types.ObjectId(),
      invoice_no: payload.invoice_no,
      customer_name: payload.customer_name
    };
  }
}

class SoftDeleteTestInvoiceService extends InvoiceService {
  constructor(invoiceModel, scheduleModel) {
    super('production');
    this.mockInvoiceModel = invoiceModel;
    this.mockScheduleModel = scheduleModel;
  }

  get invoiceModel() {
    return this.mockInvoiceModel;
  }

  get scheduleModel() {
    return this.mockScheduleModel;
  }
}

describe('InvoiceService schedule generation', () => {
  it('tracks one-time invoices only in the invoice month', () => {
    const invoice = {
      _id: new Types.ObjectId(),
      customer_name: 'ACME Industries',
      invoice_no: 'INV-001',
      invoice_date: new Date('2026-08-10T00:00:00.000Z'),
      invoice_month: '2026-08',
      invoice_type: 'one_time',
      one_time_amount: 25000,
      recurring_amount: 0
    };

    const rows = service.buildScheduleRows(invoice, new Types.ObjectId());

    assert.equal(rows.length, 1);
    assert.equal(rows[0].revenue_month, '2026-08');
    assert.equal(rows[0].revenue_type, 'one_time');
    assert.equal(rows[0].amount, 25000);
  });

  it('tracks other miscellaneous invoices only in the invoice month', () => {
    const payload = service.buildInvoicePayload({
      customer_name: 'ACME Industries',
      invoice_no: 'INV-MISC',
      invoice_date: '2026-08-12',
      invoice_type: 'other',
      invoice_value: 7500,
      contract_start_date: '2026-08-01',
      contract_end_date: '2027-07-31'
    }, { userId: new Types.ObjectId(), isCreate: true });

    assert.equal(payload.invoice_type, 'other');
    assert.equal(payload.one_time_amount, 7500);
    assert.equal(payload.recurring_amount, 0);
    assert.equal(payload.contract_start_date, null);
    assert.equal(payload.contract_end_date, null);

    const rows = service.buildScheduleRows({
      _id: new Types.ObjectId(),
      ...payload
    }, new Types.ObjectId());

    assert.equal(rows.length, 1);
    assert.equal(rows[0].revenue_month, '2026-08');
    assert.equal(rows[0].revenue_type, 'one_time');
    assert.equal(rows[0].amount, 7500);
  });

  it('stores item rows and GST details for non-mixed invoices', () => {
    const payload = service.buildInvoicePayload({
      customer_name: 'ACME Industries',
      invoice_no: 'INV-OTHER-GST',
      invoice_date: '2026-08-12',
      invoice_type: 'other',
      taxable_value: 10000,
      gst_percentage: 18,
      invoice_value: 11800,
      misc_items: [
        { item_name: 'Router', quantity: 2, unit_price: 2500 },
        { item_name: 'SIM', quantity: 10, unit_price: 500 }
      ]
    }, { userId: new Types.ObjectId(), isCreate: true });

    assert.equal(payload.one_time_amount, 11800);
    assert.equal(payload.recurring_amount, 0);
    assert.equal(payload.taxable_value, 10000);
    assert.equal(payload.gst_percentage, 18);
    assert.equal(payload.gst_amount, 1800);
    assert.deepEqual(
      payload.misc_items.map((item) => [item.item_name, item.quantity, item.unit_price, item.amount]),
      [
        ['Router', 2, 2500, 5000],
        ['SIM', 10, 500, 5000]
      ]
    );
  });

  it('tracks subscription invoices only in the invoice month while keeping contract dates as reference', () => {
    const invoice = {
      _id: new Types.ObjectId(),
      customer_name: 'ACME Industries',
      invoice_no: 'INV-002',
      invoice_date: new Date('2026-04-02T00:00:00.000Z'),
      invoice_month: '2026-04',
      invoice_type: 'recurring',
      one_time_amount: 0,
      recurring_amount: 100000,
      contract_start_date: new Date('2026-01-15T00:00:00.000Z'),
      contract_end_date: new Date('2026-03-20T00:00:00.000Z')
    };

    const rows = service.buildScheduleRows(invoice, new Types.ObjectId());

    assert.equal(rows.length, 1);
    assert.equal(rows[0].revenue_month, '2026-04');
    assert.equal(rows[0].revenue_type, 'recurring');
    assert.equal(rows[0].amount, 100000);
  });

  it('treats standard 1/3/5-year hardware plus software contracts as 12/36/60 monthly software rows', () => {
    const tenures = [
      { months: 12, endDate: '2027-08-07T00:00:00.000Z', lastMonth: '2027-07' },
      { months: 36, endDate: '2029-08-07T00:00:00.000Z', lastMonth: '2029-07' },
      { months: 60, endDate: '2031-08-07T00:00:00.000Z', lastMonth: '2031-07' }
    ];

    for (const tenure of tenures) {
      const invoice = {
        _id: new Types.ObjectId(),
        customer_name: 'ACME Industries',
        invoice_no: `INV-${tenure.months}`,
        invoice_date: new Date('2026-08-08T00:00:00.000Z'),
        invoice_month: '2026-08',
        invoice_type: 'mixed',
        one_time_amount: 5000,
        recurring_amount: tenure.months * 10000,
        invoice_value: (tenure.months * 10000) + 5000,
        contract_start_date: new Date('2026-08-08T00:00:00.000Z'),
        contract_end_date: new Date(tenure.endDate)
      };

      const rows = service.buildScheduleRows(invoice, new Types.ObjectId());
      const recurringRows = rows.filter((row) => row.revenue_type === 'recurring');

      assert.equal(recurringRows.length, tenure.months);
      assert.equal(recurringRows[0].revenue_month, '2026-08');
      assert.equal(recurringRows[tenure.months - 1].revenue_month, tenure.lastMonth);
      assert.equal(recurringRows[0].amount, 10000);
      assert.equal(recurringRows.reduce((total, row) => Number((total + row.amount).toFixed(2)), 0), tenure.months * 10000);
    }
  });

  it('creates both current-month one-time and monthly recurring rows for mixed invoices', () => {
    const invoice = {
      _id: new Types.ObjectId(),
      customer_name: 'ACME Industries',
      invoice_no: 'INV-003',
      invoice_date: new Date('2026-08-10T00:00:00.000Z'),
      invoice_month: '2026-08',
      invoice_type: 'mixed',
      one_time_amount: 40000,
      recurring_amount: 60000,
      contract_start_date: new Date('2026-08-01T00:00:00.000Z'),
      contract_end_date: new Date('2026-10-31T00:00:00.000Z')
    };

    const rows = service.buildScheduleRows(invoice, new Types.ObjectId());

    assert.deepEqual(
      rows.map((row) => [row.revenue_month, row.revenue_type, row.amount]),
      [
        ['2026-08', 'one_time', 40000],
        ['2026-08', 'recurring', 20000],
        ['2026-09', 'recurring', 20000],
        ['2026-10', 'recurring', 20000]
      ]
    );
  });

  it('calculates mixed invoice hardware and software amounts from EdgePulse and Vibo quantities', () => {
    const userId = new Types.ObjectId();
    const invoicePayload = service.buildInvoicePayload({
      customer_name: 'ACME Industries',
      invoice_no: 'INV-SENSOR',
      invoice_date: '2026-08-10',
      invoice_type: 'mixed',
      invoice_value: 100000,
      edgepulse_quantity: 2,
      vibo_quantity: 1,
      contract_start_date: '2026-08-01',
      contract_end_date: '2027-07-31'
    }, { userId, isCreate: true });

    assert.equal(invoicePayload.edgepulse_quantity, 2);
    assert.equal(invoicePayload.edgepulse_unit_price, 5500);
    assert.equal(invoicePayload.edgepulse_amount, 11000);
    assert.equal(invoicePayload.vibo_quantity, 1);
    assert.equal(invoicePayload.vibo_unit_price, 7000);
    assert.equal(invoicePayload.vibo_amount, 7000);
    assert.equal(invoicePayload.one_time_amount, 18000);
    assert.equal(invoicePayload.recurring_amount, 82000);

    const rows = service.buildScheduleRows({
      _id: new Types.ObjectId(),
      ...invoicePayload
    }, userId);
    const hardwareRow = rows.find((row) => row.revenue_type === 'one_time');
    const recurringRows = rows.filter((row) => row.revenue_type === 'recurring');

    assert.equal(hardwareRow.amount, 18000);
    assert.equal(recurringRows.reduce((total, row) => Number((total + row.amount).toFixed(2)), 0), 82000);
  });

  it('adds miscellaneous hardware items to mixed invoice hardware before splitting software', () => {
    const userId = new Types.ObjectId();
    const invoicePayload = service.buildInvoicePayload({
      customer_name: 'ACME Industries',
      invoice_no: 'INV-MISC-HW',
      invoice_date: '2026-08-10',
      invoice_type: 'mixed',
      invoice_value: 120000,
      edgepulse_quantity: 1,
      vibo_quantity: 1,
      misc_items: [
        { item_name: 'Router', quantity: 2, unit_price: 2500 },
        { item_name: 'SIM', quantity: 10, unit_price: 100 }
      ],
      contract_start_date: '2026-08-01',
      contract_end_date: '2027-07-31'
    }, { userId, isCreate: true });

    assert.equal(invoicePayload.one_time_amount, 18500);
    assert.equal(invoicePayload.recurring_amount, 101500);
    assert.deepEqual(
      invoicePayload.misc_items.map((item) => [item.item_name, item.quantity, item.unit_price, item.amount]),
      [
        ['Router', 2, 2500, 5000],
        ['SIM', 10, 100, 1000]
      ]
    );
  });

  it('keeps GST separate when splitting mixed invoice hardware and software', () => {
    const invoicePayload = service.buildInvoicePayload({
      customer_name: 'ACME Industries',
      invoice_no: 'INV-MIXED-GST',
      invoice_date: '2026-08-10',
      invoice_type: 'mixed',
      taxable_value: 100000,
      gst_percentage: 18,
      invoice_value: 118000,
      edgepulse_quantity: 1,
      vibo_quantity: 1,
      misc_items: [
        { item_name: 'Router', quantity: 1, unit_price: 2500 }
      ],
      contract_start_date: '2026-08-01',
      contract_end_date: '2027-07-31'
    }, { userId: new Types.ObjectId(), isCreate: true });

    assert.equal(invoicePayload.edgepulse_amount, 5500);
    assert.equal(invoicePayload.vibo_amount, 7000);
    assert.equal(invoicePayload.one_time_amount, 15000);
    assert.equal(invoicePayload.recurring_amount, 85000);
    assert.equal(invoicePayload.taxable_value, 100000);
    assert.equal(invoicePayload.gst_amount, 18000);
    assert.equal(invoicePayload.invoice_value, 118000);
  });

  it('supports mixed invoices with miscellaneous hardware items and no sensors', () => {
    const invoicePayload = service.buildInvoicePayload({
      customer_name: 'ACME Industries',
      invoice_no: 'INV-MISC-ONLY',
      invoice_date: '2026-08-10',
      invoice_type: 'mixed',
      invoice_value: 50000,
      misc_items: [
        { item_name: 'Panel', quantity: 2, unit_price: 4000 }
      ],
      contract_start_date: '2026-08-01',
      contract_end_date: '2027-07-31'
    }, { userId: new Types.ObjectId(), isCreate: true });

    assert.equal(invoicePayload.edgepulse_quantity, 0);
    assert.equal(invoicePayload.vibo_quantity, 0);
    assert.equal(invoicePayload.one_time_amount, 8000);
    assert.equal(invoicePayload.recurring_amount, 42000);
    assert.equal(invoicePayload.misc_items[0].amount, 8000);
  });

  it('allows mixed invoice hardware totals to equal taxable value when software amount is zero', () => {
    const invoicePayload = service.buildInvoicePayload({
      customer_name: 'ACME Industries',
      invoice_no: 'INV-SENSOR-NO-SOFT',
      invoice_date: '2026-08-10',
      invoice_type: 'mixed',
      taxable_value: 11000,
      gst_percentage: 18,
      invoice_value: 12980,
      edgepulse_quantity: 2,
      contract_start_date: '2026-08-01',
      contract_end_date: '2027-07-31'
    }, { userId: new Types.ObjectId(), isCreate: true });

    assert.equal(invoicePayload.one_time_amount, 11000);
    assert.equal(invoicePayload.recurring_amount, 0);
    assert.equal(invoicePayload.gst_amount, 1980);
    assert.equal(invoicePayload.invoice_value, 12980);
  });

  it('rejects mixed invoice hardware item totals above taxable value', () => {
    assert.throws(
      () => service.buildInvoicePayload({
        customer_name: 'ACME Industries',
        invoice_no: 'INV-SENSOR-BAD',
        invoice_date: '2026-08-10',
        invoice_type: 'mixed',
        invoice_value: 10000,
        edgepulse_quantity: 2,
        contract_start_date: '2026-08-01',
        contract_end_date: '2027-07-31'
      }, { userId: new Types.ObjectId(), isCreate: true }),
      /Hardware item amount must not exceed taxable value/
    );
  });

  it('builds monthly report totals and separates recurring revenue by invoice month', () => {
    const reportMonth = '2026-08';
    const previousInvoiceId = new Types.ObjectId();
    const currentInvoiceId = new Types.ObjectId();
    const oneTimeInvoiceId = new Types.ObjectId();

    const report = service.buildMonthlyReport([
      {
        _id: new Types.ObjectId(),
        invoice_id: previousInvoiceId,
        customer_name: 'ACME Industries',
        invoice_no: 'INV-APR',
        invoice_date: new Date('2026-04-10T00:00:00.000Z'),
        invoice_month: '2026-04',
        invoice_type: 'mixed',
        revenue_month: reportMonth,
        revenue_date: new Date('2026-08-31T00:00:00.000Z'),
        revenue_type: 'recurring',
        amount: 10000
      },
      {
        _id: new Types.ObjectId(),
        invoice_id: currentInvoiceId,
        customer_name: 'Beta Metals',
        invoice_no: 'INV-AUG-R',
        invoice_date: new Date('2026-08-01T00:00:00.000Z'),
        invoice_month: reportMonth,
        invoice_type: 'recurring',
        revenue_month: reportMonth,
        revenue_date: new Date('2026-08-31T00:00:00.000Z'),
        revenue_type: 'recurring',
        amount: 20000
      },
      {
        _id: new Types.ObjectId(),
        invoice_id: oneTimeInvoiceId,
        customer_name: 'Beta Metals',
        invoice_no: 'INV-AUG-H',
        invoice_date: new Date('2026-08-05T00:00:00.000Z'),
        invoice_month: reportMonth,
        invoice_type: 'one_time',
        revenue_month: reportMonth,
        revenue_date: new Date('2026-08-31T00:00:00.000Z'),
        revenue_type: 'one_time',
        amount: 50000
      }
    ], reportMonth);

    assert.equal(report.summary.one_time_revenue, 50000);
    assert.equal(report.summary.recurring_current_month_revenue, 20000);
    assert.equal(report.summary.recurring_previous_invoice_revenue, 10000);
    assert.equal(report.summary.recurring_revenue, 30000);
    assert.equal(report.summary.total_revenue, 80000);
    assert.equal(report.rows.length, 3);

    const beta = report.customer_breakup.find((row) => row.customer_name === 'Beta Metals');
    assert.equal(beta.total_revenue, 70000);
    assert.equal(beta.one_time_revenue, 50000);
    assert.equal(beta.recurring_current_month_revenue, 20000);

    assert.deepEqual(
      report.revenue_type_breakup.map((row) => [row.revenue_type, row.total_revenue]).sort(),
      [
        ['one_time', 50000],
        ['recurring_current_month_invoice', 20000],
        ['recurring_previous_invoice', 10000]
      ].sort()
    );
  });

  it('ignores legacy subscription schedule rows outside the invoice month in reports', () => {
    const reportMonth = '2026-09';
    const invoiceId = new Types.ObjectId();

    const report = service.buildMonthlyReport([
      {
        _id: new Types.ObjectId(),
        invoice_id: invoiceId,
        customer_name: 'ACME Industries',
        invoice_no: 'SUB-AUG',
        invoice_date: new Date('2026-08-08T00:00:00.000Z'),
        invoice_month: '2026-08',
        invoice_type: 'recurring',
        revenue_month: reportMonth,
        revenue_date: new Date('2026-09-30T00:00:00.000Z'),
        revenue_type: 'recurring',
        amount: 10000
      }
    ], reportMonth);

    assert.equal(report.summary.row_count, 0);
    assert.equal(report.summary.recurring_revenue, 0);
    assert.equal(report.summary.total_revenue, 0);
    assert.equal(report.rows.length, 0);
  });

  it('uses full invoice value for subscription KPI totals when a legacy schedule row has a split amount', () => {
    const reportMonth = '2026-08';
    const invoiceId = new Types.ObjectId();

    const report = service.buildMonthlyReport([
      {
        _id: new Types.ObjectId(),
        invoice_id: invoiceId,
        customer_name: 'Subscription Customer',
        invoice_no: 'SUB-AUG',
        invoice_date: new Date('2026-08-08T00:00:00.000Z'),
        invoice_month: reportMonth,
        invoice_type: 'recurring',
        invoice_value: 50000,
        revenue_month: reportMonth,
        revenue_date: new Date('2026-08-31T00:00:00.000Z'),
        revenue_type: 'recurring',
        amount: 4166.67
      }
    ], reportMonth);

    assert.equal(report.summary.recurring_current_month_revenue, 50000);
    assert.equal(report.summary.recurring_revenue, 50000);
    assert.equal(report.summary.total_revenue, 50000);
    assert.equal(report.rows[0].amount, 50000);
  });

  it('bulk import keeps processing rows and reports failed rows separately', async () => {
    const importService = new BulkImportTestInvoiceService('production');

    const result = await importService.bulkCreate([
      { invoice_no: 'INV-OK', customer_name: 'ACME Industries' },
      { invoice_no: 'FAIL', customer_name: 'Beta Metals' },
      { invoice_no: 'INV-OK-2', customer_name: 'Core Systems' }
    ], new Types.ObjectId());

    assert.equal(result.total_count, 3);
    assert.equal(result.created_count, 2);
    assert.equal(result.failed_count, 1);
    assert.deepEqual(result.results.map((row) => row.status), ['created', 'failed', 'created']);
    assert.equal(result.results[1].message, 'Simulated duplicate invoice');
  });

  it('soft deletes invoices and stores delete audit fields', async () => {
    const invoiceId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    let invoiceUpdate = null;
    let scheduleUpdate = null;

    const deleteService = new SoftDeleteTestInvoiceService(
      {
        async findOneAndUpdate(filter, update) {
          assert.deepEqual(filter, { _id: invoiceId, visible: true });
          invoiceUpdate = update.$set;
          return { _id: invoiceId, ...invoiceUpdate };
        }
      },
      {
        async updateMany(filter, update) {
          assert.deepEqual(filter, { invoice_id: invoiceId, visible: true });
          scheduleUpdate = update.$set;
          return { modifiedCount: 2 };
        }
      }
    );

    const deletedInvoice = await deleteService.delete(invoiceId, userId);

    assert.equal(deletedInvoice.visible, false);
    assert.equal(deletedInvoice.status, 'cancelled');
    assert.equal(String(deletedInvoice.updatedBy), String(userId));
    assert.equal(String(deletedInvoice.deletedBy), String(userId));
    assert.ok(deletedInvoice.deletedAt instanceof Date);
    assert.equal(invoiceUpdate.visible, false);
    assert.equal(invoiceUpdate.status, 'cancelled');
    assert.equal(String(invoiceUpdate.deletedBy), String(userId));
    assert.ok(invoiceUpdate.deletedAt instanceof Date);
    assert.equal(scheduleUpdate.visible, false);
    assert.equal(scheduleUpdate.status, 'cancelled');
    assert.equal(String(scheduleUpdate.deletedBy), String(userId));
    assert.equal(scheduleUpdate.deletedAt, invoiceUpdate.deletedAt);
  });
});
