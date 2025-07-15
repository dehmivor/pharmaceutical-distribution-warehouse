const ExportOrder = require("../models/ExportOrder")
const User = require("../models/User")
const { EXPORT_ORDER_STATUSES, USER_ROLES } = require("../utils/constants")

// Helper function for population to ensure consistent data structure
const populateOptions = [
  { path: "contract_id", select: "contract_code" }, // Đã sửa từ contract_number sang contract_code
  { path: "created_by", select: "email" },
  { path: "warehouse_manager_id", select: "email" }, // Populating assigned staff's email
  { path: "details.medicine_id", select: "medicine_name unit_of_measure" }, // Populating medicine details
]

/**
 * @desc    Get all export orders
 * @route   GET /api/export-orders
 * @access  Private (Warehouse Manager)
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
 * @access  Private (Warehouse Manager)
 */
exports.updatePackingDetails = async (req, res, next) => {
  try {
    const { id } = req.params
    const { details } = req.body // Array of { medicine_id, expected_quantity, actual_quantity, unit_price }

    // Basic validation for details array structure
    if (!Array.isArray(details) || details.some((d) => !d.medicine_id || typeof d.actual_quantity !== "number")) {
      return res.status(400).json({ success: false, error: "Invalid packing details format." })
    }

    const order = await ExportOrder.findByIdAndUpdate(
      id,
      { details: details },
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

    // Check if all actual quantities meet expected quantities
    const hasInsufficientQuantity = order.details.some((detail) => detail.actual_quantity < detail.expected_quantity)

    if (hasInsufficientQuantity) {
      // If quantities are insufficient, return an error or prompt for cancellation
      return res.status(400).json({
        success: false,
        error: "Cannot complete: Some items have insufficient actual quantity. Consider cancelling the order.",
      })
    }

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
