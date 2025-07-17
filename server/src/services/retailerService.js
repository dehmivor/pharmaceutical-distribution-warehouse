const Retailer = require('../models/Retailer');

const retailerService = {
  // ✅ Get all retailers with active status
  getAllRetailers: async () => {
    try {
      const retailers = await Retailer.find(
        { status: 'active' }, // Lọc chỉ lấy retailer active
        { _id: 1, name: 1 }, // Chỉ lấy _id và name
      ).lean();

      return {
        success: true,
        data: retailers,
      };
    } catch (error) {
      console.error('Error in getAllRetailers service:', error);
      return {
        success: false,
        message: 'Lỗi khi lấy danh sách nhà bán lẻ',
      };
    }
  },
};

module.exports = retailerService; 