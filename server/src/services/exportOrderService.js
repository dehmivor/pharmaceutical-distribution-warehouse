const ExportOrder = require('../models/ExportOrder');
const { EXPORT_ORDER_STATUSES } = require('../utils/constants');
const mongoose = require('mongoose');
const contractService = require('./contractService');

// Định nghĩa populateOptions thống nhất
const populateOptions = [
  {
    path: 'contract_id',
    populate: [
      { path: 'partner_id', select: 'name' },
      { path: 'items.medicine_id', select: 'medicine_name license_code' },
    ],
  },
  { path: 'warehouse_manager_id', select: 'name email role' },
  { path: 'created_by', select: 'name email role' },
  { path: 'approval_by', select: 'name email role' },
  { path: 'details.medicine_id', select: 'medicine_name license_code unit_of_measure' }, // Thêm unit_of_measure
  { path: 'details.actual_item.package_id', select: 'package_code' }, // Thêm nếu cần
  { path: 'details.actual_item.created_by', select: 'email' }, // Thêm nếu cần
];

/**
 * Representative tạo export order (luôn trạng thái draft)
 * @param {Object} data - Dữ liệu export order
 * @param {String} userId - ID người tạo
 * @returns {Promise<ExportOrder>}
 */
async function createExportOrder(data, userId) {
  const { created_by, details, ...rest } = data;
  let finalDetails = details || [];

  // Nếu không có details hoặc details rỗng, cần contract_id để auto-generate
  if (!Array.isArray(finalDetails) || finalDetails.length === 0) {
    if (!rest.contract_id) {
      throw new Error('Contract ID is required to auto-generate export order details');
    }
    
    // Kiểm tra contract phải là Retailer contract
    const Contract = require('../models/Contract');
    const contract = await Contract.findById(rest.contract_id);
    if (!contract) {
      throw new Error('Contract not found');
    }
    if (contract.partner_type !== 'Retailer') {
      throw new Error('Export orders can only be created for retailer contracts');
    }
    
    const contractState = await contractService.getCurrentContractState(rest.contract_id);
    finalDetails = (contractState.current_items || []).map((item) => ({
      medicine_id: item.medicine_id._id || item.medicine_id,
      expected_quantity: item.quantity || 0,
      unit_price: item.unit_price || 0,
    }));
  }

  const order = new ExportOrder({
    ...rest,
    details: finalDetails,
    status: EXPORT_ORDER_STATUSES.DRAFT,
    created_by: userId,
  });
  
  const savedOrder = await order.save();

  return await ExportOrder.findById(savedOrder._id).populate(populateOptions);
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
  await order.save();

  return await ExportOrder.findById(orderId).populate(populateOptions);
}

/**
 * RM từ chối export order (chuyển trạng thái sang rejected)
 * @param {String} orderId - ID export order
 * @param {String} rmId - ID RM từ chối
 * @returns {Promise<ExportOrder>}
 */
async function rejectExportOrder(orderId, rmId) {
  const order = await ExportOrder.findById(orderId);
  if (!order) throw new Error('Export order not found');
  if (order.status !== 'draft') {
    throw new Error('Only draft orders can be rejected');
  }
  order.status = EXPORT_ORDER_STATUSES.REJECTED;
  order.approval_by = rmId;
  await order.save();

  return await ExportOrder.findById(orderId).populate(populateOptions);
}


/**
 * Get export order by ID with full population
 * @param {String} orderId - ID export order
 * @returns {Promise<ExportOrder>}
 */
