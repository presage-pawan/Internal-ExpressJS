import { body, query } from 'express-validator';
import {
    ACCOUNT_FEATURE_STATUS,
    ACCOUNT_STATUS,
    EXPERIENCE_PROFILES,
    ACCOUNT_SUBSCRIPTION_TYPE,
    ACCOUNT_SUBSCRIPTION_STATUS
} from '../../schemas/company.model.js';
import { validateAccountRoleMenu } from './account-role-menu.js';

const accountNameValidator = (field) => field
    .trim()
    .notEmpty().withMessage('Account Name is required')
    .isLength({ min: 2 }).withMessage('Account Name must be at least 2 characters');

const requiredStringValidator = (field, label) => field
    .trim()
    .notEmpty().withMessage(`${label} is required`)
    .isString().withMessage(`${label} must be a string`);

const optionalStringValidator = (field, label) => field
    .optional({ nullable: true })
    .trim()
    .isString().withMessage(`${label} must be a string`);

const featureFlagValidators = () => [
    body('cookie_status').optional().isIn(ACCOUNT_FEATURE_STATUS).withMessage('Invalid cookie status'),
    body('redis_status').optional().isIn(ACCOUNT_FEATURE_STATUS).withMessage('Invalid redis status'),
    body('encrypt_payload').optional().isIn(ACCOUNT_FEATURE_STATUS).withMessage('Invalid payload encryption status'),
    body('encrypt_response').optional().isIn(ACCOUNT_FEATURE_STATUS).withMessage('Invalid response encryption status'),
];

const subscriptionValidators = () => [
    optionalStringValidator(body('subscription_plan'), 'Subscription plan'),
    body('subscription_type').optional({ checkFalsy: true }).isIn(ACCOUNT_SUBSCRIPTION_TYPE).withMessage('Invalid subscription type'),
    body('subscription_start_date').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid start date').toDate(),
    body('subscription_end_date')
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601().withMessage('Invalid end date')
        .toDate()
        .custom((value, { req }) => {
            if (!value || !req.body.subscription_start_date) {
                return true;
            }

            const startDate = new Date(req.body.subscription_start_date);
            const endDate = new Date(value);
            if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
                return true;
            }

            if (endDate < startDate) {
                throw new Error('Subscription end date must be on or after start date');
            }
            return true;
        }),
    body('subscription_status').optional({ checkFalsy: true }).isIn(ACCOUNT_SUBSCRIPTION_STATUS).withMessage('Invalid subscription status'),
    body('user_limit').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('User limit must be a positive integer'),
    body('location_limit').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Location limit must be a positive integer'),
    body('asset_limit').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Asset limit must be a positive integer')
];

const atLeastOneSubscriptionFieldValidator = body().custom((_, { req }) => {
    const hasSubscriptionField = [
        'subscription_plan',
        'subscription_type',
        'subscription_start_date',
        'subscription_end_date',
        'subscription_status',
        'user_limit',
        'location_limit',
        'asset_limit'
    ].some((field) => req.body[field] !== undefined);

    if (!hasSubscriptionField) {
        throw new Error('At least one subscription field is required');
    }

    return true;
});

export const createCompanyValidator = [
    accountNameValidator(body('account_name')),
    requiredStringValidator(body('type'), 'Type'),
    body('account_status').optional().isIn(ACCOUNT_STATUS).withMessage('Invalid status'),
    optionalStringValidator(body('description'), 'Description'),
    body('experience_profile').optional().isIn(EXPERIENCE_PROFILES).withMessage('Invalid experience profile'),
    optionalStringValidator(body('default_language'), 'Default language'),
    optionalStringValidator(body('fileName'), 'File name'),
    ...featureFlagValidators(),
    ...subscriptionValidators(),
    body('visible').optional().isBoolean(),
];

export const updateCompanyValidator = [
    accountNameValidator(body('account_name').optional()),
    optionalStringValidator(body('type'), 'Type'),
    body('account_status').optional().isIn(ACCOUNT_STATUS).withMessage('Invalid status'),
    optionalStringValidator(body('description'), 'Description'),
    body('experience_profile').optional().isIn(EXPERIENCE_PROFILES).withMessage('Invalid experience profile'),
    optionalStringValidator(body('default_language'), 'Default language'),
    optionalStringValidator(body('fileName'), 'File name'),
    ...featureFlagValidators(),
    ...subscriptionValidators(),
    body('visible').optional().isBoolean(),
];

export const updateSubscriptionValidator = [
    atLeastOneSubscriptionFieldValidator,
    ...subscriptionValidators()
];

export const listCompanyValidator = [
    query('search').optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Search must be 100 characters or fewer'),
    query('type').optional({ checkFalsy: true }).trim().isString().withMessage('Type must be a string'),
    query('account_status').optional({ checkFalsy: true }).isIn(ACCOUNT_STATUS).withMessage('Invalid status'),
    query('experience_profile').optional({ checkFalsy: true }).isIn(EXPERIENCE_PROFILES).withMessage('Invalid experience profile'),
    query('cookie_status').optional({ checkFalsy: true }).isIn(ACCOUNT_FEATURE_STATUS).withMessage('Invalid cookie status'),
    query('redis_status').optional({ checkFalsy: true }).isIn(ACCOUNT_FEATURE_STATUS).withMessage('Invalid redis status'),
    query('encrypt_payload').optional({ checkFalsy: true }).isIn(ACCOUNT_FEATURE_STATUS).withMessage('Invalid payload encryption status'),
    query('encrypt_response').optional({ checkFalsy: true }).isIn(ACCOUNT_FEATURE_STATUS).withMessage('Invalid response encryption status'),
    query('subscription_type').optional({ checkFalsy: true }).isIn(ACCOUNT_SUBSCRIPTION_TYPE).withMessage('Invalid subscription type'),
    query('subscription_status').optional({ checkFalsy: true }).isIn(ACCOUNT_SUBSCRIPTION_STATUS).withMessage('Invalid subscription status'),
    query('visible').optional({ checkFalsy: true }).isBoolean().withMessage('Visible must be boolean').toBoolean()
];

export const updateAccountRoleMenuValidator = [
    body('account_role_menu')
        .exists().withMessage('account_role_menu is required')
        .isObject().withMessage('account_role_menu must be an object')
        .custom((value, { req }) => {
            const errors = validateAccountRoleMenu(value, req.body.experience_profile);
            if (errors.length) {
                throw new Error(errors.join(', '));
            }
            return true;
        }),
    body('reason').trim().notEmpty().withMessage('Reason is required').isString().withMessage('Reason must be a string'),
];

export const resetAccountRoleMenuValidator = [
    body('experience_profile').optional().isIn(EXPERIENCE_PROFILES).withMessage('Invalid experience profile'),
    body('reason').trim().notEmpty().withMessage('Reason is required').isString().withMessage('Reason must be a string'),
];
