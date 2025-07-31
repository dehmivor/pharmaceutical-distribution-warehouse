const DashboardService = require('../services/dashboardService');

// Get Representative Dashboard Overview Data
const getRepresentativeDashboard = async (req, res) => {
  try {
    const { id: userId } = req.user;
    
    // Get current date and calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all dashboard data using service
    const [overview, monthlyChart, comparison, topExport, recentActivity] = await Promise.all([
      DashboardService.getOverviewData(userId, startOfMonth, endOfMonth),
      DashboardService.getMonthlyChartData(userId, 12),
      DashboardService.getComparisonData(userId, 12),
      DashboardService.getTopExportData(userId, 10),
      DashboardService.getRecentActivity(userId, 10)
    ]);

    const response = {
      success: true,
      data: {
        overview,
        monthlyChart,
        comparison,
        topExport,
        recentActivity
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching representative dashboard data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard data',
      details: error.message 
    });
  }
};

// Get Dashboard Statistics by Date Range
const getDashboardStats = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await DashboardService.getDashboardStats(userId, start, end);

    const response = {
      success: true,
      data: {
        ...stats,
        dateRange: {
          start: start,
          end: end
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard statistics',
      details: error.message 
    });
  }
};

module.exports = {
  getRepresentativeDashboard,
  getDashboardStats
}; 