import { body, query } from 'express-validator';
import { QUOTED_OPTIONS, SALES_LEAD_INDUSTRIES, SALES_LEAD_STAGES } from '../../schemas/sales-lead.model.js';

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
  body('next_action').trim().notEmpty().isLength({ max: 500 }).withMessage('Next action is required'),
  body('remarks').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 3000 }).withMessage('Remarks are too long'),
  validateDateOrder
];

export const updateSalesLeadValidator = createSalesLeadValidator;

export const listSalesLeadValidator = [
  query('search').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }),
  query('discussion_stage').optional({ nullable: true, checkFalsy: true }).isIn(SALES_LEAD_STAGES).withMessage('Select a valid discussion stage')
];
