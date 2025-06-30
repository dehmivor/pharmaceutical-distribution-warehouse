const { check, body } = require('express-validator');
const { CONTRACT_STATUSES } = require('../utils/constants');

// Reusable validation helpers
const isMongoId = (field) => check(field).isMongoId().withMessage(`Invalid ${field} ID`);
const isPositiveInt = (field) => check(field).isInt({ min: 1 }).withMessage(`${field} must be a positive integer`);
const isValidDate = (field) => check(field).isISO8601().toDate().withMessage(`Invalid ${field}`);
const isNonNegativeInt = (field) => check(field).isInt({ min: 0 }).withMessage(`${field} must be a non-negative integer`);
const isNonNegativeFloat = (field) => check(field).isFloat({ min: 0 }).withMessage(`${field} must be a non-negative number`);

const supplierContract = {
  validateGetAllContracts: [
    isPositiveInt('page').optional(),
    isPositiveInt('limit').optional(),
    isMongoId('created_by').optional(),
    isMongoId('supplier_id').optional(),
    check('status')
      .optional()
      .isIn(Object.values(CONTRACT_STATUSES))
      .withMessage(`Status must be one of: ${Object.values(CONTRACT_STATUSES).join(', ')}`),
    check('contract_code')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Contract code must be a non-empty string'),
  ],
  validateCreateContract: [
    check('contract_code')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Contract code is required'),
    isMongoId('supplier_id'),
    isValidDate('start_date'),
    isValidDate('end_date'),
    check('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
    isMongoId('items.*.medicine_id'),
    isNonNegativeInt('items.*.quantity'),
    isNonNegativeInt('items.*.min_order_quantity'),
    isNonNegativeFloat('items.*.unit_price').optional({ checkFalsy: true }),
    check('items.*.kpi_details')
      .isArray()
      .optional({ checkFalsy: true })
      .withMessage('KPI details must be an array'),
    check('items.*.kpi_details.*.min_sale_quantity')
      .if(check('items.*.kpi_details').notEmpty())
      .isInt({ min: 0 })
      .withMessage('Minimum sale quantity must be a non-negative integer'),
    check('items.*.kpi_details.*.profit_percentage')
      .if(check('items.*.kpi_details').notEmpty())
      .isFloat({ min: 0, max: 100 })
      .withMessage('Profit percentage must be between 0 and 100'),
    check('status')
      .optional()
      .isIn(Object.values(CONTRACT_STATUSES))
      .withMessage(`Status must be one of: ${Object.values(CONTRACT_STATUSES).join(', ')}`),
    // Custom validator for end_date >= start_date
    body('end_date').custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  ],
};

module.exports = {
  supplierContract,
};