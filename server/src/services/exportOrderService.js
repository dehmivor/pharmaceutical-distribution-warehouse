const ExportOrder = require('../models/ExportOrder');
const { EXPORT_ORDER_STATUSES } = require('../utils/constants');
const mongoose = require('mongoose');

/**
 * Representative tạo export order (luôn trạng thái draft)
 * @param {Object} data - Dữ liệu export order
 * @param {String} userId - ID người tạo
 * @returns {Promise<ExportOrder>}
 */
async function createExportOrder(data, userId) {
  // Loại bỏ created_by nếu có trong data
  const { created_by, ...rest } = data;
  const order = new ExportOrder({
    ...rest,
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

module.exports = {
  createExportOrder,
  approveExportOrder,
  assignWarehouseManager,
  getExportOrderById,
  getExportOrders,
}; 