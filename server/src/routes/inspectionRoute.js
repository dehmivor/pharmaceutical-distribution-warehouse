const express = require('express');
const router = express.Router();
const importInspectionController = require('../controllers/inspectionController');
const authorize = require('../middlewares/authorize');

// Tạo phiếu kiểm tra mới
router.post('/', importInspectionController.createInspection);

// Lấy danh sách phiếu kiểm tra (có phân trang và filter)
router.get('/', importInspectionController.getInspections);

// Lấy chi tiết một phiếu kiểm tra
router.get('/:id', importInspectionController.getInspectionById);

// Cập nhật phiếu kiểm tra
router.put('/:id', importInspectionController.updateInspection);

// Xóa phiếu kiểm tra
router.delete('/:id', authorize(['admin', 'manager']), importInspectionController.deleteInspection);

// Lấy thống kê kiểm tra theo import order
router.get('/statistics/:importOrderId', importInspectionController.getInspectionStatistics);

module.exports = router;
