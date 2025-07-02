const express = require('express');
const router = express.Router();
const importOrderController = require('../controllers/importOrderController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// BỎ authenticate tạm thời
// router.use(authenticate);

// Create new import order
router.post('/', importOrderController.createImportOrder);

// Get all import orders with filters
router.get('/', importOrderController.getImportOrders);

// Get import orders by warehouse manager
router.get('/warehouse-manager/:warehouseManagerId', importOrderController.getImportOrdersByWarehouseManager);

// Get import orders by supplier contract
router.get('/supplier-contract/:supplierContractId', importOrderController.getImportOrdersBySupplierContract);

// Get import order by ID
router.get('/:id', importOrderController.getImportOrderById);

// Update import order
router.put('/:id', authenticate, authorize(['supervisor', 'representative']), importOrderController.updateImportOrder);

// Update import order details
router.put('/:id/details', importOrderController.updateImportOrderDetails);

// Add import order detail
router.post('/:id/details', importOrderController.addImportOrderDetail);

// Update specific import order detail
router.put('/:id/details/:detailId', importOrderController.updateImportOrderDetail);

// Remove import order detail
router.delete('/:id/details/:detailId', importOrderController.removeImportOrderDetail);

// Delete import order
router.delete('/:id', importOrderController.deleteImportOrder);

// Update order status
router.patch('/:id/status', importOrderController.updateOrderStatus);

// Get valid status transitions
router.get('/status-transitions', importOrderController.getValidStatusTransitions);

// Assign warehouse manager (chỉ supervisor được phép)
router.patch('/:id/assign-warehouse-manager', authenticate, authorize('supervisor'), importOrderController.assignWarehouseManager);

// Get import orders by warehouse manager
router.get('/warehouse-manager/:warehouseManagerId', importOrderController.getImportOrdersByWarehouseManager);


module.exports = router;

