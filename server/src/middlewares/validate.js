const { check, body } = require('express-validator');
const {
  CONTRACT_STATUSES,
  PARTNER_TYPES,
  ANNEX_STATUSES,
  CONTRACT_TYPES,
  INVENTORY_CHECK_ORDER_STATUSES,
} = require('../utils/constants');

// Reusable validation helpers
const isMongoId = (field) => check(field).isMongoId().withMessage(`Invalid ${field} ID`);
const isPositiveInt = (field) =>
  check(field).isInt({ min: 1 }).withMessage(`${field} must be a positive integer`);

const contractValidator = {
  validateGetAllContracts: [
    isPositiveInt('page').optional(),
    isPositiveInt('limit').optional(),
    isMongoId('created_by').optional(),
    isMongoId('partner_id').optional(),
    check('partner_type')
      .optional()
      .isIn(Object.values(PARTNER_TYPES))
      .withMessage(`Partner type must be one of: ${Object.values(PARTNER_TYPES).join(', ')}`),
    check('contract_type')
      .optional()
      .isIn(Object.values(CONTRACT_TYPES))
      .withMessage(`Contract type must be one of: ${Object.values(CONTRACT_TYPES).join(', ')}`),
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

  validateGetContractById: [isMongoId('id').withMessage('Invalid contract ID')],

  validateCreateContract: [
    check('contract_code')
      .isString()
      .withMessage('Contract code must be a string')
      .notEmpty()
      .withMessage('Contract code is required'),
    check('contract_type')
      .exists()
      .withMessage('Contract type is required')
      .isIn(Object.values(CONTRACT_TYPES))
      .withMessage(`Contract type must be one of: ${Object.values(CONTRACT_TYPES).join(', ')}`),
    isMongoId('partner_id'),
    check('partner_type')
      .isIn(Object.values(PARTNER_TYPES))
      .withMessage(`Partner type must be one of: ${Object.values(PARTNER_TYPES).join(', ')}`),
    check('start_date')
      .exists()
      .withMessage('Start date is required')
      .isISO8601()
      .toDate()
      .withMessage('Invalid start date'),
    check('end_date')
      .exists()
      .withMessage('End date is required')
      .isISO8601()
      .toDate()
      .withMessage('Invalid end date'),
    body('end_date').custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.start_date)) {
        throw new Error('End date must be after or equal to start date');
      }
      return true;
    }),
    check('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
    check('items.*.medicine_id')
      .exists()
      .withMessage('Medicine ID is required')
      .isMongoId()
      .withMessage('Invalid medicine ID'),
    check('items.*.quantity')
      .if((value, { req }) => req.body.contract_type === CONTRACT_TYPES.ECONOMIC)
      .exists()
      .withMessage('Quantity is required for economic contracts')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    check('items.*.quantity')
      .if((value, { req }) => req.body.contract_type === CONTRACT_TYPES.PRINCIPAL)
      .not()
      .exists()
      .withMessage('Quantity is not allowed for principal contracts'),
    check('items.*.unit_price')
      .exists()
      .withMessage('Unit price is required')
      .isFloat({ min: 0.01 })
      .withMessage('Unit price must be a positive number'),
    check('annexes')
      .if(
        (value, { req }) =>
          req.body.contract_type === CONTRACT_TYPES.ECONOMIC && req.body.annexes !== undefined,
      )
      .isArray({ max: 0 })
      .withMessage('Annexes are not allowed for economic contracts'),
    check('status')
      .optional()
      .isIn(Object.values(CONTRACT_STATUSES))
      .withMessage(`Status must be one of: ${Object.values(CONTRACT_STATUSES).join(', ')}`),
  ],

  validateUpdateContract: [
    isMongoId('id').withMessage('Invalid contract ID'),
    check('contract_code')
      .isString()
      .withMessage('Contract code must be a string')
      .notEmpty()
      .withMessage('Contract code is required'),
    check('contract_type')
      .exists()
      .withMessage('Contract type is required')
      .isIn(Object.values(CONTRACT_TYPES))
      .withMessage(`Contract type must be one of: ${Object.values(CONTRACT_TYPES).join(', ')}`),
    isMongoId('partner_id'),
    check('partner_type')
      .isIn(Object.values(PARTNER_TYPES))
      .withMessage(`Partner type must be one of: ${Object.values(PARTNER_TYPES).join(', ')}`),
    check('start_date')
      .exists()
      .withMessage('Start date is required')
      .isISO8601()
      .toDate()
      .withMessage('Invalid start date'),
    check('end_date')
      .exists()
      .withMessage('End date is required')
      .isISO8601()
      .toDate()
      .withMessage('Invalid end date'),
    body('end_date').custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.start_date)) {
        throw new Error('End date must be after or equal to start date');
      }
      return true;
    }),
    check('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
    check('items.*.medicine_id')
      .exists()
      .withMessage('Medicine ID is required')
      .isMongoId()
      .withMessage('Invalid medicine ID'),
    check('items.*.quantity')
      .if((value, { req }) => req.body.contract_type === CONTRACT_TYPES.ECONOMIC)
      .exists()
      .withMessage('Quantity is required for economic contracts')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer for economic contracts'),
    check('items.*.quantity')
      .if((value, { req }) => req.body.contract_type === CONTRACT_TYPES.PRINCIPAL)
      .not()
      .exists()
      .withMessage('Quantity is not allowed for principal contracts'),
    check('items.*.unit_price')
      .exists()
      .withMessage('Unit price is required')
      .isFloat({ min: 0.01 })
      .withMessage('Unit price must be a positive number'),
    check('annexes')
      .if(
        (value, { req }) =>
          req.body.contract_type === CONTRACT_TYPES.ECONOMIC && req.body.annexes !== undefined,
      )
      .isArray({ max: 0 })
      .withMessage('Annexes are not allowed for economic contracts'),
    // Validate annexes for principal contracts
    check('annexes')
      .if((value, { req }) => req.body.contract_type === CONTRACT_TYPES.PRINCIPAL && req.body.annexes !== undefined)
      .isArray()
      .withMessage('Annexes must be an array'),
    check('annexes.*.annex_code')
      .if((value, { req }) => req.body.contract_type === CONTRACT_TYPES.PRINCIPAL && req.body.annexes !== undefined)
      .isString()
      .withMessage('Annex code must be a string')
      .notEmpty()
      .withMessage('Annex code is required'),
    check('annexes.*.signed_date')
      .if((value, { req }) => req.body.contract_type === CONTRACT_TYPES.PRINCIPAL && req.body.annexes !== undefined)
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Invalid signed date'),
    check('annexes.*.description')
      .if((value, { req }) => req.body.contract_type === CONTRACT_TYPES.PRINCIPAL && req.body.annexes !== undefined)
      .optional()
      .isString()
      .withMessage('Description must be a string'),
    check('annexes.*.medicine_changes')
      .if((value, { req }) => req.body.contract_type === CONTRACT_TYPES.PRINCIPAL && req.body.annexes !== undefined)
      .optional()
      .isObject()
      .withMessage('Medicine changes must be an object'),
    check('annexes.*.medicine_changes.add_items')
      .if((value, { req }) => req.body.contract_type === CONTRACT_TYPES.PRINCIPAL && req.body.annexes !== undefined)
      .optional()
      .isArray()
      .withMessage('Add items must be an array'),
    check('annexes.*.medicine_changes.add_items.*.medicine_id')
      .if((value, { req }) => req.body.contract_type === CONTRACT_TYPES.PRINCIPAL && req.body.annexes !== undefined)
      .optional()
      .isMongoId()
      .withMessage('Invalid medicine ID in add items'),
    check('annexes.*.medicine_changes.add_items.*.unit_price')
      .if((value, { req }) => req.body.contract_type === CONTRACT_TYPES.PRINCIPAL && req.body.annexes !== undefined)
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Unit price must be a positive number in add items'),
    check('annexes.*.medicine_changes.remove_items')
      .if((value, { req }) => req.body.contract_type === CONTRACT_TYPES.PRINCIPAL && req.body.annexes !== undefined)
      .optional()
      .isArray()
      .withMessage('Remove items must be an array'),
    check('annexes.*.medicine_changes.remove_items.*.medicine_id')
      .if((value, { req }) => req.body.contract_type === CONTRACT_TYPES.PRINCIPAL && req.body.annexes !== undefined)
      .optional()
      .isMongoId()
      .withMessage('Invalid medicine ID in remove items'),
    check('annexes.*.medicine_changes.update_prices')
      .if((value, { req }) => req.body.contract_type === CONTRACT_TYPES.PRINCIPAL && req.body.annexes !== undefined)
      .optional()
      .isArray()
      .withMessage('Update prices must be an array'),
    check('annexes.*.medicine_changes.update_prices.*.medicine_id')
      .if((value, { req }) => req.body.contract_type === CONTRACT_TYPES.PRINCIPAL && req.body.annexes !== undefined)
      .optional()
      .isMongoId()
      .withMessage('Invalid medicine ID in update prices'),
    check('annexes.*.medicine_changes.update_prices.*.unit_price')
      .if((value, { req }) => req.body.contract_type === CONTRACT_TYPES.PRINCIPAL && req.body.annexes !== undefined)
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Unit price must be a positive number in update prices'),
  ],

  validateUpdateContractStatus: [
    isMongoId('id').withMessage('Invalid contract ID'),
    check('status')
      .exists()
      .withMessage('Status is required')
      .isIn(Object.values(CONTRACT_STATUSES))
      .withMessage(`Status must be one of: ${Object.values(CONTRACT_STATUSES).join(', ')}`),
  ],

  validateCreateAnnex: [
    isMongoId('id').withMessage('Invalid contract ID'),
    check('annex_code')
      .isString()
      .withMessage('Annex code must be a string')
      .notEmpty()
      .withMessage('Annex code is required'),
    check('signed_date')
      .exists()
      .withMessage('Signed date is required')
      .isISO8601()
      .toDate()
      .withMessage('Invalid signed date'),
    check('description').optional().isString().withMessage('Description must be a string'),
    check('status')
      .optional()
      .isIn(Object.values(ANNEX_STATUSES))
      .withMessage(`Annex status must be one of: ${Object.values(ANNEX_STATUSES).join(', ')}`),
    
    // Validate medicine_changes
    check('medicine_changes').optional().isObject().withMessage('Medicine changes must be an object'),
    check('medicine_changes.add_items').optional().isArray().withMessage('Add items must be an array'),
    check('medicine_changes.add_items.*.medicine_id')
      .if((value, { req }) => req.body.medicine_changes?.add_items?.length > 0)
      .exists()
      .withMessage('Medicine ID is required in add items')
      .isMongoId()
      .withMessage('Invalid medicine ID in add items'),
    check('medicine_changes.add_items.*.unit_price')
      .if((value, { req }) => req.body.medicine_changes?.add_items?.length > 0)
      .exists()
      .withMessage('Unit price is required in add items')
      .isFloat({ min: 0.01 })
      .withMessage('Unit price must be a positive number in add items'),
    
    check('medicine_changes.remove_items').optional().isArray().withMessage('Remove items must be an array'),
    check('medicine_changes.remove_items.*.medicine_id')
      .if((value, { req }) => req.body.medicine_changes?.remove_items?.length > 0)
      .exists()
      .withMessage('Medicine ID is required in remove items')
      .isMongoId()
      .withMessage('Invalid medicine ID in remove items'),
    
    check('medicine_changes.update_prices').optional().isArray().withMessage('Update prices must be an array'),
    check('medicine_changes.update_prices.*.medicine_id')
      .if((value, { req }) => req.body.medicine_changes?.update_prices?.length > 0)
      .exists()
      .withMessage('Medicine ID is required in update prices')
      .isMongoId()
      .withMessage('Invalid medicine ID in update prices'),
    check('medicine_changes.update_prices.*.unit_price')
      .if((value, { req }) => req.body.medicine_changes?.update_prices?.length > 0)
      .exists()
      .withMessage('Unit price is required in update prices')
      .isFloat({ min: 0.01 })
      .withMessage('Unit price must be a positive number in update prices'),
    
    // Validate end_date_change
    check('end_date_change').optional().isObject().withMessage('End date change must be an object'),
    check('end_date_change.new_end_date')
      .if((value, { req }) => req.body.end_date_change?.new_end_date !== undefined)
      .isISO8601()
      .toDate()
      .withMessage('Invalid new end date'),
  ],

  validateUpdateAnnex: [
    isMongoId('id').withMessage('Invalid contract ID'),
    check('annex_code')
      .isString()
      .withMessage('Annex code must be a string')
      .notEmpty()
      .withMessage('Annex code is required'),
    check('description').optional().isString().withMessage('Description must be a string'),
    
    // Validate medicine_changes
    check('medicine_changes').optional().isObject().withMessage('Medicine changes must be an object'),
    check('medicine_changes.add_items').optional().isArray().withMessage('Add items must be an array'),
    check('medicine_changes.add_items.*.medicine_id')
      .if((value, { req }) => req.body.medicine_changes?.add_items?.length > 0)
      .exists()
      .withMessage('Medicine ID is required in add items')
      .isMongoId()
      .withMessage('Invalid medicine ID in add items'),
    check('medicine_changes.add_items.*.unit_price')
      .if((value, { req }) => req.body.medicine_changes?.add_items?.length > 0)
      .exists()
      .withMessage('Unit price is required in add items')
      .isFloat({ min: 0.01 })
      .withMessage('Unit price must be a positive number in add items'),
    
    check('medicine_changes.remove_items').optional().isArray().withMessage('Remove items must be an array'),
    check('medicine_changes.remove_items.*.medicine_id')
      .if((value, { req }) => req.body.medicine_changes?.remove_items?.length > 0)
      .exists()
      .withMessage('Medicine ID is required in remove items')
      .isMongoId()
      .withMessage('Invalid medicine ID in remove items'),
    
    check('medicine_changes.update_prices').optional().isArray().withMessage('Update prices must be an array'),
    check('medicine_changes.update_prices.*.medicine_id')
      .if((value, { req }) => req.body.medicine_changes?.update_prices?.length > 0)
      .exists()
      .withMessage('Medicine ID is required in update prices')
      .isMongoId()
      .withMessage('Invalid medicine ID in update prices'),
    check('medicine_changes.update_prices.*.unit_price')
      .if((value, { req }) => req.body.medicine_changes?.update_prices?.length > 0)
      .exists()
      .withMessage('Unit price is required in update prices')
      .isFloat({ min: 0.01 })
      .withMessage('Unit price must be a positive number in update prices'),
    
    // Validate end_date_change
    check('end_date_change').optional().isObject().withMessage('End date change must be an object'),
    check('end_date_change.new_end_date')
      .if((value, { req }) => req.body.end_date_change?.new_end_date !== undefined)
      .isISO8601()
      .toDate()
      .withMessage('Invalid new end date'),
  ],

  validateUpdateAnnexStatus: [
    isMongoId('id').withMessage('Invalid contract ID'),
    check('annex_code')
      .isString()
      .withMessage('Annex code must be a string')
      .notEmpty()
      .withMessage('Annex code is required'),
    check('status')
      .exists()
      .withMessage('Annex status is required')
      .isIn(Object.values(ANNEX_STATUSES))
      .withMessage(`Annex status must be one of: ${Object.values(ANNEX_STATUSES).join(', ')}`),
  ],
};

