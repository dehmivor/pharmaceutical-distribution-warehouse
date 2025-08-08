const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middlewares/accountMiddleware');

// Apply authentication middleware to all dashboard routes
router.use(authenticateToken);

// Get Representative Dashboard Overview Data
router.get('/representative', dashboardController.getRepresentativeDashboard);

// Get Dashboard Statistics by Date Range
router.get('/stats', dashboardController.getDashboardStats);

// Get Warehouse Manager Dashboard Data
router.get('/warehouse-manager', dashboardController.getWarehouseManagerDashboard);

// Get Warehouse Manager Chart Data
router.get('/warehouse-manager/chart', dashboardController.getWarehouseManagerChart);

// Get Warehouse Manager Detailed Stats
router.get('/warehouse-manager/stats', dashboardController.getWarehouseManagerDetailedStats);

// Get Warehouse Manager Top Medicines
router.get('/warehouse-manager/top-medicines', dashboardController.getWarehouseManagerTopMedicines);

// Get Warehouse Manager Alerts
router.get('/warehouse-manager/alerts', dashboardController.getWarehouseManagerAlerts);

// Get Supervisor Dashboard Data
router.get('/supervisor', dashboardController.getSupervisorDashboard);

// Get Supervisor Recent Activity
router.get('/supervisor/recent-activity', dashboardController.getSupervisorRecentActivity);

// ==================== DEBT DASHBOARD ROUTES ====================

// Get Debt Overview Data
router.get('/debt/overview', dashboardController.getDebtOverview);

// Get Debt Chart Data
router.get('/debt/chart', dashboardController.getDebtChartData);

// Get Debt Analysis Data
router.get('/debt/analysis', dashboardController.getDebtAnalysis);

// Get Debt Receivable/Payable Data
router.get('/debt/receivable-payable', dashboardController.getDebtReceivablePayable);

module.exports = router;
