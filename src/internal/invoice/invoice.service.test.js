import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Types } from 'mongoose';
import { InvoiceService } from './invoice.service.js';

const service = new InvoiceService('production');

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

  it('splits recurring invoices across inclusive contract months and adjusts rounding in the last month', () => {
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

    assert.deepEqual(rows.map((row) => row.revenue_month), ['2026-01', '2026-02', '2026-03']);
    assert.deepEqual(rows.map((row) => row.amount), [33333.33, 33333.33, 33333.34]);
    assert.equal(rows.reduce((total, row) => Number((total + row.amount).toFixed(2)), 0), 100000);
  });

  it('treats standard 1/3/5-year contracts as 12/36/60 monthly revenue rows', () => {
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
        invoice_type: 'recurring',
        one_time_amount: 0,
        recurring_amount: tenure.months * 10000,
        contract_start_date: new Date('2026-08-08T00:00:00.000Z'),
        contract_end_date: new Date(tenure.endDate)
      };

      const rows = service.buildScheduleRows(invoice, new Types.ObjectId());

      assert.equal(rows.length, tenure.months);
      assert.equal(rows[0].revenue_month, '2026-08');
      assert.equal(rows[tenure.months - 1].revenue_month, tenure.lastMonth);
      assert.equal(rows[0].amount, 10000);
      assert.equal(rows.reduce((total, row) => Number((total + row.amount).toFixed(2)), 0), tenure.months * 10000);
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
        invoice_type: 'recurring',
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
});