const inventoryCheckOrderValidator = {
  validateGetAllInventoryCheckOrders: [
    isPositiveInt('page').optional(),
    isPositiveInt('limit').optional(),
    check('status')
      .optional()
      .isIn(Object.values(INVENTORY_CHECK_ORDER_STATUSES))
      .withMessage(`Status must be one of: ${Object.values(INVENTORY_CHECK_ORDER_STATUSES).join(', ')}`),
    check('startDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Invalid start date'),
    check('endDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Invalid end date'),
    isMongoId('warehouse_manager_id').optional(),
  ],

  validateGetInventoryCheckOrderById: [
    isMongoId('id').withMessage('Invalid inventory check order ID'),
  ],

  validateCreateInventoryCheckOrder: [
    isMongoId('warehouse_manager_id').withMessage('Invalid warehouse manager ID'),
    check('inventory_check_date')
      .exists()
      .withMessage('Inventory check date is required')
      .isISO8601()
      .toDate()
      .withMessage('Invalid inventory check date'),
    check('notes')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must be a string with maximum 1000 characters'),
  ],

  validateUpdateInventoryCheckOrder: [
    isMongoId('id').withMessage('Invalid inventory check order ID'),
    isMongoId('warehouse_manager_id').optional().withMessage('Invalid warehouse manager ID'),
    check('inventory_check_date')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Invalid inventory check date')
      .custom((value) => {
        if (!value) return true; // Skip validation if no date provided
        
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of today
        const checkDate = new Date(value);
        checkDate.setHours(0, 0, 0, 0);
        
        if (checkDate <= today) {
          throw new Error('Ngày kiểm kê phải sau ngày hôm nay');
        }
        return true;
      }),
    check('status')
      .optional()
      .isIn(Object.values(INVENTORY_CHECK_ORDER_STATUSES))
      .withMessage(`Status must be one of: ${Object.values(INVENTORY_CHECK_ORDER_STATUSES).join(', ')}`),
    check('notes')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must be a string with maximum 1000 characters'),
  ],
};

