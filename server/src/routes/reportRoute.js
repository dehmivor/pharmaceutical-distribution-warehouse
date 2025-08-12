const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticate = require('../middlewares/authenticate');

// Apply authentication middleware to all report routes
router.use(authenticate);

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

module.exports = router;
