const express = require('express');
const router = express.Router();
const importInspectionController = require('../controllers/inspectionController');
const authorize = require('../middlewares/authorize');

router.post('/', authorize(['warehouse']), importInspectionController.createMultipleInspections);

// FIX: Thêm route để tạo inspection đơn lẻ (không qua validation duplicate)
router.post('/single', authorize(['warehouse']), importInspectionController.createSingleInspection);

router.get('/', importInspectionController.getInspections);

router.get('/inspection-for-approve', importInspectionController.getInspectionForApprove);

router.get('/by-import-ord/:id', importInspectionController.getInspectionByImportOrderId);

router.get('/:id', importInspectionController.getInspectionById);

router.put('/:id', importInspectionController.updateInspection);

router.delete(
  '/:id',
  authorize(['warehouse_manager', 'supervisor', 'warehouse']),
  importInspectionController.deleteInspection,
);

router.get('/statistics/:importOrderId', importInspectionController.getInspectionStatistics);

module.exports = router;