const areaValidator = {
  validateGetAllAreas: [
    isPositiveInt('page').optional(),
    isPositiveInt('limit').optional(),
    check('search')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search term must be a string with maximum 100 characters'),
  ],

  validateGetAreaById: [
    isMongoId('id').withMessage('Invalid area ID'),
  ],

  validateCreateArea: [
    check('name')
      .exists()
      .withMessage('Area name is required')
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Area name must be a string with 1-100 characters'),
    check('storage_conditions.temperature')
      .optional()
      .isString()
      .trim()
      .matches(/^\d+-\d+$|^-\d+$|^\d+$/)
      .withMessage('Temperature must be in format "X-Y", "-X", or "X" (numbers only)'),
    check('storage_conditions.humidity')
      .optional()
      .isString()
      .trim()
      .matches(/^\d+$|^\d+-\d+$/)
      .withMessage('Humidity must be in format "X" or "X-Y" (numbers only)'),
    check('storage_conditions.light')
      .optional()
      .isIn(['none', 'low', 'medium', 'high', ''])
      .withMessage('Light must be one of: none, low, medium, high'),
    check('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be a string with maximum 1000 characters'),
  ],

  validateUpdateArea: [
    isMongoId('id').withMessage('Invalid area ID'),
    check('name')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Area name must be a string with 1-100 characters'),
    check('storage_conditions.temperature')
      .optional()
      .isString()
      .trim()
      .matches(/^\d+-\d+$|^-\d+$|^\d+$/)
      .withMessage('Temperature must be in format "X-Y", "-X", or "X" (numbers only)'),
    check('storage_conditions.humidity')
      .optional()
      .isString()
      .trim()
      .matches(/^\d+$|^\d+-\d+$/)
      .withMessage('Humidity must be in format "X" or "X-Y" (numbers only)'),
    check('storage_conditions.light')
      .optional()
      .isIn(['none', 'low', 'medium', 'high', ''])
      .withMessage('Light must be one of: none, low, medium, high'),
    check('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be a string with maximum 1000 characters'),
  ],

  validateDeleteArea: [
    isMongoId('id').withMessage('Invalid area ID'),
  ],
};

