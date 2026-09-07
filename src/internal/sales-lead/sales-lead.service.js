import { getConnection } from '../../_db/index.js';
import { SalesLeadModel } from '../../schemas/sales-lead.model.js';
import { validateObjectId } from '../../utils/helper.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const CLOSED_STAGES = new Set(['Won', 'Lost']);
const EDITABLE_FIELDS = [
  'first_contact_date',
  'last_interaction_date',
  'prospective_company',
  'industry',
  'city_region',
  'contacts',
  'discussion_stage',
  'deal_value',
  'quoted',
  'next_action',
  'remarks'
];

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class SalesLeadService {
  constructor(dbType = 'production') {
    if (dbType && typeof dbType === 'object') {
      this.connectionOverride = dbType;
      this.dbType = 'production';
    } else {
      this.dbType = dbType;
    }
  }

  get connection() {
    return this.connectionOverride || getConnection(this.dbType, 'website');
  }

  get model() {
    return SalesLeadModel(this.connection);
  }

  isAdmin(requester) {
    return requester?.user_role === 'admin';
  }

  getRequesterId(requester) {
    return validateObjectId(requester?._id || requester?.id);
  }

  buildAccessFilter(requester, filter = {}) {
    if (this.isAdmin(requester)) {
      return filter;
    }
    return { ...filter, owner_user_id: this.getRequesterId(requester) };
  }

  buildListFilter(requester, query = {}) {
    const filter = this.buildAccessFilter(requester, { visible: true });
    if (query.search) {
      const search = new RegExp(escapeRegex(String(query.search).trim()), 'i');
      filter.$or = [
        { prospective_company: search },
        { city_region: search },
        { 'contacts.contact_person': search },
        { 'contacts.email': search }
      ];
    }
    if (query.discussion_stage) {
      filter.discussion_stage = query.discussion_stage;
    }
    return filter;
  }

  normalizeContacts(contacts = []) {
    const normalized = contacts.map((contact, index) => ({
      contact_person: String(contact?.contact_person || '').trim(),
      designation: String(contact?.designation || '').trim(),
      email: String(contact?.email || '').trim().toLowerCase(),
      phone: String(contact?.phone || '').trim(),
      is_primary: contact?.is_primary === true
    }));

    if (normalized.length && !normalized.some(contact => contact.is_primary)) {
      normalized[0].is_primary = true;
    }
    if (normalized.filter(contact => contact.is_primary).length > 1) {
      let primaryFound = false;
      normalized.forEach(contact => {
        if (contact.is_primary && !primaryFound) {
          primaryFound = true;
        } else {
          contact.is_primary = false;
        }
      });
    }
    return normalized;
  }

  buildPayload(payload = {}) {
    const data = {};
    EDITABLE_FIELDS.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        data[field] = payload[field];
      }
    });
    if (data.contacts) {
      data.contacts = this.normalizeContacts(data.contacts);
    }
    if (data.quoted) {
      data.quoted = String(data.quoted).toLowerCase();
    }
    return data;
  }

  mapLead(lead) {
    if (!lead) return null;
    const item = typeof lead.toObject === 'function' ? lead.toObject() : { ...lead };
    const firstContact = new Date(item.first_contact_date);
    const pipelineEnd = CLOSED_STAGES.has(item.discussion_stage)
      ? new Date(item.last_interaction_date)
      : new Date();
    const daysInPipeline = Number.isNaN(firstContact.getTime()) || Number.isNaN(pipelineEnd.getTime())
      ? 0
      : Math.max(0, Math.floor((pipelineEnd.getTime() - firstContact.getTime()) / DAY_MS));

    return {
      ...item,
      id: item.id || item._id,
      days_in_pipeline: daysInPipeline
    };
  }

  async findAll(requester, query = {}) {
    const leads = await this.model.find(this.buildListFilter(requester, query))
      .populate({ path: 'owner_user_id', select: 'firstName lastName username email jobTitle user_role' })
      .sort({ last_interaction_date: -1, createdAt: -1 })
      .lean();
    return leads.map(lead => this.mapLead(lead));
  }

  async findById(id, requester) {
    const filter = this.buildAccessFilter(requester, { _id: validateObjectId(id), visible: true });
    const lead = await this.model.findOne(filter)
      .populate({ path: 'owner_user_id', select: 'firstName lastName username email jobTitle user_role' })
      .lean();
    return this.mapLead(lead);
  }

  async create(payload, requester) {
    const userId = this.getRequesterId(requester);
    const lead = await this.model.create({
      ...this.buildPayload(payload),
      owner_user_id: userId,
      createdBy: userId
    });
    return this.mapLead(lead);
  }

  async update(id, payload, requester) {
    const userId = this.getRequesterId(requester);
    const filter = this.buildAccessFilter(requester, { _id: validateObjectId(id), visible: true });
    const lead = await this.model.findOneAndUpdate(
      filter,
      { $set: { ...this.buildPayload(payload), updatedBy: userId } },
      { new: true, runValidators: true }
    ).populate({ path: 'owner_user_id', select: 'firstName lastName username email jobTitle user_role' });
    return this.mapLead(lead);
  }

  async delete(id, requester) {
    const userId = this.getRequesterId(requester);
    const filter = this.buildAccessFilter(requester, { _id: validateObjectId(id), visible: true });
    return this.model.findOneAndUpdate(filter, {
      $set: {
        visible: false,
        updatedBy: userId,
        deletedBy: userId,
        deletedAt: new Date()
      }
    }, { new: true });
  }
}
