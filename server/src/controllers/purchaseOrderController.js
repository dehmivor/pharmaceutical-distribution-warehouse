const purchaseOrderService = require('../services/purchaseOrderService');

const purchaseOrderController = {
  // Create new purchase order
  async createPurchaseOrder(req, res) {
    try {
      const orderData = {
        ...req.body,
        created_by: req.user.userId,
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
        req.user.role
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
        req.user.role
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
        req.user.role
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