const locationValidator = {
  validateGetAllLocations: [
    isPositiveInt('page').optional(),
    isPositiveInt('limit').optional(),
    check('areaId')
      .optional()
      .custom((value) => {
        if (value && value !== '') {
          // Only validate as MongoDB ID if value is not empty
          const mongoose = require('mongoose');
          if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error('Invalid areaId ID');
          }
        }
        return true;
      }),
    check('available')
      .optional()
      .isIn(['true', 'false', ''])
      .withMessage('Available must be true, false, or empty'),
  ],

  validateCreateLocation: [
    isMongoId('area_id').withMessage('Invalid area ID'),
    check('bay')
      .exists()
      .withMessage('Bay is required')
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Bay must be a string with 1-50 characters'),
    check('row')
      .exists()
      .withMessage('Row is required')
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Row must be a string with 1-50 characters'),
    check('column')
      .exists()
      .withMessage('Column is required')
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Column must be a string with 1-50 characters'),
  ],

  validateGetLocationById: [
    isMongoId('id').withMessage('Invalid location ID'),
  ],

  validateGetLocationInfo: [
    isMongoId('id').withMessage('Invalid location ID'),
  ],

  validateUpdateLocationAvailable: [
    isMongoId('id').withMessage('Invalid location ID'),
    check('available')
      .exists()
      .withMessage('Available status is required')
      .isBoolean()
      .withMessage('Available must be a boolean value'),
  ],

  validateDeleteLocation: [
    isMongoId('id').withMessage('Invalid location ID'),
  ],
};

