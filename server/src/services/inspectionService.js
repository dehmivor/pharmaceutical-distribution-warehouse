const ImportInspection = require('../models/ImportInspection');
const ImportOrder = require('../models/ImportOrder');
const Batch = require('../models/Batch');

const createMultipleInspections = async (listInspectionData) => {
  if (
    listInspectionData &&
    !Array.isArray(listInspectionData) &&
    Array.isArray(listInspectionData.inspections)
  ) {
    listInspectionData = listInspectionData.inspections;
  }

  if (listInspectionData.length === 0) {
    const error = new Error('Input data must be a non-empty array');
    error.statusCode = 400;
    throw error;
  }

  // Lấy import_order_id từ đoạn data, giả định tất cả cùng một import_order_id
  // Hoặc lấy tất cả import_order_id nếu đa order, thay đổi phù hợp yêu cầu
  const importOrderIds = [...new Set(listInspectionData.map((d) => d.import_order_id.toString()))];

  for (const importOrderId of importOrderIds) {
    // Kiểm tra import order tồn tại
    const importOrder = await ImportOrder.findById(importOrderId);
    if (!importOrder) {
      const error = new Error(`Import order ${importOrderId} not found`);
      error.statusCode = 404;
      throw error;
    }

    // FIX: Kiểm tra logic nghiệp vụ - chỉ ngăn chặn tạo inspection trùng lặp
    // trong cùng một lần gọi API, không ngăn chặn tạo mới sau khi xóa
    const newInspections = listInspectionData.filter(
      (d) => d.import_order_id.toString() === importOrderId,
    );

    // Kiểm tra duplicate trong danh sách mới (trong cùng một request)
    const medicineIdsInRequest = newInspections.map((d) => d.medicine_id.toString());
    const duplicateInRequest = medicineIdsInRequest.filter(
      (id, index) => medicineIdsInRequest.indexOf(id) !== index,
    );

    if (duplicateInRequest.length > 0) {
      const uniqueDuplicates = [...new Set(duplicateInRequest)];
      const medicineListStr = uniqueDuplicates.join(', ');
      const error = new Error(`Duplicate medicine(s) in request: ${medicineListStr}`);
      error.statusCode = 400;
      throw error;
    }

    // Kiểm tra rejected không vượt actual trong những inspection mới
    for (const data of newInspections) {
      if (data.rejected_quantity > data.actual_quantity) {
        const error = new Error('Rejected quantity cannot exceed actual quantity');
        error.statusCode = 400;
        throw error;
      }
    }
  }

  // Tạo nhiều bản ghi cùng lúc
  const inspections = await ImportInspection.insertMany(listInspectionData);

  // Optional: lấy chi tiết từng phiếu sau khi tạo
  return inspections;
};

// FIX: Thêm function tạo inspection đơn lẻ (không qua validation duplicate)
const createSingleInspection = async (inspectionData) => {
  // Kiểm tra dữ liệu đầu vào
  if (!inspectionData.import_order_id || !inspectionData.medicine_id) {
    const error = new Error('Import order ID and Medicine ID are required');
    error.statusCode = 400;
    throw error;
  }

  // Kiểm tra import order tồn tại
  const importOrder = await ImportOrder.findById(inspectionData.import_order_id);
  if (!importOrder) {
    const error = new Error(`Import order ${inspectionData.import_order_id} not found`);
    error.statusCode = 404;
    throw error;
  }

  // Kiểm tra rejected không vượt actual
  if (inspectionData.rejected_quantity > inspectionData.actual_quantity) {
    const error = new Error('Rejected quantity cannot exceed actual quantity');
    error.statusCode = 400;
    throw error;
  }

  // Tạo inspection mới
  const inspection = new ImportInspection(inspectionData);
  await inspection.save();

  return inspection;
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

const deleteInspection = async (id) => {
  const inspection = await ImportInspection.findById(id).populate('import_order_id');

  if (!inspection) {
    const error = new Error('Import inspection not found');
    error.statusCode = 404;
    throw error;
  }
  await ImportInspection.findByIdAndDelete(id);

  return { message: 'Inspection deleted successfully' };
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

const getInspectionByImportOrderId = async (importOrderId) => {
  // Kiểm tra import order có tồn tại không
  const importOrder = await ImportOrder.findById(importOrderId);
  if (!importOrder) {
    const error = new Error('Import order not found');
    error.statusCode = 404;
    throw error;
  }

  const inspections = await ImportInspection.find({ import_order_id: importOrderId })
    .populate('import_order_id')
    .populate('created_by', 'name email')
    .populate({
      path: 'medicine_id',
      select: '_id unit_of_measure medicine_name license_code',
    })
    .sort({ createdAt: -1 });

  // Trả về mảng rỗng nếu không có inspections thay vì throw error
  return inspections || [];
};

module.exports = {
  createMultipleInspections,
  getInspections,
  getInspectionById,
  updateInspection,
  deleteInspection,
  getInspectionStatistics,
  getAvailableQuantityForImport,
  getInspectionsForApprove,
  getInspectionByImportOrderId,
  createSingleInspection,
};
