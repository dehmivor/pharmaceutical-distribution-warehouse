const express = require('express');
const router = express.Router();
const { inventoryCheckOrderValidator } = require('../middlewares/validate');
const inventoryCheckOrderController = require('../controllers/inventoryCheckOrderController');
const authenticate = require('../middlewares/authenticate');

// Get all inventory check orders with pagination and filters
router.get(
  '/',
  authenticate,
  inventoryCheckOrderValidator.validateGetAllInventoryCheckOrders,
  inventoryCheckOrderController.getAllInventoryCheckOrders
);

// Create new inventory check order (only supervisor)
router.post(
  '/',
  authenticate,
  inventoryCheckOrderValidator.validateCreateInventoryCheckOrder,
  inventoryCheckOrderController.createInventoryCheckOrder
);

// Get inventory check order by ID
router.get(
  '/:id',
  authenticate,
  inventoryCheckOrderValidator.validateGetInventoryCheckOrderById,
  inventoryCheckOrderController.getInventoryCheckOrderById
);

// Update inventory check order
router.put(
  '/:id',
  authenticate,
  inventoryCheckOrderValidator.validateUpdateInventoryCheckOrder,
  inventoryCheckOrderController.updateInventoryCheckOrder
);

// Patch inventory check order (for status updates)
router.patch(
  '/:id',
  authenticate,
  inventoryCheckOrderValidator.validateUpdateInventoryCheckOrder,
  inventoryCheckOrderController.updateInventoryCheckOrder
);

// Create inspections for inventory check order
router.post(
  '/:id/inspections',
  authenticate,
  inventoryCheckOrderController.createInspections
);

module.exports = router; 