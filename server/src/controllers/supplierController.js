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

  // Get suppliers for management with pagination and filters
  getSuppliersForManagement: async (req, res) => {
    try {
      const { page = 1, limit = 10, name, status } = req.query;
      const filters = { name, status };

      const result = await supplierService.getAllSuppliersForManagement(
        parseInt(page),
        parseInt(limit),
        filters
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Lấy danh sách nhà cung cấp thành công',
        data: result.data,
      });
    } catch (error) {
      console.error('Error in getSuppliersForManagement:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách nhà cung cấp',
      });
    }
  },

  getSupplierById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await supplierService.getSupplierById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Lấy thông tin nhà cung cấp thành công',
        data: result.data,
      });
    } catch (error) {
      console.error('Error in getSupplierById:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin nhà cung cấp',
      });
    }
  },

  createSupplier: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: errors.array(),
        });
      }

      const result = await supplierService.createSupplier(req.body);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json({
        success: true,
        message: 'Tạo nhà cung cấp thành công',
        data: result.data,
      });
    } catch (error) {
      console.error('Error in createSupplier:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo nhà cung cấp',
      });
    }
  },

  updateSupplier: async (req, res) => {
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
      const result = await supplierService.updateSupplier(id, req.body);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Cập nhật nhà cung cấp thành công',
        data: result.data,
      });
    } catch (error) {
      console.error('Error in updateSupplier:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật nhà cung cấp',
      });
    }
  },

  deleteSupplier: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await supplierService.deleteSupplier(id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Xóa nhà cung cấp thành công',
      });
    } catch (error) {
      console.error('Error in deleteSupplier:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa nhà cung cấp',
      });
    }
  },
};

module.exports = supplierController;
