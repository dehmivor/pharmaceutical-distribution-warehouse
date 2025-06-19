const importOrderService = require('../services/importOrderService');
const { IMPORT_ORDER_STATUSES } = require('../utils/constants');

// Create new import order
const createImportOrder = async (req, res) => {
  try {
    const { orderData, orderDetails } = req.body;

    // Add created_by from authenticated user if available
    if (req.user && req.user._id) {
      orderData.created_by = req.user._id;
    } else {
      // For testing purposes, use a default supervisor ID
      orderData.created_by = '22ec4da883aa4736aa000001'; // Default supervisor ID
    }

    const newOrder = await importOrderService.createImportOrder(orderData, orderDetails);

    res.status(201).json({
      success: true,
      data: newOrder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all import orders
const getImportOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, supplier_id, warehouse_id } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (supplier_id) query.supplier_id = supplier_id;
    if (warehouse_id) query.warehouse_id = warehouse_id;

    const result = await importOrderService.getImportOrders(query, parseInt(page), parseInt(limit));

    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get import order by ID
const getImportOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await importOrderService.getImportOrderById(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
};

// Update import order
const updateImportOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedOrder = await importOrderService.updateImportOrder(id, updateData);

    res.status(200).json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Update import order details
const updateImportOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { details } = req.body;

    const updatedDetails = await importOrderService.updateImportOrderDetails(id, details);

    res.status(200).json({
      success: true,
      data: updatedDetails,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete import order
const deleteImportOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await importOrderService.deleteImportOrder(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!Object.values(IMPORT_ORDER_STATUSES).includes(status)) {
      throw new Error('Invalid status');
    }

    // Get approved_by from authenticated user if available
    const approvedBy = req.user && req.user._id ? req.user._id : null;

    const updatedOrder = await importOrderService.updateOrderStatus(id, status, approvedBy);

    res.status(200).json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  createImportOrder,
  getImportOrders,
  getImportOrderById,
  updateImportOrder,
  updateImportOrderDetails,
  deleteImportOrder,
  updateOrderStatus,
};
