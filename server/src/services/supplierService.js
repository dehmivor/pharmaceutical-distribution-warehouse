const Supplier = require('../models/Supplier');

const supplierService = {
  // ✅ Get all suppliers with active status
  getAllSuppliers: async () => {
    try {
      const suppliers = await Supplier.find(
        { status: 'active' }, // Lọc chỉ lấy supplier active
        { _id: 1, name: 1 }, // Chỉ lấy _id và name
      ).lean();

      return {
        success: true,
        data: suppliers,
      };
    } catch (error) {
      console.error('Error in getAllSuppliers service:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách nhà cung cấp',
      };
    }
  },

  // Get all suppliers for management (including inactive)
  getAllSuppliersForManagement: async (page = 1, limit = 10, filters = {}) => {
    try {
      const skip = (page - 1) * limit;
      const query = {};

      // Apply filters
      if (filters.name) {
        query.name = { $regex: filters.name, $options: 'i' };
      }
      if (filters.status) {
        query.status = filters.status;
      }

      const suppliers = await Supplier.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      const total = await Supplier.countDocuments(query);

      return {
        success: true,
        data: {
          suppliers,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
          }
        },
      };
    } catch (error) {
      console.error('Error in getAllSuppliersForManagement service:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách nhà cung cấp',
      };
    }
  },

  // Get supplier by ID
  getSupplierById: async (id) => {
    try {
      const supplier = await Supplier.findById(id).lean();
      
      if (!supplier) {
        return {
          success: false,
          message: 'Không tìm thấy nhà cung cấp',
        };
      }

      return {
        success: true,
        data: supplier,
      };
    } catch (error) {
      console.error('Error in getSupplierById service:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy thông tin nhà cung cấp',
      };
    }
  },

  // Create new supplier
  createSupplier: async (supplierData) => {
    try {
      // Check if supplier with same name already exists
      const existingSupplier = await Supplier.findOne({ name: supplierData.name });
      if (existingSupplier) {
        return {
          success: false,
          message: 'Nhà cung cấp với tên này đã tồn tại',
        };
      }

      const supplier = new Supplier(supplierData);
      await supplier.save();

      return {
        success: true,
        data: supplier,
      };
    } catch (error) {
      console.error('Error in createSupplier service:', error);
      return {
        success: false,
        message: 'Lỗi khi tạo nhà cung cấp',
      };
    }
  },

  // Update supplier
  updateSupplier: async (id, updateData) => {
    try {
      // Check if supplier exists
      const existingSupplier = await Supplier.findById(id);
      if (!existingSupplier) {
        return {
          success: false,
          message: 'Không tìm thấy nhà cung cấp',
        };
      }

      // Check if name is being changed and if it conflicts with existing supplier
      if (updateData.name && updateData.name !== existingSupplier.name) {
        const nameConflict = await Supplier.findOne({ 
          name: updateData.name, 
          _id: { $ne: id } 
        });
        if (nameConflict) {
          return {
            success: false,
            message: 'Nhà cung cấp với tên này đã tồn tại',
          };
        }
      }

      const updatedSupplier = await Supplier.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      return {
        success: true,
        data: updatedSupplier,
      };
    } catch (error) {
      console.error('Error in updateSupplier service:', error);
      return {
        success: false,
        message: 'Lỗi khi cập nhật nhà cung cấp',
      };
    }
  },

  // Delete supplier
  deleteSupplier: async (id) => {
    try {
      const supplier = await Supplier.findById(id);
      if (!supplier) {
        return {
          success: false,
          message: 'Không tìm thấy nhà cung cấp',
        };
      }

      await Supplier.findByIdAndDelete(id);

      return {
        success: true,
        message: 'Xóa nhà cung cấp thành công',
      };
    } catch (error) {
      console.error('Error in deleteSupplier service:', error);
      return {
        success: false,
        message: 'Lỗi khi xóa nhà cung cấp',
      };
    }
  },
};

module.exports = supplierService;
