const express = require("express")
const authenticate = require("../middlewares/authenticate") 
const authorize = require("../middlewares/authorize")
const exportOrderController = require("../controllers/exportOrderController")
const router = express.Router()


router.use(authenticate) // Tất cả các route đều yêu cầu xác thực

// Tạo mới export order - chỉ representative và representative_manager
router.route("/").post(authorize(['representative', 'representative_manager']), exportOrderController.createExportOrder);

// Lấy tất cả đơn hàng xuất kho - cho phép cả warehouse_manager, warehouse, representative_manager, representative
router.route("/").get(authorize(['warehouse_manager', 'warehouse', 'representative_manager', 'representative']), exportOrderController.getAllExportOrders);

// Phân công nhân viên cho đơn hàng xuất kho - chỉ warehouse_manager
router.route("/:id/assign-staff").put(authorize('warehouse_manager'), exportOrderController.assignStaffToExportOrder);

// Cập nhật chi tiết đóng gói - có thể truy cập bởi cả warehouse và warehouse_manager
router
  .route("/:id/update-packing")
  .put(authorize(['warehouse_manager', 'warehouse']), exportOrderController.updatePackingDetails);

// Hoàn thành đơn hàng xuất kho - chỉ warehouse_manager
router.route("/:id/complete").put(authorize('warehouse_manager'), exportOrderController.completeExportOrder);

// Hủy đơn hàng xuất kho - chỉ warehouse_manager
router.route("/:id/cancel").put(authorize('warehouse_manager'), exportOrderController.cancelExportOrder);

// Xóa export order - cho phép representative và representative_manager
router.route('/:id').delete(authorize(['representative', 'representative_manager']), exportOrderController.deleteExportOrder);

// Update export order - chỉ cho phép representative
router.route('/:id').patch(authorize(['representative']), exportOrderController.updateExportOrder);

router.get(
  '/:id',
  authorize(['warehouse', 'warehouse_manager']),
  exportOrderController.getExportOrderDetail,
);


module.exports = router
