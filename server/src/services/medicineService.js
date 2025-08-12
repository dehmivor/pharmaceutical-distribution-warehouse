// services/medicineService.js
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const Package = require('../models/Package');
const ExportOrder = require('../models/ExportOrder');
const ImportOrder = require('../models/ImportOrder');
const ImportInspection = require('../models/ImportInspection');
const axios = require('axios');

// const constants = require('../utils/constants');
const { MEDICINE_STATUSES } = require('../utils/constants');
const medicineService = {
  getMedicinesPaging: async (filters = {}) => {
    try {
      const query = {};

      // Filter by category
      if (filters.category) {
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
      const medicines = await Medicine.find(query)
        .sort({ license_code: 1 })
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

  // ✅ Find medicine by ID (returns medicine object or null)
  findMedicineById: async (medicineId) => {
    try {
      if (!medicineId) {
        return null;
      }

      const medicine = await Medicine.findById(medicineId);
      return medicine;
    } catch (error) {
      console.error('Find medicine by ID service error:', error);
      return null;
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
      console.log('medicineData', medicineData);

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
      if (min_stock_threshold !== undefined && min_stock_threshold < 0) {
        return {
          success: false,
          message: 'Ngưỡng tồn kho tối thiểu không được âm',
        };
      }

      if (max_stock_threshold !== undefined && max_stock_threshold < 0) {
        return {
          success: false,
          message: 'Ngưỡng tồn kho tối đa không được âm',
        };
      }

      if (
        min_stock_threshold !== undefined &&
        max_stock_threshold !== undefined &&
        max_stock_threshold < min_stock_threshold
      ) {
        return {
          success: false,
          message: 'Ngưỡng tồn kho tối đa phải lớn hơn hoặc bằng ngưỡng tối thiểu',
        };
      }

      // Create new medicine
      const medicineDoc = {
        medicine_name: medicine_name.trim(),
        license_code: license_code.trim(),
        category: category.trim(),
        storage_conditions: storage_conditions || {},
        unit_of_measure,
      };

      // Only include threshold fields if they are provided
      if (min_stock_threshold !== undefined) {
        medicineDoc.min_stock_threshold = min_stock_threshold;
      }
      if (max_stock_threshold !== undefined) {
        medicineDoc.max_stock_threshold = max_stock_threshold;
      }

      const newMedicine = new Medicine(medicineDoc);

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
      if (updateData.min_stock_threshold !== undefined && updateData.min_stock_threshold !== null && updateData.min_stock_threshold < 0) {
        return {
          success: false,
          message: 'Ngưỡng tồn kho tối thiểu không được âm',
        };
      }

      if (updateData.max_stock_threshold !== undefined && updateData.max_stock_threshold !== null && updateData.max_stock_threshold < 0) {
        return {
          success: false,
          message: 'Ngưỡng tồn kho tối đa không được âm',
        };
      }

      // Only validate max >= min if both values are provided in the update
      if (updateData.min_stock_threshold !== undefined && updateData.min_stock_threshold !== null && updateData.max_stock_threshold !== undefined && updateData.max_stock_threshold !== null) {
        if (updateData.max_stock_threshold < updateData.min_stock_threshold) {
          return {
            success: false,
            message: 'Ngưỡng tồn kho tối đa phải lớn hơn hoặc bằng ngưỡng tối thiểu',
          };
        }
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

      if (medicine.status === 'active') {
        return {
          success: false,
          message: 'Không thể xóa thuốc đang hoạt động. Vui lòng chuyển trạng thái thành "Không hoạt động" trước khi xóa.',
        };
      }

      // Kiểm tra điều kiện xóa: số lượng = 0 và trạng thái = inactive
      const amountResult = await medicineService.getMedicineAmountById(medicineId);
      const currentAmount = amountResult.success ? amountResult.data.total_amount : 0;

      if (currentAmount > 0) {
        return {
          success: false,
          message: `Không thể xóa thuốc. Hiện tại còn ${currentAmount} ${medicine.unit_of_measure} trong kho. Vui lòng xuất hết thuốc trước khi xóa.`,
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
        { _id: 1, license_code: 1, medicine_name: 1 }, // Thêm medicine_name
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

  // ✅ Get medicine amount by ID
  getMedicineAmountById: async (medicineId) => {
    try {
      if (!medicineId) {
        return {
          success: false,
          message: 'ID thuốc là bắt buộc',
        };
      }

      // 1. Tìm tất cả Batch chứa medicine này

      const batches = await Batch.find({ medicine_id: medicineId }).lean();

      if (batches.length === 0) {
        return {
          success: true,
          data: {
            total_amount: 0
          }
        };
      }

      const batchIds = batches.map(batch => batch._id);

      // 2. Tìm tất cả Package chứa các Batch này và tính tổng quantity
      const packages = await Package.find({
        batch_id: { $in: batchIds }
      }).lean();

      const totalAmount = packages.reduce((sum, package) => sum + (package.quantity || 0), 0);

      return {
        success: true,
        data: {
          total_amount: totalAmount
        }
      };
    } catch (error) {
      console.error('Get medicine amount service error:', error);

      if (error.name === 'CastError') {
        return {
          success: false,
          message: 'ID thuốc không hợp lệ',
        };
      }

      return {
        success: false,
        message: 'Lỗi server khi tính toán số lượng thuốc',
      };
    }
  },

  getMedicineSummary: async (licenseCode) => {
    if (!licenseCode) {
      const err = new Error('licenseCode is required');
      err.statusCode = 400;
      throw err;
    }

    const url = `https://drugbank.vn/services/drugbank/api/public/thuoc/${encodeURIComponent(licenseCode)}`;
    let resp;
    try {
      resp = await axios.get(url);
    } catch (err) {
      // If the upstream returns 404, bubble as our 404
      if (err.response && err.response.status === 404) {
        const notFound = new Error(`Medicine with code ${licenseCode} not found`);
        notFound.statusCode = 404;
        throw notFound;
      }
      // Other network or server errors
      const e = new Error('Error fetching from DrugBank API');
      e.statusCode = 502;
      throw e;
    }

    const data = resp.data;
    // Some valid responses may still have state != 202 → treat as not found
    if (data.state !== 202) {
      const notFound = new Error(`Medicine with code ${licenseCode} not found`);
      notFound.statusCode = 404;
      throw notFound;
    }

    return {
      medicine_name: data.tenThuoc,
      license_code: data.soDangKy,
      category: data.phanLoai,
      unit_of_measure: data.baoChe
    };
  },

  getInventoryFlowByLicenseCode: async(licenseCode) => {
  if (!licenseCode) {
    const err = new Error('licenseCode is required');
    err.status = 400;
    throw err;
  }

  // 1) Find medicine
  const medicine = await Medicine.findOne({ license_code: licenseCode.trim() }).exec();
  if (!medicine) {
    const err = new Error('Medicine not found');
    err.status = 404;
    throw err;
  }

  // 2) Compute 12-month window: start = first day of month 11 months ago, end = now
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0, 0);

  // helper: create months index map and zero-filled arrays
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1, 0, 0, 0, 0);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
    months.push({ key, start: d });
  }
  const monthIndex = months.reduce((acc, m, idx) => { acc[m.key] = idx; return acc; }, {});

  // zero-filled arrays (12 values)
  const zeroArray = () => Array(12).fill(0);
  const import_contracted = zeroArray();
  const import_uncontracted = zeroArray();
  const export_contracted = zeroArray();
  const export_uncontracted = zeroArray();

  // ---------- EXPORTS ----------
  // 3) Query export orders referencing this medicine in details within the window and status completed
  const exportQuery = {
    status: 'completed',
    updatedAt: { $gte: startMonth, $lte: now },
    'details.medicine_id': medicine._id,
  };

  const exportOrders = await ExportOrder.find(exportQuery)
    .sort({ updatedAt: 1 })
    // populate contract_id so we can detect contracted/uncontracted easily (optional)
    .populate('contract_id')
    .exec();

  for (const order of exportOrders) {
    const updated = order.updatedAt || order.updatedAt;
    if (!updated) continue; // safety
    const key = `${updated.getFullYear()}-${String(updated.getMonth() + 1).padStart(2, '0')}`;
    const idx = monthIndex[key];
    // if order falls outside (shouldn't due to query) skip
    if (typeof idx !== 'number') continue;

    // Sum relevant detail(s) for this medicine within this order
    let orderSum = 0;
    if (Array.isArray(order.details)) {
      for (const detail of order.details) {
        if (!detail) continue;
        // only sum details that refer to our medicine
        if (detail.medicine_id && detail.medicine_id.toString() === medicine._id.toString()) {
          // detail.actual_item is expected to be an array of export inspections
          if (Array.isArray(detail.actual_item)) {
            for (const item of detail.actual_item) {
              // Per your spec we use `quantity` on exportInspectionSchema
              const q = Number(item?.quantity ?? 0);
              if (!Number.isNaN(q)) orderSum += q;
            }
          }
        }
      }
    }

    if (order.contract_id) {
      export_contracted[idx] += orderSum;
    } else {
      export_uncontracted[idx] += orderSum;
    }
  }

  // ---------- IMPORTS ----------
  // 4) Find import orders updated in window that reference this medicine in their details
  const importQuery = {
    status: 'completed',
    updatedAt: { $gte: startMonth, $lte: now },
    'details.medicine_id': medicine._id,
  };

  const importOrders = await ImportOrder.find(importQuery)
    .sort({ updatedAt: 1 })
    .select('_id contract_id updatedAt')
    .exec();

  const importOrderIds = importOrders.map((o) => o._id);
  // build a map for contract_id and updatedAt lookup
  const importOrderMap = importOrders.reduce((acc, o) => {
    acc[o._id.toString()] = { contract_id: o.contract_id, updatedAt: o.updatedAt };
    return acc;
  }, {});

  // 5) Find import inspections for those orders and this medicine
  //    then sum (actual_quantity - rejected_quantity) per inspection and assign to month/contract bucket
  if (importOrderIds.length > 0) {
    const inspections = await ImportInspection.find({
      import_order_id: { $in: importOrderIds },
      medicine_id: medicine._id,
    }).exec();

    for (const insp of inspections) {
      const parent = importOrderMap[insp.import_order_id?.toString()];
      if (!parent) continue;
      const updated = parent.updatedAt;
      if (!updated) continue;
      const key = `${updated.getFullYear()}-${String(updated.getMonth() + 1).padStart(2, '0')}`;
      const idx = monthIndex[key];
      if (typeof idx !== 'number') continue;

      const actual = Number(insp.actual_quantity ?? 0);
      const rejected = Number(insp.rejected_quantity ?? 0);
      const value = (Number.isNaN(actual) ? 0 : actual) - (Number.isNaN(rejected) ? 0 : rejected);

      if (parent.contract_id) {
        import_contracted[idx] += value;
      } else {
        import_uncontracted[idx] += value;
      }
    }
  }

  // Final object in requested format
  const result = {
    import: {
      contracted_order: import_contracted,
      uncontracted_order: import_uncontracted,
    },
    export: {
      contracted_order: export_contracted,
      uncontracted_order: export_uncontracted,
    },
    // optional: include month keys so caller knows which index corresponds to which month
    _months: months.map((m) => m.key), // oldest -> newest
  };

  return result;
}

};

module.exports = medicineService;
