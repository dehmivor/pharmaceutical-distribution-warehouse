const ImportOrder = require('../models/ImportOrder');
const { IMPORT_ORDER_STATUSES, USER_ROLES } = require('../utils/constants');
const { User, Notification, SupplierContract, Supplier } = require('../models');
const mongoose = require('mongoose');

// Create new import order
const createImportOrder = async (orderData, orderDetails, userContext = null) => {
  try {
    const newOrderData = {
      ...orderData,
      details: orderDetails,
    };

    const newOrder = new ImportOrder(newOrderData);

    // Truyền user context vào model để validation
    if (userContext) {
      newOrder._userContext = userContext;
    }

    const savedOrder = await newOrder.save();

    return await ImportOrder.findById(savedOrder._id)
      .populate({
        path: 'contract_id',
        populate: [
          { path: 'partner_id', select: 'name' },
          { path: 'items.medicine_id', select: 'medicine_name license_code' }
        ],
      })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code');
  } catch (error) {
    throw error;
  }
};

// Get all import orders with pagination and filters
const getImportOrders = async (params = {}, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const query = {};

  // 1) Filter by status
  if (params.status) {
    query.status = params.status;
  }

  // 2) Filter by warehouse_manager_id
  if (params.warehouse_manager_id != null) {
    if (params.warehouse_manager_id === '0') {
      query.warehouse_manager_id = { $exists: false };
    } else if (mongoose.Types.ObjectId.isValid(params.warehouse_manager_id)) {
      query.warehouse_manager_id = new mongoose.Types.ObjectId(params.warehouse_manager_id);
    }
  }

  // 3) Filter by createdAt day
  if (params.createdAt) {
    const start = new Date(params.createdAt);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query.createdAt = { $gte: start, $lt: end };
  }

  // 4) Query the DB
  const [orders, total] = await Promise.all([
    ImportOrder.find(query)
      .populate({
        path: 'contract_id',
        populate: [
          { path: 'partner_id', select: 'name' },
          { path: 'items.medicine_id', select: 'medicine_name license_code' }
        ],
      })
      .populate('warehouse_manager_id', 'email name role')
      .populate('created_by', 'email name role')
      .populate('approval_by', 'email name role')
      .populate('details.medicine_id', 'medicine_name license_code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),

    ImportOrder.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    orders,
    pagination: { total, page, limit, totalPages },
  };
};

const getImportOrderById = async (orderId) => {
  try {
    const order = await ImportOrder.findById(orderId)
      .populate({
        path: 'contract_id',
        populate: [
          { path: 'partner_id', select: 'name' },
          { path: 'items.medicine_id', select: 'medicine_name license_code' }
        ],
      })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code unit_of_measure');

    if (!order) {
      throw new Error('Import order not found');
    }

    return order;
  } catch (error) {
    throw error;
  }
};
// Update import order
const updateImportOrder = async (orderId, updateData, userContext = null) => {
  try {
    const order = await ImportOrder.findById(orderId);
    if (!order) {
      throw new Error('Import order not found');
    }

    // Check if order can be updated
    if (order.status === IMPORT_ORDER_STATUSES.COMPLETED) {
      throw new Error('Cannot update completed order');
    }

    // Lưu trạng thái gốc để validation
    order._original = { status: order.status };

    // Truyền user context vào model để validation
    if (userContext) {
      order._userContext = userContext;
      // Nếu là representative và order đang rejected, chuyển về draft
      if (
        userContext.role === 'representative' &&
        order.status === IMPORT_ORDER_STATUSES.REJECTED
      ) {
        order.status = IMPORT_ORDER_STATUSES.DRAFT;
      }
    }

    // Cập nhật từng field để trigger validation
    Object.keys(updateData).forEach((key) => {
      order[key] = updateData[key];
    });

    const updatedOrder = await order.save();

    return await ImportOrder.findById(updatedOrder._id)
      .populate({
        path: 'contract_id',
        populate: [
          { path: 'partner_id', select: 'name' },
          { path: 'items.medicine_id', select: 'medicine_name license_code' }
        ],
      })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code');
  } catch (error) {
    throw error;
  }
};

// Update import order details
const updateImportOrderDetails = async (orderId, orderDetails) => {
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
      { $set: { details: orderDetails } },
      { new: true, runValidators: true },
    )
      .populate({
        path: 'contract_id',
        populate: [
          { path: 'partner_id', select: 'name' },
          { path: 'items.medicine_id', select: 'medicine_name license_code' }
        ],
      })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code');

    return updatedOrder;
  } catch (error) {
    throw error;
  }
};

