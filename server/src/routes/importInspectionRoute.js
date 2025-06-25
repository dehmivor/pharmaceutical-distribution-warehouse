const express = require('express');
const router = express.Router();
const importInspectionController = require('../controllers/importInspectionController');

// Lấy danh sách các thùng theo batch_id
router.get('/by-batch/:batchId', importInspectionController.getByBatch);

// Cập nhật vị trí thùng
router.put('/:id/location', importInspectionController.updateLocation);

// Lấy danh sách inspection theo import_order_id
router.get(
  '/import-orders/:importOrderId/inspections',
  importInspectionController.getInspectionByImportOrder,
);

module.exports = router;
