import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validationResult } from 'express-validator';
import { createConnection, Types } from 'mongoose';
import { SalesLeadModel } from '../../schemas/sales-lead.model.js';
import {
  addSalesLeadInteractionValidator,
  createSalesLeadValidator
} from './sales-lead.validator.js';

const runValidators = async (validators, body) => {
  const request = { body };
  for (const validator of validators) await validator.run(request);
  return validationResult(request).array();
};

describe('Sales Lead optional next action validation', () => {
  it('accepts a lead without a next action, including bulk-import shaped data', async () => {
    const errors = await runValidators(createSalesLeadValidator, {
      first_contact_date: '2026-09-01',
      last_interaction_date: '2026-09-01',
      prospective_company: 'ACME',
      industry: 'Manufacturing',
      city_region: 'Pune',
      contacts: [{ contact_person: 'Ravi', is_primary: true }],
      discussion_stage: 'New Lead',
      deal_value: 0,
      quoted: 'no',
      next_action: '',
      next_action_date: null,
      remarks: ''
    });

    assert.deepEqual(errors, []);
  });

  it('accepts an interaction without a next action', async () => {
    const errors = await runValidators(addSalesLeadInteractionValidator, {
      interaction_date: '2026-09-07',
      interaction_type: 'Call',
      notes: 'Introductory call completed',
      discussion_stage: 'Contacted',
      next_action: '',
      next_action_date: null
    });

    assert.deepEqual(errors, []);
  });

  it('allows the database model used by Excel import to save a blank next action', async () => {
    const connection = createConnection();
    const SalesLead = SalesLeadModel(connection);
    assert.equal(
      SalesLead.schema.indexes().some(([keys, options]) => keys.company_key === 1 && options.unique === true),
      false
    );
    const userId = new Types.ObjectId();
    const lead = new SalesLead({
      first_contact_date: new Date('2026-09-01'),
      last_interaction_date: new Date('2026-09-01'),
      prospective_company: 'ACME',
      company_key: 'acme',
      industry: 'Manufacturing',
      city_region: 'Pune',
      contacts: [{ contact_person: 'Ravi', is_primary: true }],
      discussion_stage: 'New Lead',
      quoted: 'no',
      next_action: '',
      owner_user_id: userId,
      createdBy: userId
    });

    await lead.validate();
    await connection.destroy();
  });
});
