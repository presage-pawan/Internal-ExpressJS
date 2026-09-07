import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Types } from 'mongoose';
import { RoleManager } from '../utils/role-menu.js';
import { SalesLeadService } from './sales-lead.service.js';

const service = new SalesLeadService('production');

class CompanyIndexTestService extends SalesLeadService {
  constructor(indexes = []) {
    super('production');
    this.connectionOverride = {};
    this.indexes = indexes;
    this.droppedIndexes = [];
  }

  get model() {
    return {
      collection: {
        indexes: async () => this.indexes,
        dropIndex: async (name) => this.droppedIndexes.push(name)
      }
    };
  }
}

class BulkTestService extends SalesLeadService {
  async create(payload) {
    return { id: new Types.ObjectId(), prospective_company: payload.prospective_company };
  }
}

class PaginatedListTestService extends SalesLeadService {
  constructor(rows, total) {
    super('production');
    this.rows = rows;
    this.total = total;
    this.appliedSkip = null;
    this.appliedLimit = null;
  }

  get model() {
    const query = {
      select: () => query,
      populate: () => query,
      sort: () => query,
      skip: (value) => {
        this.appliedSkip = value;
        return query;
      },
      limit: (value) => {
        this.appliedLimit = value;
        return query;
      },
      lean: async () => this.rows
    };
    return {
      find: () => query,
      countDocuments: async () => this.total
    };
  }
}

describe('SalesLeadService access control', () => {
  it('limits non-admin users to leads they own', () => {
    const userId = new Types.ObjectId();
    const filter = service.buildAccessFilter({ _id: userId, user_role: 'employee' }, { visible: true });

    assert.equal(filter.visible, true);
    assert.equal(String(filter.owner_user_id), String(userId));
  });

  it('allows admins to query all visible leads', () => {
    const filter = service.buildAccessFilter(
      { _id: new Types.ObjectId(), user_role: 'admin' },
      { visible: true }
    );

    assert.deepEqual(filter, { visible: true });
  });

  it('does not accept ownership or audit fields from a form payload', () => {
    const payload = service.buildPayload({
      prospective_company: 'ACME',
      owner_user_id: new Types.ObjectId(),
      createdBy: new Types.ObjectId(),
      visible: false
    });

    assert.equal(payload.prospective_company, 'ACME');
    assert.equal(payload.owner_user_id, undefined);
    assert.equal(payload.createdBy, undefined);
    assert.equal(payload.visible, undefined);
  });
});

