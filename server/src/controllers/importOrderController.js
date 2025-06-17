const importOrderService = require('../services/importOrderService');
const { IMPORT_ORDER_STATUSES } = require('../utils/constants');

class ImportOrderController {
  // Create new import order
  async createImportOrder(req, res) {
    try {
      const orderData = req.body;
      
      // Add created_by from authenticated user if available
      if (req.user && req.user._id) {
        orderData.created_by = req.user._id;
      } else {
        // For testing purposes, use a default supervisor ID
        orderData.created_by = "22ec4da883aa4736aa000001"; // Default supervisor ID
      }
      
      const newOrder = await importOrderService.createImportOrder(orderData);
      
      res.status(201).json({
        success: true,
        data: newOrder
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get all import orders
  async getImportOrders(req, res) {
    try {
      const { page = 1, limit = 10, status, manager_id, purchase_order_id } = req.query;
      
      // Build query
      const query = {};
      if (status) query.status = status;
      if (manager_id) query.manager_id = manager_id;
      if (purchase_order_id) query.purchase_order_id = purchase_order_id;

      const result = await importOrderService.getImportOrders(
        query,
        parseInt(page),
        parseInt(limit)
      );

      res.status(200).json({
        success: true,
        data: result.orders,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get import order by ID
  async getImportOrderById(req, res) {
    try {
      const { id } = req.params;
      const result = await importOrderService.getImportOrderById(id);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update import order
  async updateImportOrder(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedOrder = await importOrderService.updateImportOrder(id, updateData);

      res.status(200).json({
        success: true,
        data: updatedOrder
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Delete import order
  async deleteImportOrder(req, res) {
    try {
      const { id } = req.params;
      const result = await importOrderService.deleteImportOrder(id);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update order status
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate status
      if (!Object.values(IMPORT_ORDER_STATUSES).includes(status)) {
        throw new Error('Invalid status');
      }

      const updatedOrder = await importOrderService.updateOrderStatus(id, status);

      res.status(200).json({
        success: true,
        data: updatedOrder
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ImportOrderController(); 