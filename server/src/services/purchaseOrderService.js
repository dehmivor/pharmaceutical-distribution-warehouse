// services/purchaseOrderService.js
const PurchaseOrder = require('../models/PurchaseOrder');
const { PURCHASE_ORDER_STATUSES, CONTRACT_STATUSES } = require('../utils/constants');
const mongoose = require('mongoose');
const Contract = require('../models/SupplierContract');

const PurchaseOrderService = {
  // Create new purchase order
  async createPurchaseOrder(orderData) {
    try {
      const { contract_id, order_list } = orderData;

      // Validate required fields
      if (!order_list || !Array.isArray(order_list) || order_list.length === 0) {
        throw new Error('Order list is required and must not be empty');
      }

      // Validate ObjectIds
      if (contract_id && !mongoose.Types.ObjectId.isValid(contract_id)) {
        throw new Error('Invalid contract ID');
      }

      // Kiểm tra contract phải ở trạng thái active
      if (contract_id) {
        const contract = await Contract.findById(contract_id);
        if (!contract || contract.status !== CONTRACT_STATUSES.ACTIVE) {
          throw new Error('Contract must be active to create purchase order');
        }
      }

      const purchaseOrderData = {
        contract_id: contract_id || null,
        created_by: orderData.created_by,
        order_list,
        status: PURCHASE_ORDER_STATUSES.PENDING,
      };

      const purchaseOrder = new PurchaseOrder(purchaseOrderData);
      await purchaseOrder.save();

      // Populate và return
      return await this.getPurchaseOrderById(purchaseOrder._id);
    } catch (error) {
      throw new Error(`Error creating purchase order: ${error.message}`);
    }
  },

  // Get all purchase orders with pagination and filters
  async getPurchaseOrders(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        created_by,
        contract_id,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      // Xây dựng filter
      const filter = {};
      if (status && status !== 'all') {
        filter.status = status;
      }
      if (created_by) {
        filter.created_by = created_by;
      }
      if (contract_id) {
        filter.contract_id = contract_id;
      }

      // Tính toán pagination
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Thực hiện query với populate mở rộng
      const [purchaseOrders, total] = await Promise.all([
        PurchaseOrder.find(filter)
          // Populate contract với thông tin supplier và retailer
          .populate({
            path: 'contract_id',
            select:
              'contract_code type partner_type supplier_id retailer_id start_date end_date status items',
            populate: [
              {
                path: 'supplier_id',
                model: 'User',
                select: 'email role status',
              },
              {
                path: 'retailer_id',
                model: 'User',
                select: 'email role status',
              },
              {
                path: 'created_by',
                model: 'User',
                select: 'email role',
              },
            ],
          })
          // Populate thông tin người tạo
          .populate({
            path: 'created_by',
            model: 'User',
            select: 'email role status',
          })
          // Populate thông tin người phê duyệt
          .populate({
            path: 'approved_by',
            model: 'User',
            select: 'email role status',
          })
          // Populate danh sách order (nếu có reference đến Medicine hoặc Product)
          .populate({
            path: 'order_list',
            select: 'name code price unit category description',
          })
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        PurchaseOrder.countDocuments(filter),
      ]);

      // Tính toán thống kê
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        data: purchaseOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage,
        },
      };
    } catch (error) {
      throw new Error(`Error fetching purchase orders: ${error.message}`);
    }
  },

  // Get purchase order by ID
  async getPurchaseOrderById(orderId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new Error('Invalid purchase order ID');
      }

      const purchaseOrder = await PurchaseOrder.findById(orderId)
        .populate('contract_id')
        .populate('created_by', 'name email')
        .populate('approved_by', 'name email')
        .populate('order_list')
        .lean();

      if (!purchaseOrder) {
        throw new Error('Purchase order not found');
      }

      return purchaseOrder;
    } catch (error) {
      throw new Error(`Error fetching purchase order: ${error.message}`);
    }
  },

  // Update purchase order
  async updatePurchaseOrder(orderId, updateData, userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new Error('Invalid purchase order ID');
      }

      const purchaseOrder = await PurchaseOrder.findById(orderId);
      if (!purchaseOrder) {
        throw new Error('Purchase order not found');
      }

      // Kiểm tra quyền chỉnh sửa
      if (purchaseOrder.status !== PURCHASE_ORDER_STATUSES.PENDING) {
        throw new Error('Cannot update purchase order that is not in pending status');
      }

      // Chỉ cho phép creator hoặc admin chỉnh sửa
      if (purchaseOrder.created_by.toString() !== userId.toString()) {
        throw new Error('You do not have permission to update this purchase order');
      }

      const allowedFields = ['contract_id', 'order_list'];
      const updateFields = {};

      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          updateFields[field] = updateData[field];
        }
      });

      const updatedPurchaseOrder = await PurchaseOrder.findByIdAndUpdate(orderId, updateFields, {
        new: true,
        runValidators: true,
      });

      return await this.getPurchaseOrderById(updatedPurchaseOrder._id);
    } catch (error) {
      throw new Error(`Error updating purchase order: ${error.message}`);
    }
  },

  // Delete purchase order
  async deletePurchaseOrder(orderId, userRole) {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new Error('Invalid purchase order ID');
      }

      const purchaseOrder = await PurchaseOrder.findById(orderId);
      if (!purchaseOrder) {
        throw new Error('Purchase order not found');
      }

      // Chỉ cho phép representative xóa đơn hàng
      if (userRole !== 'representative') {
        throw new Error('Unauthorized to delete order');
      }

      // Chỉ cho phép xóa đơn hàng ở trạng thái pending
      if (purchaseOrder.status !== PURCHASE_ORDER_STATUSES.PENDING) {
        throw new Error('Can only delete pending orders');
      }

      await PurchaseOrder.findByIdAndDelete(orderId);
      return { message: 'Purchase order deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting purchase order: ${error.message}`);
    }
  },

  // Update order status
  async updateOrderStatus(orderId, status, userRole) {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new Error('Invalid purchase order ID');
      }

      if (!Object.values(PURCHASE_ORDER_STATUSES).includes(status)) {
        throw new Error('Invalid status');
      }

      const purchaseOrder = await PurchaseOrder.findById(orderId);
      if (!purchaseOrder) {
        throw new Error('Purchase order not found');
      }

      // Chỉ cho phép supervisor cập nhật status
      if (userRole !== 'supervisor') {
        throw new Error('Unauthorized to update order status');
      }

      const updateData = { status };

      // Nếu status là approved, set approved_by
      if (status === PURCHASE_ORDER_STATUSES.APPROVED) {
        updateData.approved_by = purchaseOrder.created_by;
      }

      const updatedPurchaseOrder = await PurchaseOrder.findByIdAndUpdate(orderId, updateData, {
        new: true,
        runValidators: true,
      });

      return await this.getPurchaseOrderById(updatedPurchaseOrder._id);
    } catch (error) {
      throw new Error(`Error updating order status: ${error.message}`);
    }
  },

  // Submit for approval
  async submitForApproval(id, userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid purchase order ID');
      }

      const purchaseOrder = await PurchaseOrder.findById(id);
      if (!purchaseOrder) {
        throw new Error('Purchase order not found');
      }

      if (purchaseOrder.status !== PURCHASE_ORDER_STATUSES.PENDING) {
        throw new Error('Only pending orders can be submitted for approval');
      }

      const updatedPurchaseOrder = await PurchaseOrder.findByIdAndUpdate(
        id,
        { status: PURCHASE_ORDER_STATUSES.SUBMITTED },
        { new: true, runValidators: true },
      );

      return await this.getPurchaseOrderById(updatedPurchaseOrder._id);
    } catch (error) {
      throw new Error(`Error submitting for approval: ${error.message}`);
    }
  },

  // Approve purchase order
  async approve(id, notes = '', userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid purchase order ID');
      }

      const purchaseOrder = await PurchaseOrder.findById(id);
      if (!purchaseOrder) {
        throw new Error('Purchase order not found');
      }

      if (purchaseOrder.status !== PURCHASE_ORDER_STATUSES.SUBMITTED) {
        throw new Error('Only submitted orders can be approved');
      }

      const updatedPurchaseOrder = await PurchaseOrder.findByIdAndUpdate(
        id,
        {
          status: PURCHASE_ORDER_STATUSES.APPROVED,
          approved_by: userId,
          notes: notes || purchaseOrder.notes,
        },
        { new: true, runValidators: true },
      );

      return await this.getPurchaseOrderById(updatedPurchaseOrder._id);
    } catch (error) {
      throw new Error(`Error approving purchase order: ${error.message}`);
    }
  },

  // Reject purchase order
  async reject(id, notes = '', userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid purchase order ID');
      }

      const purchaseOrder = await PurchaseOrder.findById(id);
      if (!purchaseOrder) {
        throw new Error('Purchase order not found');
      }

      if (purchaseOrder.status !== PURCHASE_ORDER_STATUSES.SUBMITTED) {
        throw new Error('Only submitted orders can be rejected');
      }

      const updatedPurchaseOrder = await PurchaseOrder.findByIdAndUpdate(
        id,
        {
          status: PURCHASE_ORDER_STATUSES.REJECTED,
          notes: notes || purchaseOrder.notes,
        },
        { new: true, runValidators: true },
      );

      return await this.getPurchaseOrderById(updatedPurchaseOrder._id);
    } catch (error) {
      throw new Error(`Error rejecting purchase order: ${error.message}`);
    }
  },

  // Search purchase orders
  async searchPurchaseOrders(keyword, options = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;

      const filter = {
        $or: [
          { order_number: { $regex: keyword, $options: 'i' } },
          { status: { $regex: keyword, $options: 'i' } },
        ],
      };

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [purchaseOrders, total] = await Promise.all([
        PurchaseOrder.find(filter)
          .populate('contract_id', 'contract_number supplier_id')
          .populate('created_by', 'name email')
          .populate('approved_by', 'name email')
          .populate('order_list', 'name code')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        PurchaseOrder.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        data: purchaseOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage,
        },
      };
    } catch (error) {
      throw new Error(`Error searching purchase orders: ${error.message}`);
    }
  },

  // Get statistics
  async getStatistics(userId = null) {
    try {
      const filter = userId ? { created_by: userId } : {};

      const stats = await PurchaseOrder.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      const total = await PurchaseOrder.countDocuments(filter);

      const result = {
        total,
        byStatus: {},
      };

      // Initialize all statuses with 0
      Object.values(PURCHASE_ORDER_STATUSES).forEach((status) => {
        result.byStatus[status] = 0;
      });

      // Fill actual counts
      stats.forEach((stat) => {
        result.byStatus[stat._id] = stat.count;
      });

      return result;
    } catch (error) {
      throw new Error(`Error getting statistics: ${error.message}`);
    }
  },
};

module.exports = PurchaseOrderService;
