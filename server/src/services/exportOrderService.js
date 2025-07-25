const ExportOrder = require('../models/ExportOrder');
const { EXPORT_ORDER_STATUSES } = require('../utils/constants');
const mongoose = require('mongoose');
const contractService = require('./contractService');

/**
 * Representative tạo export order (luôn trạng thái draft)
 * @param {Object} data - Dữ liệu export order
 * @param {String} userId - ID người tạo
 * @returns {Promise<ExportOrder>}
 */
async function createExportOrder(data, userId) {
  // Loại bỏ created_by nếu có trong data
  const { created_by, details, ...rest } = data;
  let finalDetails = details;

  // Nếu không truyền details hoặc details rỗng, tự động lấy từ contract
  if (!Array.isArray(details) || details.length === 0) {
    if (!rest.contract_id) {
      throw new Error('Contract ID is required to auto-generate export order details');
    }
    // Lấy danh sách thuốc hiện tại từ contract (bao gồm phụ lục)
    const contractState = await contractService.getCurrentContractState(rest.contract_id);
    // Map sang export order details
    finalDetails = (contractState.current_items || []).map(item => ({
      medicine_id: item.medicine_id._id || item.medicine_id,
      expected_quantity: item.quantity || 0, // Nếu contract không có quantity thì để 0
      unit_price: item.unit_price || 0
    }));
  }

  const order = new ExportOrder({
    ...rest,
    details: finalDetails,
    status: EXPORT_ORDER_STATUSES.DRAFT,
    created_by: userId,
  });
  const savedOrder = await order.save();

  return await ExportOrder.findById(savedOrder._id)
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
}

/**
 * RM duyệt export order (chỉ chuyển trạng thái sang approved)
 * @param {String} orderId - ID export order
 * @param {String} rmId - ID RM duyệt
 * @returns {Promise<ExportOrder>}
 */
async function approveExportOrder(orderId, rmId) {
  const order = await ExportOrder.findById(orderId);
  if (!order) throw new Error('Export order not found');
  if (order.status !== 'draft') {
    throw new Error('Only draft orders can be approved');
  }
  order.status = EXPORT_ORDER_STATUSES.APPROVED;
  order.approval_by = rmId;
  // Không gán order.warehouse_manager_id ở đây!
  await order.save();

  return await ExportOrder.findById(orderId)
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
}

/**
 * Gán warehouse manager cho export order
 * @param {String} orderId - ID export order
 * @param {String} warehouseManagerId - ID warehouse manager
 * @returns {Promise<ExportOrder>}
 */
async function assignWarehouseManager(orderId, warehouseManagerId) {
  const order = await ExportOrder.findById(orderId);
  if (!order) throw new Error('Export order not found');
  order.warehouse_manager_id = warehouseManagerId;
  await order.save();

  return await ExportOrder.findById(orderId)
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
}

/**
 * Get export order by ID with full population
 * @param {String} orderId - ID export order
 * @returns {Promise<ExportOrder>}
 */
async function getExportOrderById(orderId) {
  const order = await ExportOrder.findById(orderId)
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

  if (!order) {
    throw new Error('Export order not found');
  }

  return order;
}

/**
 * Get all export orders with pagination and filters
 * @param {Object} params - Filter parameters
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @returns {Promise<Object>}
 */
