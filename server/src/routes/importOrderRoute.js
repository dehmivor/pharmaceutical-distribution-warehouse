const express = require('express');
const router = express.Router();
const importOrderController = require('../controllers/importOrderController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// Apply authentication middleware to all routes
router.use(authenticate);

// Routes for representative
router.post('/', authorize('representative'), importOrderController.createImportOrder);
router.put(
  '/:id',
  authorize('warehouse', 'representative', 'supervisor'),
  importOrderController.updateImportOrder,
);
router.put(
  '/:id/details',
  authorize('representative', 'warehouse', 'supervisor'),
  importOrderController.updateImportOrderDetails,
);
router.delete(
  '/:id',
  authorize('representative', 'supervisor', 'warehouse'),
  importOrderController.deleteImportOrder,
);

// Routes for supervisor, representative, and warehouse
router.get(
  '/',
  authorize(['supervisor', 'representative', 'warehouse']),
  importOrderController.getImportOrders,
);
router.get(
  '/:id',
  authorize(['supervisor', 'representative', 'warehouse']),
  importOrderController.getImportOrderById,
);

// Routes for supervisor only
router.patch('/:id/status', authorize('supervisor'), importOrderController.updateOrderStatus);

// Routes for warehouse only

module.exports = router;
