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
  'next_action_date',
  'remarks'
];

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toCompanyKey = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
const startOfUtcDay = (value = new Date()) => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
const addUtcDays = (date, days) => new Date(date.getTime() + (days * DAY_MS));

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
    if (query.industry) filter.industry = query.industry;
    if (query.quoted) filter.quoted = query.quoted;
    if (query.owner_user_id && this.isAdmin(requester)) {
      filter.owner_user_id = validateObjectId(query.owner_user_id);
    }
    if (query.from_date || query.to_date) {
      filter.first_contact_date = {};
      if (query.from_date) filter.first_contact_date.$gte = new Date(query.from_date);
      if (query.to_date) filter.first_contact_date.$lte = new Date(`${query.to_date}T23:59:59.999Z`);
    }
    const today = startOfUtcDay();
    if (query.follow_up === 'overdue') {
      filter.next_action_date = { $lt: today };
      filter.discussion_stage = { $nin: [...CLOSED_STAGES] };
    } else if (query.follow_up === 'today') {
      filter.next_action_date = { $gte: today, $lt: addUtcDays(today, 1) };
      filter.discussion_stage = { $nin: [...CLOSED_STAGES] };
    } else if (query.follow_up === 'upcoming') {
      filter.next_action_date = { $gte: addUtcDays(today, 1) };
      filter.discussion_stage = { $nin: [...CLOSED_STAGES] };
    } else if (query.follow_up === 'not_scheduled') {
      filter.next_action_date = null;
      filter.discussion_stage = { $nin: [...CLOSED_STAGES] };
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
    if (data.prospective_company) {
      data.company_key = toCompanyKey(data.prospective_company);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'next_action_date') && !data.next_action_date) {
      data.next_action_date = null;
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

    const today = startOfUtcDay();
    const followUpDate = item.next_action_date ? startOfUtcDay(new Date(item.next_action_date)) : null;
    let followUpStatus = 'not_scheduled';
    if (CLOSED_STAGES.has(item.discussion_stage)) followUpStatus = 'closed';
    else if (followUpDate && followUpDate < today) followUpStatus = 'overdue';
    else if (followUpDate && followUpDate.getTime() === today.getTime()) followUpStatus = 'today';
    else if (followUpDate) followUpStatus = 'upcoming';

    return {
      ...item,
      id: item.id || item._id,
      days_in_pipeline: daysInPipeline,
      follow_up_status: followUpStatus,
      is_overdue: followUpStatus === 'overdue'
    };
  }

  async findAll(requester, query = {}) {
    const leads = await this.model.find(this.buildListFilter(requester, query))
      .select('-interactions')
      .populate({ path: 'owner_user_id', select: 'firstName lastName username email jobTitle user_role' })
      .sort({ last_interaction_date: -1, createdAt: -1 })
      .lean();
    return leads.map(lead => this.mapLead(lead));
  }

  async findById(id, requester) {
    const filter = this.buildAccessFilter(requester, { _id: validateObjectId(id), visible: true });
    const lead = await this.model.findOne(filter)
      .populate({ path: 'owner_user_id', select: 'firstName lastName username email jobTitle user_role' })
      .populate({ path: 'interactions.createdBy', select: 'firstName lastName username' })
      .lean();
    return this.mapLead(lead);
  }

  async getAnalytics(requester, query = {}) {
    const filter = this.buildAccessFilter(requester, { visible: true });
    if (query.owner_user_id && this.isAdmin(requester)) {
      filter.owner_user_id = validateObjectId(query.owner_user_id);
    }
    if (query.from_date || query.to_date) {
      filter.first_contact_date = {};
      if (query.from_date) filter.first_contact_date.$gte = new Date(query.from_date);
      if (query.to_date) filter.first_contact_date.$lte = new Date(`${query.to_date}T23:59:59.999Z`);
    }
    const leads = await this.model.find(filter)
      .populate({ path: 'owner_user_id', select: 'firstName lastName username email' })
      .lean();
    return this.buildAnalytics(leads, query);
  }

  buildAnalytics(leads = [], query = {}) {
    const mapped = leads.map(lead => this.mapLead(lead));
    const openLeads = mapped.filter(lead => !CLOSED_STAGES.has(lead.discussion_stage));
    const won = mapped.filter(lead => lead.discussion_stage === 'Won');
    const lost = mapped.filter(lead => lead.discussion_stage === 'Lost');
    const quoted = mapped.filter(lead => lead.quoted === 'yes');
    const totalInteractions = mapped.reduce((total, lead) => total + (lead.interactions?.length || 0), 0);
    const sum = (rows) => rows.reduce((total, lead) => total + Number(lead.deal_value || 0), 0);
    const ratio = (numerator, denominator) => denominator ? Number(((numerator / denominator) * 100).toFixed(2)) : 0;
    const averageDays = mapped.length
      ? Number((mapped.reduce((total, lead) => total + lead.days_in_pipeline, 0) / mapped.length).toFixed(1))
      : 0;

    const group = (keyFn) => {
      const rows = new Map();
      mapped.forEach(lead => {
        const key = keyFn(lead) || 'Not specified';
        const current = rows.get(key) || { name: key, lead_count: 0, deal_value: 0, won_count: 0, quoted_count: 0, interaction_count: 0 };
        current.lead_count += 1;
        current.deal_value += Number(lead.deal_value || 0);
        current.won_count += lead.discussion_stage === 'Won' ? 1 : 0;
        current.quoted_count += lead.quoted === 'yes' ? 1 : 0;
        current.interaction_count += lead.interactions?.length || 0;
        rows.set(key, current);
      });
      return [...rows.values()].sort((a, b) => b.deal_value - a.deal_value);
    };

    const ownerName = (lead) => {
      const owner = lead.owner_user_id;
      if (!owner || typeof owner === 'string') return 'Unknown employee';
      return [owner.firstName, owner.lastName].filter(Boolean).join(' ') || owner.username || owner.email;
    };

    const employeeBreakup = group(lead => {
      const owner = lead.owner_user_id;
      const ownerId = owner?._id || owner?.id || (typeof owner === 'string' ? owner : 'unknown');
      return `${ownerId}|||${ownerName(lead)}`;
    }).map(row => {
      const [ownerUserId, name] = row.name.split('|||');
      return { ...row, name, owner_user_id: ownerUserId === 'unknown' ? null : ownerUserId };
    });

    const monthly = group(lead => {
      const date = new Date(lead.first_contact_date);
      return Number.isNaN(date.getTime()) ? 'Unknown' : `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    }).sort((a, b) => a.name.localeCompare(b.name));

    return {
      period: { from_date: query.from_date || null, to_date: query.to_date || null },
      summary: {
        total_leads: mapped.length,
        open_leads: openLeads.length,
        pipeline_value: sum(openLeads),
        total_deal_value: sum(mapped),
        won_count: won.length,
        won_value: sum(won),
        lost_count: lost.length,
        quoted_count: quoted.length,
        quote_rate: ratio(quoted.length, mapped.length),
        conversion_rate: ratio(won.length, won.length + lost.length),
        overdue_follow_ups: mapped.filter(lead => lead.is_overdue).length,
        average_days_in_pipeline: averageDays,
        total_interactions: totalInteractions
      },
      stage_breakup: group(lead => lead.discussion_stage),
      employee_breakup: employeeBreakup,
      industry_breakup: group(lead => lead.industry),
      region_breakup: group(lead => lead.city_region),
      monthly_trend: monthly
    };
  }

  async create(payload, requester) {
    const userId = this.getRequesterId(requester);
    const normalizedPayload = this.buildPayload(payload);
    await this.assertNoDuplicate(normalizedPayload.company_key);
    const initialInteraction = {
      interaction_date: normalizedPayload.first_contact_date,
      interaction_type: 'First Contact',
      notes: normalizedPayload.remarks || 'Lead created',
      discussion_stage: normalizedPayload.discussion_stage,
      next_action: normalizedPayload.next_action,
      next_action_date: normalizedPayload.next_action_date,
      createdBy: userId
    };
    const lead = await this.model.create({
      ...normalizedPayload,
      interactions: [initialInteraction],
      owner_user_id: userId,
      createdBy: userId
    });
    return this.mapLead(lead);
  }

  async update(id, payload, requester) {
    const userId = this.getRequesterId(requester);
    const filter = this.buildAccessFilter(requester, { _id: validateObjectId(id), visible: true });
    const normalizedPayload = this.buildPayload(payload);
    if (normalizedPayload.company_key) {
      await this.assertNoDuplicate(normalizedPayload.company_key, id);
    }
    const lead = await this.model.findOneAndUpdate(
      filter,
      { $set: { ...normalizedPayload, updatedBy: userId } },
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

  async assertNoDuplicate(companyKey, excludeId = null) {
    if (!companyKey) return;
    const normalizedName = new RegExp(`^${escapeRegex(companyKey)}$`, 'i');
    const filter = {
      visible: true,
      $or: [
        { company_key: companyKey },
        { prospective_company: normalizedName }
      ]
    };
    if (excludeId) filter._id = { $ne: validateObjectId(excludeId) };
    const duplicate = await this.model.findOne(filter).select('_id prospective_company owner_user_id').lean();
    if (duplicate) {
      const error = Object.assign(new Error(`An active lead already exists for ${duplicate.prospective_company}`), {
        status: 409,
        code: 'DUPLICATE_SALES_LEAD'
      });
      throw error;
    }
  }

  async bulkCreate(rows = [], requester) {
    const results = [];
    for (const [index, row] of rows.entries()) {
      try {
        const lead = await this.create(row, requester);
        results.push({ row: index + 1, status: 'created', id: lead.id, prospective_company: lead.prospective_company });
      } catch (error) {
        results.push({
          row: index + 1,
          status: 'failed',
          prospective_company: row?.prospective_company,
          message: error?.message || 'Sales lead import failed'
        });
      }
    }
    const createdCount = results.filter(result => result.status === 'created').length;
    return {
      total_count: rows.length,
      created_count: createdCount,
      failed_count: rows.length - createdCount,
      results
    };
  }

  async addInteraction(id, payload, requester) {
    const userId = this.getRequesterId(requester);
    const filter = this.buildAccessFilter(requester, { _id: validateObjectId(id), visible: true });
    const interaction = {
      interaction_date: payload.interaction_date,
      interaction_type: payload.interaction_type,
      notes: String(payload.notes || '').trim(),
      discussion_stage: payload.discussion_stage,
      next_action: String(payload.next_action || '').trim(),
      next_action_date: payload.next_action_date || null,
      createdBy: userId,
      createdAt: new Date()
    };
    const lead = await this.model.findOneAndUpdate(filter, {
      $push: { interactions: interaction },
      $set: {
        last_interaction_date: payload.interaction_date,
        discussion_stage: payload.discussion_stage,
        next_action: interaction.next_action,
        next_action_date: interaction.next_action_date,
        updatedBy: userId
      }
    }, { new: true, runValidators: true })
      .populate({ path: 'owner_user_id', select: 'firstName lastName username email jobTitle user_role' });
    return this.mapLead(lead);
  }

  async reassign(id, ownerUserId, requester) {
    if (!this.isAdmin(requester)) throw Object.assign(new Error('Forbidden'), { status: 403 });
    const userId = this.getRequesterId(requester);
    const targetUserId = validateObjectId(ownerUserId);
    this.model;
    const targetUser = await this.connection.models.InternalUser.findOne({
      _id: targetUserId,
      visible: { $ne: false },
      user_status: 'active'
    }).select('_id').lean();
    if (!targetUser) throw Object.assign(new Error('Selected employee is not active'), { status: 400 });
    const lead = await this.model.findOneAndUpdate(
      { _id: validateObjectId(id), visible: true },
      { $set: { owner_user_id: targetUserId, updatedBy: userId } },
      { new: true, runValidators: true }
    ).populate({ path: 'owner_user_id', select: 'firstName lastName username email jobTitle user_role' });
    return this.mapLead(lead);
  }
}
