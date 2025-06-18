const express = require('express');
const router = express.Router();
const importOrderController = require('../controllers/importOrderController');
const authenticate = require('../middlewares/authenticate');

// Apply authentication middleware to all routes
// router.use(authenticate);

// Create new import order
router.post('/', importOrderController.createImportOrder);

// Get all import orders with filters
router.get('/', importOrderController.getImportOrders);

// Get import order by ID
router.get('/:id', importOrderController.getImportOrderById);

// Update import order
router.put('/:id', importOrderController.updateImportOrder);

// Delete import order
router.delete('/:id', importOrderController.deleteImportOrder);

// Update order status
router.patch('/:id/status', importOrderController.updateOrderStatus);

module.exports = router;

