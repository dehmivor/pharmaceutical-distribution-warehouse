const express = require('express');
const router = express.Router();
const importOrderController = require('../controllers/importOrderController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// Apply authentication middleware to all routes
router.use(authenticate);

// Create new import order - chỉ representative và supervisor
router.post('/', authorize(['representative', 'supervisor']), importOrderController.createImportOrder);

// Get all import orders with filters - chỉ supervisor, representative và warehouse_manager
router.get('/', authorize(['supervisor', 'representative', 'warehouse_manager', 'warehouse']), importOrderController.getImportOrders);

// Get import orders by warehouse manager - warehouse manager chỉ xem orders của mình
router.get('/warehouse-manager/:warehouseManagerId', authorize(['warehouse_manager', 'supervisor']), importOrderController.getImportOrdersByWarehouseManager);

// Get import orders by supplier contract - representative và supervisor
router.get('/supplier-contract/:supplierContractId', authorize(['representative', 'supervisor']), importOrderController.getImportOrdersBySupplierContract);

// Get import order by ID - chỉ supervisor, representative và warehouse_manager
router.get('/:id', authorize(['supervisor', 'representative', 'warehouse_manager', 'warehouse']), importOrderController.getImportOrderById);

// Update import order - chỉ supervisor và representative
router.put('/:id', authorize(['supervisor', 'representative']), importOrderController.updateImportOrder);

// Update import order details - chỉ supervisor, representative và warehouse_manager
router.put('/:id/details', authorize(['supervisor', 'representative', 'warehouse_manager']), importOrderController.updateImportOrderDetails);

// Add import order detail - chỉ supervisor, representative và warehouse_manager
router.post('/:id/details', authorize(['supervisor', 'representative', 'warehouse_manager']), importOrderController.addImportOrderDetail);

// Update specific import order detail - chỉ supervisor, representative và warehouse_manager
router.put('/:id/details/:detailId', authorize(['supervisor', 'representative', 'warehouse_manager']), importOrderController.updateImportOrderDetail);

// Remove import order detail - chỉ supervisor, representative và warehouse_manager
router.delete('/:id/details/:detailId', authorize(['supervisor', 'representative', 'warehouse_manager']), importOrderController.removeImportOrderDetail);

// Delete import order - chỉ supervisor và representative
router.delete('/:id', authorize(['supervisor', 'representative']), importOrderController.deleteImportOrder);

// Update order status - cho phép supervisor và warehouse manager (không phải warehouse staff)
router.patch('/:id/status', authorize(['supervisor', 'warehouse_manager']), importOrderController.updateOrderStatus);

// Get valid status transitions - chỉ supervisor, representative và warehouse_manager
router.get('/status-transitions', authorize(['supervisor', 'representative', 'warehouse_manager']), importOrderController.getValidStatusTransitions);

// Assign warehouse manager (chỉ supervisor được phép)
router.patch('/:id/assign-warehouse-manager', authorize('supervisor'), importOrderController.assignWarehouseManager);

// Get import orders by warehouse manager
router.get('/warehouse-manager/:warehouseManagerId', importOrderController.getImportOrdersByWarehouseManager);


module.exports = router;