// Add item to import order details
const addImportOrderDetail = async (orderId, detailItem) => {
  try {
    const order = await ImportOrder.findById(orderId);
    if (!order) {
      throw new Error('Import order not found');
    }

    // Check if order can be updated
    if (order.status === IMPORT_ORDER_STATUSES.COMPLETED) {
      throw new Error('Cannot update completed order');
    }

    // Validate required fields for detail item
    if (!detailItem.medicine_id || !detailItem.quantity) {
      throw new Error('medicine_id and quantity are required for import order detail');
    }

    const updatedOrder = await ImportOrder.findByIdAndUpdate(
      orderId,
      { $push: { details: detailItem } },
      { new: true, runValidators: true },
    )
      .populate({
        path: 'contract_id',
        populate: [
          { path: 'partner_id', select: 'name' },
          { path: 'items.medicine_id', select: 'medicine_name license_code' }
        ],
      })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code');

    return updatedOrder;
  } catch (error) {
    throw error;
  }
};

// Update specific import order detail
const updateImportOrderDetail = async (orderId, detailId, updateData) => {
  try {
    const order = await ImportOrder.findById(orderId);
    if (!order) {
      throw new Error('Import order not found');
    }

    // Check if order can be updated
    if (order.status === IMPORT_ORDER_STATUSES.COMPLETED) {
      throw new Error('Cannot update completed order');
    }

    // Validate that the detail item exists
    const detailItem = order.details.id(detailId);
    if (!detailItem) {
      throw new Error('Import order detail not found');
    }

    // Prepare update data with proper field mapping
    const updateFields = {};
    Object.keys(updateData).forEach((key) => {
      updateFields[`details.$.${key}`] = updateData[key];
    });

    const updatedOrder = await ImportOrder.findOneAndUpdate(
      { _id: orderId, 'details._id': detailId },
      { $set: updateFields },
      { new: true, runValidators: true },
    )
      .populate({
        path: 'contract_id',
        populate: [
          { path: 'partner_id', select: 'name' },
          { path: 'items.medicine_id', select: 'medicine_name license_code' }
        ],
      })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code');

    return updatedOrder;
  } catch (error) {
    throw error;
  }
};

// Remove item from import order details
const removeImportOrderDetail = async (orderId, detailId) => {
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
      { $pull: { details: { _id: detailId } } },
      { new: true, runValidators: true },
    )
      .populate({
        path: 'contract_id',
        populate: [
          { path: 'partner_id', select: 'name' },
          { path: 'items.medicine_id', select: 'medicine_name license_code' }
        ],
      })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code');

    return updatedOrder;
  } catch (error) {
    throw error;
  }
};

// Delete import order
const deleteImportOrder = async (orderId) => {
  try {
    const order = await ImportOrder.findById(orderId);
    if (!order) {
      throw new Error('Import order not found');
    }

    // Check if order can be deleted
    if (
      order.status !== IMPORT_ORDER_STATUSES.DRAFT &&
      order.status !== IMPORT_ORDER_STATUSES.CANCELLED
    ) {
      throw new Error('Can only delete draft or cancelled orders');
    }

    await ImportOrder.findByIdAndDelete(orderId);

    return { message: 'Import order deleted successfully' };
  } catch (error) {
    throw error;
  }
};

