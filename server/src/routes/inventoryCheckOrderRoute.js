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

module.exports = router; 