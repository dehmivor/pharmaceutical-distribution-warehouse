const express = require('express');
const router = express.Router();
const importInspectionController = require('../controllers/importInspectionController');
const authMiddleware = require('../middleware/authMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');

// Middleware xác thực cho tất cả routes
router.use(authMiddleware.authenticate);

// Tạo phiếu kiểm tra mới
router.post(
  '/',
  validationMiddleware.validateCreateInspection,
  importInspectionController.createInspection,
);

// Lấy danh sách phiếu kiểm tra (có phân trang và filter)
router.get(
  '/',
  validationMiddleware.validateGetInspections,
  importInspectionController.getInspections,
);

// Lấy chi tiết một phiếu kiểm tra
router.get(
  '/:id',
  validationMiddleware.validateObjectId,
  importInspectionController.getInspectionById,
);

// Cập nhật phiếu kiểm tra
router.put(
  '/:id',
  validationMiddleware.validateObjectId,
  validationMiddleware.validateUpdateInspection,
  importInspectionController.updateInspection,
);

// Xóa phiếu kiểm tra
router.delete(
  '/:id',
  validationMiddleware.validateObjectId,
  authMiddleware.authorize(['admin', 'manager']),
  importInspectionController.deleteInspection,
);

// Lấy thống kê kiểm tra theo import order
router.get(
  '/statistics/:importOrderId',
  validationMiddleware.validateObjectId,
  importInspectionController.getInspectionStatistics,
);

module.exports = router;