describe('SalesLeadService lead normalization', () => {
  it('paginates detailed leads in the database query', async () => {
    const paginatedService = new PaginatedListTestService([{
      _id: new Types.ObjectId(),
      first_contact_date: new Date('2026-09-01T00:00:00.000Z'),
      last_interaction_date: new Date('2026-09-02T00:00:00.000Z'),
      discussion_stage: 'New Lead'
    }], 45);

    const result = await paginatedService.findAll(
      { _id: new Types.ObjectId(), user_role: 'admin' },
      { page: '2', limit: '20' }
    );

    assert.equal(paginatedService.appliedSkip, 20);
    assert.equal(paginatedService.appliedLimit, 20);
    assert.equal(result.data.length, 1);
    assert.deepEqual(result.pagination, {
      total: 45,
      page: 2,
      limit: 20,
      total_pages: 3,
      has_previous: true,
      has_next: true
    });
  });

  it('supports multiple contacts and assigns one primary contact', () => {
    const contacts = service.normalizeContacts([
      { contact_person: '  Ravi  ', email: 'RAVI@EXAMPLE.COM' },
      { contact_person: 'Nisha', is_primary: true },
      { contact_person: 'Third', is_primary: true }
    ]);

    assert.equal(contacts.length, 3);
    assert.equal(contacts[0].contact_person, 'Ravi');
    assert.equal(contacts[0].email, 'ravi@example.com');
    assert.equal(contacts.filter(contact => contact.is_primary).length, 1);
    assert.equal(contacts[1].is_primary, true);
  });

  it('calculates closed lead pipeline days up to the last interaction', () => {
    const lead = service.mapLead({
      _id: new Types.ObjectId(),
      first_contact_date: new Date('2026-01-01T00:00:00.000Z'),
      last_interaction_date: new Date('2026-01-11T00:00:00.000Z'),
      discussion_stage: 'Won'
    });

    assert.equal(lead.days_in_pipeline, 10);
  });

  it('marks overdue and upcoming follow-ups in mapped leads', () => {
    const overdue = service.mapLead({
      _id: new Types.ObjectId(),
      first_contact_date: new Date('2025-01-01'),
      last_interaction_date: new Date('2025-01-02'),
      discussion_stage: 'Qualified',
      next_action_date: new Date('2025-01-03')
    });
    const upcoming = service.mapLead({
      _id: new Types.ObjectId(),
      first_contact_date: new Date('2025-01-01'),
      last_interaction_date: new Date('2025-01-02'),
      discussion_stage: 'Qualified',
      next_action_date: new Date('2099-01-03')
    });

    assert.equal(overdue.follow_up_status, 'overdue');
    assert.equal(overdue.is_overdue, true);
    assert.equal(upcoming.follow_up_status, 'upcoming');
  });

  it('builds advanced admin filters including owner and follow-up status', () => {
    const ownerId = new Types.ObjectId();
    const filter = service.buildListFilter(
      { _id: new Types.ObjectId(), user_role: 'admin' },
      { industry: 'Manufacturing', quoted: 'yes', owner_user_id: String(ownerId), follow_up: 'overdue' }
    );

    assert.equal(filter.industry, 'Manufacturing');
    assert.equal(filter.quoted, 'yes');
    assert.equal(String(filter.owner_user_id), String(ownerId));
    assert.ok(filter.next_action_date.$lt instanceof Date);
  });

  it('filters lead lists by first-contact reporting period', () => {
    const filter = service.buildListFilter(
      { _id: new Types.ObjectId(), user_role: 'admin' },
      { from_date: '2026-04-01', to_date: '2027-03-31' }
    );

    assert.equal(filter.first_contact_date.$gte.toISOString(), '2026-04-01T00:00:00.000Z');
    assert.equal(filter.first_contact_date.$lte.toISOString(), '2027-03-31T23:59:59.999Z');
    assert.equal(filter.last_interaction_date, undefined);
  });
});

