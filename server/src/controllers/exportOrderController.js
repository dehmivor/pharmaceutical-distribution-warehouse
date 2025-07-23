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

const completeExportOrder = async (req, res, next) => {
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

/**
 * @desc    Create export order (auto details from contract if not provided)
 * @route   POST /api/export-orders
 * @access  Private (Representative, Representative Manager)
 */
const createExportOrder = async (req, res, next) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const newOrder = await exportOrderService.createExportOrder(req.body, userId);
    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete export order (only draft/cancelled, RP chỉ xóa đơn của mình, RM xóa tất cả)
 * @route   DELETE /api/export-orders/:id
 * @access  Private (Representative, Representative Manager)
 */
const deleteExportOrder = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const result = await exportOrderService.deleteExportOrder(id, user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update export order (only draft, RP chỉ update đơn của mình)
 * @route   PATCH /api/export-orders/:id
 * @access  Private (Representative)
 */
const updateExportOrder = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const updatedOrder = await exportOrderService.updateExportOrder(id, req.body, user);
    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllExportOrders,
  assignStaffToExportOrder,
  updatePackingDetails,
  completeExportOrder,
  cancelExportOrder,
  getExportOrderDetail,
  createExportOrder,
  deleteExportOrder,
  updateExportOrder,
}
