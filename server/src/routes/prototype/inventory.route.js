const express = require('express');
const Drug = require('../../models/drug.model');
const InventoryLog = require('../../models/inventoryLog.model');

// Tạo controller cho inventory
const inventoryController = {
  // Thêm số lượng thuốc khi nhập kho
  addStock: async (req, res) => {
    try {
      const { drugCode, quantity, batchNumber, expiryDate, importPrice } = req.body;

      if (!drugCode || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Mã thuốc và số lượng là bắt buộc, số lượng phải lớn hơn 0',
        });
      }

      // Tìm thuốc theo mã
      const drug = await Drug.findOne({ code: drugCode });

      if (!drug) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thuốc với mã này',
        });
      }

      // Cập nhật số lượng và giá nhập nếu có
      const oldQuantity = drug.quantity || 0;
      drug.quantity = oldQuantity + quantity;

      if (importPrice) {
        drug.price_import = importPrice;
      }

      drug.updated_at = new Date();

      // Lưu thông tin thuốc đã cập nhật
      await drug.save();

      // Tạo bản ghi kiểm kê cho lần nhập hàng này
      const inventory = await new InventoryLog({
        drug_id: drug._id,
        drug_code: drug.code,
        drug_name: drug.name,
        action: 'import',
        quantity_change: quantity,
        quantity_before: oldQuantity,
        quantity_after: drug.quantity,
        batch_number: batchNumber,
        expiry_date: expiryDate,
        note: req.body.note || 'Nhập kho',
      }).save();

      return res.status(200).json({
        success: true,
        message: 'Cập nhật số lượng thuốc thành công',
        data: {
          drug,
          inventory,
        },
      });
    } catch (error) {
      console.error('Lỗi khi thêm số lượng thuốc:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi thêm số lượng thuốc',
        error: error.message,
      });
    }
  },

  // Giảm số lượng thuốc (xuất kho, điều chỉnh)
  reduceStock: async (req, res) => {
    try {
      const { drugCode, quantity, reason } = req.body;

      if (!drugCode || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Mã thuốc và số lượng là bắt buộc, số lượng phải lớn hơn 0',
        });
      }

      // Tìm thuốc theo mã
      const drug = await Drug.findOne({ code: drugCode });

      if (!drug) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thuốc với mã này',
        });
      }

      const oldQuantity = drug.quantity || 0;

      // Kiểm tra số lượng tồn kho
      if (oldQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Số lượng giảm lớn hơn số lượng hiện có trong kho',
        });
      }

      // Cập nhật số lượng
      drug.quantity = oldQuantity - quantity;
      drug.updated_at = new Date();

      // Lưu thông tin thuốc đã cập nhật
      await drug.save();

      // Tạo bản ghi kiểm kê cho lần xuất hàng này
      const inventory = await new InventoryLog({
        drug_id: drug._id,
        drug_code: drug.code,
        drug_name: drug.name,
        action: 'export',
        quantity_change: -quantity,
        quantity_before: oldQuantity,
        quantity_after: drug.quantity,
        note: reason || 'Xuất kho',
      }).save();

      return res.status(200).json({
        success: true,
        message: 'Cập nhật số lượng thuốc thành công',
        data: {
          drug,
          inventory,
        },
      });
    } catch (error) {
      console.error('Lỗi khi giảm số lượng thuốc:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi giảm số lượng thuốc',
        error: error.message,
      });
    }
  },

  // Điều chỉnh số lượng tồn kho (kiểm kê)
  adjustStock: async (req, res) => {
    try {
      const { drugCode, actualQuantity, note } = req.body;

      if (!drugCode || actualQuantity === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Mã thuốc và số lượng thực tế là bắt buộc',
        });
      }

      if (actualQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Số lượng không được âm',
        });
      }

      // Tìm thuốc theo mã
      const drug = await Drug.findOne({ code: drugCode });

      if (!drug) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thuốc với mã này',
        });
      }

      const oldQuantity = drug.quantity || 0;
      const quantityDifference = actualQuantity - oldQuantity;

      // Cập nhật số lượng
      drug.quantity = actualQuantity;
      drug.updated_at = new Date();

      // Lưu thông tin thuốc đã cập nhật
      await drug.save();

      // Tạo bản ghi kiểm kê cho lần điều chỉnh này
      const inventory = await new InventoryLog({
        drug_id: drug._id,
        drug_code: drug.code,
        drug_name: drug.name,
        action: 'adjustment',
        quantity_change: quantityDifference,
        quantity_before: oldQuantity,
        quantity_after: actualQuantity,
        note: note || 'Điều chỉnh kiểm kê',
      }).save();

      return res.status(200).json({
        success: true,
        message: 'Điều chỉnh số lượng thuốc thành công',
        data: {
          drug,
          inventory,
          difference: quantityDifference,
        },
      });
    } catch (error) {
      console.error('Lỗi khi điều chỉnh số lượng thuốc:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi điều chỉnh số lượng thuốc',
        error: error.message,
      });
    }
  },

  // Lấy lịch sử kiểm kê theo mã thuốc
  getInventoryHistory: async (req, res) => {
    try {
      const { drugCode } = req.params;

      if (!drugCode) {
        return res.status(400).json({
          success: false,
          message: 'Mã thuốc là bắt buộc',
        });
      }

      // Tìm thuốc để kiểm tra tồn tại
      const drug = await Drug.findOne({ code: drugCode });

      if (!drug) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thuốc với mã này',
        });
      }

      // Lấy lịch sử kiểm kê
      const inventoryLogs = await InventoryLog.find({ drug_code: drugCode }).sort({
        created_at: -1,
      }); // Sắp xếp theo thời gian giảm dần

      return res.status(200).json({
        success: true,
        message: 'Lấy lịch sử kiểm kê thành công',
        data: {
          drug: {
            _id: drug._id,
            code: drug.code,
            name: drug.name,
            current_quantity: drug.quantity,
          },
          inventory_history: inventoryLogs,
        },
      });
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử kiểm kê:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy lịch sử kiểm kê',
        error: error.message,
      });
    }
  },

  // Lấy danh sách thuốc có số lượng thấp (cảnh báo hết hàng)
  getLowStockDrugs: async (req, res) => {
    try {
      const { threshold = 10 } = req.query;

      // Tìm các thuốc có số lượng dưới ngưỡng
      const lowStockDrugs = await Drug.find({
        quantity: { $lte: parseInt(threshold) },
      }).select('code name quantity price_sell price_import category manufacturer');

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách thuốc có số lượng thấp thành công',
        data: {
          threshold: parseInt(threshold),
          count: lowStockDrugs.length,
          drugs: lowStockDrugs,
        },
      });
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thuốc có số lượng thấp:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách thuốc có số lượng thấp',
        error: error.message,
      });
    }
  },

  // Kiểm tra số lượng thuốc
  checkDrugStock: async (req, res) => {
    try {
      const { drugCode } = req.params;

      if (!drugCode) {
        return res.status(400).json({
          success: false,
          message: 'Mã thuốc là bắt buộc',
        });
      }

      // Tìm thuốc theo mã
      const drug = await Drug.findOne({ code: drugCode });

      if (!drug) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thuốc với mã này',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Kiểm tra số lượng thuốc thành công',
        data: {
          drug_id: drug._id,
          code: drug.code,
          name: drug.name,
          quantity: drug.quantity || 0,
          price_import: drug.price_import,
          price_sell: drug.price_sell,
          unit: drug.unit,
        },
      });
    } catch (error) {
      console.error('Lỗi khi kiểm tra số lượng thuốc:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi kiểm tra số lượng thuốc',
        error: error.message,
      });
    }
  },
};

// Tạo router cho inventory API
const inventoryRoutes = (app) => {
  const router = express.Router();

  // Thêm số lượng khi nhập kho
  router.post('/import', inventoryController.addStock);

  // Giảm số lượng khi xuất kho
  router.post('/export', inventoryController.reduceStock);

  // Điều chỉnh số lượng khi kiểm kê
  router.post('/adjust', inventoryController.adjustStock);

  // Lấy lịch sử kiểm kê theo mã thuốc
  router.get('/history/:drugCode', inventoryController.getInventoryHistory);

  // Lấy danh sách thuốc có số lượng thấp
  router.get('/low-stock', inventoryController.getLowStockDrugs);

  // Kiểm tra số lượng thuốc
  router.get('/check/:drugCode', inventoryController.checkDrugStock);

  app.use('/api/inventory', router);
};

module.exports = {
  inventoryRoutes,
  InventoryLog,
};
