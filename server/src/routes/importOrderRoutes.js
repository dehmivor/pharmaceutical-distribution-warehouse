const express = require('express');
const router = express.Router();
const importOrderController = require('../controllers/importOrderController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// Apply authentication middleware to all routes
router.use(authenticate);

// Create new import order - chỉ representative và supervisor
router.post(
  '/',
  authorize(['representative', 'supervisor']),
  importOrderController.createImportOrder,
);

// Create internal import order - chỉ warehouse manager
router.post(
  '/internal',
  authorize(['warehouse_manager']),
  importOrderController.createInternalImportOrder,
);

// Get all import orders with filters - chỉ supervisor, representative, representative_manager và warehouse_manager
router.get(
  '/',
  authorize([
    'supervisor',
    'representative',
    'representative_manager',
    'warehouse_manager',
    'warehouse',
  ]),
  importOrderController.getImportOrders,
);

// Get valid status transitions - chỉ supervisor, representative, representative_manager và warehouse_manager
router.get(
  '/status-transitions',
  authorize(['supervisor', 'representative', 'representative_manager', 'warehouse_manager']),
  importOrderController.getValidStatusTransitions,
);

// Get import orders by warehouse manager - warehouse manager chỉ xem orders của mình
router.get(
  '/warehouse-manager/:warehouseManagerId',
  authorize(['warehouse_manager', 'supervisor']),
  importOrderController.getImportOrdersByWarehouseManager,
);

// Get import orders by contract - representative và supervisor
router.get(
  '/contract/:contractId',
  authorize(['representative', 'supervisor']),
  importOrderController.getImportOrdersByContract,
);

router.get(
  '/receipt/:id',
  authorize(['warehouse_manager', 'supervisor']),
  importOrderController.docx,
);

// Get import order by ID - chỉ supervisor, representative, representative_manager và warehouse_manager
router.get(
  '/:id',
  authorize([
    'supervisor',
    'representative',
    'representative_manager',
    'warehouse_manager',
    'warehouse',
  ]),
  importOrderController.getImportOrderById,
);

// Update import order - chỉ supervisor và representative
router.put(
  '/:id',
  authorize(['supervisor', 'representative']),
  importOrderController.updateImportOrder,
);

// Update import order details - chỉ supervisor, representative và warehouse_manager
router.put(
  '/:id/details',
  authorize(['supervisor', 'representative', 'warehouse_manager']),
  importOrderController.updateImportOrderDetails,
);

// Add import order detail - chỉ supervisor, representative và warehouse_manager
router.post(
  '/:id/details',
  authorize(['supervisor', 'representative', 'warehouse_manager']),
  importOrderController.addImportOrderDetail,
);

// Update specific import order detail - chỉ supervisor, representative và warehouse_manager
router.put(
  '/:id/details/:detailId',
  authorize(['supervisor', 'representative', 'warehouse_manager']),
  importOrderController.updateImportOrderDetail,
);

// Remove import order detail - chỉ supervisor, representative và warehouse_manager
router.delete(
  '/:id/details/:detailId',
  authorize(['supervisor', 'representative', 'warehouse_manager']),
  importOrderController.removeImportOrderDetail,
);

// Delete import order - chỉ supervisor và representative
router.delete(
  '/:id',
  authorize(['supervisor', 'representative']),
  importOrderController.deleteImportOrder,
);

// Update order status - cho phép supervisor, representative_manager, warehouse manager và representative
router.patch(
  '/:id/status',
  authorize(['supervisor', 'representative_manager', 'warehouse_manager', 'representative']),
  importOrderController.updateOrderStatus,
);

// Assign warehouse manager (chỉ warehouse_manager tự assign cho chính mình)
router.patch(
  '/:id/assign-warehouse-manager',
  authorize('warehouse_manager'),
  importOrderController.assignWarehouseManager,
);



module.exports = router;
