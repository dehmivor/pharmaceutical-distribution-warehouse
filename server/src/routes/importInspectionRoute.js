const express = require('express');
const router = express.Router();
const importInspectionController = require('../controllers/importInspectionController');

// GET /api/import-inspections/by-batch/:batchId
router.get('/by-batch/:batchId', importInspectionController.getByBatch);

module.exports = router;