// Update order status
const updateOrderStatus = async (orderId, status, approvalBy = null, bypassValidation = false) => {
  try {
    const order = await ImportOrder.findById(orderId);
    if (!order) {
      throw new Error('Import order not found');
    }

    // Validate status transition (skip if bypassValidation is true for supervisor)
    if (!bypassValidation) {
      const validTransitions = {
        [IMPORT_ORDER_STATUSES.DRAFT]: [
          IMPORT_ORDER_STATUSES.APPROVED,
          IMPORT_ORDER_STATUSES.REJECTED, // Cho phép chuyển sang rejected
          IMPORT_ORDER_STATUSES.CANCELLED,
        ],
        [IMPORT_ORDER_STATUSES.APPROVED]: [
          IMPORT_ORDER_STATUSES.DRAFT,
          IMPORT_ORDER_STATUSES.DELIVERED,
          IMPORT_ORDER_STATUSES.CANCELLED,
        ],
        [IMPORT_ORDER_STATUSES.DELIVERED]: [
          IMPORT_ORDER_STATUSES.APPROVED,
          IMPORT_ORDER_STATUSES.CHECKED,
          IMPORT_ORDER_STATUSES.CANCELLED,
        ],
        [IMPORT_ORDER_STATUSES.CHECKED]: [
          IMPORT_ORDER_STATUSES.DELIVERED,
          IMPORT_ORDER_STATUSES.ARRANGED,
          IMPORT_ORDER_STATUSES.CANCELLED,
        ],
        [IMPORT_ORDER_STATUSES.ARRANGED]: [
          IMPORT_ORDER_STATUSES.CHECKED,
          IMPORT_ORDER_STATUSES.COMPLETED,
          IMPORT_ORDER_STATUSES.CANCELLED,
        ],
        [IMPORT_ORDER_STATUSES.COMPLETED]: [],
        [IMPORT_ORDER_STATUSES.CANCELLED]: [],
      };

      if (!validTransitions[order.status].includes(status)) {
        throw new Error(`Cannot change status from ${order.status} to ${status}`);
      }
    }

    const updateData = { status };
    if (approvalBy) {
      updateData.approval_by = approvalBy;
    }

    const updatedOrder = await ImportOrder.findByIdAndUpdate(
      orderId,
      { $set: updateData },
      { new: true, runValidators: true },
    )
      .populate({ path: 'contract_id', populate: { path: 'partner_id', select: 'name' } })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code');

    return updatedOrder;
  } catch (error) {
    throw error;
  }
};

// Get import orders by warehouse manager
const getImportOrdersByWarehouseManager = async (
  warehouseManagerId,
  query = {},
  page = 1,
  limit = 10,
) => {
  try {
    const searchQuery = { ...query, warehouse_manager_id: warehouseManagerId };
    return await getImportOrders(searchQuery, page, limit);
  } catch (error) {
    throw error;
  }
};

// Get import orders by contract
const getImportOrdersByContract = async (contractId) => {
  try {
    const orders = await ImportOrder.find({ contract_id: contractId })
      .populate({ path: 'contract_id', populate: { path: 'partner_id', select: 'name' } })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code')
      .sort({ createdAt: -1 });

    return orders;
  } catch (error) {
    throw error;
  }
};

// Get valid status transitions for a given status
const getValidStatusTransitions = (currentStatus) => {
  const validTransitions = {
    [IMPORT_ORDER_STATUSES.DRAFT]: [
      IMPORT_ORDER_STATUSES.APPROVED,
      IMPORT_ORDER_STATUSES.REJECTED, // Cho phép chuyển sang rejected
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.APPROVED]: [
      IMPORT_ORDER_STATUSES.DRAFT,
      IMPORT_ORDER_STATUSES.DELIVERED,
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.DELIVERED]: [
      IMPORT_ORDER_STATUSES.APPROVED,
      IMPORT_ORDER_STATUSES.CHECKED,
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.CHECKED]: [
      IMPORT_ORDER_STATUSES.DELIVERED,
      IMPORT_ORDER_STATUSES.ARRANGED,
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.ARRANGED]: [
      IMPORT_ORDER_STATUSES.CHECKED,
      IMPORT_ORDER_STATUSES.COMPLETED,
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.COMPLETED]: [],
    [IMPORT_ORDER_STATUSES.CANCELLED]: [],
  };

  return validTransitions[currentStatus] || [];
};

