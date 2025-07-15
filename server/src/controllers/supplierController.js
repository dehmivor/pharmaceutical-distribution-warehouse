const supplierService = require('../services/supplierService');
const { validationResult } = require('express-validator');

const supplierController = {
  getAllSuppliers: async (req, res) => {
    console.log('getAllSuppliers called');
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: errors.array(),
        });
      }

      const result = await supplierService.getAllSuppliers();

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Lấy danh sách nhà cung cấp thành công',
        data: result.data,
      });
    } catch (error) {
      console.error('Error in getAllSuppliers:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách nhà cung cấp',
      });
    }
  },
};

module.exports = supplierController;
