const retailerService = require('../services/retailerService');
const { validationResult } = require('express-validator');

const retailerController = {
  getAllRetailers: async (req, res) => {
    console.log('getAllRetailers called');
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: errors.array(),
        });
      }

      const result = await retailerService.getAllRetailers();

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Lấy danh sách nhà bán lẻ thành công',
        data: result.data,
      });
    } catch (error) {
      console.error('Error in getAllRetailers:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách nhà bán lẻ',
      });
    }
  },
};

module.exports = retailerController; 