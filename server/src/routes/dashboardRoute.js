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



module.exports = router; 