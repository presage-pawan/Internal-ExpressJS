import { body, param, query } from 'express-validator';

const dbTypeValidator = (location) => location('dbType')
  .optional()
  .isIn(['staging', 'production'])
  .withMessage('dbType must be staging or production');

export const listSapMappingsValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('limit must be between 1 and 500'),
  query('cmmsAccountId').optional().isMongoId().withMessage('cmmsAccountId must be a valid ID'),
  query('active').optional().isBoolean().withMessage('active must be true or false')
];

export const sapMappingIdValidator = [
  param('id').isMongoId().withMessage('Mapping ID must be valid')
];

export const listMappingUsersValidator = [
  query('accountId').optional().isMongoId().withMessage('accountId must be a valid ID'),
  query('search').optional().isString().trim().isLength({ max: 200 }),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('limit must be between 1 and 1000')
];

const mappingFields = (optional = false) => {
  const required = (chain) => optional ? chain.optional() : chain.notEmpty();

  return [
    required(body('sapAccountId')).isString().trim().isLength({ min: 1, max: 200 })
      .withMessage('SAP account ID is required and must not exceed 200 characters'),
    body('sapAccountName').optional({ nullable: true }).isString().trim().isLength({ max: 300 }),
    required(body('sapUserId')).isString().trim().isLength({ min: 1, max: 200 })
      .withMessage('SAP user ID is required and must not exceed 200 characters'),
    body('sapUserName').optional({ nullable: true }).isString().trim().isLength({ max: 300 }),
    body('sapUserEmail').optional({ nullable: true, checkFalsy: true }).isEmail().normalizeEmail()
      .withMessage('SAP user email must be valid'),
    required(body('cmmsAccountId')).isMongoId().withMessage('CMMS account ID must be valid'),
    required(body('cmmsUserId')).isMongoId().withMessage('CMMS user ID must be valid'),
    body('active').optional().isBoolean().withMessage('active must be true or false'),
    body('notes').optional({ nullable: true }).isString().trim().isLength({ max: 1000 }),
    dbTypeValidator(body)
  ];
};

export const createSapMappingValidator = mappingFields(false);
export const updateSapMappingValidator = [
  ...sapMappingIdValidator,
  ...mappingFields(false)
];
