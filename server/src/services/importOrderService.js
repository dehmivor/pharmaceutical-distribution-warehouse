const ImportOrder = require('../models/ImportOrder');
const { IMPORT_ORDER_STATUSES } = require('../utils/constants');

class ImportOrderService {
  // Create new import order
  async createImportOrder(orderData) {
    try {
      const newOrder = new ImportOrder(orderData);
      const savedOrder = await newOrder.save();
      return savedOrder;
    } catch (error) {
      throw error;
    }
  }

  // Get all import orders with pagination and filters
  async getImportOrders(query = {}, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const orders = await ImportOrder.find(query)
        .populate('manager_id')
        .populate('purchase_order_id')
        .populate('import_content.batch_id')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await ImportOrder.countDocuments(query);

      return {
        orders,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get import order by ID
  async getImportOrderById(orderId) {
    try {
      const order = await ImportOrder.findById(orderId)
        .populate('manager_id')
        .populate('purchase_order_id')
        .populate('import_content.batch_id');

      if (!order) {
        throw new Error('Import order not found');
      }

      return order;
    } catch (error) {
      throw error;
    }
  }

  // Update import order
  async updateImportOrder(orderId, updateData) {
    try {
      const order = await ImportOrder.findById(orderId);
      if (!order) {
        throw new Error('Import order not found');
      }

      // Check if order can be updated
      if (order.status === IMPORT_ORDER_STATUSES.COMPLETED) {
        throw new Error('Cannot update completed order');
      }

      const updatedOrder = await ImportOrder.findByIdAndUpdate(
        orderId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      return updatedOrder;
    } catch (error) {
      throw error;
    }
  }

  // Delete import order
  async deleteImportOrder(orderId) {
    try {
      const order = await ImportOrder.findById(orderId);
      if (!order) {
        throw new Error('Import order not found');
      }

      // Check if order can be deleted
      if (order.status !== IMPORT_ORDER_STATUSES.PENDING) {
        throw new Error('Can only delete pending orders');
      }
      
      await ImportOrder.findByIdAndDelete(orderId);

      return { message: 'Import order deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(orderId, status) {
    try {
      const order = await ImportOrder.findById(orderId);
      if (!order) {
        throw new Error('Import order not found');
      }

      const updatedOrder = await ImportOrder.findByIdAndUpdate(
        orderId,
        { $set: { status } },
        { new: true, runValidators: true }
      );

      return updatedOrder;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ImportOrderService(); 