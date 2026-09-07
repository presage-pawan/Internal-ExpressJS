import { body, query } from 'express-validator';
import {
  QUOTED_OPTIONS,
  SALES_LEAD_INDUSTRIES,
  SALES_LEAD_INTERACTION_TYPES,
  SALES_LEAD_STAGES
} from '../../schemas/sales-lead.model.js';

const contactValidators = [
  body('contacts').isArray({ min: 1, max: 20 }).withMessage('Add at least one contact person (maximum 20)'),
  body('contacts.*.contact_person').trim().notEmpty().withMessage('Contact person name is required'),
  body('contacts.*.designation').optional({ nullable: true, checkFalsy: true }).trim().isString(),
  body('contacts.*.email').optional({ nullable: true, checkFalsy: true }).trim().isEmail().withMessage('Enter a valid contact email'),
  body('contacts.*.phone').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 30 }).withMessage('Contact phone is too long'),
  body('contacts.*.is_primary').optional().isBoolean().withMessage('Primary contact value must be true or false')
];

const validateDateOrder = body().custom((payload) => {
  if (payload.first_contact_date && payload.last_interaction_date) {
    const first = new Date(payload.first_contact_date);
    const last = new Date(payload.last_interaction_date);
    if (last < first) throw new Error('Last interaction cannot be before first contact');
  }
  return true;
});

export const createSalesLeadValidator = [
  body('first_contact_date').isISO8601().withMessage('First contact date is required'),
  body('last_interaction_date').isISO8601().withMessage('Last interaction date is required'),
  body('prospective_company').trim().notEmpty().isLength({ max: 200 }).withMessage('Prospective company is required'),
  body('industry').isIn(SALES_LEAD_INDUSTRIES).withMessage('Select a valid industry'),
  body('city_region').trim().notEmpty().isLength({ max: 150 }).withMessage('City / region is required'),
  ...contactValidators,
  body('discussion_stage').isIn(SALES_LEAD_STAGES).withMessage('Select a valid discussion stage'),
  body('deal_value').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Deal value must be 0 or greater'),
  body('quoted').isIn(QUOTED_OPTIONS).withMessage('Quoted must be Yes or No'),
  body('next_action').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Next action is too long'),
  body('next_action_date').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Next action date must be valid'),
  body('remarks').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 3000 }).withMessage('Remarks are too long'),
  validateDateOrder
];

export const updateSalesLeadValidator = createSalesLeadValidator;

export const listSalesLeadValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be 1 or greater'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }),
  query('discussion_stage').optional({ nullable: true, checkFalsy: true }).isIn(SALES_LEAD_STAGES).withMessage('Select a valid discussion stage'),
  query('industry').optional({ nullable: true, checkFalsy: true }).isIn(SALES_LEAD_INDUSTRIES).withMessage('Select a valid industry'),
  query('quoted').optional({ nullable: true, checkFalsy: true }).isIn(QUOTED_OPTIONS).withMessage('Quoted must be Yes or No'),
  query('owner_user_id').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Owner must be a valid user'),
  query('follow_up').optional({ nullable: true, checkFalsy: true }).isIn(['overdue', 'today', 'upcoming', 'not_scheduled']).withMessage('Invalid follow-up filter'),
  query('from_date').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('From date must be valid'),
  query('to_date').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('To date must be valid'),
  query().custom(value => {
    if (value.from_date && value.to_date && value.from_date > value.to_date) {
      throw new Error('From date cannot be after to date');
    }
    return true;
  })
];

export const bulkCreateSalesLeadValidator = [
  body('leads').isArray({ min: 1, max: 500 }).withMessage('Add between 1 and 500 sales leads')
];

export const addSalesLeadInteractionValidator = [
  body('interaction_date').isISO8601().withMessage('Interaction date is required'),
  body('interaction_type').isIn(SALES_LEAD_INTERACTION_TYPES).withMessage('Select a valid interaction type'),
  body('notes').trim().notEmpty().isLength({ max: 3000 }).withMessage('Interaction notes are required'),
  body('discussion_stage').isIn(SALES_LEAD_STAGES).withMessage('Select a valid discussion stage'),
  body('next_action').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Next action is too long'),
  body('next_action_date').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Next action date must be valid')
];

export const reassignSalesLeadValidator = [
  body('owner_user_id').isMongoId().withMessage('Select a valid employee')
];

export const salesLeadAnalyticsValidator = [
  query('owner_user_id').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Owner must be a valid user'),
  query('from_date').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('From date must be valid'),
  query('to_date').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('To date must be valid'),
  query().custom(value => {
    if (value.from_date && value.to_date && value.from_date > value.to_date) throw new Error('From date cannot be after to date');
    return true;
  })
];
