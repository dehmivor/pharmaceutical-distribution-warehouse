const express = require("express")
const {
  getAllExportOrders,
  assignStaffToExportOrder,
  updatePackingDetails,
  completeExportOrder,
  cancelExportOrder,
} = require("../controllers/exportOrderController")
const authenticate = require("../middlewares/authenticate") // Assuming you have this middleware
const authorize = require("../middlewares/authorize") // Assuming you have this middleware
const { USER_ROLES } = require("../utils/constants")

const router = express.Router()

// All routes below require authentication and authorization for warehouse_manager role
router.use(authenticate)
router.use(authorize(USER_ROLES.WAREHOUSEMANAGER)) // Ensure only warehouse managers can access

router.route("/").get(getAllExportOrders)
router.route("/:id/assign-staff").put(assignStaffToExportOrder)
router.route("/:id/update-packing").put(updatePackingDetails)
router.route("/:id/complete").put(completeExportOrder)
router.route("/:id/cancel").put(cancelExportOrder)

module.exports = router
