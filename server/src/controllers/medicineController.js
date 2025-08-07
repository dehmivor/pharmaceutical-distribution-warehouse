// controllers/medicineController.js
const medicineService = require('../services/medicineService');
const { validationResult } = require('express-validator');
const constants = require('../utils/constants');

const medicineController = {
  // ✅ Get all medicines with filters
  getMedicinesPaging: async (req, res) => {
    try {
      const { category, license_code, status, page, limit } = req.query;

      const filters = {
        category,
        license_code,
        status,
        page,
        limit,
      };

      const result = await medicineService.getMedicinesPaging(filters);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Lấy danh sách thuốc thành công',
        data: result.data,
      });
    } catch (error) {
      console.error('Get all medicines error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách thuốc',
      });
    }
  },

  // ✅ Get medicine by ID
  getMedicineById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID thuốc là bắt buộc',
        });
      }

      // Get medicine details
      const medicineResult = await medicineService.getMedicineById(id);

      if (!medicineResult.success) {
        return res.status(404).json(medicineResult);
      }

      // Get medicine amount
      const amountResult = await medicineService.getMedicineAmountById(id);

      // Merge data
      const responseData = {
        medicine: medicineResult.data.medicine,
        amount_info: amountResult.success ? amountResult.data : {
          total_amount: 0
        }
      };

      res.status(200).json({
        success: true,
        message: 'Lấy thông tin thuốc thành công',
        data: responseData,
      });
    } catch (error) {
      console.error('Get medicine by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin thuốc',
      });
    }
  },

  // ✅ Create new medicine
  createMedicine: async (req, res) => {
    try {
      const {
        medicine_name,
        license_code,
        category,
        storage_conditions,
        min_stock_threshold,
        max_stock_threshold,
        unit_of_measure,
      } = req.body;

      // Validate required fields
      if (!medicine_name || !license_code || !category || !unit_of_measure) {
        return res.status(400).json({
          success: false,
          message: 'Tên thuốc, mã thuốc, danh mục và đơn vị đo là bắt buộc',
        });
      }

      // Validate enum fields
      if (!Object.values(constants.MEDICINE_CATEGORY).includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Danh mục không hợp lệ. Phải là một trong: ${Object.values(constants.MEDICINE_CATEGORY).join(', ')}`,
        });
      }

      // Validate thresholds
      if (min_stock_threshold !== undefined && min_stock_threshold < 0) {
        return res.status(400).json({
          success: false,
          message: 'Ngưỡng tồn kho tối thiểu không được âm',
        });
      }

      if (max_stock_threshold !== undefined && max_stock_threshold < 0) {
        return res.status(400).json({
          success: false,
          message: 'Ngưỡng tồn kho tối đa không được âm',
        });
      }

      if (
        min_stock_threshold !== undefined &&
        max_stock_threshold !== undefined &&
        max_stock_threshold < min_stock_threshold
      ) {
        return res.status(400).json({
          success: false,
          message: 'Ngưỡng tồn kho tối đa phải lớn hơn hoặc bằng ngưỡng tối thiểu',
        });
      }

      const medicineData = {
        medicine_name,
        license_code,
        category,
        storage_conditions,
        unit_of_measure,
      };

      // Only include threshold fields if they are provided
      if (min_stock_threshold !== undefined) {
        medicineData.min_stock_threshold = min_stock_threshold;
      }
      if (max_stock_threshold !== undefined) {
        medicineData.max_stock_threshold = max_stock_threshold;
      }

      const result = await medicineService.createMedicine(medicineData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json({
        success: true,
        message: 'Tạo thuốc mới thành công',
        data: result.data,
      });
    } catch (error) {
      console.error('Create medicine error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo thuốc mới',
      });
    }
  },

  // ✅ Update medicine
  updateMedicine: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID thuốc là bắt buộc',
        });
      }

      // Validate thresholds
      if (updateData.min_stock_threshold !== undefined && updateData.min_stock_threshold !== null && updateData.min_stock_threshold < 0) {
        return res.status(400).json({
          success: false,
          message: 'Ngưỡng tồn kho tối thiểu không được âm',
        });
      }

      if (updateData.max_stock_threshold !== undefined && updateData.max_stock_threshold !== null && updateData.max_stock_threshold < 0) {
        return res.status(400).json({
          success: false,
          message: 'Ngưỡng tồn kho tối đa không được âm',
        });
      }

      if (
        updateData.min_stock_threshold !== undefined &&
        updateData.min_stock_threshold !== null &&
        updateData.max_stock_threshold !== undefined &&
        updateData.max_stock_threshold !== null &&
        updateData.max_stock_threshold < updateData.min_stock_threshold
      ) {
        return res.status(400).json({
          success: false,
          message: 'Ngưỡng tồn kho tối đa phải lớn hơn hoặc bằng ngưỡng tối thiểu',
        });
      }

      const result = await medicineService.updateMedicine(id, updateData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Cập nhật thuốc thành công',
        data: result.data,
      });
    } catch (error) {
      console.error('Update medicine error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật thuốc',
      });
    }
  },

  // ✅ Delete medicine
  deleteMedicine: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID thuốc là bắt buộc',
        });
      }

      const result = await medicineService.deleteMedicine(id);

      if (!result.success) {
        if (result.message === 'Không tìm thấy thuốc') {
          return res.status(404).json(result);
        }
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Xóa thuốc thành công',
        data: result.data,
      });
    } catch (error) {
      console.error('Delete medicine error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa thuốc',
      });
    }
  },

  // ✅ Get available options for filters
  getFilterOptions: async (req, res) => {
    try {
      const options = {
        category: Object.values(constants.MEDICINE_CATEGORY),
      };

      res.status(200).json({
        success: true,
        message: 'Lấy tùy chọn bộ lọc thành công',
        data: options,
      });
    } catch (error) {
      console.error('Get filter options error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy tùy chọn bộ lọc',
      });
    }
  },

  // Get all medicine with out filters
  getAllMedicines: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: errors.array(),
        });
      }

      const result = await medicineService.getAllMedicines();

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Lấy danh sách thuốc thành công',
        data: result.data,
      });
    } catch (error) {
      console.error('Error in getAllMedicines:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách thuốc',
      });
    }
  },

  getDrugInfo: async (req, res) => {
    try {
      const { code } = req.params;   // e.g. /api/drugs/VN-17635-14
      const summary = await medicineService.getMedicineSummary(code);
      res.json({ success: true, data: summary });
    } catch (err) {
      console.error(err);
      const status = err.statusCode || 500;
      res.status(status).json({ success: false, error: err.message });
    }
  }

};

module.exports = medicineController;