async function getExportOrderById(orderId) {
  const order = await ExportOrder.findById(orderId).populate(populateOptions);
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

  if (params.status) {
    query.status = params.status;
  }

  if (params.warehouse_manager_id != null) {
    if (params.warehouse_manager_id === '0') {
      query.warehouse_manager_id = { $exists: false };
    } else if (mongoose.Types.ObjectId.isValid(params.warehouse_manager_id)) {
      query.warehouse_manager_id = new mongoose.Types.ObjectId(params.warehouse_manager_id);
    }
  }

  if (params.created_by) {
    query.created_by = params.created_by;
  }

  const [orders, total] = await Promise.all([
    ExportOrder.find(query)
      .populate(populateOptions)
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

/**
 * Get export orders with filters
 * @param {Object} params - Filter parameters
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @returns {Promise<Object>}
 */
async function getExportOrdersFilter(params = {}, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const query = {};

  if (params.status) {
    query.status = params.status;
  }

  if (params.warehouse_manager_id != null) {
    if (params.warehouse_manager_id === '0') {
      query.warehouse_manager_id = { $exists: false };
    } else if (mongoose.Types.ObjectId.isValid(params.warehouse_manager_id)) {
      query.warehouse_manager_id = new mongoose.Types.ObjectId(params.warehouse_manager_id);
    }
  }

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

  const [orders, total] = await Promise.all([
    ExportOrder.find(query)
      .populate(populateOptions)
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

/**
 * Xóa export order
 * @param {String} orderId
 * @param {Object} user
 * @returns {Promise<Object>}
 */
async function deleteExportOrder(orderId, user) {
  const order = await ExportOrder.findById(orderId);
  if (!order) throw new Error('Export order not found');
  if (![EXPORT_ORDER_STATUSES.DRAFT, EXPORT_ORDER_STATUSES.CANCELLED].includes(order.status)) {
    throw new Error('Can only delete draft or cancelled export orders');
  }
  if (user.role === 'representative' && order.created_by.toString() !== user.userId) {
    throw new Error('You can only delete your own export orders');
  }
  await ExportOrder.findByIdAndDelete(orderId);
  return { success: true, message: 'Export order deleted successfully' };
}

/**
 * Cập nhật export order
 * @param {String} orderId
 * @param {Object} updateData
 * @param {Object} user
 * @returns {Promise<ExportOrder>}
 */
async function updateExportOrder(orderId, updateData, user) {
  const order = await ExportOrder.findById(orderId);
  if (!order) throw new Error('Export order not found');
  
  // Representative chỉ có thể sửa draft hoặc rejected orders
  if (!['draft', 'rejected'].includes(order.status)) {
    throw new Error('Can only update draft or rejected export orders');
  }
  
  // Representative chỉ có thể sửa orders của mình
  if (user.role !== 'representative' || order.created_by.toString() !== user.userId) {
    throw new Error('You can only update your own export orders');
  }
  
  // Set currentUser context cho validation middleware
  order.currentUser = user;
  
  // Nếu đang sửa rejected order, tự động chuyển về draft
  if (order.status === 'rejected') {
    order.status = EXPORT_ORDER_STATUSES.DRAFT;
    order.approval_by = undefined;
  }
  
  let details = updateData.details;
  if (!Array.isArray(details) || details.length === 0) {
    if (!updateData.contract_id && !order.contract_id) {
      throw new Error('Contract ID is required to auto-generate export order details');
    }
    const contractId = updateData.contract_id || order.contract_id;
    
    // Kiểm tra contract phải là Retailer contract
    const Contract = require('../models/Contract');
    const contract = await Contract.findById(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }
    if (contract.partner_type !== 'Retailer') {
      throw new Error('Export orders can only be created for retailer contracts');
    }
    
    const contractState = await contractService.getCurrentContractState(contractId);
    details = (contractState.current_items || []).map((item) => ({
      medicine_id: item.medicine_id._id || item.medicine_id,
      expected_quantity: item.quantity || 0,
      unit_price: item.unit_price || 0,
    }));
  }
  
  if (updateData.contract_id) {
    // Kiểm tra contract mới cũng phải là Retailer contract
    const Contract = require('../models/Contract');
    const newContract = await Contract.findById(updateData.contract_id);
    if (!newContract) {
      throw new Error('New contract not found');
    }
    if (newContract.partner_type !== 'Retailer') {
      throw new Error('Export orders can only be created for retailer contracts');
    }
    order.contract_id = updateData.contract_id;
  }
  
  order.details = details;
  await order.save();
  return await ExportOrder.findById(orderId).populate(populateOptions);
}

/**
 * Get export order detail
 * @param {String} id
 * @returns {Promise<ExportOrder>}
 */
async function getExportOrderDetail(id) {
  const exportOrder = await ExportOrder.findById(id).populate(populateOptions);
  if (!exportOrder) {
    throw new Error('Export order not found');
  }
  return exportOrder;
}

/**
 * Thêm export inspection
 * @param {String} orderId
 * @param {String} detailId
 * @param {Object} inspectionData
 * @returns {Promise<Object>}
 */
async function addExportInspection(orderId, detailId, inspectionData) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error('Invalid orderId');
  }
  if (!mongoose.Types.ObjectId.isValid(detailId)) {
    throw new Error('Invalid detailId');
  }

  const order = await ExportOrder.findById(orderId);
  if (!order) {
    const err = new Error('Export order not found');
    err.status = 404;
    throw err;
  }

  const detail = order.details.id(detailId);
  if (!detail) {
    const err = new Error('Export order detail not found');
    err.status = 404;
    throw err;
  }

  if (!mongoose.Types.ObjectId.isValid(inspectionData.package_id)) {
    throw new Error('Invalid package_id');
  }

  detail.actual_item.push({
    package_id: inspectionData.package_id,
    quantity: inspectionData.quantity,
    created_by: inspectionData.created_by,
  });

  await order.save();
  return detail.actual_item[detail.actual_item.length - 1];
}

/**
 * Kiểm tra tồn kho cho export order
 * @param {Array} details - Chi tiết export order
 * @returns {Promise<Object>} - Kết quả kiểm tra tồn kho
 */
async function checkStockAvailability(details) {
  try {
    const Batch = require('../models/Batch');
    const Package = require('../models/Package');
    const Medicine = require('../models/Medicine');

    const stockCheckResults = [];

    for (const detail of details) {
      const { medicine_id, expected_quantity } = detail;

      // Lấy thông tin thuốc
      const medicine = await Medicine.findById(medicine_id).select('medicine_name license_code');
      if (!medicine) {
        stockCheckResults.push({
          medicine_id,
          medicine_name: 'Unknown',
          license_code: 'Unknown',
          expected_quantity,
          available_quantity: 0,
          is_available: false,
          error: 'Medicine not found'
        });
        continue;
      }

      // Tìm tất cả batch của thuốc này
      const batches = await Batch.find({ medicine_id }).lean();
      
      if (batches.length === 0) {
        stockCheckResults.push({
          medicine_id,
          medicine_name: medicine.medicine_name,
          license_code: medicine.license_code,
          expected_quantity,
          available_quantity: 0,
          is_available: false,
          error: 'No batches found for this medicine'
        });
        continue;
      }

      const batchIds = batches.map(batch => batch._id);

      // Tính tổng số lượng có sẵn từ tất cả package
      const packages = await Package.find({ 
        batch_id: { $in: batchIds }
      }).lean();

      const availableQuantity = packages.reduce((sum, pkg) => sum + (pkg.quantity || 0), 0);

      stockCheckResults.push({
        medicine_id,
        medicine_name: medicine.medicine_name,
        license_code: medicine.license_code,
        expected_quantity,
        available_quantity: availableQuantity,
        is_available: availableQuantity >= expected_quantity,
        error: availableQuantity >= expected_quantity ? null : 'Insufficient stock'
      });
    }

    const allAvailable = stockCheckResults.every(result => result.is_available);
    const insufficientItems = stockCheckResults.filter(result => !result.is_available);

    return {
      success: true,
      data: {
        all_available: allAvailable,
        stock_check_results: stockCheckResults,
        insufficient_items: insufficientItems,
        total_items: stockCheckResults.length,
        available_items: stockCheckResults.filter(result => result.is_available).length
      }
    };
  } catch (error) {
    console.error('Error checking stock availability:', error);
    return {
      success: false,
      message: 'Error checking stock availability',
      error: error.message
    };
  }
}

async function assignWarehouseManager(orderId, warehouseManagerId) {
  const order = await ExportOrder.findById(orderId);
  if (!order) throw new Error('Export order not found');
  order.warehouse_manager_id = warehouseManagerId;
  await order.save();

  return await ExportOrder.findById(orderId).populate(populateOptions);
}

/**
 * Get export order by ID with full population
 * @param {String} orderId - ID export order
 * @returns {Promise<ExportOrder>}
 */
async function getExportOrderById(orderId) {
  const order = await ExportOrder.findById(orderId).populate(populateOptions);
  if (!order) {
    throw new Error('Export order not found');
  }
  return order;
}

module.exports = {
  createExportOrder,
  getExportOrdersFilter,
  approveExportOrder,
  rejectExportOrder, // Thêm function reject
  getExportOrderById,
  getExportOrders,
  deleteExportOrder,
  updateExportOrder,
  getExportOrderDetail,
  addExportInspection,
  checkStockAvailability,
  assignWarehouseManager // Thêm function mới
};