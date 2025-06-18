const ImportOrder = require('../models/ImportOrder');
const { IMPORT_ORDER_STATUSES } = require('../utils/constants');

// Create new import order
const createImportOrder = async (orderData, importContent) => {
  try {
    const newOrderData = {
      ...orderData,
      import_content: importContent,
    };

    const newOrder = new ImportOrder(newOrderData);
    const savedOrder = await newOrder.save();

    return savedOrder;
  } catch (error) {
    throw error;
  }
};

// Get all import orders with pagination and filters
const getImportOrders = async (query = {}, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    const orders = await ImportOrder.find(query)
      .populate('manager_id', 'name email role')
      .populate('purchase_order_id')
      .populate('import_content.batch_id', 'name medicine_code')
      .populate('import_content.created_by', 'name email')
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
      .populate('manager_id', 'name email role')
      .populate('purchase_order_id')
      .populate('import_content.batch_id', 'name medicine_code batch_number expiry_date')
      .populate('import_content.created_by', 'name email');

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
      .populate('manager_id', 'name email role')
      .populate('purchase_order_id')
      .populate('import_content.batch_id', 'name medicine_code')
      .populate('import_content.created_by', 'name email');

    return updatedOrder;
  } catch (error) {
    throw error;
  }
};

// Update import order content
const updateImportOrderContent = async (orderId, importContent) => {
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
      { $set: { import_content: importContent } },
      { new: true, runValidators: true },
    )
      .populate('manager_id', 'name email role')
      .populate('purchase_order_id')
      .populate('import_content.batch_id', 'name medicine_code')
      .populate('import_content.created_by', 'name email');

    return updatedOrder;
  } catch (error) {
    throw error;
  }
};

// Add item to import content
const addImportContentItem = async (orderId, contentItem) => {
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
      { $push: { import_content: contentItem } },
      { new: true, runValidators: true },
    )
      .populate('manager_id', 'name email role')
      .populate('purchase_order_id')
      .populate('import_content.batch_id', 'name medicine_code')
      .populate('import_content.created_by', 'name email');

    return updatedOrder;
  } catch (error) {
    throw error;
  }
};

// Update specific import content item
const updateImportContentItem = async (orderId, contentItemId, updateData) => {
  try {
    const order = await ImportOrder.findById(orderId);
    if (!order) {
      throw new Error('Import order not found');
    }

    // Check if order can be updated
    if (order.status === IMPORT_ORDER_STATUSES.COMPLETED) {
      throw new Error('Cannot update completed order');
    }

    const updatedOrder = await ImportOrder.findOneAndUpdate(
      { _id: orderId, 'import_content._id': contentItemId },
      { $set: { 'import_content.$': updateData } },
      { new: true, runValidators: true },
    )
      .populate('manager_id', 'name email role')
      .populate('purchase_order_id')
      .populate('import_content.batch_id', 'name medicine_code')
      .populate('import_content.created_by', 'name email');

    return updatedOrder;
  } catch (error) {
    throw error;
  }
};

// Remove item from import content
const removeImportContentItem = async (orderId, contentItemId) => {
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
      { $pull: { import_content: { _id: contentItemId } } },
      { new: true, runValidators: true },
    )
      .populate('manager_id', 'name email role')
      .populate('purchase_order_id')
      .populate('import_content.batch_id', 'name medicine_code')
      .populate('import_content.created_by', 'name email');

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
    if (order.status !== IMPORT_ORDER_STATUSES.PENDING) {
      throw new Error('Can only delete pending orders');
    }

    await ImportOrder.findByIdAndDelete(orderId);

    return { message: 'Import order deleted successfully' };
  } catch (error) {
    throw error;
  }
};

// Update order status
const updateOrderStatus = async (orderId, status, managerId = null) => {
  try {
    const order = await ImportOrder.findById(orderId);
    if (!order) {
      throw new Error('Import order not found');
    }

    // Validate status transition
    const validTransitions = {
      [IMPORT_ORDER_STATUSES.PENDING]: [
        IMPORT_ORDER_STATUSES.IN_PROGRESS,
        IMPORT_ORDER_STATUSES.CANCELLED,
      ],
      [IMPORT_ORDER_STATUSES.IN_PROGRESS]: [
        IMPORT_ORDER_STATUSES.COMPLETED,
        IMPORT_ORDER_STATUSES.CANCELLED,
      ],
      [IMPORT_ORDER_STATUSES.COMPLETED]: [],
      [IMPORT_ORDER_STATUSES.CANCELLED]: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      throw new Error(`Cannot change status from ${order.status} to ${status}`);
    }

    const updateData = { status };
    if (managerId) {
      updateData.manager_id = managerId;
    }

    const updatedOrder = await ImportOrder.findByIdAndUpdate(
      orderId,
      { $set: updateData },
      { new: true, runValidators: true },
    )
      .populate('manager_id', 'name email role')
      .populate('purchase_order_id')
      .populate('import_content.batch_id', 'name medicine_code')
      .populate('import_content.created_by', 'name email');

    return updatedOrder;
  } catch (error) {
    throw error;
  }
};

// Get import orders by manager
const getImportOrdersByManager = async (managerId, query = {}, page = 1, limit = 10) => {
  try {
    const searchQuery = { ...query, manager_id: managerId };
    return await getImportOrders(searchQuery, page, limit);
  } catch (error) {
    throw error;
  }
};

// Get import orders by purchase order
const getImportOrdersByPurchaseOrder = async (purchaseOrderId) => {
  try {
    const orders = await ImportOrder.find({ purchase_order_id: purchaseOrderId })
      .populate('manager_id', 'name email role')
      .populate('purchase_order_id')
      .populate('import_content.batch_id', 'name medicine_code')
      .populate('import_content.created_by', 'name email')
      .sort({ createdAt: -1 });

    return orders;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createImportOrder,
  getImportOrders,
  getImportOrderById,
  updateImportOrder,
  updateImportOrderContent,
  addImportContentItem,
  updateImportContentItem,
  removeImportContentItem,
  deleteImportOrder,
  updateOrderStatus,
  getImportOrdersByManager,
  getImportOrdersByPurchaseOrder,
};
