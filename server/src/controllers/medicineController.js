// controllers/medicineController.js
const medicineService = require('../services/medicineService');
const constants = require('../utils/constants');

const medicineController = {
  // ✅ Get all medicines with filters
  getAllMedicines: async (req, res) => {
    try {
      const {
        dosage_form,
        target_customer,
        unit_of_measure,
        category,
        medicine_name,
        page,
        limit,
      } = req.query;

      // Validate enum filters
      if (dosage_form && !Object.values(constants.MEDICINE_DOSAGE_FORMS).includes(dosage_form)) {
        return res.status(400).json({
          success: false,
          message: `Dạng bào chế không hợp lệ. Phải là một trong: ${Object.values(constants.MEDICINE_DOSAGE_FORMS).join(', ')}`,
        });
      }

      if (target_customer && !Object.values(constants.MEDICINE_TARGET_CUSTOMERS).includes(target_customer)) {
        return res.status(400).json({
          success: false,
          message: `Đối tượng khách hàng không hợp lệ. Phải là một trong: ${Object.values(constants.MEDICINE_TARGET_CUSTOMERS).join(', ')}`,
        });
      }

      if (unit_of_measure && !Object.values(constants.MEDICINE_UNITS).includes(unit_of_measure)) {
        return res.status(400).json({
          success: false,
          message: `Đơn vị đo không hợp lệ. Phải là một trong: ${Object.values(constants.MEDICINE_UNITS).join(', ')}`,
        });
      }

      const filters = {
        dosage_form,
        target_customer,
        unit_of_measure,
        category,
        medicine_name,
        page,
        limit,
      };

      const result = await medicineService.getAllMedicines(filters);

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

      const result = await medicineService.getMedicineById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Lấy thông tin thuốc thành công',
        data: result.data,
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
        medicine_code,
        category,
        storage_conditions,
        dosage_form,
        target_customer,
        min_stock_threshold,
        max_stock_threshold,
        unit_of_measure,
        description,
      } = req.body;

      // Validate required fields
      if (!medicine_name || !medicine_code || !category || !dosage_form || !unit_of_measure) {
        return res.status(400).json({
          success: false,
          message: 'Tên thuốc, mã thuốc, danh mục, dạng bào chế và đơn vị đo là bắt buộc',
        });
      }

      // Validate enum fields
      if (!Object.values(constants.MEDICINE_DOSAGE_FORMS).includes(dosage_form)) {
        return res.status(400).json({
          success: false,
          message: `Dạng bào chế không hợp lệ. Phải là một trong: ${Object.values(constants.MEDICINE_DOSAGE_FORMS).join(', ')}`,
        });
      }

      if (target_customer && !Object.values(constants.MEDICINE_TARGET_CUSTOMERS).includes(target_customer)) {
        return res.status(400).json({
          success: false,
          message: `Đối tượng khách hàng không hợp lệ. Phải là một trong: ${Object.values(constants.MEDICINE_TARGET_CUSTOMERS).join(', ')}`,
        });
      }

      if (!Object.values(constants.MEDICINE_UNITS).includes(unit_of_measure)) {
        return res.status(400).json({
          success: false,
          message: `Đơn vị đo không hợp lệ. Phải là một trong: ${Object.values(constants.MEDICINE_UNITS).join(', ')}`,
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

      if (min_stock_threshold !== undefined && max_stock_threshold !== undefined && max_stock_threshold < min_stock_threshold) {
        return res.status(400).json({
          success: false,
          message: 'Ngưỡng tồn kho tối đa phải lớn hơn hoặc bằng ngưỡng tối thiểu',
        });
      }

      const medicineData = {
        medicine_name,
        medicine_code,
        category,
        storage_conditions,
        dosage_form,
        target_customer,
        min_stock_threshold: min_stock_threshold || 0,
        max_stock_threshold: max_stock_threshold || 0,
        unit_of_measure,
        description,
      };

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

      // Validate enum fields if they exist in update data
      if (updateData.dosage_form && !Object.values(constants.MEDICINE_DOSAGE_FORMS).includes(updateData.dosage_form)) {
        return res.status(400).json({
          success: false,
          message: `Dạng bào chế không hợp lệ. Phải là một trong: ${Object.values(constants.MEDICINE_DOSAGE_FORMS).join(', ')}`,
        });
      }

      if (updateData.target_customer && !Object.values(constants.MEDICINE_TARGET_CUSTOMERS).includes(updateData.target_customer)) {
        return res.status(400).json({
          success: false,
          message: `Đối tượng khách hàng không hợp lệ. Phải là một trong: ${Object.values(constants.MEDICINE_TARGET_CUSTOMERS).join(', ')}`,
        });
      }

      if (updateData.unit_of_measure && !Object.values(constants.MEDICINE_UNITS).includes(updateData.unit_of_measure)) {
        return res.status(400).json({
          success: false,
          message: `Đơn vị đo không hợp lệ. Phải là một trong: ${Object.values(constants.MEDICINE_UNITS).join(', ')}`,
        });
      }

      // Validate thresholds
      if (updateData.min_stock_threshold !== undefined && updateData.min_stock_threshold < 0) {
        return res.status(400).json({
          success: false,
          message: 'Ngưỡng tồn kho tối thiểu không được âm',
        });
      }

      if (updateData.max_stock_threshold !== undefined && updateData.max_stock_threshold < 0) {
        return res.status(400).json({
          success: false,
          message: 'Ngưỡng tồn kho tối đa không được âm',
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

  // ✅ Get medicine statistics
  getMedicineStats: async (req, res) => {
    try {
      const result = await medicineService.getMedicineStats();

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Lấy thống kê thuốc thành công',
        data: result.data,
      });
    } catch (error) {
      console.error('Get medicine stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thống kê thuốc',
      });
    }
  },

  // ✅ Get available options for filters
  getFilterOptions: async (req, res) => {
    try {
      const options = {
        dosage_forms: Object.values(constants.MEDICINE_DOSAGE_FORMS),
        target_customers: Object.values(constants.MEDICINE_TARGET_CUSTOMERS),
        units_of_measure: Object.values(constants.MEDICINE_UNITS),
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
};

module.exports = medicineController;