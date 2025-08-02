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

    // Lấy toàn bộ các medicine_id đã có inspection trong importOrder này
    const existingInspections = await ImportInspection.find({ import_order_id: importOrderId });
    const existingMedicineIds = existingInspections.map((ins) => ins.medicine_id.toString());

    // Lọc những inspection data trong listInspectionData thuộc importOrder này
    const newInspections = listInspectionData.filter(
      (d) => d.import_order_id.toString() === importOrderId,
    );

    // Xác định những thuốc đã có inspect trong danh sách mới
    const duplicateMedicines = newInspections.filter((d) =>
      existingMedicineIds.includes(d.medicine_id.toString()),
    );

    if (duplicateMedicines.length > 0) {
      const medicineListStr = duplicateMedicines.map((d) => d.medicine_id.toString()).join(', ');
      const error = new Error(`Inspections already exist for medicine(s): ${medicineListStr}`);
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

const getInspectionByImportOrderId = async (importOrderId) => {
  const inspections = await ImportInspection.find({ import_order_id: importOrderId })
    .populate('import_order_id')
    .populate('created_by', 'name email')
    .populate({
      path: 'medicine_id',
      select: '_id unit_of_measure medicine_name',
    })
    .sort({ createdAt: -1 });

  if (!inspections || inspections.length === 0) {
    const error = new Error('No inspections found for this import order');
    error.statusCode = 404;
    throw error;
  }

  return inspections;
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
};
