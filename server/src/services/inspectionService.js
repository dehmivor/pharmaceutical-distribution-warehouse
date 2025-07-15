const ImportInspection = require('../models/ImportInspection');
const ImportOrder = require('../models/ImportOrder');
const Batch = require('../models/Batch');

// Tạo phiếu kiểm tra mới
const createInspection = async (inspectionData) => {
  // Kiểm tra import order tồn tại
  const importOrder = await ImportOrder.findById(inspectionData.import_order_id);
  if (!importOrder) {
    const error = new Error('Import order not found');
    error.statusCode = 404;
    throw error;
  }

  // Kiểm tra logic nghiệp vụ
  if (inspectionData.rejected_quantity > inspectionData.actual_quantity) {
    const error = new Error('Rejected quantity cannot exceed actual quantity');
    error.statusCode = 400;
    throw error;
  }

  const inspection = new ImportInspection(inspectionData);
  await inspection.save();

  return await getInspectionById(inspection._id);
};

// Lấy danh sách phiếu kiểm tra với phân trang
const getInspections = async ({ page, limit, filters }) => {
  const skip = (page - 1) * limit;

  const inspections = await ImportInspection.find(filters)
    .populate('import_order_id', 'order_code status')
    .populate('created_by', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await ImportInspection.countDocuments(filters);
  const totalPages = Math.ceil(total / limit);

  return {
    inspections,
    pagination: {
      current_page: page,
      total_pages: totalPages,
      total_items: total,
      items_per_page: limit,
      has_next: page < totalPages,
      has_prev: page > 1,
    },
  };
};

const getInspectionsForApprove = async ({ page, limit, filters, populateOptions }) => {
  const skip = (page - 1) * limit;

  const inspections = await ImportInspection.find(filters)
    .skip(skip)
    .limit(limit)
    .populate(populateOptions)
    .lean()
    .exec();

  const total = await ImportInspection.countDocuments(filters);

  return {
    data: inspections,
    pagination: {
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      itemsPerPage: limit,
    },
  };
};

// Lấy chi tiết một phiếu kiểm tra
const getInspectionById = async (id) => {
  const inspection = await ImportInspection.findById(id)
    .populate('import_order_id')
    .populate('created_by', 'name email');

  if (!inspection) {
    const error = new Error('Import inspection not found');
    error.statusCode = 404;
    throw error;
  }

  return inspection;
};

// Cập nhật phiếu kiểm tra
const updateInspection = async (id, updateData) => {
  const inspection = await ImportInspection.findById(id);
  if (!inspection) {
    const error = new Error('Import inspection not found');
    error.statusCode = 404;
    throw error;
  }

  // Kiểm tra logic nghiệp vụ khi cập nhật
  const actualQuantity = updateData.actual_quantity || inspection.actual_quantity;
  const rejectedQuantity = updateData.rejected_quantity || inspection.rejected_quantity;

  if (rejectedQuantity > actualQuantity) {
    const error = new Error('Rejected quantity cannot exceed actual quantity');
    error.statusCode = 400;
    throw error;
  }

  Object.assign(inspection, updateData);
  inspection.updatedAt = new Date();
  await inspection.save();

  return await getInspectionById(id);
};

// Xóa phiếu kiểm tra
const deleteInspection = async (id) => {
  const inspection = await ImportInspection.findById(id);
  if (!inspection) {
    const error = new Error('Import inspection not found');
    error.statusCode = 404;
    throw error;
  }

  await ImportInspection.findByIdAndDelete(id);
};

// Thống kê kiểm tra theo import order
const getInspectionStatistics = async (importOrderId) => {
  const inspections = await ImportInspection.find({ import_order_id: importOrderId });

  if (inspections.length === 0) {
    return {
      total_inspections: 0,
      total_actual_quantity: 0,
      total_rejected_quantity: 0,
      acceptance_rate: 0,
    };
  }

  const totalActualQuantity = inspections.reduce(
    (sum, inspection) => sum + inspection.actual_quantity,
    0,
  );

  const totalRejectedQuantity = inspections.reduce(
    (sum, inspection) => sum + inspection.rejected_quantity,
    0,
  );

  const acceptanceRate =
    totalActualQuantity > 0
      ? (((totalActualQuantity - totalRejectedQuantity) / totalActualQuantity) * 100).toFixed(2)
      : 0;

  return {
    total_inspections: inspections.length,
    total_actual_quantity: totalActualQuantity,
    total_rejected_quantity: totalRejectedQuantity,
    total_accepted_quantity: totalActualQuantity - totalRejectedQuantity,
    acceptance_rate: parseFloat(acceptanceRate),
    inspections: inspections,
  };
};

// Kiểm tra số lượng còn lại có thể nhập
const getAvailableQuantityForImport = async (importOrderId) => {
  const inspections = await ImportInspection.find({ import_order_id: importOrderId });

  return inspections.reduce((total, inspection) => {
    return total + (inspection.actual_quantity - inspection.rejected_quantity);
  }, 0);
};

module.exports = {
  createInspection,
  getInspections,
  getInspectionById,
  updateInspection,
  deleteInspection,
  getInspectionStatistics,
  getAvailableQuantityForImport,
  getInspectionsForApprove,
};
