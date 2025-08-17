const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const exportReportController = require('../controllers/exportReportController');
const authenticate = require('../middlewares/authenticate');

// Apply authentication middleware to all report routes
router.use(authenticate);

// ===== BILLS REPORT ROUTES =====
// Get comprehensive report
router.get('/comprehensive', reportController.getComprehensiveReport);

// Get report by period (weekly, monthly, quarterly)
router.get('/period', reportController.getReportByPeriod);

// Get partner analysis report
router.get('/partner-analysis', reportController.getPartnerAnalysisReport);

// Get medicine analysis report
router.get('/medicine-analysis', reportController.getMedicineAnalysisReport);

// Export report to Excel
router.get('/export', reportController.exportReportToExcel);

// Upload Excel file
router.post('/upload', reportController.upload.single('file'), reportController.uploadExcelFile);

// Get report templates
router.get('/templates', reportController.getReportTemplates);

// ===== EXPORT ORDERS REPORT ROUTES =====
// Get export orders report
router.get('/export-orders', exportReportController.getExportOrdersReport);

// Get export orders report by period (weekly, monthly, quarterly)
router.get('/export-orders/period', exportReportController.getExportOrdersReportByPeriod);

// Get export orders partner analysis report
router.get(
  '/export-orders/partner-analysis',
  exportReportController.getExportOrdersPartnerAnalysis,
);

// Export export orders report to Excel
router.get('/export-orders/export', exportReportController.exportExportOrdersToExcel);

// Get partner types for filtering
router.get('/partner-types', exportReportController.getPartnerTypes);

module.exports = router;
