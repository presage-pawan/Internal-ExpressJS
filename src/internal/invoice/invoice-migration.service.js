import { getConnection } from '../../_db/index.js';
import { InvoiceModel } from '../../schemas/invoice.model.js';
import { InvoiceRevenueScheduleModel } from '../../schemas/invoice-revenue-schedule.model.js';

const DEFAULT_BATCH_SIZE = 500;
let migrationInProgress = false;

export class InvoiceMigrationService {
  constructor(sourceConnection = null, targetConnection = null) {
    this.sourceConnectionOverride = sourceConnection;
    this.targetConnectionOverride = targetConnection;
  }

  get sourceConnection() {
    return this.sourceConnectionOverride || getConnection('production', 'cmms');
  }

  get targetConnection() {
    return this.targetConnectionOverride || getConnection('production', 'website');
  }

  get sourceInvoiceModel() {
    return InvoiceModel(this.sourceConnection);
  }

  get targetInvoiceModel() {
    return InvoiceModel(this.targetConnection);
  }

  get sourceScheduleModel() {
    return InvoiceRevenueScheduleModel(this.sourceConnection);
  }

  get targetScheduleModel() {
    return InvoiceRevenueScheduleModel(this.targetConnection);
  }

  async getStatus() {
    const [sourceInvoices, sourceSchedules, targetInvoices, targetSchedules] = await Promise.all([
      this.sourceInvoiceModel.collection.countDocuments({}),
      this.sourceScheduleModel.collection.countDocuments({}),
      this.targetInvoiceModel.collection.countDocuments({}),
      this.targetScheduleModel.collection.countDocuments({})
    ]);

    return {
      source: {
        database: this.sourceConnection.name,
        invoices: sourceInvoices,
        invoice_revenue_schedules: sourceSchedules
      },
      target: {
        database: this.targetConnection.name,
        invoices: targetInvoices,
        invoice_revenue_schedules: targetSchedules
      },
      migration_in_progress: migrationInProgress
    };
  }

  async migrate({ batchSize = DEFAULT_BATCH_SIZE } = {}) {
    if (migrationInProgress) {
      throw Object.assign(new Error('Invoice migration is already in progress'), { status: 409 });
    }

    migrationInProgress = true;
    try {
      await Promise.all([
        this.targetInvoiceModel.createIndexes(),
        this.targetScheduleModel.createIndexes()
      ]);

      const invoices = await this.copyCollection(
        this.sourceInvoiceModel.collection,
        this.targetInvoiceModel.collection,
        batchSize
      );
      const schedules = await this.copyCollection(
        this.sourceScheduleModel.collection,
        this.targetScheduleModel.collection,
        batchSize
      );
      const status = await this.getStatus();
      status.migration_in_progress = false;

      return {
        source_database: this.sourceConnection.name,
        target_database: this.targetConnection.name,
        source_data_preserved: true,
        invoices,
        invoice_revenue_schedules: schedules,
        status
      };
    } finally {
      migrationInProgress = false;
    }
  }

  async copyCollection(sourceCollection, targetCollection, batchSize) {
    const normalizedBatchSize = Math.min(1000, Math.max(1, Number.parseInt(batchSize, 10) || DEFAULT_BATCH_SIZE));
    const sourceCount = await sourceCollection.countDocuments({});
    const cursor = sourceCollection.find({}).sort({ _id: 1 }).batchSize(normalizedBatchSize);
    let batch = [];
    let inserted = 0;
    let alreadyPresent = 0;

    const flush = async () => {
      if (!batch.length) return;
      const result = await targetCollection.bulkWrite(
        batch.map(document => ({
          updateOne: {
            filter: { _id: document._id },
            update: { $setOnInsert: document },
            upsert: true
          }
        })),
        { ordered: false }
      );
      inserted += result.upsertedCount || 0;
      alreadyPresent += result.matchedCount || 0;
      batch = [];
    };

    for await (const document of cursor) {
      batch.push(document);
      if (batch.length >= normalizedBatchSize) await flush();
    }
    await flush();

    const targetCount = await targetCollection.countDocuments({});
    return {
      collection: sourceCollection.collectionName,
      source_count: sourceCount,
      inserted_count: inserted,
      already_present_count: alreadyPresent,
      processed_count: inserted + alreadyPresent,
      target_count: targetCount,
      all_source_ids_present: inserted + alreadyPresent === sourceCount
    };
  }
}
