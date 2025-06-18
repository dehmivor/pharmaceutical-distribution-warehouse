// controllers/purchaseOrderController.js
const purchaseOrderService = require('../services/purchaseOrderService');
const { validationResult } = require('express-validator');

const purchaseOrderController = {
  // Create new purchase order
  async createPurchaseOrder(req, res) {
    try {
      const orderData = {
        ...req.body,
        created_by: req.user?.userId || req.user?.id,
      };

      const order = await purchaseOrderService.createPurchaseOrder(orderData);
      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get all purchase orders
  async getPurchaseOrders(req, res) {
    try {
      const { page = 1, limit = 10, status, contract_id } = req.query;
      const query = {};

      if (status) query.status = status;
      if (contract_id) query.contract_id = contract_id;

      const result = await purchaseOrderService.getPurchaseOrders(
        query,
        parseInt(page),
        parseInt(limit)
      );

      res.status(200).json({
        success: true,
        data: result.orders,
        pagination: result.pagination,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get purchase order by ID
  async getPurchaseOrderById(req, res) {
    try {
      const order = await purchaseOrderService.getPurchaseOrderById(req.params.id);
      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Update purchase order
  async updatePurchaseOrder(req, res) {
    try {
      const order = await purchaseOrderService.updatePurchaseOrder(
        req.params.id,
        req.body,
        req.user?.role
      );
      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Delete purchase order
  async deletePurchaseOrder(req, res) {
    try {
      const result = await purchaseOrderService.deletePurchaseOrder(
        req.params.id,
        req.user?.role
      );
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Update order status
  async updateOrderStatus(req, res) {
    try {
      const { status } = req.body;
      const order = await purchaseOrderService.updateOrderStatus(
        req.params.id,
        status,
        req.user?.role
      );
      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = purchaseOrderController;

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