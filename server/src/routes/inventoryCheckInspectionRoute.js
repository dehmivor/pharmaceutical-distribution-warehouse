const express = require("express")
const router = express.Router()
const inventoryCheckInspectionController = require("../controllers/inventoryCheckInspectionController")
const authenticate = require("../middlewares/authenticate")
const authorize = require("../middlewares/authorize")

// Apply authentication middleware to all routes
router.use(authenticate)

// Get all check inventory inspection by order id
router.get(
  "/:orderId/inspections",
  authorize(["warehouse", "warehouse_manager"]),
  inventoryCheckInspectionController.getInspectionsByOrderIdController,
)

router.patch(
  "/:inspectionId/status",
  authorize(["warehouse", "warehouse_manager"]),
  inventoryCheckInspectionController.updateInspectionStatus,
)

router.patch(
  "/:inspectionId/checker",
  authorize(["warehouse", "warehouse_manager"]),
  inventoryCheckInspectionController.setInspectionChecker,
)

router.post(
  "/:inspectionId/check-items/initialize",
  authorize(["warehouse", "warehouse_manager"]),
  inventoryCheckInspectionController.initializeCheckItems,
)

router.get(
  "/:inspectionId/check-items",
  authorize(["warehouse", "warehouse_manager"]),
  inventoryCheckInspectionController.getCheckItems,
)

router.patch("/:inspectionId/check-items", inventoryCheckInspectionController.updateCheckItem)

// Route for clearing inspections (reset actual quantity and status to draft)
router.patch(
  "/:orderId/clear-inspections", // Corrected path: no /check-order/ segment
  authorize(["warehouse", "warehouse_manager"]),
  inventoryCheckInspectionController.clearInspectionsController,
)

// Route for updating InventoryCheckOrder status (used by complete and cancel)
router.patch(
  "/:orderId/status", // New route for order status updates
  authorize(["warehouse", "warehouse_manager"]),
  inventoryCheckInspectionController.updateCheckOrderStatusController,
)

// New route to delete a specific check item from an inspection
router.delete(
  "/:inspectionId/check-items/:packageId",
  authorize(["warehouse", "warehouse_manager"]),
  inventoryCheckInspectionController.deleteCheckItemController,
)

module.exports = router