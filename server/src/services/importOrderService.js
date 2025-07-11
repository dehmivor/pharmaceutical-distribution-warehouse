const ImportOrder = require('../models/ImportOrder');
const { IMPORT_ORDER_STATUSES } = require('../utils/constants');

// Create new import order
const createImportOrder = async (orderData, orderDetails) => {
  try {
    const newOrderData = {
      ...orderData,
      details: orderDetails,
    };

    const newOrder = new ImportOrder(newOrderData);
    const savedOrder = await newOrder.save();

    return await ImportOrder.findById(savedOrder._id)
      .populate({ path: 'supplier_contract_id', populate: { path: 'supplier_id', select: 'name' } })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code');
  } catch (error) {
    throw error;
  }
};

// Get all import orders with pagination and filters
const getImportOrders = async (query = {}, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    
    // Xử lý search query
    let searchQuery = { ...query };
    if (query.warehouse_manager_id) {
      searchQuery.warehouse_manager_id = { $exists: true, $ne: null, $eq: query.warehouse_manager_id };
    }
    if (query.$or) {
      // Nếu có search, cần populate trước khi search
      const orders = await ImportOrder.find({})
        .populate({ path: 'supplier_contract_id', populate: { path: 'supplier_id', select: 'name' } })
        .populate('warehouse_manager_id', 'name email role')
        .populate('created_by', 'name email role')
        .populate('approval_by', 'name email role')
        .populate('details.medicine_id', 'medicine_name license_code');

      // Filter theo search
      const filteredOrders = orders.filter(order => {
        return query.$or.some(condition => {
          if (condition._id) {
            return order._id.toString().toLowerCase().includes(condition._id.$regex.toLowerCase());
          }
          if (condition['supplier_contract_id.contract_code']) {
            return order.supplier_contract_id?.contract_code?.toLowerCase().includes(condition['supplier_contract_id.contract_code'].$regex.toLowerCase());
          }
          return false;
        });
      });

      // Apply other filters
      const finalFilteredOrders = filteredOrders.filter(order => {
        if (query.status && order.status !== query.status) return false;
        if (
          query.warehouse_manager_id &&
          getManagerId(order.warehouse_manager_id) !== query.warehouse_manager_id.toString()
        ) return false;
        return true;
      });

      const total = finalFilteredOrders.length;
      const paginatedOrders = finalFilteredOrders.slice(skip, skip + limit);

      return {
        orders: paginatedOrders,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    // Nếu không có search, sử dụng query bình thường
    const orders = await ImportOrder.find(searchQuery)
      .populate({ path: 'supplier_contract_id', populate: { path: 'supplier_id', select: 'name' } })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await ImportOrder.countDocuments(searchQuery);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw error;
  }
};

// Get import order by ID with details
const getImportOrderById = async (orderId) => {
  try {
    const order = await ImportOrder.findById(orderId)
      .populate({ path: 'supplier_contract_id', populate: { path: 'supplier_id', select: 'name' } })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code');

    if (!order) {
      throw new Error('Import order not found');
    }

    return order;
  } catch (error) {
    throw error;
  }
};

// Update import order
const updateImportOrder = async (orderId, updateData) => {
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
      { new: true, runValidators: true },
    )
      .populate({ path: 'supplier_contract_id', populate: { path: 'supplier_id', select: 'name' } })
      .populate('warehouse_manager_id', 'name email role')
      .populate('created_by', 'name email role')
      .populate('approval_by', 'name email role')
      .populate('details.medicine_id', 'medicine_name license_code');

    return updatedOrder;
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
      .populate({ path: 'supplier_contract_id', populate: { path: 'supplier_id', select: 'name' } })
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
      .populate({ path: 'supplier_contract_id', populate: { path: 'supplier_id', select: 'name' } })
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
      .populate({ path: 'supplier_contract_id', populate: { path: 'supplier_id', select: 'name' } })
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
      .populate({ path: 'supplier_contract_id', populate: { path: 'supplier_id', select: 'name' } })
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
      .populate({ path: 'supplier_contract_id', populate: { path: 'supplier_id', select: 'name' } })
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
const getImportOrdersByWarehouseManager = async (warehouseManagerId, query = {}, page = 1, limit = 10) => {
  try {
    const searchQuery = { ...query, warehouse_manager_id: warehouseManagerId };
    return await getImportOrders(searchQuery, page, limit);
  } catch (error) {
    throw error;
  }
};

// Get import orders by supplier contract
const getImportOrdersBySupplierContract = async (supplierContractId) => {
  try {
    const orders = await ImportOrder.find({ supplier_contract_id: supplierContractId })
      .populate({ path: 'supplier_contract_id', populate: { path: 'supplier_id', select: 'name' } })
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
  const order = await ImportOrder.findById(orderId);
  if (!order) throw new Error('Import order not found');
  order.warehouse_manager_id = warehouseManagerId;
  await order.save();
  return await ImportOrder.findById(orderId)
    .populate({ path: 'supplier_contract_id', populate: { path: 'supplier_id', select: 'name' } })
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
  getImportOrdersBySupplierContract,
  getValidStatusTransitions,
  getAllStatusTransitions,
  assignWarehouseManager,
};
