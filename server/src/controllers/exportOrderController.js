const ExportOrder = require("../models/ExportOrder")
const User = require("../models/User")
const { EXPORT_ORDER_STATUSES, USER_ROLES } = require("../utils/constants")

// Helper function for population to ensure consistent data structure
const populateOptions = [
  { path: "contract_id", select: "contract_code" },
  { path: "created_by", select: "email" },
  { path: "warehouse_manager_id", select: "email" }, // Populating assigned staff's email
  { path: "details.medicine_id", select: "medicine_name unit_of_measure" }, // Populating medicine details
]
const exportOrderService = require('../services/exportOrderService');

/**
 * @desc    Get all export orders
 * @route   GET /api/export-orders
 * @access  Private (Representative, Representative Manager, Warehouse Manager)
 */
const getAllExportOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, warehouse_manager_id, created_by } = req.query;
    const result = await exportOrderService.getExportOrders(
      { status, warehouse_manager_id, created_by },
      parseInt(page),
      parseInt(limit)
    );
    res.status(200).json({ success: true, data: result.orders, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Assign staff to an export order
 * @route   PUT /api/export-orders/:id/assign-staff
 * @access  Private (Warehouse Manager)
 */
const assignStaffToExportOrder = async (req, res, next) => {
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

const updatePackingDetails = async (req, res, next) => {
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

const completeExportOrder = async (req, res, next) => {
  try {
    const { id } = req.params
    const order = await ExportOrder.findById(id)

    if (!order) {
      return res.status(404).json({ success: false, error: "Export Order not found" })
    }

    // Loại bỏ kiểm tra số lượng khi hoàn thành đơn hàng cho warehouse_manager
    order.status = EXPORT_ORDER_STATUSES.COMPLETED
    await order.save()

    const populatedOrder = await ExportOrder.findById(id).populate(populateOptions)
    res.status(200).json({ success: true, data: populatedOrder })
  } catch (error) {
    next(error)
  }
}

const cancelExportOrder = async (req, res, next) => {
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

const getExportOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // Find export order by ID and populate references
    const exportOrder = await ExportOrder.findById(id)
      .populate("contract_id", "contract_code")
      .populate("warehouse_manager_id", "email")
      .populate("created_by", "email")
      .populate("approval_by", "email")
      // If your details include a product or medicine reference, adjust accordingly:
      .populate("details.medicine_id", "medicine_name license_code")
      .populate("details.actual_item");

    if (!exportOrder) {
      return res.status(404).json({
        success: false,
        message: `Export order with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: exportOrder,
    });
  } catch (error) {
    console.error("Error fetching export order:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving export order",
      error: error.message,
    });
  }
};

module.exports = {
  getAllExportOrders,
  assignStaffToExportOrder,
  updatePackingDetails,
  completeExportOrder,
  cancelExportOrder,
  getExportOrderDetail
}
