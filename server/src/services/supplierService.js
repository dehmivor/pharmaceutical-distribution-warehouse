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
};

module.exports = supplierService;
