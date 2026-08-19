import { AccountModel, defaultSubscriptionLimitData } from '../../schemas/company.model.js';
import { AccountRoleMenuAuditModel } from '../../schemas/account-role-menu-audit.model.js';
import { getConnection } from '../../../_db/index.js';
import {
    ACCOUNT_ROLE_MENU_SCHEMA_VERSION,
    getAccountRoleMenuTemplate,
    mergeWithAccountRoleMenuTemplate,
    validateAccountRoleMenu
} from './account-role-menu.js';

const ACCOUNT_UPDATE_FIELDS = [
    'account_name',
    'account_status',
    'type',
    'experience_profile',
    'description',
    'fileName',
    'default_language',
    'cookie_status',
    'encrypt_payload',
    'encrypt_response',
    'visible',
    'subscription_plan',
    'subscription_type',
    'subscription_start_date',
    'subscription_end_date',
    'subscription_status',
    'user_limit',
    'location_limit',
    'asset_limit'
];

const SUBSCRIPTION_FIELDS = [
    'subscription_plan',
    'subscription_type',
    'subscription_start_date',
    'subscription_end_date',
    'subscription_status',
    'user_limit',
    'location_limit',
    'asset_limit'
];

const FEATURE_STATUS_FIELDS = ['cookie_status', 'encrypt_payload', 'encrypt_response'];
const LIMIT_FIELDS = ['user_limit', 'location_limit', 'asset_limit'];
const DATE_FIELDS = ['subscription_start_date', 'subscription_end_date'];
const FILTER_FIELDS = [
    'type',
    'account_status',
    'experience_profile',
    'cookie_status',
    'encrypt_payload',
    'encrypt_response',
    'subscription_status',
    'subscription_type'
];

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class CompanyService {

    constructor(dbType = 'production') {
        this.dbType = dbType;
    }

    get model() {
        const connection = getConnection(this.dbType, 'cmms');
        return AccountModel(connection);
    }

    get auditModel() {
        const connection = getConnection(this.dbType, 'cmms');
        return AccountRoleMenuAuditModel(connection);
    }

    async create(payload) {
        const accountPayload = this.buildAccountPayload(payload, { isCreate: true });
        const account = new this.model(accountPayload);
        return account.save();
    }

    async findAll(filter = {}, projection = null, options = {}) {
        return this.model.find(filter, projection, options).exec();
    }

    async findById(id) {
        return this.model.findById(id).exec();
    }

    async update(id, payload) {
        const account = await this.findById(id);
        if (!account) {
            return null;
        }

        const updatePayload = this.buildAccountPayload(payload, { existingAccount: account });
        return this.model.findByIdAndUpdate(id, { $set: updatePayload }, { new: true, runValidators: true });
    }

    async updatePartial(id, payload) {
        return this.update(id, payload);
    }

    async updateSubscription(id, payload) {
        const updateData = this.buildSubscriptionPayload(payload);
        if (!Object.keys(updateData).length) {
            throw Object.assign(new Error('At least one subscription field is required'), { status: 400 });
        }

        return this.model.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
    }

    async delete(id, updatedBy) {
        return this.model.findByIdAndUpdate(id, { visible: false, updatedBy }, { new: true });
    }

    async getAccountRoleMenu(accountId) {
        const account = await this.findById(accountId);
        if (!account) {
            throw Object.assign(new Error('Account not found'), { status: 404 });
        }

        return {
            account_id: account._id,
            experience_profile: account.experience_profile,
            account_role_menu: this.getCurrentAccountRoleMenu(account),
            account_permission_version: account.account_permission_version || 1,
            account_role_menu_schema_version: account.account_role_menu_schema_version || 1
        };
    }

    async updateAccountRoleMenu(accountId, payload, internalUserId) {
        const account = await this.findById(accountId);
        if (!account) {
            throw Object.assign(new Error('Account not found'), { status: 404 });
        }

        const accountRoleMenu = this.normalizeAccountRoleMenu(payload.account_role_menu, account.experience_profile);
        const before = this.getCurrentAccountRoleMenu(account);
        const accountPermissionVersion = Number(account.account_permission_version || 1) + 1;
        const updatedAccount = await this.model.findByIdAndUpdate(
            accountId,
            {
                $set: {
                    account_role_menu: accountRoleMenu,
                    account_permission_version: accountPermissionVersion,
                    account_role_menu_schema_version: ACCOUNT_ROLE_MENU_SCHEMA_VERSION,
                    account_role_menu_updated_by: internalUserId,
                    account_role_menu_updated_at: new Date()
                }
            },
            { new: true, runValidators: true }
        );

        await this.auditModel.create({
            account_id: accountId,
            before,
            after: accountRoleMenu,
            changed_by: internalUserId,
            reason: payload.reason
        });

        return {
            account_id: updatedAccount._id,
            account_role_menu: updatedAccount.account_role_menu,
            account_permission_version: updatedAccount.account_permission_version,
            account_role_menu_schema_version: updatedAccount.account_role_menu_schema_version
        };
    }

    async resetAccountRoleMenu(accountId, payload, internalUserId) {
        const account = await this.findById(accountId);
        if (!account) {
            throw Object.assign(new Error('Account not found'), { status: 404 });
        }

        const experienceProfile = payload.experience_profile || account.experience_profile || 'standard_account';
        const accountRoleMenu = getAccountRoleMenuTemplate(experienceProfile);
        const before = this.getCurrentAccountRoleMenu(account);
        const accountPermissionVersion = Number(account.account_permission_version || 1) + 1;
        const updatedAccount = await this.model.findByIdAndUpdate(
            accountId,
            {
                $set: {
                    experience_profile: experienceProfile,
                    account_role_menu: accountRoleMenu,
                    account_permission_version: accountPermissionVersion,
                    account_role_menu_schema_version: ACCOUNT_ROLE_MENU_SCHEMA_VERSION,
                    account_role_menu_updated_by: internalUserId,
                    account_role_menu_updated_at: new Date()
                }
            },
            { new: true, runValidators: true }
        );

        await this.auditModel.create({
            account_id: accountId,
            before,
            after: accountRoleMenu,
            changed_by: internalUserId,
            reason: payload.reason
        });

        return {
            account_id: updatedAccount._id,
            experience_profile: updatedAccount.experience_profile,
            account_role_menu: updatedAccount.account_role_menu,
            account_permission_version: updatedAccount.account_permission_version,
            account_role_menu_schema_version: updatedAccount.account_role_menu_schema_version
        };
    }

    getCurrentAccountRoleMenu(account) {
        const roleMenu = account.account_role_menu && Object.keys(account.account_role_menu).length
            ? account.account_role_menu
            : {};
        return mergeWithAccountRoleMenuTemplate(roleMenu, account.experience_profile);
    }

    normalizeAccountRoleMenu(accountRoleMenu, experienceProfile = 'standard_account') {
        const errors = validateAccountRoleMenu(accountRoleMenu, experienceProfile);
        if (errors.length) {
            throw Object.assign(new Error(errors.join(', ')), { status: 400 });
        }
        return mergeWithAccountRoleMenuTemplate(accountRoleMenu, experienceProfile);
    }

    buildListFilter(query = {}) {
        const filter = {};

        for (const field of FILTER_FIELDS) {
            if (query[field]) {
                filter[field] = query[field];
            }
        }

        if (query.visible !== undefined && query.visible !== '') {
            filter.visible = query.visible === true || query.visible === 'true';
        }

        const search = String(query.search || '').trim();
        if (search) {
            const pattern = new RegExp(escapeRegex(search), 'i');
            filter.$or = [
                { account_name: pattern },
                { type: pattern },
                { description: pattern },
                { subscription_plan: pattern }
            ];
        }

        return filter;
    }

    buildAccountPayload(payload, options = {}) {
        const accountPayload = {};
        for (const field of ACCOUNT_UPDATE_FIELDS) {
            if (this.shouldIncludeField(field, payload[field])) {
                accountPayload[field] = this.normalizeFieldValue(field, payload[field]);
            }
        }

        const experienceProfile = accountPayload.experience_profile
            || options.existingAccount?.experience_profile
            || 'standard_account';

        if (options.isCreate) {
            accountPayload.account_role_menu = getAccountRoleMenuTemplate(experienceProfile);
            accountPayload.account_role_menu_schema_version = ACCOUNT_ROLE_MENU_SCHEMA_VERSION;
            accountPayload.account_permission_version = 1;
        }

        const existingSub = options.existingAccount?.subscription;
        const incomingSub = payload.subscription;

        const subscriptionType = incomingSub?.subscription_type
            ?? accountPayload.subscription_type
            ?? existingSub?.subscription_type
            ?? options.existingAccount?.subscription_type
            ?? (options.isCreate ? 'free' : undefined);

        const subscriptionStatus = incomingSub?.subscription_status
            ?? accountPayload.subscription_status
            ?? existingSub?.subscription_status
            ?? options.existingAccount?.subscription_status
            ?? (options.isCreate ? 'active' : undefined);

        const subscriptionPlan = incomingSub?.subscription_plan
            ?? accountPayload.subscription_plan
            ?? existingSub?.subscription_plan
            ?? options.existingAccount?.subscription_plan
            ?? (options.isCreate ? '' : undefined);

        const subscriptionStartDate = incomingSub?.subscription_start_date !== undefined
            ? this.normalizeFieldValue('subscription_start_date', incomingSub.subscription_start_date)
            : (accountPayload.subscription_start_date !== undefined
                ? accountPayload.subscription_start_date
                : (existingSub?.subscription_start_date ?? options.existingAccount?.subscription_start_date ?? (options.isCreate ? null : undefined)));

        const subscriptionEndDate = incomingSub?.subscription_end_date !== undefined
            ? this.normalizeFieldValue('subscription_end_date', incomingSub.subscription_end_date)
            : (accountPayload.subscription_end_date !== undefined
                ? accountPayload.subscription_end_date
                : (existingSub?.subscription_end_date ?? options.existingAccount?.subscription_end_date ?? (options.isCreate ? null : undefined)));

        const defaultLimits = defaultSubscriptionLimitData[subscriptionType || 'free'] || defaultSubscriptionLimitData.free;

        const userLimit = incomingSub?.limits?.user_limit !== undefined
            ? Number(incomingSub.limits.user_limit)
            : (accountPayload.user_limit !== undefined
                ? accountPayload.user_limit
                : (existingSub?.limits?.user_limit ?? options.existingAccount?.user_limit ?? (options.isCreate ? defaultLimits.user_limit : undefined)));

        const locationLimit = incomingSub?.limits?.location_limit !== undefined
            ? Number(incomingSub.limits.location_limit)
            : (accountPayload.location_limit !== undefined
                ? accountPayload.location_limit
                : (existingSub?.limits?.location_limit ?? options.existingAccount?.location_limit ?? (options.isCreate ? defaultLimits.location_limit : undefined)));

        const assetLimit = incomingSub?.limits?.asset_limit !== undefined
            ? Number(incomingSub.limits.asset_limit)
            : (accountPayload.asset_limit !== undefined
                ? accountPayload.asset_limit
                : (existingSub?.limits?.asset_limit ?? options.existingAccount?.asset_limit ?? (options.isCreate ? defaultLimits.asset_limit : undefined)));

        if (options.isCreate || incomingSub || subscriptionType !== undefined || userLimit !== undefined || locationLimit !== undefined || assetLimit !== undefined || subscriptionPlan !== undefined || subscriptionStatus !== undefined || subscriptionStartDate !== undefined || subscriptionEndDate !== undefined) {
            accountPayload.subscription = {
                limits: {
                    asset_limit: assetLimit !== undefined ? assetLimit : defaultLimits.asset_limit,
                    location_limit: locationLimit !== undefined ? locationLimit : defaultLimits.location_limit,
                    user_limit: userLimit !== undefined ? userLimit : defaultLimits.user_limit
                },
                subscription_type: subscriptionType || 'free',
                subscription_status: subscriptionStatus || 'active',
                subscription_start_date: subscriptionStartDate ?? null,
                subscription_end_date: subscriptionEndDate ?? null,
                subscription_plan: subscriptionPlan || ''
            };

            accountPayload.subscription_type = accountPayload.subscription.subscription_type;
            accountPayload.subscription_status = accountPayload.subscription.subscription_status;
            accountPayload.subscription_start_date = accountPayload.subscription.subscription_start_date;
            accountPayload.subscription_end_date = accountPayload.subscription.subscription_end_date;
            accountPayload.subscription_plan = accountPayload.subscription.subscription_plan;
            accountPayload.user_limit = accountPayload.subscription.limits.user_limit;
            accountPayload.location_limit = accountPayload.subscription.limits.location_limit;
            accountPayload.asset_limit = accountPayload.subscription.limits.asset_limit;
        }

        return accountPayload;
    }

    buildSubscriptionPayload(payload) {
        const subscriptionPayload = {};
        for (const field of SUBSCRIPTION_FIELDS) {
            if (this.shouldIncludeField(field, payload[field])) {
                subscriptionPayload[field] = this.normalizeFieldValue(field, payload[field]);
            }
        }

        const incomingSub = payload.subscription;
        if (incomingSub && typeof incomingSub === 'object') {
            if (incomingSub.subscription_type !== undefined) subscriptionPayload.subscription_type = incomingSub.subscription_type;
            if (incomingSub.subscription_status !== undefined) subscriptionPayload.subscription_status = incomingSub.subscription_status;
            if (incomingSub.subscription_plan !== undefined) subscriptionPayload.subscription_plan = incomingSub.subscription_plan;
            if (incomingSub.subscription_start_date !== undefined) subscriptionPayload.subscription_start_date = this.normalizeFieldValue('subscription_start_date', incomingSub.subscription_start_date);
            if (incomingSub.subscription_end_date !== undefined) subscriptionPayload.subscription_end_date = this.normalizeFieldValue('subscription_end_date', incomingSub.subscription_end_date);
            if (incomingSub.limits && typeof incomingSub.limits === 'object') {
                if (incomingSub.limits.user_limit !== undefined) subscriptionPayload.user_limit = Number(incomingSub.limits.user_limit);
                if (incomingSub.limits.location_limit !== undefined) subscriptionPayload.location_limit = Number(incomingSub.limits.location_limit);
                if (incomingSub.limits.asset_limit !== undefined) subscriptionPayload.asset_limit = Number(incomingSub.limits.asset_limit);
            }
        }

        const hasExplicitLimit = LIMIT_FIELDS.some((field) => subscriptionPayload[field] !== undefined);
        if (subscriptionPayload.subscription_type && !hasExplicitLimit) {
            this.applyDefaultLimits(subscriptionPayload, subscriptionPayload.subscription_type);
        }

        const defaultLimits = defaultSubscriptionLimitData[subscriptionPayload.subscription_type || 'free'] || defaultSubscriptionLimitData.free;

        const userLimit = subscriptionPayload.user_limit !== undefined ? subscriptionPayload.user_limit : defaultLimits.user_limit;
        const locationLimit = subscriptionPayload.location_limit !== undefined ? subscriptionPayload.location_limit : defaultLimits.location_limit;
        const assetLimit = subscriptionPayload.asset_limit !== undefined ? subscriptionPayload.asset_limit : defaultLimits.asset_limit;

        subscriptionPayload.subscription = {
            limits: {
                asset_limit: assetLimit,
                location_limit: locationLimit,
                user_limit: userLimit
            },
            subscription_type: subscriptionPayload.subscription_type || 'free',
            subscription_status: subscriptionPayload.subscription_status || 'active',
            subscription_start_date: subscriptionPayload.subscription_start_date ?? null,
            subscription_end_date: subscriptionPayload.subscription_end_date ?? null,
            subscription_plan: subscriptionPayload.subscription_plan || ''
        };

        return subscriptionPayload;
    }

    shouldIncludeField(field, value) {
        if (value === undefined) {
            return false;
        }

        if (LIMIT_FIELDS.includes(field) && value === '') {
            return false;
        }

        return true;
    }

    applyDefaultLimits(target, subscriptionType) {
        const defaultLimits = defaultSubscriptionLimitData[subscriptionType] || defaultSubscriptionLimitData.free;
        for (const field of LIMIT_FIELDS) {
            if (target[field] === undefined || target[field] === null || target[field] === '') {
                target[field] = defaultLimits[field];
            }
        }
    }

    normalizeFieldValue(field, value) {
        if (FEATURE_STATUS_FIELDS.includes(field)) {
            return value === true ? 'enabled' : value === false ? 'disabled' : value;
        }

        if (LIMIT_FIELDS.includes(field)) {
            return Number(value);
        }

        if (DATE_FIELDS.includes(field)) {
            return value === '' ? null : value;
        }

        return value;
    }
}
