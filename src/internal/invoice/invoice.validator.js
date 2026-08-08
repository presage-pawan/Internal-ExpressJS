import { body, query } from 'express-validator';
import { INVOICE_TYPES } from '../../schemas/invoice.model.js';

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

const isRecurringType = (invoiceType) => invoiceType === 'recurring' || invoiceType === 'mixed';

const hasValue = (value) => value !== undefined && value !== null && value !== '';

const validateInvoiceAmounts = (payload) => {
  const invoiceType = payload.invoice_type;
  const invoiceValue = Number(payload.invoice_value);
  const oneTimeAmount = Number(payload.one_time_amount || 0);
  const recurringAmount = Number(payload.recurring_amount || 0);

  if (!INVOICE_TYPES.includes(invoiceType)) {
    throw new Error('Invalid invoice type');
  }

  if (!Number.isFinite(invoiceValue) || invoiceValue <= 0) {
    throw new Error('Invoice value must be greater than 0');
  }

  if (invoiceType === 'mixed') {
    if (!hasValue(payload.one_time_amount) || !hasValue(payload.recurring_amount)) {
      throw new Error('Mixed invoice requires one_time_amount and recurring_amount');
    }

    if (oneTimeAmount <= 0 || recurringAmount <= 0) {
      throw new Error('Mixed invoice amounts must be greater than 0');
    }

    if (Math.abs((oneTimeAmount + recurringAmount) - invoiceValue) > 0.01) {
      throw new Error('One-time amount and recurring amount must equal invoice value');
    }
  }

  if (invoiceType === 'recurring' && hasValue(payload.recurring_amount) && recurringAmount <= 0) {
    throw new Error('Recurring amount must be greater than 0');
  }

  return true;
};

const validateContractDates = (payload) => {
  if (!isRecurringType(payload.invoice_type)) {
    return true;
  }

  if (!hasValue(payload.contract_start_date) || !hasValue(payload.contract_end_date)) {
    throw new Error('Recurring invoices require contract_start_date and contract_end_date');
  }

  const startDate = new Date(payload.contract_start_date);
  const endDate = new Date(payload.contract_end_date);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error('Invalid contract dates');
  }

  if (endDate < startDate) {
    throw new Error('Contract end date must be on or after contract start date');
  }

  return true;
};

const baseInvoiceValidators = [
  body('account_id').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('account_id must be a valid ID'),
  body('customer_name').trim().notEmpty().withMessage('Customer name is required'),
  body('gst_no').optional({ nullable: true, checkFalsy: true }).trim().isString(),
  body('place_of_supply').optional({ nullable: true, checkFalsy: true }).trim().isString(),
  body('invoice_no').trim().notEmpty().withMessage('Invoice no is required'),
  body('invoice_date').isISO8601().withMessage('Invoice date must be a valid date'),
  body('invoice_type').isIn(INVOICE_TYPES).withMessage('Invalid invoice type'),
  body('currency').optional({ nullable: true, checkFalsy: true }).trim().isString(),
  body('exchange_rate').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Exchange rate must be 0 or greater'),
  body('invoice_value').isFloat({ gt: 0 }).withMessage('Invoice value must be greater than 0'),
  body('taxable_value').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Taxable value must be 0 or greater'),
  body('gst_amount').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('GST amount must be 0 or greater'),
  body('one_time_amount').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('One-time amount must be 0 or greater'),
  body('recurring_amount').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Recurring amount must be 0 or greater'),
  body('contract_start_date').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Contract start date must be valid'),
  body('contract_end_date').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Contract end date must be valid'),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim().isString()
];

export const createInvoiceValidator = [
  ...baseInvoiceValidators,
  body().custom(validateInvoiceAmounts),
  body().custom(validateContractDates)
];

export const updateInvoiceValidator = [
  body('account_id').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('account_id must be a valid ID'),
  body('customer_name').optional().trim().notEmpty().withMessage('Customer name cannot be empty'),
  body('gst_no').optional({ nullable: true, checkFalsy: true }).trim().isString(),
  body('place_of_supply').optional({ nullable: true, checkFalsy: true }).trim().isString(),
  body('invoice_no').optional().trim().notEmpty().withMessage('Invoice no cannot be empty'),
  body('invoice_date').optional().isISO8601().withMessage('Invoice date must be a valid date'),
  body('invoice_type').optional().isIn(INVOICE_TYPES).withMessage('Invalid invoice type'),
  body('currency').optional({ nullable: true, checkFalsy: true }).trim().isString(),
  body('exchange_rate').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Exchange rate must be 0 or greater'),
  body('invoice_value').optional().isFloat({ gt: 0 }).withMessage('Invoice value must be greater than 0'),
  body('taxable_value').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Taxable value must be 0 or greater'),
  body('gst_amount').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('GST amount must be 0 or greater'),
  body('one_time_amount').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('One-time amount must be 0 or greater'),
  body('recurring_amount').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Recurring amount must be 0 or greater'),
  body('contract_start_date').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Contract start date must be valid'),
  body('contract_end_date').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Contract end date must be valid'),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim().isString()
];

export const listInvoiceValidator = [
  query('month').optional({ nullable: true, checkFalsy: true }).matches(monthRegex).withMessage('Month must use YYYY-MM format'),
  query('search').optional({ nullable: true, checkFalsy: true }).trim().isString(),
  query('invoice_type').optional({ nullable: true, checkFalsy: true }).isIn(INVOICE_TYPES).withMessage('Invalid invoice type')
];

export const monthlyReportValidator = [
  query('month').notEmpty().withMessage('Month is required').matches(monthRegex).withMessage('Month must use YYYY-MM format')
];
