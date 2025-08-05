const express = require('express');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const exportOrderController = require('../controllers/exportOrderController');
const router = express.Router();

router.use(authenticate); // Tất cả các route đều yêu cầu xác thực

// Kiểm tra tồn kho cho export order - chỉ representative
router
  .route('/check-stock')
  .post(
    authorize(['representative']),
    exportOrderController.checkStockForExportOrder,
  );

// Tạo mới export order - chỉ representative và representative_manager
router
  .route('/')
  .post(
    authorize(['representative', 'representative_manager']),
    exportOrderController.createExportOrder,
  );

// Lấy tất cả đơn hàng xuất kho - cho phép cả warehouse_manager, warehouse, representative_manager, representative
router
  .route('/')
  .get(
    authorize([
      'warehouse_manager',
      'warehouse',
      'representative_manager',
      'representative',
      'supervisor',
    ]),
    exportOrderController.getExportOrders,
  );

// Phân công nhân viên cho đơn hàng xuất kho - chỉ warehouse_manager
router
  .route('/:id/assign-staff')
  .put(authorize('warehouse_manager'), exportOrderController.assignStaffToExportOrder);

// Duyệt export order - chỉ representative_manager
router
  .route('/:id/approve')
  .put(authorize('representative_manager'), exportOrderController.approveExportOrder);

// Từ chối export order - chỉ representative_manager
router
  .route('/:id/reject')
  .put(authorize('representative_manager'), exportOrderController.rejectExportOrder);

// Cập nhật chi tiết đóng gói - có thể truy cập bởi cả warehouse và warehouse_manager
router
  .route('/:id/update-packing')
  .put(authorize(['warehouse_manager', 'warehouse']), exportOrderController.updatePackingDetails);

// Hoàn thành đơn hàng xuất kho - chỉ warehouse_manager
router
  .route('/:id/complete')
  .put(authorize('warehouse_manager'), exportOrderController.completeExportOrder);

// Hủy đơn hàng xuất kho - chỉ warehouse_manager
router
  .route('/:id/cancel')
  .put(authorize('warehouse_manager'), exportOrderController.cancelExportOrder);

// Xóa export order - cho phép representative và representative_manager
router
  .route('/:id')
  .delete(
    authorize(['representative', 'representative_manager']),
    exportOrderController.deleteExportOrder,
  );

// Update export order - chỉ cho phép representative
router.route('/:id').patch(authorize(['representative']), exportOrderController.updateExportOrder);

router.get(
  '/:id',
  authorize(['warehouse', 'warehouse_manager']),
  exportOrderController.getExportOrderDetail,
);

router.get('/:orderId/packages-needed', exportOrderController.getPackagesNeededForExport);

router.post('/:orderId/details/:detailId/inspections', exportOrderController.addExportInspection);

module.exports = router;