// Get all status transitions mapping
const getAllStatusTransitions = () => {
  return {
    [IMPORT_ORDER_STATUSES.DRAFT]: [
      IMPORT_ORDER_STATUSES.APPROVED,
      IMPORT_ORDER_STATUSES.REJECTED, // Cho phép chuyển sang rejected
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.APPROVED]: [
      IMPORT_ORDER_STATUSES.DRAFT,
      IMPORT_ORDER_STATUSES.DELIVERED,
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.DELIVERED]: [
      IMPORT_ORDER_STATUSES.APPROVED,
      IMPORT_ORDER_STATUSES.CHECKED,
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.CHECKED]: [
      IMPORT_ORDER_STATUSES.DELIVERED,
      IMPORT_ORDER_STATUSES.ARRANGED,
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.ARRANGED]: [
      IMPORT_ORDER_STATUSES.CHECKED,
      IMPORT_ORDER_STATUSES.COMPLETED,
      IMPORT_ORDER_STATUSES.CANCELLED,
    ],
    [IMPORT_ORDER_STATUSES.COMPLETED]: [],
    [IMPORT_ORDER_STATUSES.CANCELLED]: [],
  };
};

const assignWarehouseManager = async (orderId, warehouseManagerId) => {
  // 1. Check order exists
  const order = await ImportOrder.findById(orderId);
  if (!order) throw new Error('Import order not found');

  // 2. Check order status is delivered
  if (order.status !== IMPORT_ORDER_STATUSES.DELIVERED) {
    throw new Error('Order must be in delivered status to assign a warehouse manager');
  }

  // 3. Check if already assigned
  if (order.warehouse_manager_id) {
    throw new Error('Warehouse manager has already been assigned to this order');
  }

  // 4. Validate warehouseManagerId is a valid user with correct role
  const user = await User.findById(warehouseManagerId);
  if (!user) {
    throw new Error('Warehouse manager user not found');
  }
  if (user.role !== USER_ROLES.WAREHOUSEMANAGER) {
    throw new Error('Assigned user is not a warehouse manager');
  }
  if (user.status !== 'active') {
    throw new Error('Warehouse manager user is not active');
  }

  order.warehouse_manager_id = warehouseManagerId;
  await order.save();

  // Gửi notification cho tất cả warehouse
  const warehouses = await User.find({ role: USER_ROLES.WAREHOUSE, status: 'active' });
  const notifications = warehouses.map((wh) => ({
    recipient_id: wh._id,
    sender_id: user._id, // warehouse manager vừa được gán
    title: 'Phiếu nhập đã được giao cho warehouse manager',
    message: `Phiếu nhập ${order._id} đã được giao cho warehouse manager ${user.email}.`,
    type: 'system',
    status: 'unread',
    createdAt: new Date(),
  }));
  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  return await ImportOrder.findById(orderId)
    .populate({
      path: 'contract_id',
      populate: [
        { path: 'partner_id', select: 'name' },
        { path: 'items.medicine_id', select: 'medicine_name license_code' }
      ],
    })
    .populate('warehouse_manager_id', 'name email role')
    .populate('created_by', 'name email role')
    .populate('approval_by', 'name email role')
    .populate('details.medicine_id', 'medicine_name license_code');
};

// Helper function to safely get manager id as string
function getManagerId(warehouse_manager_id) {
  if (!warehouse_manager_id) return null;
  if (typeof warehouse_manager_id === 'string' || typeof warehouse_manager_id === 'number') {
    return warehouse_manager_id.toString();
  }
  if (typeof warehouse_manager_id === 'object') {
    if (warehouse_manager_id._id) return warehouse_manager_id._id.toString();
    if (typeof warehouse_manager_id.toString === 'function') return warehouse_manager_id.toString();
  }
  return null;
}

module.exports = {
  createImportOrder,
  getImportOrders,
  getImportOrderById,
  updateImportOrder,
  updateImportOrderDetails,
  addImportOrderDetail,
  updateImportOrderDetail,
  removeImportOrderDetail,
  deleteImportOrder,
  updateOrderStatus,
  getImportOrdersByWarehouseManager,
  getImportOrdersByContract,
  getValidStatusTransitions,
  getAllStatusTransitions,
  assignWarehouseManager,
};
