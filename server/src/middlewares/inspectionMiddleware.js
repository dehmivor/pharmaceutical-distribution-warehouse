const { body, query, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

const validateObjectId = [
  param('id').custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid ObjectId format');
    }
    return true;
  }),
  handleValidationErrors,
];

const validateCreateInspection = [
  body('import_order_id')
    .notEmpty()
    .withMessage('Import order ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid import order ID format');
      }
      return true;
    }),

  body('batch_id')
    .notEmpty()
    .withMessage('Batch ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid batch ID format');
      }
      return true;
    }),

  body('actual_quantity')
    .isNumeric()
    .withMessage('Actual quantity must be a number')
    .isFloat({ min: 0 })
    .withMessage('Actual quantity cannot be negative'),

  body('rejected_quantity')
    .optional()
    .isNumeric()
    .withMessage('Rejected quantity must be a number')
    .isFloat({ min: 0 })
    .withMessage('Rejected quantity cannot be negative'),

  body('note')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Note cannot exceed 500 characters')
    .trim(),

  handleValidationErrors,
];

const validateUpdateInspection = [
  body('actual_quantity')
    .optional()
    .isNumeric()
    .withMessage('Actual quantity must be a number')
    .isFloat({ min: 0 })
    .withMessage('Actual quantity cannot be negative'),

  body('rejected_quantity')
    .optional()
    .isNumeric()
    .withMessage('Rejected quantity must be a number')
    .isFloat({ min: 0 })
    .withMessage('Rejected quantity cannot be negative'),

  body('note')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Note cannot exceed 500 characters')
    .trim(),

  handleValidationErrors,
];

const validateGetInspections = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('import_order_id')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid import order ID format');
      }
      return true;
    }),

  handleValidationErrors,
];

module.exports = {
  validateObjectId,
  validateCreateInspection,
  validateUpdateInspection,
  validateGetInspections,
};
