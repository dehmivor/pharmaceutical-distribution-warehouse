const ImportInspection = require('../models/ImportInspection');
const ImportOrder = require('../models/ImportOrder');
const Batch = require('../models/Batch');
const { AppError } = require('../utils/errors');

class ImportInspectionService {
  // Tạo phiếu kiểm tra mới
  async createInspection(inspectionData) {
    // Kiểm tra import order tồn tại
    const importOrder = await ImportOrder.findById(inspectionData.import_order_id);
    if (!importOrder) {
      throw new AppError('Import order not found', 404);
    }

    // Kiểm tra batch tồn tại
    const batch = await Batch.findById(inspectionData.batch_id);
    if (!batch) {
      throw new AppError('Batch not found', 404);
    }

    // Kiểm tra logic nghiệp vụ
    if (inspectionData.rejected_quantity > inspectionData.actual_quantity) {
      throw new AppError('Rejected quantity cannot exceed actual quantity', 400);
    }

    // Kiểm tra xem đã có phiếu kiểm tra cho batch này chưa
    const existingInspection = await ImportInspection.findOne({
      import_order_id: inspectionData.import_order_id,
      batch_id: inspectionData.batch_id,
    });

    if (existingInspection) {
      throw new AppError('Inspection already exists for this batch', 409);
    }

    const inspection = new ImportInspection(inspectionData);
    await inspection.save();

    return await this.getInspectionById(inspection._id);
  }

  // Lấy danh sách phiếu kiểm tra với phân trang
  async getInspections({ page, limit, filters }) {
    const skip = (page - 1) * limit;

    const inspections = await ImportInspection.find(filters)
      .populate('import_order_id', 'order_code status')
      .populate('batch_id', 'batch_code production_date expiry_date')
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
  }

  // Lấy chi tiết một phiếu kiểm tra
  async getInspectionById(id) {
    const inspection = await ImportInspection.findById(id)
      .populate('import_order_id')
      .populate('batch_id')
      .populate('created_by', 'name email');

    if (!inspection) {
      throw new AppError('Import inspection not found', 404);
    }

    return inspection;
  }

  // Cập nhật phiếu kiểm tra
  async updateInspection(id, updateData) {
    const inspection = await ImportInspection.findById(id);
    if (!inspection) {
      throw new AppError('Import inspection not found', 404);
    }

    // Kiểm tra logic nghiệp vụ khi cập nhật
    const actualQuantity = updateData.actual_quantity || inspection.actual_quantity;
    const rejectedQuantity = updateData.rejected_quantity || inspection.rejected_quantity;

    if (rejectedQuantity > actualQuantity) {
      throw new AppError('Rejected quantity cannot exceed actual quantity', 400);
    }

    Object.assign(inspection, updateData);
    inspection.updatedAt = new Date();
    await inspection.save();

    return await this.getInspectionById(id);
  }

  // Xóa phiếu kiểm tra
  async deleteInspection(id) {
    const inspection = await ImportInspection.findById(id);
    if (!inspection) {
      throw new AppError('Import inspection not found', 404);
    }

    await ImportInspection.findByIdAndDelete(id);
  }

  // Thống kê kiểm tra theo import order
  async getInspectionStatistics(importOrderId) {
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
  }

  // Kiểm tra số lượng còn lại có thể nhập
  async getAvailableQuantityForImport(importOrderId) {
    const inspections = await ImportInspection.find({ import_order_id: importOrderId });

    return inspections.reduce((total, inspection) => {
      return total + (inspection.actual_quantity - inspection.rejected_quantity);
    }, 0);
  }
}

module.exports = new ImportInspectionService();
