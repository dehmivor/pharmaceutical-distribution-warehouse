const express = require('express');
const router = express.Router();
const importInspectionController = require('../controllers/importInspectionController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// GET /api/import-inspections/by-batch/:batchId
router.get('/by-batch/:batchId', importInspectionController.getByBatch);
router.put('/:id/location', importInspectionController.updateLocation);

// Apply authentication middleware to all routes
//router.use(authenticate);

// Routes for representative
router.get(
  '/import-orders/:importOrderId/inspections',
  importInspectionController.getInspectionByImportOrder,
);

module.exports = router
