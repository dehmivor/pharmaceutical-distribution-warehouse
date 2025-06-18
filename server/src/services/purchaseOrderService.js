const PurchaseOrder = require('../models/PurchaseOrder');
const { PURCHASE_ORDER_STATUSES } = require('../utils/constants');
const Contract = require('../models/SupplierContract');

class PurchaseOrderService {
  // Create new purchase order
  async createPurchaseOrder(orderData) {
    try {
      // Lấy contract
      const contract = await Contract.findById(orderData.contract_id);
      if (!contract) throw new Error('Contract not found');
      if (!contract.items || contract.items.length === 0) throw new Error('No medicines in contract');
      // Lấy danh sách medicine_id từ contract
      const medicineIds = contract.items.map(item => item.medicine_id);
      // Tạo purchase order mới
      const newOrder = new PurchaseOrder({
        contract_id: orderData.contract_id,
        created_by: orderData.created_by,
        order_list: medicineIds,
        status: PURCHASE_ORDER_STATUSES.PENDING,
      });
      const savedOrder = await newOrder.save();
      return savedOrder;
    } catch (error) {
      throw error;
    }
  }

  // Get all purchase orders with pagination and filters
  async getPurchaseOrders(query = {}, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const orders = await PurchaseOrder.find(query)
        .populate('contract_id')
        .populate('created_by')
        .populate('approved_by')
        .populate('order_list')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await PurchaseOrder.countDocuments(query);

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

  // Get purchase order by ID
  async getPurchaseOrderById(orderId) {
    try {
      const order = await PurchaseOrder.findById(orderId)
        .populate('contract_id')
        .populate('created_by')
        .populate('approved_by')
        .populate('order_list');

      if (!order) {
        throw new Error('Purchase order not found');
      }

      return order;
    } catch (error) {
      throw error;
    }
  }

  // Update purchase order
  async updatePurchaseOrder(orderId, updateData, userRole) {
    try {
      const order = await PurchaseOrder.findById(orderId);
      if (!order) {
        throw new Error('Purchase order not found');
      }

      // Chỉ cho phép supervisor cập nhật status
      if (updateData.status && userRole !== 'supervisor') {
        throw new Error('Unauthorized to update order status');
      }

      // Kiểm tra trạng thái hiện tại
      if (order.status === PURCHASE_ORDER_STATUSES.CANCELLED) {
        throw new Error('Cannot update cancelled order');
      }

      const updatedOrder = await PurchaseOrder.findByIdAndUpdate(
        orderId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      return updatedOrder;
    } catch (error) {
      throw error;
    }
  }

  // Delete purchase order
  async deletePurchaseOrder(orderId, userRole) {
    try {
      const order = await PurchaseOrder.findById(orderId);
      if (!order) {
        throw new Error('Purchase order not found');
      }

      // Chỉ cho phép representative xóa đơn hàng
      if (userRole !== 'representative') {
        throw new Error('Unauthorized to delete order');
      }

      // Chỉ cho phép xóa đơn hàng ở trạng thái pending
      if (order.status !== PURCHASE_ORDER_STATUSES.PENDING) {
        throw new Error('Can only delete pending orders');
      }

      await PurchaseOrder.findByIdAndDelete(orderId);
      return { message: 'Purchase order deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(orderId, status, userRole) {
    try {
      const order = await PurchaseOrder.findById(orderId);
      if (!order) {
        throw new Error('Purchase order not found');
      }

      // Chỉ cho phép supervisor cập nhật status
      if (userRole !== 'supervisor') {
        throw new Error('Unauthorized to update order status');
      }

      // Kiểm tra trạng thái hiện tại
      if (order.status === PURCHASE_ORDER_STATUSES.CANCELLED) {
        throw new Error('Cannot update cancelled order');
      }

      const updatedOrder = await PurchaseOrder.findByIdAndUpdate(
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

module.exports = new PurchaseOrderService(); 