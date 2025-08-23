const importInspectionService = require('../services/inspectionService');

// Tạo phiếu kiểm tra mới
const createMultipleInspections = async (req, res) => {
  try {
    const inspectionDataList = req.body; // Đây là mảng các phiếu nhập

    const createdInspections =
      await importInspectionService.createMultipleInspections(inspectionDataList);

    return res.status(201).json({
      success: true,
      data: createdInspections,
      message: `Created ${createdInspections.length} import inspections successfully`,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// Lấy danh sách phiếu kiểm tra
const getInspections = async (req, res) => {
  try {
    const { page = 1, limit = 10, import_order_id } = req.query;

    const filters = {};
    if (import_order_id) filters.import_order_id = import_order_id;

    const result = await importInspectionService.getInspections({
      page: parseInt(page),
      limit: parseInt(limit),
      filters,
    });

    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message,
    });
  }
};

const getInspectionForApprove = async (req, res) => {
  try {
    const { page = 1, limit = 10, import_order_id, batch_id } = req.query;

    const filters = {};
    if (import_order_id) filters.import_order_id = import_order_id;
    if (batch_id) filters.batch_id = batch_id;

    // Deep population configuration
    const populateOptions = [
      {
        path: 'import_order_id',
        model: 'ImportOrder',
        populate: [
          { path: 'supplier_contract_id', model: 'SupplierContract' },
          { path: 'warehouse_manager_id', model: 'User' },
          { path: 'created_by', model: 'User' },
          { path: 'approval_by', model: 'User' },
          {
            path: 'details.medicine_id',
            model: 'Medicine',
          },
        ],
      },
      { path: 'batch_id', model: 'Batch' },
      { path: 'created_by', model: 'User' },
      { path: 'medicine_id', model: 'Medicine' },
    ];

    const result = await importInspectionService.getInspectionsForApprove({
      page: parseInt(page),
      limit: parseInt(limit),
      filters,
      populateOptions, // Pass populate configuration to service
    });

    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message,
    });
  }
};

// Lấy chi tiết một phiếu kiểm tra
const getInspectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const inspection = await importInspectionService.getInspectionById(id);

    return res.json(inspection);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
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

    return res.json(inspection);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message,
    });
  }
};

// Xóa phiếu kiểm tra
const deleteInspection = async (req, res) => {
  try {
    const { id } = req.params;

    // Sử dụng service thay vì gọi trực tiếp model
    await importInspectionService.deleteInspection(id);

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting inspection:', error);

    // Xử lý lỗi cụ thể
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

// Lấy thống kê kiểm tra
const getInspectionStatistics = async (req, res) => {
  try {
    const { importOrderId } = req.params;
    const statistics = await importInspectionService.getInspectionStatistics(importOrderId);

    return res.json(statistics);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message,
    });
  }
};

const getInspectionByImportOrderId = async (req, res) => {
  try {
    const { id } = req.params;
    const inspections = await importInspectionService.getInspectionByImportOrderId(id);

    return res.json(inspections);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message,
    });
  }
};

// FIX: Thêm function tạo inspection đơn lẻ
const createSingleInspection = async (req, res) => {
  try {
    const inspectionData = req.body;
    const inspection = await importInspectionService.createSingleInspection(inspectionData);

    return res.status(201).json({
      success: true,
      data: inspection,
      message: 'Inspection created successfully',
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createMultipleInspections,
  createSingleInspection, // FIX: Export function mới
  getInspections,
  getInspectionById,
  updateInspection,
  deleteInspection,
  getInspectionStatistics,
  getInspectionForApprove,
  getInspectionByImportOrderId,
};
