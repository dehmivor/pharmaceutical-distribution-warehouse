const express = require('express');
const router = express.Router();
const importInspectionController = require('../controllers/importInspectionController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');


// Apply authentication middleware to all routes
//router.use(authenticate);

// Routes for representative
router.get(
  '/import-orders/:importOrderId/inspections',
  importInspectionController.getInspectionByImportOrder,
);

module.exports = router
