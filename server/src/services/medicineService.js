// services/medicineService.js
const Medicine = require('../models/Medicine');
// const constants = require('../utils/constants');
const { MEDICINE_STATUSES } = require('../utils/constants');
const medicineService = {
  getMedicinesPaging: async (filters = {}) => {
    try {
      const query = {};

      // Filter by category
      if (filters.category){
        query.category = filters.category;
      }

      // Filter by license code (partial match)
      if (filters.license_code) {
        query.license_code = new RegExp(filters.license_code, 'i');
      }

      // Filter by status
      if (filters.status) {
        query.status = filters.status;
      }

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const skip = (page - 1) * limit;

      // Execute query
      const medicines = await Medicine.find(query).sort({ license_code: 1 }).skip(skip).limit(limit);

      // Get total count for pagination
      const total = await Medicine.countDocuments(query);

      return {
        success: true,
        data: {
          medicines,
          pagination: {
            current_page: page,
            per_page: limit,
            total,
            total_pages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      console.error('Get all medicines service error:', error);
      return {
        success: false,
        message: 'Lỗi server khi lấy danh sách thuốc',
      };
    }
  },

  // ✅ Get medicine by ID
  getMedicineById: async (medicineId) => {
    try {
      if (!medicineId) {
        return {
          success: false,
          message: 'ID thuốc là bắt buộc',
        };
      }

      const medicine = await Medicine.findById(medicineId);

      if (!medicine) {
        return {
          success: false,
          message: 'Không tìm thấy thuốc',
        };
      }

      return {
        success: true,
        data: {
          medicine,
        },
      };
    } catch (error) {
      console.error('Get medicine by ID service error:', error);

      if (error.name === 'CastError') {
        return {
          success: false,
          message: 'ID thuốc không hợp lệ',
        };
      }

      return {
        success: false,
        message: 'Lỗi server khi lấy thông tin thuốc',
      };
    }
  },

  // ✅ Create new medicine
  createMedicine: async (medicineData) => {
    try {
      console.log('📝 MedicineService.createMedicine called:', medicineData.medicine_name);

      const {
        medicine_name,
        license_code,
        category,
        storage_conditions,
        min_stock_threshold,
        max_stock_threshold,
        unit_of_measure,
      } = medicineData;

      // Validate required fields
      if (!medicine_name || !license_code || !category || !unit_of_measure) {
        return {
          success: false,
          message: 'Tên thuốc, mã thuốc, danh mục và đơn vị đo là bắt buộc',
        };
      }

      // Check if medicine code already exists
      const existingMedicine = await Medicine.findOne({
        license_code: license_code.trim(),
      });

      if (existingMedicine) {
        return {
          success: false,
          message: 'Số đăng ký đã được sử dụng',
        };
      }

      // Validate thresholds
      if (min_stock_threshold < 0 || max_stock_threshold < 0) {
        return {
          success: false,
          message: 'Ngưỡng tồn kho không được âm',
        };
      }

      if (max_stock_threshold < min_stock_threshold) {
        return {
          success: false,
          message: 'Ngưỡng tồn kho tối đa phải lớn hơn hoặc bằng ngưỡng tối thiểu',
        };
      }

      // Create new medicine
      const newMedicine = new Medicine({
        medicine_name: medicine_name.trim(),
        license_code: license_code.trim(),
        category: category.trim(),
        storage_conditions: storage_conditions || {},
        min_stock_threshold: min_stock_threshold || 0,
        max_stock_threshold: max_stock_threshold || 0,
        unit_of_measure,
      });

      const savedMedicine = await newMedicine.save();

      return {
        success: true,
        data: {
          medicine: savedMedicine,
        },
      };
    } catch (error) {
      console.error('Create medicine service error:', error);

      // Handle specific MongoDB errors
      if (error.code === 11000) {
        return {
          success: false,
          message: 'Số đăng ký đã được sử dụng',
        };
      }

      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err) => err.message);
        return {
          success: false,
          message: messages.join(', '),
        };
      }

      return {
        success: false,
        message: 'Lỗi server khi tạo thuốc mới',
      };
    }
  },

  // ✅ Update medicine
  updateMedicine: async (medicineId, updateData) => {
    try {
      console.log('📝 MedicineService.updateMedicine called:', medicineId);

      if (!medicineId) {
        return {
          success: false,
          message: 'ID thuốc là bắt buộc',
        };
      }

      const existingMedicine = await Medicine.findById(medicineId);
      if (!existingMedicine) {
        return {
          success: false,
          message: 'Không tìm thấy thuốc',
        };
      }

      // Check if medicine_code is being updated and already exists
      if (updateData.license_code && updateData.license_code !== existingMedicine.license_code) {
        const codeExists = await Medicine.findOne({
          license_code: updateData.license_code.trim(),
          _id: { $ne: medicineId },
        });

        if (codeExists) {
          return {
            success: false,
            message: 'Mã thuốc đã được sử dụng',
          };
        }
      }

      // Validate thresholds if they're being updated
      const minThreshold = updateData.min_stock_threshold ?? existingMedicine.min_stock_threshold;
      const maxThreshold = updateData.max_stock_threshold ?? existingMedicine.max_stock_threshold;

      if (minThreshold < 0 || maxThreshold < 0) {
        return {
          success: false,
          message: 'Ngưỡng tồn kho không được âm',
        };
      }

      if (maxThreshold < minThreshold) {
        return {
          success: false,
          message: 'Ngưỡng tồn kho tối đa phải lớn hơn hoặc bằng ngưỡng tối thiểu',
        };
      }

      // Trim string fields
      const sanitizedData = { ...updateData };
      if (sanitizedData.medicine_name)
        sanitizedData.medicine_name = sanitizedData.medicine_name.trim();
      if (sanitizedData.license_code)
        sanitizedData.license_code = sanitizedData.license_code.trim();
      if (sanitizedData.category) sanitizedData.category = sanitizedData.category.trim();

      const updatedMedicine = await Medicine.findByIdAndUpdate(medicineId, sanitizedData, {
        new: true,
        runValidators: true,
      });

      return {
        success: true,
        data: {
          medicine: updatedMedicine,
        },
      };
    } catch (error) {
      console.error('Update medicine service error:', error);

      if (error.name === 'CastError') {
        return {
          success: false,
          message: 'ID thuốc không hợp lệ',
        };
      }

      if (error.code === 11000) {
        return {
          success: false,
          message: 'Mã thuốc đã được sử dụng',
        };
      }

      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err) => err.message);
        return {
          success: false,
          message: messages.join(', '),
        };
      }

      return {
        success: false,
        message: 'Lỗi server khi cập nhật thuốc',
      };
    }
  },

  // ✅ Delete medicine
  deleteMedicine: async (medicineId) => {
    try {
      console.log('📝 MedicineService.deleteMedicine called:', medicineId);

      if (!medicineId) {
        return {
          success: false,
          message: 'ID thuốc là bắt buộc',
        };
      }

      const medicine = await Medicine.findById(medicineId);
      if (!medicine) {
        return {
          success: false,
          message: 'Không tìm thấy thuốc',
        };
      }

      await Medicine.findByIdAndDelete(medicineId);

      return {
        success: true,
        message: 'Xóa thuốc thành công',
        data: {
          deleted_medicine: medicine,
        },
      };
    } catch (error) {
      console.error('Delete medicine service error:', error);

      if (error.name === 'CastError') {
        return {
          success: false,
          message: 'ID thuốc không hợp lệ',
        };
      }

      return {
        success: false,
        message: 'Lỗi server khi xóa thuốc',
      };
    }
  },

  // Get all medicines with out filters
  getAllMedicines: async () => {
    try {
      const medicines = await Medicine.find(
        { status: 'active' }, // Lọc chỉ lấy thuốc active
        { _id: 1, license_code: 1 }, // Chỉ lấy _id và license_code
      ).lean();

      return {
        success: true,
        data: medicines,
      };
    } catch (error) {
      console.error('Error in getAllMedicines service:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách thuốc',
      };
    }
  },
};

module.exports = medicineService;