const packageValidator = {
  validateGetAllPackages: [
    check('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    check('limit')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Limit must be a positive integer'),
    check('medicine_id')
      .optional()
      .custom((value) => {
        if (value && value !== '') {
          const mongoose = require('mongoose');
          if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error('Invalid medicine_id');
          }
        }
        return true;
      }),
    check('area_id')
      .optional()
      .custom((value) => {
        if (value && value !== '') {
          const mongoose = require('mongoose');
          if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error('Invalid area_id');
          }
        }
        return true;
      }),
  ],
  validateGetPackageById: [
    check('id')
      .exists()
      .withMessage('Package ID is required')
      .isMongoId()
      .withMessage('Invalid package ID'),
  ],
  validateUpdatePackage: [
    isMongoId('id').withMessage('Invalid package ID'),
    body('newLocationId')
      .optional()
      .isMongoId()
      .withMessage('Invalid new location ID'),
    body('quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Quantity must be a non-negative integer'),
  ],
  validateUpdatePackageLocation: [
    isMongoId('id').withMessage('Invalid package ID'),
    body('newLocationId')
      .exists()
      .withMessage('New location ID is required')
      .isMongoId()
      .withMessage('Invalid new location ID'),
  ],
};

module.exports = {
  contractValidator,
  inventoryCheckOrderValidator,
  areaValidator,
  locationValidator,
  packageValidator,
};
