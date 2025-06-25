const importInspectionService = require('../services/inspectionService');

// Tạo phiếu kiểm tra mới
const createInspection = async (req, res) => {
  try {
    const inspectionData = {
      ...req.body,
      created_by: req.user.id,
    };

    const inspection = await importInspectionService.createInspection(inspectionData);

    return successResponse(
      res,
      {
        message: 'Import inspection created successfully',
        data: inspection,
      },
      201,
    );
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// Lấy danh sách phiếu kiểm tra
const getInspections = async (req, res) => {
  try {
    const { page = 1, limit = 10, import_order_id, batch_id } = req.query;

    const filters = {};
    if (import_order_id) filters.import_order_id = import_order_id;
    if (batch_id) filters.batch_id = batch_id;

    const result = await importInspectionService.getInspections({
      page: parseInt(page),
      limit: parseInt(limit),
      filters,
    });

    return successResponse(res, {
      message: 'Import inspections retrieved successfully',
      data: result.inspections,
      pagination: result.pagination,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// Lấy chi tiết một phiếu kiểm tra
const getInspectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const inspection = await importInspectionService.getInspectionById(id);

    return successResponse(res, {
      message: 'Import inspection retrieved successfully',
      data: inspection,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// Cập nhật phiếu kiểm tra
const updateInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const inspection = await importInspectionService.updateInspection(id, updateData);

    return successResponse(res, {
      message: 'Import inspection updated successfully',
      data: inspection,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// Xóa phiếu kiểm tra
const deleteInspection = async (req, res) => {
  try {
    const { id } = req.params;
    await importInspectionService.deleteInspection(id);

    return successResponse(res, {
      message: 'Import inspection deleted successfully',
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// Lấy thống kê kiểm tra
const getInspectionStatistics = async (req, res) => {
  try {
    const { importOrderId } = req.params;
    const statistics = await importInspectionService.getInspectionStatistics(importOrderId);

    return successResponse(res, {
      message: 'Inspection statistics retrieved successfully',
      data: statistics,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createInspection,
  getInspections,
  getInspectionById,
  updateInspection,
  deleteInspection,
  getInspectionStatistics,
};
