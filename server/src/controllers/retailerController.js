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

  // Get retailers for management with pagination and filters
  getRetailersForManagement: async (req, res) => {
    try {
      const { page = 1, limit = 10, name, status } = req.query;
      const filters = { name, status };

      const result = await retailerService.getAllRetailersForManagement(
        parseInt(page),
        parseInt(limit),
        filters
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Lấy danh sách nhà bán lẻ thành công',
        data: result.data,
      });
    } catch (error) {
      console.error('Error in getRetailersForManagement:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách nhà bán lẻ',
      });
    }
  },

  getRetailerById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await retailerService.getRetailerById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Lấy thông tin nhà bán lẻ thành công',
        data: result.data,
      });
    } catch (error) {
      console.error('Error in getRetailerById:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin nhà bán lẻ',
      });
    }
  },

  createRetailer: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: errors.array(),
        });
      }

      const result = await retailerService.createRetailer(req.body);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json({
        success: true,
        message: 'Tạo nhà bán lẻ thành công',
        data: result.data,
      });
    } catch (error) {
      console.error('Error in createRetailer:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo nhà bán lẻ',
      });
    }
  },

  updateRetailer: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const result = await retailerService.updateRetailer(id, req.body);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Cập nhật nhà bán lẻ thành công',
        data: result.data,
      });
    } catch (error) {
      console.error('Error in updateRetailer:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật nhà bán lẻ',
      });
    }
  },

  deleteRetailer: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await retailerService.deleteRetailer(id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Xóa nhà bán lẻ thành công',
      });
    } catch (error) {
      console.error('Error in deleteRetailer:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa nhà bán lẻ',
      });
    }
  },
};

module.exports = retailerController; 