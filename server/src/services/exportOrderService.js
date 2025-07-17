const ExportOrder = require('../models/ExportOrder');
const { EXPORT_ORDER_STATUSES } = require('../utils/constants');

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
  return await order.save();
}

/**
 * RM duyệt và gán warehouse manager cho export order
 * @param {String} orderId - ID export order
 * @param {String} rmId - ID RM duyệt
 * @param {String} warehouseManagerId - ID warehouse manager được gán
 * @returns {Promise<ExportOrder>}
 */
async function approveExportOrder(orderId, rmId, warehouseManagerId) {
  const order = await ExportOrder.findById(orderId);
  if (!order) throw new Error('Export order not found');
  if (order.status !== 'draft') {
    throw new Error('Only draft orders can be approved and assigned a warehouse manager');
  }
  order.status = EXPORT_ORDER_STATUSES.APPROVED;
  order.approval_by = rmId;
  order.warehouse_manager_id = warehouseManagerId;
  return await order.save();
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
  return await order.save();
}

module.exports = {
  createExportOrder,
  approveExportOrder,
  assignWarehouseManager,
}; 