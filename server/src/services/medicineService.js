// services/medicineService.js
const Medicine = require('../models/Medicine');
const constants = require('../utils/constants');

const medicineService = {
  // ✅ Get all medicines with filtering
  getAllMedicines: async (filters = {}) => {
    try {
      console.log('📝 MedicineService.getAllMedicines called with filters:', filters);

      // Build query object based on filters
      const query = {};

      // Filter by dosage_form
      if (filters.dosage_form && Object.values(constants.MEDICINE_DOSAGE_FORMS).includes(filters.dosage_form)) {
        query.dosage_form = filters.dosage_form;
      }

      // Filter by target_customer
      if (filters.target_customer && Object.values(constants.MEDICINE_TARGET_CUSTOMERS).includes(filters.target_customer)) {
        query.target_customer = filters.target_customer;
      }

      // Filter by unit_of_measure
      if (filters.unit_of_measure && Object.values(constants.MEDICINE_UNITS).includes(filters.unit_of_measure)) {
        query.unit_of_measure = filters.unit_of_measure;
      }

      // Filter by category (exact match)
      if (filters.category) {
        query.category = new RegExp(filters.category, 'i'); // Case insensitive
      }

      // Filter by medicine name (partial match)
      if (filters.medicine_name) {
        query.medicine_name = new RegExp(filters.medicine_name, 'i');
      }

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const skip = (page - 1) * limit;

      // Execute query
      const medicines = await Medicine.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

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
      console.error('❌ Get all medicines service error:', error);
      return {
        success: false,
        message: 'Lỗi server khi lấy danh sách thuốc',
      };
    }
  },

  // ✅ Get medicine by ID
  getMedicineById: async (medicineId) => {
    try {
      console.log('📝 MedicineService.getMedicineById called:', medicineId);

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
      console.error('❌ Get medicine by ID service error:', error);
      
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
        medicine_code,
        category,
        storage_conditions,
        dosage_form,
        target_customer,
        min_stock_threshold,
        max_stock_threshold,
        unit_of_measure,
        description,
      } = medicineData;

      // Validate required fields
      if (!medicine_name || !medicine_code || !category || !dosage_form || !unit_of_measure) {
        return {
          success: false,
          message: 'Tên thuốc, mã thuốc, danh mục, dạng bào chế và đơn vị đo là bắt buộc',
        };
      }

      // Check if medicine code already exists
      const existingMedicine = await Medicine.findOne({
        medicine_code: medicine_code.trim(),
      });

      if (existingMedicine) {
        return {
          success: false,
          message: 'Mã thuốc đã được sử dụng',
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
        medicine_code: medicine_code.trim(),
        category: category.trim(),
        storage_conditions: storage_conditions || {},
        dosage_form,
        target_customer: target_customer || constants.MEDICINE_TARGET_CUSTOMERS.ALL,
        min_stock_threshold: min_stock_threshold || 0,
        max_stock_threshold: max_stock_threshold || 0,
        unit_of_measure,
        description: description?.trim() || '',
      });

      const savedMedicine = await newMedicine.save();

      return {
        success: true,
        data: {
          medicine: savedMedicine,
        },
      };
    } catch (error) {
      console.error('❌ Create medicine service error:', error);

      // Handle specific MongoDB errors
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
      if (updateData.medicine_code && updateData.medicine_code !== existingMedicine.medicine_code) {
        const codeExists = await Medicine.findOne({
          medicine_code: updateData.medicine_code.trim(),
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
      if (sanitizedData.medicine_name) sanitizedData.medicine_name = sanitizedData.medicine_name.trim();
      if (sanitizedData.medicine_code) sanitizedData.medicine_code = sanitizedData.medicine_code.trim();
      if (sanitizedData.category) sanitizedData.category = sanitizedData.category.trim();
      if (sanitizedData.description) sanitizedData.description = sanitizedData.description.trim();

      const updatedMedicine = await Medicine.findByIdAndUpdate(
        medicineId,
        sanitizedData,
        { new: true, runValidators: true }
      );

      return {
        success: true,
        data: {
          medicine: updatedMedicine,
        },
      };
    } catch (error) {
      console.error('❌ Update medicine service error:', error);

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
      console.error('❌ Delete medicine service error:', error);

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

  // ✅ Get medicine statistics
  getMedicineStats: async () => {
    try {
      console.log('📝 MedicineService.getMedicineStats called');

      const stats = await Medicine.aggregate([
        {
          $group: {
            _id: null,
            total_medicines: { $sum: 1 },
            by_dosage_form: {
              $push: {
                dosage_form: '$dosage_form',
                count: 1,
              },
            },
            by_target_customer: {
              $push: {
                target_customer: '$target_customer',
                count: 1,
              },
            },
            avg_min_threshold: { $avg: '$min_stock_threshold' },
            avg_max_threshold: { $avg: '$max_stock_threshold' },
          },
        },
      ]);

      // Count by dosage form
      const dosageFormCounts = await Medicine.aggregate([
        { $group: { _id: '$dosage_form', count: { $sum: 1 } } },
      ]);

      // Count by target customer
      const targetCustomerCounts = await Medicine.aggregate([
        { $group: { _id: '$target_customer', count: { $sum: 1 } } },
      ]);

      return {
        success: true,
        data: {
          total_medicines: stats[0]?.total_medicines || 0,
          by_dosage_form: dosageFormCounts,
          by_target_customer: targetCustomerCounts,
          avg_min_threshold: Math.round(stats[0]?.avg_min_threshold || 0),
          avg_max_threshold: Math.round(stats[0]?.avg_max_threshold || 0),
        },
      };
    } catch (error) {
      console.error('❌ Get medicine stats service error:', error);
      return {
        success: false,
        message: 'Lỗi server khi lấy thống kê thuốc',
      };
    }
  },
};

module.exports = medicineService;