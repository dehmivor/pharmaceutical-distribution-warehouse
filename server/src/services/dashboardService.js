const ExportOrder = require("../models/ExportOrder");
const ImportOrder = require("../models/ImportOrder");
const Contract = require("../models/Contract");
const mongoose = require('mongoose');

class DashboardService {
  // Get overview data for representative dashboard
  static async getOverviewData(userId, startDate, endDate) {
    try {
      const overviewData = await Promise.all([
        // Total Export Orders
        ExportOrder.countDocuments({
          created_by: userId,
          createdAt: { $gte: startDate, $lte: endDate }
        }),
        
        // Total Import Orders
        ImportOrder.countDocuments({
          created_by: userId,
          createdAt: { $gte: startDate, $lte: endDate }
        }),
        
        // Total Contracts
        Contract.countDocuments({
          created_by: userId,
          createdAt: { $gte: startDate, $lte: endDate }
        }),
        
        // Total Value from Export Orders
        ExportOrder.aggregate([
          {
            $match: {
              created_by: new mongoose.Types.ObjectId(userId),
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              totalValue: { $sum: "$total_value" }
            }
          }
        ])
      ]);

      return {
        totalExportOrders: overviewData[0],
        totalImportOrders: overviewData[1],
        totalContracts: overviewData[2],
        totalValue: overviewData[3][0]?.totalValue || 0
      };
    } catch (error) {
      throw new Error(`Failed to get overview data: ${error.message}`);
    }
  }

  // Get monthly chart data
  static async getMonthlyChartData(userId, months = 12) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const monthlyData = await ExportOrder.aggregate([
        {
          $match: {
            created_by: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 },
            totalValue: { $sum: "$total_value" }
          }
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 }
        }
      ]);

      return monthlyData.map(item => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        count: item.count,
        value: item.totalValue
      }));
    } catch (error) {
      throw new Error(`Failed to get monthly chart data: ${error.message}`);
    }
  }

  // Get export vs import comparison data
  static async getComparisonData(userId, months = 12) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const [exportData, importData] = await Promise.all([
        ExportOrder.aggregate([
          {
            $match: {
              created_by: new mongoose.Types.ObjectId(userId),
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" }
              },
              exportCount: { $sum: 1 },
              exportValue: { $sum: "$total_value" }
            }
          },
          {
            $sort: { "_id.year": 1, "_id.month": 1 }
          }
        ]),
        
        ImportOrder.aggregate([
          {
            $match: {
              created_by: new mongoose.Types.ObjectId(userId),
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" }
              },
              importCount: { $sum: 1 },
              importValue: { $sum: "$total_value" }
            }
          },
          {
            $sort: { "_id.year": 1, "_id.month": 1 }
          }
        ])
      ]);

      return {
        export: exportData.map(item => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          count: item.exportCount,
          value: item.exportValue
        })),
        import: importData.map(item => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          count: item.importCount,
          value: item.importValue
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get comparison data: ${error.message}`);
    }
  }

  // Get top export orders by month
  static async getTopExportData(userId, limit = 10) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - limit);

      const topExportData = await ExportOrder.aggregate([
        {
          $match: {
            created_by: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 },
            totalValue: { $sum: "$total_value" }
          }
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 }
        },
        {
          $limit: limit
        }
      ]);

      return topExportData.map(item => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        count: item.count,
        value: item.totalValue
      }));
    } catch (error) {
      throw new Error(`Failed to get top export data: ${error.message}`);
    }
  }

  // Get recent activity
  static async getRecentActivity(userId, limit = 10) {
    try {
      const recentActivity = await ExportOrder.find({
        created_by: userId
      })
      .populate('contract_id', 'contract_code')
      .populate('warehouse_manager_id', 'email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('order_code contract_id warehouse_manager_id status total_value createdAt');

      return recentActivity.map(order => ({
        id: order._id,
        orderCode: order.order_code,
        contractCode: order.contract_id?.contract_code,
        warehouseManager: order.warehouse_manager_id?.email,
        status: order.status,
        totalValue: order.total_value,
        createdAt: order.createdAt
      }));
    } catch (error) {
      throw new Error(`Failed to get recent activity: ${error.message}`);
    }
  }

  // Get dashboard statistics by date range
  static async getDashboardStats(userId, startDate, endDate) {
    try {
      const stats = await Promise.all([
        // Export Orders Stats
        ExportOrder.aggregate([
          {
            $match: {
              created_by: new mongoose.Types.ObjectId(userId),
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalValue: { $sum: "$total_value" },
              avgValue: { $avg: "$total_value" }
            }
          }
        ]),

        // Import Orders Stats
        ImportOrder.aggregate([
          {
            $match: {
              created_by: new mongoose.Types.ObjectId(userId),
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalValue: { $sum: "$total_value" },
              avgValue: { $avg: "$total_value" }
            }
          }
        ]),

        // Contracts Stats
        Contract.aggregate([
          {
            $match: {
              created_by: new mongoose.Types.ObjectId(userId),
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              totalContracts: { $sum: 1 }
            }
          }
        ])
      ]);

      return {
        exportOrders: stats[0][0] || { totalOrders: 0, totalValue: 0, avgValue: 0 },
        importOrders: stats[1][0] || { totalOrders: 0, totalValue: 0, avgValue: 0 },
        contracts: stats[2][0] || { totalContracts: 0 }
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }
}

module.exports = DashboardService; 