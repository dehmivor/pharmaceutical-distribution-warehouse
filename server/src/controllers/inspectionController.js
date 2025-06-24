const importInspectionService = require('../services/inspectionService');
class ImportInspectionController {
  // Tạo phiếu kiểm tra mới
  async createInspection(req, res) {
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
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  // Lấy danh sách phiếu kiểm tra
  async getInspections(req, res) {
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
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  // Lấy chi tiết một phiếu kiểm tra
  async getInspectionById(req, res) {
    try {
      const { id } = req.params;
      const inspection = await importInspectionService.getInspectionById(id);

      return successResponse(res, {
        message: 'Import inspection retrieved successfully',
        data: inspection,
      });
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  // Cập nhật phiếu kiểm tra
  async updateInspection(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const inspection = await importInspectionService.updateInspection(id, updateData);

      return successResponse(res, {
        message: 'Import inspection updated successfully',
        data: inspection,
      });
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  // Xóa phiếu kiểm tra
  async deleteInspection(req, res) {
    try {
      const { id } = req.params;
      await importInspectionService.deleteInspection(id);

      return successResponse(res, {
        message: 'Import inspection deleted successfully',
      });
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  // Lấy thống kê kiểm tra
  async getInspectionStatistics(req, res) {
    try {
      const { importOrderId } = req.params;
      const statistics = await importInspectionService.getInspectionStatistics(importOrderId);

      return successResponse(res, {
        message: 'Inspection statistics retrieved successfully',
        data: statistics,
      });
    } catch (error) {
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }
}

module.exports = new ImportInspectionController();
