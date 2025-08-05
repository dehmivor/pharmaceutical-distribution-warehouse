const express = require('express');
const router = express.Router();
const inventoryCheckInspectionController = require('../controllers/inventoryCheckInspectionController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// Apply authentication middleware to all routes
router.use(authenticate);


// Get all check inventory inspection by order id
router.get(
  '/:orderId/inspections',
  authorize(['warehouse', 'warehouse_manager']),
  inventoryCheckInspectionController.getInspectionsByOrderIdController,
);

router.patch(
  '/:inspectionId/status',
  authorize(['warehouse', 'warehouse_manager']),
  inventoryCheckInspectionController.updateInspectionStatus
);

router.patch(
  '/:inspectionId/checker',
  authorize(['warehouse', 'warehouse_manager']),
  inventoryCheckInspectionController.setInspectionChecker
);

router.post(
  '/:inspectionId/check-items/initialize',
  authorize(['warehouse', 'warehouse_manager']),
  inventoryCheckInspectionController.initializeCheckItems
);

router.get(
  '/:inspectionId/check-items',
  authorize(['warehouse', 'warehouse_manager']),
  inventoryCheckInspectionController.getCheckItems
);

router.patch(
  '/:inspectionId/check-items',
  inventoryCheckInspectionController.updateCheckItem
);

router.patch(
  "/:orderId/clear-inspections", // Use orderId as the parameter
  authorize(["warehouse", "warehouse_manager"]),
  inventoryCheckInspectionController.clearInspectionsController,
)

router.patch(
  "/:orderId/status", // New route for order status updates
  authorize(["warehouse", "warehouse_manager"]),
  inventoryCheckInspectionController.updateCheckOrderStatusController,
)

module.exports = router; 


