const ExportOrder = require("../models/ExportOrder")
const User = require("../models/User")
const Package = require("../models/Package") // Assuming you have a Package model defined
const { EXPORT_ORDER_STATUSES, USER_ROLES } = require("../utils/constants")

// Helper function for population to ensure consistent data structure
const populateOptions = [
  { path: "contract_id", select: "contract_code" },
  { path: "created_by", select: "email" },
  { path: "warehouse_manager_id", select: "email" }, // Populating assigned staff's email
  { path: "details.medicine_id", select: "medicine_name unit_of_measure" }, // Populating medicine details
  { path: "details.actual_item.package_id", select: "package_code" }, // Populate package_code from Package model
  { path: "details.actual_item.created_by", select: "email" }, // Populate email from User model for who packed it
]

/**
 * @desc    Get all export orders
 * @route   GET /api/export-orders
 * @access  Private (Warehouse Manager, Warehouse)
 */
exports.getAllExportOrders = async (req, res, next) => {
  try {
    const orders = await ExportOrder.find().populate(populateOptions).sort({ createdAt: -1 })
    res.status(200).json({ success: true, data: orders })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Assign staff to an export order
 * @route   PUT /api/export-orders/:id/assign-staff
 * @access  Private (Warehouse Manager)
 */
exports.assignStaffToExportOrder = async (req, res, next) => {
  try {
    const { id } = req.params
    const { staffId } = req.body
    // Validate staffId is a valid User with WAREHOUSE role
    const staff = await User.findById(staffId)
    if (!staff || staff.role !== USER_ROLES.WAREHOUSE) {
      return res.status(400).json({ success: false, error: "Invalid staff ID or staff is not a warehouse employee." })
    }
    const order = await ExportOrder.findByIdAndUpdate(
      id,
      { warehouse_manager_id: staffId }, // Assigning staff to warehouse_manager_id
      { new: true, runValidators: true },
    ).populate(populateOptions)
    if (!order) {
      return res.status(404).json({ success: false, error: "Export Order not found" })
    }
    res.status(200).json({ success: true, data: order })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Update packing details for an export order
 * @route   PUT /api/export-orders/:id/update-packing
 * @access  Private (Warehouse Manager, Warehouse)
 */
exports.updatePackingDetails = async (req, res, next) => {
  try {
    const { id } = req.params
    const { details } = req.body // Array of { medicine_id, expected_quantity, actual_item, unit_price }

    // Basic validation for details array structure
    if (!Array.isArray(details) || details.some((d) => !d.medicine_id || !Array.isArray(d.actual_item))) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid packing details format. 'details' must be an array of objects with 'medicine_id' and 'actual_item' array.",
      })
    }

    // Validate each actual_item entry within each detail
    for (const detail of details) {
      for (const item of detail.actual_item) {
        // Ensure package_id and created_by are present and quantity is a positive number
        if (!item.package_id || typeof item.quantity !== "number" || item.quantity < 0 || !item.created_by) {
          return res.status(400).json({
            success: false,
            error:
              "Invalid actual_item format. Each item must have 'package_id', 'quantity' (non-negative number), and 'created_by'.",
          })
        }
        // Optional: You might want to add more robust validation here,
        // e.g., checking if package_id and created_by exist in your database.
        // const existingPackage = await Package.findById(item.package_id);
        // if (!existingPackage) return res.status(400).json({ success: false, error: `Package with ID ${item.package_id} not found.` });
        // const existingUser = await User.findById(item.created_by);
        // if (!existingUser) return res.status(400).json({ success: false, error: `User with ID ${item.created_by} not found.` });
      }
    }

    const order = await ExportOrder.findByIdAndUpdate(
      id,
      { details: details }, // Update the entire details array
      { new: true, runValidators: true },
    ).populate(populateOptions)

    if (!order) {
      return res.status(404).json({ success: false, error: "Export Order not found" })
    }

    res.status(200).json({ success: true, data: order })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Complete an export order
 * @route   PUT /api/export-orders/:id/complete
 * @access  Private (Warehouse Manager)
 */
exports.completeExportOrder = async (req, res, next) => {
  try {
    const { id } = req.params
    const order = await ExportOrder.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, error: "Export Order not found" })
    }
    // As per your request, the quantity check for completion is removed for warehouse_manager
    order.status = EXPORT_ORDER_STATUSES.COMPLETED
    await order.save()
    const populatedOrder = await ExportOrder.findById(id).populate(populateOptions)
    res.status(200).json({ success: true, data: populatedOrder })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Cancel an export order
 * @route   PUT /api/export-orders/:id/cancel
 * @access  Private (Warehouse Manager)
 */
exports.cancelExportOrder = async (req, res, next) => {
  try {
    const { id } = req.params
    const order = await ExportOrder.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, error: "Export Order not found" })
    }
    order.status = EXPORT_ORDER_STATUSES.CANCELLED
    await order.save()
    const populatedOrder = await ExportOrder.findById(id).populate(populateOptions)
    res.status(200).json({ success: true, data: populatedOrder })
  } catch (error) {
    next(error)
  }
}
