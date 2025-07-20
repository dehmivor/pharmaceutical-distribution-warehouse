const express = require("express")
const {
  getAllExportOrders,
  assignStaffToExportOrder,
  updatePackingDetails,
  completeExportOrder,
  cancelExportOrder,
} = require("../controllers/exportOrderController")
const authenticate = require("../middlewares/authenticate") // Giả định middleware này đã tồn tại
const authorize = require("../middlewares/authorize") // SỬ DỤNG MIDDLEWARE AUTHORIZE HIỆN CÓ CỦA BẠN
const { USER_ROLES } = require("../utils/constants")

const router = express.Router()

router.use(authenticate) // Tất cả các route đều yêu cầu xác thực

// Lấy tất cả đơn hàng xuất kho - có thể truy cập bởi cả warehouse và warehouse_manager
router.route("/").get(authorize([USER_ROLES.WAREHOUSEMANAGER, USER_ROLES.WAREHOUSE]), getAllExportOrders)

// Phân công nhân viên cho đơn hàng xuất kho - chỉ warehouse_manager
router.route("/:id/assign-staff").put(authorize(USER_ROLES.WAREHOUSEMANAGER), assignStaffToExportOrder)

// Cập nhật chi tiết đóng gói - có thể truy cập bởi cả warehouse và warehouse_manager
router
  .route("/:id/update-packing")
  .put(authorize([USER_ROLES.WAREHOUSEMANAGER, USER_ROLES.WAREHOUSE]), updatePackingDetails)

// Hoàn thành đơn hàng xuất kho - chỉ warehouse_manager
router.route("/:id/complete").put(authorize(USER_ROLES.WAREHOUSEMANAGER), completeExportOrder)

// Hủy đơn hàng xuất kho - chỉ warehouse_manager
router.route("/:id/cancel").put(authorize(USER_ROLES.WAREHOUSEMANAGER), cancelExportOrder)

module.exports = router
