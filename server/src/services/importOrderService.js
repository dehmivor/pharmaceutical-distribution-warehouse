const ImportOrder = require('../models/ImportOrder');
const ImportOrderDetail = require('../models/ImportOrderDetail');
const { IMPORT_ORDER_STATUSES } = require('../utils/constants');

class ImportOrderService {
  // Create new import order
  async createImportOrder(orderData, orderDetails) {
    try {
      const newOrder = new ImportOrder(orderData);
      const savedOrder = await newOrder.save();

      // Create order details
      const details = orderDetails.map(detail => ({
        ...detail,
        import_order_id: savedOrder._id
      }));
      await ImportOrderDetail.insertMany(details);

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
        .populate('contract_id')
        .populate('supplier_id')
        .populate('warehouse_id')
        .populate('created_by')
        .populate('approved_by')
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

  // Get import order by ID with details
  async getImportOrderById(orderId) {
    try {
      const order = await ImportOrder.findById(orderId)
        .populate('contract_id')
        .populate('supplier_id')
        .populate('warehouse_id')
        .populate('created_by')
        .populate('approved_by');

      if (!order) {
        throw new Error('Import order not found');
      }

      const details = await ImportOrderDetail.find({ import_order_id: orderId })
        .populate('medicine_id')
        .populate('batch_id')
        .populate('package_list');

      return {
        order,
        details
      };
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

  // Update import order details
  async updateImportOrderDetails(orderId, details) {
    try {
      const order = await ImportOrder.findById(orderId);
      if (!order) {
        throw new Error('Import order not found');
      }

      // Check if order can be updated
      if (order.status === IMPORT_ORDER_STATUSES.COMPLETED) {
        throw new Error('Cannot update completed order');
      }

      // Delete existing details
      await ImportOrderDetail.deleteMany({ import_order_id: orderId });

      // Create new details
      const newDetails = details.map(detail => ({
        ...detail,
        import_order_id: orderId
      }));
      await ImportOrderDetail.insertMany(newDetails);

      return await ImportOrderDetail.find({ import_order_id: orderId });
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

      // Delete order details first
      await ImportOrderDetail.deleteMany({ import_order_id: orderId });
      
      // Delete order
      await ImportOrder.findByIdAndDelete(orderId);

      return { message: 'Import order deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(orderId, status, approvedBy = null) {
    try {
      const order = await ImportOrder.findById(orderId);
      if (!order) {
        throw new Error('Import order not found');
      }

      const updateData = { status };
      if (approvedBy) {
        updateData.approved_by = approvedBy;
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
}

module.exports = new ImportOrderService(); 