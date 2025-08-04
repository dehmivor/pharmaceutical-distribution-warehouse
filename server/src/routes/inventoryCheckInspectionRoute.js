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
  authorize(['warehouse']),
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


module.exports = router; 