async function getExportOrders(params = {}, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const query = {};

  // Filter by status
  if (params.status) {
    query.status = params.status;
  }

  // Filter by warehouse_manager_id
  if (params.warehouse_manager_id != null) {
    if (params.warehouse_manager_id === '0') {
      query.warehouse_manager_id = { $exists: false };
    } else if (mongoose.Types.ObjectId.isValid(params.warehouse_manager_id)) {
      query.warehouse_manager_id = new mongoose.Types.ObjectId(params.warehouse_manager_id);
    }
  }

  // Filter by created_by
  if (params.created_by) {
    query.created_by = params.created_by;
  }

  const [orders, total] = await Promise.all([
    ExportOrder.find(query)
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
      .populate('details.medicine_id', 'medicine_name license_code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),

    ExportOrder.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    orders,
    pagination: { total, page, limit, totalPages },
  };
}



const getExportOrdersFilter = async (params = {}, page = 1, limit = 10) => {
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

  // 3) Filter by createdAt date
  if (params.createdAt) {
    const start = new Date(params.createdAt);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query.createdAt = { $gte: start, $lt: end };
  }

  if (params.created_by) {
    if (mongoose.Types.ObjectId.isValid(params.created_by)) {
      query.created_by = new mongoose.Types.ObjectId(params.created_by);
    }
  }

  // 4) Execute query + count in parallel
  const [orders, total] = await Promise.all([
    ExportOrder.find(query)
      .populate({
        path: 'contract_id',
        populate: [
          // adjust these paths as needed for your Contract schema
          { path: 'partner_id', select: 'name' },
          { path: 'items.medicine_id', select: 'medicine_name license_code' },
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
    ExportOrder.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    orders,
    pagination: { total, page, limit, totalPages },
  };
};


async function deleteExportOrder(orderId, user) {
  const order = await ExportOrder.findById(orderId);
  if (!order) throw new Error('Export order not found');
  // Chỉ cho phép xóa khi trạng thái là draft hoặc cancelled
  if (![EXPORT_ORDER_STATUSES.DRAFT, EXPORT_ORDER_STATUSES.CANCELLED].includes(order.status)) {
    throw new Error('Can only delete draft or cancelled export orders');
  }
  // Chỉ cho phép representative xóa đơn do mình tạo, RM xóa tất cả
  if (user.role === 'representative' && order.created_by.toString() !== user.userId) {
    throw new Error('You can only delete your own export orders');
  }
  // RM hoặc supervisor có thể xóa bất kỳ đơn nào
  await ExportOrder.findByIdAndDelete(orderId);
  return { success: true, message: 'Export order deleted successfully' };
}

/**
 * Cập nhật export order (chỉ cho phép RP update đơn draft do mình tạo)
 * @param {String} orderId
 * @param {Object} updateData
 * @param {Object} user
 * @returns {Promise<ExportOrder>}
 */
async function updateExportOrder(orderId, updateData, user) {
  const order = await ExportOrder.findById(orderId);
  if (!order) throw new Error('Export order not found');
  if (order.status !== EXPORT_ORDER_STATUSES.DRAFT) {
    throw new Error('Can only update draft export orders');
  }
  if (user.role !== 'representative' || order.created_by.toString() !== user.userId) {
    throw new Error('You can only update your own draft export orders');
  }
  // Nếu update details rỗng, tự động lấy lại từ contract
  let details = updateData.details;
  if (!Array.isArray(details) || details.length === 0) {
    if (!updateData.contract_id && !order.contract_id) {
      throw new Error('Contract ID is required to auto-generate export order details');
    }
    const contractId = updateData.contract_id || order.contract_id;
    const contractState = await contractService.getCurrentContractState(contractId);
    details = (contractState.current_items || []).map(item => ({
      medicine_id: item.medicine_id._id || item.medicine_id,
      expected_quantity: item.quantity || 0,
      unit_price: item.unit_price || 0
    }));
  }
  // Cập nhật các trường cho phép
  if (updateData.contract_id) order.contract_id = updateData.contract_id;
  order.details = details;
  await order.save();
  return await ExportOrder.findById(orderId)
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
}


const getExportOrderDetail = async (id) => {
  const exportOrder = await ExportOrder.findById(id)
    .populate('contract_id', 'contract_code')
    .populate('warehouse_manager_id', 'email')
    .populate('created_by', 'email')
    .populate('approval_by', 'email')
    .populate('details.medicine_id', 'medicine_name license_code')
    .populate('details.actual_item');

  return exportOrder;
}

async function addExportInspection(orderId, detailId, inspectionData) {
  // 1) Validate IDs
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error('Invalid orderId');
  }
  if (!mongoose.Types.ObjectId.isValid(detailId)) {
    throw new Error('Invalid detailId');
  }

  // 2) Load the order
  const order = await ExportOrder.findById(orderId);
  if (!order) {
    const err = new Error('Export order not found');
    err.status = 404;
    throw err;
  }

  // 3) Find the detail subdoc
  const detail = order.details.id(detailId);
  if (!detail) {
    const err = new Error('Export order detail not found');
    err.status = 404;
    throw err;
  }

  // 4) Validate inspectionData.package_id
  if (!mongoose.Types.ObjectId.isValid(inspectionData.package_id)) {
    throw new Error('Invalid package_id');
  }

  // 5) Push new inspection
  detail.actual_item.push({
    package_id: inspectionData.package_id,
    quantity: inspectionData.quantity,
    created_by: inspectionData.created_by,
  });

  // 6) Save the parent doc
  await order.save();

  // 7) Return the newly added inspection (last in array)
  return detail.actual_item[detail.actual_item.length - 1];
}



module.exports = {
  createExportOrder,
  getExportOrdersFilter,
  approveExportOrder,
  assignWarehouseManager,
  getExportOrderById,
  getExportOrders,
  deleteExportOrder,
  updateExportOrder,
  getExportOrderDetail,
  addExportInspection
}; 