import { body, query } from 'express-validator';
import { INVOICE_TYPES } from '../../schemas/invoice.model.js';

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
const sensorPrices = {
  edgepulse: 5500,
  vibo: 7000
};

const isRecurringType = (invoiceType) => invoiceType === 'recurring' || invoiceType === 'mixed';

const hasValue = (value) => value !== undefined && value !== null && value !== '';

const toSensorQuantity = (value, fieldName) => {
  if (!hasValue(value)) {
    return 0;
  }

  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
    throw new Error(`${fieldName} must be a whole number 0 or greater`);
  }

  return quantity;
};

const getMiscItemsAmount = (items = []) => {
  if (!hasValue(items)) {
    return 0;
  }

  if (!Array.isArray(items)) {
    throw new Error('misc_items must be an array');
  }

  return items
    .map((item) => ({
      item_name: String(item?.item_name || item?.name || '').trim(),
      quantity: Number(item?.quantity || 0),
      unit_price: Number(item?.unit_price || 0)
    }))
    .filter((item) => item.item_name || item.quantity > 0 || item.unit_price > 0)
    .reduce((total, item) => {
      if (!item.item_name) {
        throw new Error('Misc item name is required');
      }

      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        throw new Error(`Quantity for ${item.item_name} must be greater than 0`);
      }

      if (!Number.isFinite(item.unit_price) || item.unit_price <= 0) {
        throw new Error(`Unit price for ${item.item_name} must be greater than 0`);
      }

      return total + (item.quantity * item.unit_price);
    }, 0);
};

const validateInvoiceAmounts = (payload) => {
  const invoiceType = payload.invoice_type;
  const invoiceValue = Number(payload.invoice_value);
  const taxableValue = hasValue(payload.taxable_value) ? Number(payload.taxable_value) : invoiceValue;
  const oneTimeAmount = Number(payload.one_time_amount || 0);
  const recurringAmount = Number(payload.recurring_amount || 0);
  const edgepulseQuantity = toSensorQuantity(payload.edgepulse_quantity, 'edgepulse_quantity');
  const viboQuantity = toSensorQuantity(payload.vibo_quantity, 'vibo_quantity');
  const sensorHardwareAmount = (edgepulseQuantity * sensorPrices.edgepulse) + (viboQuantity * sensorPrices.vibo);
  const miscItemsAmount = getMiscItemsAmount(payload.misc_items);
  const hardwareItemAmount = sensorHardwareAmount + miscItemsAmount;
  const hasHardwareBreakup = hardwareItemAmount > 0;

  if (!INVOICE_TYPES.includes(invoiceType)) {
    throw new Error('Invalid invoice type');
  }

  if (!Number.isFinite(invoiceValue) || invoiceValue <= 0) {
    throw new Error('Invoice value must be greater than 0');
  }

  if (invoiceType === 'mixed') {
    if (hasHardwareBreakup) {
      if (hardwareItemAmount > taxableValue) {
        throw new Error('Hardware item amount must not exceed taxable value');
      }

      return true;
    }

    if (!hasValue(payload.one_time_amount) || !hasValue(payload.recurring_amount)) {
      throw new Error('Mixed invoice requires one_time_amount and recurring_amount');
    }

    if (oneTimeAmount <= 0 || recurringAmount < 0) {
      throw new Error('Mixed invoice one-time amount must be greater than 0 and software amount must be 0 or greater');
    }

    if (Math.abs((oneTimeAmount + recurringAmount) - taxableValue) > 0.01) {
      throw new Error('One-time amount and recurring amount must equal taxable value');
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

const validateBulkInvoices = (rows = []) => {
  if (!Array.isArray(rows)) {
    throw new Error('Invoices must be an array');
  }

  if (!rows.length) {
    throw new Error('At least one invoice row is required');
  }

  if (rows.length > 500) {
    throw new Error('Maximum 500 invoice rows can be imported at once');
  }

  rows.forEach((row, index) => {
    const rowNumber = index + 1;

    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error(`Row ${rowNumber}: invoice data is invalid`);
    }

    if (!hasValue(row.customer_name)) {
      throw new Error(`Row ${rowNumber}: customer_name is required`);
    }

    if (!hasValue(row.invoice_no)) {
      throw new Error(`Row ${rowNumber}: invoice_no is required`);
    }

    if (!hasValue(row.invoice_date) || Number.isNaN(new Date(row.invoice_date).getTime())) {
      throw new Error(`Row ${rowNumber}: invoice_date must be a valid date`);
    }

    try {
      validateInvoiceAmounts(row);
      validateContractDates(row);
    } catch (error) {
      throw new Error(`Row ${rowNumber}: ${error.message}`);
    }
  });

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
  body('gst_percentage').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('GST % must be 0 or greater'),
  body('gst_amount').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('GST amount must be 0 or greater'),
  body('one_time_amount').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('One-time amount must be 0 or greater'),
  body('recurring_amount').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Recurring amount must be 0 or greater'),
  body('edgepulse_quantity').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0 }).withMessage('EdgePulse quantity must be a whole number 0 or greater'),
  body('vibo_quantity').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0 }).withMessage('Vibo quantity must be a whole number 0 or greater'),
  body('misc_items').optional({ nullable: true }).isArray({ max: 50 }).withMessage('Misc items must be an array'),
  body('misc_items.*.item_name').optional({ nullable: true, checkFalsy: true }).trim().isString(),
  body('misc_items.*.quantity').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Misc item quantity must be 0 or greater'),
  body('misc_items.*.unit_price').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Misc item unit price must be 0 or greater'),
  body('contract_start_date').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Contract start date must be valid'),
  body('contract_end_date').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Contract end date must be valid'),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim().isString()
];

export const createInvoiceValidator = [
  ...baseInvoiceValidators,
  body().custom(validateInvoiceAmounts),
  body().custom(validateContractDates)
];

export const bulkCreateInvoiceValidator = [
  body('invoices').custom(validateBulkInvoices)
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
  body('gst_percentage').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('GST % must be 0 or greater'),
  body('gst_amount').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('GST amount must be 0 or greater'),
  body('one_time_amount').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('One-time amount must be 0 or greater'),
  body('recurring_amount').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Recurring amount must be 0 or greater'),
  body('edgepulse_quantity').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0 }).withMessage('EdgePulse quantity must be a whole number 0 or greater'),
  body('vibo_quantity').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0 }).withMessage('Vibo quantity must be a whole number 0 or greater'),
  body('misc_items').optional({ nullable: true }).isArray({ max: 50 }).withMessage('Misc items must be an array'),
  body('misc_items.*.item_name').optional({ nullable: true, checkFalsy: true }).trim().isString(),
  body('misc_items.*.quantity').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Misc item quantity must be 0 or greater'),
  body('misc_items.*.unit_price').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Misc item unit price must be 0 or greater'),
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
