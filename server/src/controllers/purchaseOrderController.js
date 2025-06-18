// controllers/purchaseOrderController.js
const purchaseOrderService = require('../services/purchaseOrderService');
const { validationResult } = require('express-validator');

// GET /api/purchase-orders
const getPurchaseOrders = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      status: req.query.status,
      created_by: req.query.created_by,
      contract_id: req.query.contract_id,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
    };

    const result = await purchaseOrderService.getPurchaseOrders(options);

    res.status(200).json({
      success: true,
      message: 'Purchase orders retrieved successfully',
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/purchase-orders/:id
const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseOrder = await purchaseOrderService.getPurchaseOrderById(id);

    res.status(200).json({
      success: true,
      message: 'Purchase order retrieved successfully',
      data: purchaseOrder,
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// POST /api/purchase-orders
const createPurchaseOrder = async (req, res) => {
  try {
    // Kiểm tra validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const userId = req.user.id; // Từ auth middleware
    const purchaseOrder = await purchaseOrderService.createPurchaseOrder(req.body, userId);

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: purchaseOrder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// PUT /api/purchase-orders/:id
const updatePurchaseOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const purchaseOrder = await purchaseOrderService.updatePurchaseOrder(id, req.body, userId);

    res.status(200).json({
      success: true,
      message: 'Purchase order updated successfully',
      data: purchaseOrder,
    });
  } catch (error) {
    const statusCode = error.message.includes('not found')
      ? 404
      : error.message.includes('permission')
        ? 403
        : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// PATCH /api/purchase-orders/:id/status
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.id;

    const purchaseOrder = await purchaseOrderService.updateStatus(id, status, notes, userId);

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: purchaseOrder,
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// PATCH /api/purchase-orders/:id/submit
const submitForApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const purchaseOrder = await purchaseOrderService.submitForApproval(id, userId);

    res.status(200).json({
      success: true,
      message: 'Purchase order submitted for approval',
      data: purchaseOrder,
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// PATCH /api/purchase-orders/:id/approve
const approve = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    const purchaseOrder = await purchaseOrderService.approve(id, notes, userId);

    res.status(200).json({
      success: true,
      message: 'Purchase order approved successfully',
      data: purchaseOrder,
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// PATCH /api/purchase-orders/:id/reject
const reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    const purchaseOrder = await purchaseOrderService.reject(id, notes, userId);

    res.status(200).json({
      success: true,
      message: 'Purchase order rejected',
      data: purchaseOrder,
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE /api/purchase-orders/:id
const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await purchaseOrderService.deletePurchaseOrder(id, userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const statusCode = error.message.includes('not found')
      ? 404
      : error.message.includes('permission')
        ? 403
        : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/purchase-orders/search/:keyword
const searchPurchaseOrders = async (req, res) => {
  try {
    const { keyword } = req.params;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
    };

    const result = await purchaseOrderService.searchPurchaseOrders(keyword, options);

    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/purchase-orders/statistics
const getStatistics = async (req, res) => {
  try {
    const userId = req.query.user_id || null;
    const stats = await purchaseOrderService.getStatistics(userId);

    res.status(200).json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  updateStatus,
  submitForApproval,
  approve,
  reject,
  deletePurchaseOrder,
  searchPurchaseOrders,
  getStatistics,
};
