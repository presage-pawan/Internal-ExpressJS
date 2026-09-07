import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Types } from 'mongoose';
import { RoleManager } from '../utils/role-menu.js';
import { SalesLeadService } from './sales-lead.service.js';

const service = new SalesLeadService('production');

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
