const mongoose = require('mongoose');
const InventoryCheckOrder = require('../models/InventoryCheckOrder');
const User = require('../models/User');
const { INVENTORY_CHECK_ORDER_STATUSES } = require('../utils/constants');

const inventoryCheckOrderService = {
  // Get all inventory check orders with pagination and filters
  async getAllInventoryCheckOrders({
    page = 1,
    limit = 10,
    status,
    startDate,
    endDate,
    warehouse_manager_id,
    sortBy,
    sortDirection,
    search,
    searchBy,
  }) {
    try {
      const query = {};

      // Filter by status
      if (status && Object.values(INVENTORY_CHECK_ORDER_STATUSES).includes(status)) {
        query.status = status;
      }

      // Filter by warehouse manager
      if (warehouse_manager_id && mongoose.Types.ObjectId.isValid(warehouse_manager_id)) {
        query.warehouse_manager_id = warehouse_manager_id;
      }

      // Search by created_by
      if (search && searchBy === 'created_by') {
        query['created_by'] = { $regex: search, $options: 'i' };
      }

      // Filter by date range
      if (startDate || endDate) {
        query.inventory_check_date = {};

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          query.inventory_check_date.$gte = start;
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.inventory_check_date.$lte = end;
        }
      }

      const skip = (page - 1) * limit;

      // Get inventory check orders with pagination
      const [inventoryCheckOrders, total] = await Promise.all([
        InventoryCheckOrder.find(query)
          .populate('warehouse_manager_id', 'name email role')
          .populate('created_by', 'name email role')
          .sort(
            sortBy && sortDirection
              ? { [sortBy]: sortDirection === 'asc' ? 1 : -1 }
              : { inventory_check_date: -1 },
          )
          .skip(skip)
          .limit(limit)
          .lean(),
        InventoryCheckOrder.countDocuments(query),
      ]);

      return {
        success: true,
        data: {
          inventoryCheckOrders,
          pagination: {
            current_page: page,
            per_page: limit,
            total,
            total_pages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      console.error('Get all inventory check orders service error:', error);
      return {
        success: false,
        message: 'Lỗi server khi lấy danh sách phiếu kiểm kê',
      };
    }
  },

  // Create new inventory check order
  async createInventoryCheckOrder(inventoryCheckOrderData) {
    try {
      const newInventoryCheckOrder = new InventoryCheckOrder(inventoryCheckOrderData);
      const savedInventoryCheckOrder = await newInventoryCheckOrder.save();

      const populatedInventoryCheckOrder = await InventoryCheckOrder.findById(
        savedInventoryCheckOrder._id,
      )
        .populate('warehouse_manager_id', 'email role')
        .populate('created_by', 'email role');

      return {
        success: true,
        data: populatedInventoryCheckOrder,
        message: 'Tạo phiếu kiểm kê thành công',
      };
    } catch (error) {
      console.error('Create inventory check order service error:', error);

      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err) => err.message);
        return {
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: validationErrors,
        };
      }

      return {
        success: false,
        message: 'Lỗi server khi tạo phiếu kiểm kê',
      };
    }
  },

  // Get inventory check order by ID
  async getInventoryCheckOrderById(id) {
    try {
      const inventoryCheckOrder = await InventoryCheckOrder.findById(id)
        .populate('warehouse_manager_id', 'email role')
        .populate('created_by', 'email role');

      if (!inventoryCheckOrder) {
        return {
          success: false,
          message: 'Không tìm thấy phiếu kiểm kê',
        };
      }

      return {
        success: true,
        data: inventoryCheckOrder,
      };
    } catch (error) {
      console.error('Get inventory check order by ID service error:', error);
      return {
        success: false,
        message: 'Lỗi server khi lấy thông tin phiếu kiểm kê',
      };
    }
  },

  // Update inventory check order
  async updateInventoryCheckOrder(id, updateData) {
    try {
      // First, get the current inventory check order to check its status
      const currentOrder = await InventoryCheckOrder.findById(id);

      if (!currentOrder) {
        return {
          success: false,
          message: 'Không tìm thấy phiếu kiểm kê',
        };
      }

      // If trying to update status to cancelled, check if current status allows it
      if (updateData.status === INVENTORY_CHECK_ORDER_STATUSES.CANCELLED) {
        if (
          currentOrder.status !== INVENTORY_CHECK_ORDER_STATUSES.PENDING &&
          currentOrder.status !== INVENTORY_CHECK_ORDER_STATUSES.PROCESSING
        ) {
          return {
            success: false,
            message: 'Chỉ có thể hủy phiếu kiểm kê khi trạng thái là pending hoặc processing',
          };
        }
      }

      const inventoryCheckOrder = await InventoryCheckOrder.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      })
        .populate('warehouse_manager_id', 'email role')
        .populate('created_by', 'email role');

      return {
        success: true,
        data: inventoryCheckOrder,
        message: 'Cập nhật phiếu kiểm kê thành công',
      };
    } catch (error) {
      console.error('Update inventory check order service error:', error);

      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err) => err.message);
        return {
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: validationErrors,
        };
      }

      return {
        success: false,
        message: 'Lỗi server khi cập nhật phiếu kiểm kê',
      };
    }
  },

  // Create inspections for inventory check order
  async createInspections(orderId) {
    try {
      // Get the inventory check order
      const order = await InventoryCheckOrder.findById(orderId);
      if (!order) {
        return {
          success: false,
          message: 'Không tìm thấy phiếu kiểm kê',
        };
      }

      // Check if order status is pending
      if (order.status !== INVENTORY_CHECK_ORDER_STATUSES.PENDING) {
        return {
          success: false,
          message: 'Chỉ có thể tạo phiếu kiểm kê con khi trạng thái là pending',
        };
      }

      // TODO: Implement logic to create inspection slips based on order items and locations
      // For now, return a placeholder response
      return {
        success: true,
        data: {
          createdCount: 0,
          message: 'Chức năng tạo phiếu kiểm kê con đang được phát triển'
        },
        message: 'Chức năng tạo phiếu kiểm kê con đang được phát triển'
      };
    } catch (error) {
      console.error('Create inspections service error:', error);
      return {
        success: false,
        message: 'Lỗi server khi tạo phiếu kiểm kê con',
      };
    }
  },
};

module.exports = inventoryCheckOrderService;
