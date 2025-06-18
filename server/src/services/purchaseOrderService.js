// services/purchaseOrderService.js
const PurchaseOrder = require('../models/PurchaseOrder');
const { PURCHASE_ORDER_STATUSES, CONTRACT_STATUSES } = require('../utils/constants');
const mongoose = require('mongoose');
const Contract = require('../models/SupplierContract');

// Lấy danh sách purchase orders với pagination và filter
const getPurchaseOrders = async (options = {}) => {
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

    // Thực hiện query với populate
    const [purchaseOrders, total] = await Promise.all([
      PurchaseOrder.find(filter)
        .populate('contract_id', 'contract_number supplier_id terms')
        .populate('created_by', 'name email')
        .populate('approved_by', 'name email')
        .populate('order_list', 'name code price unit')
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
};

// Lấy purchase order theo ID
const getPurchaseOrderById = async (id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid purchase order ID');
    }

    const purchaseOrder = await PurchaseOrder.findById(id)
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
};

// Tạo purchase order mới
const createPurchaseOrder = async (data, userId) => {
  try {
    const { contract_id, order_list } = data;

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
      created_by: userId,
      order_list,
      status: PURCHASE_ORDER_STATUSES.PENDING,
    };

    const purchaseOrder = new PurchaseOrder(purchaseOrderData);
    await purchaseOrder.save();

    // Populate và return
    return await getPurchaseOrderById(purchaseOrder._id);
  } catch (error) {
    throw new Error(`Error creating purchase order: ${error.message}`);
  }
};

// Cập nhật purchase order
const updatePurchaseOrder = async (id, data, userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid purchase order ID');
    }

    const purchaseOrder = await PurchaseOrder.findById(id);
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
    const updateData = {};

    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    const updatedPurchaseOrder = await PurchaseOrder.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return await getPurchaseOrderById(updatedPurchaseOrder._id);
  } catch (error) {
    throw new Error(`Error updating purchase order: ${error.message}`);
  }
};

// Cập nhật trạng thái
const updateStatus = async (id, status, notes = '', userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid purchase order ID');
    }

    if (!Object.values(PURCHASE_ORDER_STATUSES).includes(status)) {
      throw new Error('Invalid status');
    }

    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    const updateData = { status };

    // Nếu status là approved, set approved_by
    if (status === PURCHASE_ORDER_STATUSES.APPROVED) {
      updateData.approved_by = userId;
    }

    const updatedPurchaseOrder = await PurchaseOrder.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return await getPurchaseOrderById(updatedPurchaseOrder._id);
  } catch (error) {
    throw new Error(`Error updating status: ${error.message}`);
  }
};

// Gửi để duyệt
const submitForApproval = async (id, userId) => {
  return await updateStatus(
    id,
    PURCHASE_ORDER_STATUSES.PENDING_APPROVAL,
    'Submitted for approval',
    userId,
  );
};

// Duyệt purchase order
const approve = async (id, notes = '', userId) => {
  return await updateStatus(id, PURCHASE_ORDER_STATUSES.APPROVED, notes, userId);
};

// Từ chối purchase order
const reject = async (id, notes = '', userId) => {
  return await updateStatus(id, PURCHASE_ORDER_STATUSES.REJECTED, notes, userId);
};

// Xóa purchase order
const deletePurchaseOrder = async (id, userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid purchase order ID');
    }

    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    // Chỉ cho phép xóa nếu status là pending
    if (purchaseOrder.status !== PURCHASE_ORDER_STATUSES.PENDING) {
      throw new Error('Cannot delete purchase order that is not in pending status');
    }

    // Kiểm tra quyền xóa
    if (purchaseOrder.created_by.toString() !== userId.toString()) {
      throw new Error('You do not have permission to delete this purchase order');
    }

    await PurchaseOrder.findByIdAndDelete(id);
    return { message: 'Purchase order deleted successfully' };
  } catch (error) {
    throw new Error(`Error deleting purchase order: ${error.message}`);
  }
};

// Tìm kiếm purchase orders
const searchPurchaseOrders = async (keyword, options = {}) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Tạo regex pattern cho tìm kiếm
    const searchRegex = new RegExp(keyword, 'i');

    // Tìm kiếm trong nhiều trường
    const filter = {
      $or: [
        { status: searchRegex },
        // Có thể thêm các trường khác để search
      ],
    };

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

    return {
      data: purchaseOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    throw new Error(`Error searching purchase orders: ${error.message}`);
  }
};

// Lấy thống kê
const getStatistics = async (userId = null) => {
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
};

const PurchaseOrderService = {
  // Create new purchase order
  async createPurchaseOrder(orderData) {
    try {
      // Lấy contract
      const contract = await Contract.findById(orderData.contract_id);
      if (!contract) throw new Error('Contract not found');
      if (!contract.items || contract.items.length === 0) throw new Error('No medicines in contract');
      // Kiểm tra contract phải ở trạng thái active
      if (contract.status !== CONTRACT_STATUSES.ACTIVE) throw new Error('Contract must be active to create purchase order');
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
  },

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
  },

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
  },

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
  },

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
  },

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
  },
};

module.exports = PurchaseOrderService; 