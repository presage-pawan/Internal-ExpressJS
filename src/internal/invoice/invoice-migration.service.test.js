import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { InvoiceMigrationService } from './invoice-migration.service.js';

const sourceCollection = (collectionName, documents) => ({
  collectionName,
  countDocuments: async () => documents.length,
  find: () => {
    const cursor = {
      sort: () => cursor,
      batchSize: () => cursor,
      async *[Symbol.asyncIterator]() {
        for (const document of documents) yield document;
      }
    };
    return cursor;
  }
});

const targetCollection = (collectionName, documents = []) => {
  const stored = new Map(documents.map(document => [String(document._id), document]));
  return {
    collectionName,
    stored,
    countDocuments: async () => stored.size,
    bulkWrite: async (operations) => {
      let upsertedCount = 0;
      let matchedCount = 0;
      operations.forEach(({ updateOne }) => {
        const key = String(updateOne.filter._id);
        if (stored.has(key)) {
          matchedCount += 1;
        } else {
          stored.set(key, updateOne.update.$setOnInsert);
          upsertedCount += 1;
        }
      });
      return { upsertedCount, matchedCount };
    }
  };
};

class TestInvoiceMigrationService extends InvoiceMigrationService {
  constructor() {
    super({}, {});
    this.sourceInvoices = sourceCollection('invoices', [
      { _id: 'invoice-1', invoice_no: 'INV-001' },
      { _id: 'invoice-2', invoice_no: 'INV-002' }
    ]);
    this.sourceSchedules = sourceCollection('invoice_revenue_schedules', [
      { _id: 'schedule-1', invoice_id: 'invoice-1' }
    ]);
    this.targetInvoices = targetCollection('invoices');
    this.targetSchedules = targetCollection('invoice_revenue_schedules');
    this.invoiceIndexesCreated = false;
    this.scheduleIndexesCreated = false;
  }

  get sourceConnection() { return { name: 'cmms' }; }
  get targetConnection() { return { name: 'website' }; }
  get sourceInvoiceModel() { return { collection: this.sourceInvoices }; }
  get sourceScheduleModel() { return { collection: this.sourceSchedules }; }
  get targetInvoiceModel() {
    return {
      collection: this.targetInvoices,
      createIndexes: async () => { this.invoiceIndexesCreated = true; }
    };
  }
  get targetScheduleModel() {
    return {
      collection: this.targetSchedules,
      createIndexes: async () => { this.scheduleIndexesCreated = true; }
    };
  }
}

describe('InvoiceMigrationService', () => {
  it('copies invoices and schedules to website without removing source data', async () => {
    const service = new TestInvoiceMigrationService();

    const result = await service.migrate({ batchSize: 1 });

    assert.equal(result.source_database, 'cmms');
    assert.equal(result.target_database, 'website');
    assert.equal(result.source_data_preserved, true);
    assert.equal(result.invoices.inserted_count, 2);
    assert.equal(result.invoice_revenue_schedules.inserted_count, 1);
    assert.equal(result.invoices.all_source_ids_present, true);
    assert.equal(result.status.migration_in_progress, false);
    assert.equal(service.sourceInvoices.countDocuments instanceof Function, true);
    assert.equal(service.targetInvoices.stored.size, 2);
    assert.equal(service.targetSchedules.stored.size, 1);
    assert.equal(service.invoiceIndexesCreated, true);
    assert.equal(service.scheduleIndexesCreated, true);
  });

  it('can be rerun without duplicating documents', async () => {
    const service = new TestInvoiceMigrationService();
    await service.migrate();

    const result = await service.migrate();

    assert.equal(result.invoices.inserted_count, 0);
    assert.equal(result.invoices.already_present_count, 2);
    assert.equal(result.invoice_revenue_schedules.inserted_count, 0);
    assert.equal(result.invoice_revenue_schedules.already_present_count, 1);
    assert.equal(service.targetInvoices.stored.size, 2);
    assert.equal(service.targetSchedules.stored.size, 1);
  });
});
