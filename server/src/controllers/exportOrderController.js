const ExportOrder = require("../models/ExportOrder")
const User = require("../models/User")
const { EXPORT_ORDER_STATUSES, USER_ROLES } = require("../utils/constants")
const exportOrderService = require('../services/exportOrderService');

/**
 * @desc    Get all export orders
 * @route   GET /api/export-orders
 * @access  Private (Representative, Representative Manager, Warehouse Manager)
 */
exports.getAllExportOrders = async (req, res, next) => {
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
};
 
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

/**
 * @desc    Representative tạo export order (trạng thái draft)
 * @route   POST /api/export-orders
 * @access  Private (Representative)
 */
exports.createExportOrder = async (req, res, next) => {
  try {
    const userId = req.user.userId; // Lấy từ middleware xác thực, dạng string
    console.log('POST /api/export-orders body:', req.body); // Log dữ liệu nhận được
    const order = await exportOrderService.createExportOrder(req.body, userId);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Create export order error:', error); // Log lỗi chi tiết
    next(error);
  }
};

/**
 * @desc    RM duyệt và gán warehouse manager cho export order
 * @route   PUT /api/export-orders/:id/approve
 * @access  Private (Representative Manager)
 */
exports.approveExportOrder = async (req, res, next) => {
  try {
    const rmId = req.user._id; // Lấy từ middleware xác thực
    const { id } = req.params;
    const order = await exportOrderService.approveExportOrder(id, rmId);
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Gán warehouse manager cho export order
 * @route   PUT /api/export-orders/:id/assign-warehouse-manager
 * @access  Private (Representative Manager)
 */
exports.assignWarehouseManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouse_manager_id } = req.body;
    if (!warehouse_manager_id) {
      return res.status(400).json({ success: false, error: 'warehouse_manager_id is required' });
    }
    const updatedOrder = await exportOrderService.assignWarehouseManager(id, warehouse_manager_id);
    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