describe('Sales Lead Phase 3 analytics', () => {
  it('calculates summary KPIs and performance breakups', () => {
    const employeeId = new Types.ObjectId();
    const analytics = service.buildAnalytics([
      {
        _id: new Types.ObjectId(),
        first_contact_date: new Date('2026-04-05T00:00:00.000Z'),
        last_interaction_date: new Date('2026-04-06T00:00:00.000Z'),
        discussion_stage: 'Qualified',
        deal_value: 100000,
        quoted: 'yes',
        industry: 'Manufacturing',
        city_region: 'Pune',
        next_action_date: new Date('2025-01-01T00:00:00.000Z'),
        interactions: [{}, {}],
        owner_user_id: { _id: employeeId, firstName: 'Ravi', lastName: 'Patil' }
      },
      {
        _id: new Types.ObjectId(),
        first_contact_date: new Date('2026-05-01T00:00:00.000Z'),
        last_interaction_date: new Date('2026-06-01T00:00:00.000Z'),
        discussion_stage: 'Won',
        deal_value: 250000,
        quoted: 'yes',
        industry: 'Automotive',
        city_region: 'Mumbai',
        interactions: [{}],
        owner_user_id: { _id: employeeId, firstName: 'Ravi', lastName: 'Patil' }
      },
      {
        _id: new Types.ObjectId(),
        first_contact_date: new Date('2026-05-10T00:00:00.000Z'),
        last_interaction_date: new Date('2026-05-20T00:00:00.000Z'),
        discussion_stage: 'Lost',
        deal_value: 50000,
        quoted: 'no',
        industry: 'Automotive',
        city_region: 'Mumbai',
        interactions: [],
        owner_user_id: { _id: employeeId, firstName: 'Ravi', lastName: 'Patil' }
      }
    ], { from_date: '2026-04-01', to_date: '2027-03-31' });

    assert.equal(analytics.summary.total_leads, 3);
    assert.equal(analytics.summary.open_leads, 1);
    assert.equal(analytics.summary.pipeline_value, 100000);
    assert.equal(analytics.summary.won_value, 250000);
    assert.equal(analytics.summary.conversion_rate, 50);
    assert.equal(analytics.summary.quote_rate, 66.67);
    assert.equal(analytics.summary.overdue_follow_ups, 1);
    assert.equal(analytics.summary.total_interactions, 3);
    assert.equal(analytics.employee_breakup[0].name, 'Ravi Patil');
    assert.equal(analytics.employee_breakup[0].owner_user_id, String(employeeId));
    assert.equal(analytics.employee_breakup[0].won_count, 1);
    assert.deepEqual(analytics.monthly_trend.map(row => row.name), ['2026-04', '2026-05']);
  });

  it('returns at most the latest 12 monthly trend rows in chronological order', () => {
    const leads = Array.from({ length: 13 }, (_, index) => ({
      _id: new Types.ObjectId(),
      first_contact_date: new Date(Date.UTC(2025, index, 1)),
      last_interaction_date: new Date(Date.UTC(2025, index, 1)),
      discussion_stage: 'New Lead',
      deal_value: 0,
      quoted: 'no',
      industry: 'Manufacturing',
      city_region: 'Pune',
      interactions: []
    }));

    const monthlyTrend = service.buildAnalytics(leads).monthly_trend;

    assert.equal(monthlyTrend.length, 12);
    assert.equal(monthlyTrend[0].name, '2025-02');
    assert.equal(monthlyTrend[11].name, '2026-01');
  });
});

describe('Sales Lead Phase 2 workflows', () => {
  it('removes the legacy unique company index while preserving unrelated indexes', async () => {
    const indexService = new CompanyIndexTestService([
      { name: '_id_', key: { _id: 1 }, unique: true },
      { name: 'company_key_1', key: { company_key: 1 }, unique: true }
    ]);

    await indexService.ensureCompanyDuplicatesAllowed();

    assert.deepEqual(indexService.droppedIndexes, ['company_key_1']);
  });

  it('bulk imports multiple rows for the same company', async () => {
    const result = await new BulkTestService().bulkCreate([
      { prospective_company: 'Sun Pharma', contact: 'First contact' },
      { prospective_company: 'Sun Pharma', contact: 'Second contact' }
    ], { _id: new Types.ObjectId(), user_role: 'employee' });

    assert.equal(result.total_count, 2);
    assert.equal(result.created_count, 2);
    assert.equal(result.failed_count, 0);
    assert.deepEqual(result.results.map(row => row.prospective_company), ['Sun Pharma', 'Sun Pharma']);
  });
});

describe('Sales Lead role-menu defaults', () => {
  it('enables every Sales Lead permission for admins', async () => {
    const roleMenu = await RoleManager.getRoleMenuData('admin');
    assert.equal(roleMenu.master_sales_lead_tracker.view, true);
    assert.deepEqual(
      ['view', 'add', 'edit', 'delete', 'import', 'export'].map(key => roleMenu.sales_lead_tracker[key]),
      [true, true, true, true, true, true]
    );
  });

  it('disables every Sales Lead permission for existing non-admin roles by default', async () => {
    for (const role of ['manager', 'employee', 'worker']) {
      const roleMenu = await RoleManager.getRoleMenuData(role);
      assert.equal(roleMenu.master_sales_lead_tracker.view, false);
      assert.deepEqual(
        ['view', 'add', 'edit', 'delete', 'import', 'export'].map(key => roleMenu.sales_lead_tracker[key]),
        [false, false, false, false, false, false]
      );
    }
  });
});
