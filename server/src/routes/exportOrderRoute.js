const express = require("express")
const {
  getAllExportOrders,
  assignStaffToExportOrder,
  updatePackingDetails,
  completeExportOrder,
  cancelExportOrder,
  createExportOrder,
  approveExportOrder,
} = require("../controllers/exportOrderController")
const authenticate = require("../middlewares/authenticate")
const authorize = require("../middlewares/authorize")

const router = express.Router()

// Apply authentication middleware to all routes
router.use(authenticate)

// Create new export order - chỉ representative và supervisor
router.post(
  '/',
  authorize(['representative', 'supervisor']),
  createExportOrder,
)

// Get all export orders - supervisor, representative, representative_manager, warehouse_manager, warehouse
router.get(
  '/',
  authorize([
    'supervisor',
    'representative',
    'representative_manager',
    'warehouse_manager',
    'warehouse',
  ]),
  getAllExportOrders,
)

// RM duyệt và gán warehouse manager
router.put(
  '/:id/approve',
  authorize(['representative_manager', 'supervisor']),
  approveExportOrder,
)

// Assign staff to export order - warehouse_manager, supervisor
router.put(
  '/:id/assign-staff',
  authorize(['warehouse_manager', 'supervisor']),
  assignStaffToExportOrder,
)

// Assign warehouse manager to export order - representative_manager, supervisor
router.put(
  '/:id/assign-warehouse-manager',
  authorize(['representative_manager', 'supervisor']),
  require('../controllers/exportOrderController').assignWarehouseManager,
);

// Update packing details - warehouse_manager, supervisor
router.put(
  '/:id/update-packing',
  authorize(['warehouse_manager', 'supervisor']),
  updatePackingDetails,
)

// Complete export order - warehouse_manager, supervisor
router.put(
  '/:id/complete',
  authorize(['warehouse_manager', 'supervisor']),
  completeExportOrder,
)

// Cancel export order - warehouse_manager, supervisor
router.put(
  '/:id/cancel',
  authorize(['warehouse_manager', 'supervisor']),
  cancelExportOrder,
)

module.exports = router
