const ExportOrder = require('../models/ExportOrder');
const ImportOrder = require('../models/ImportOrder');
const Contract = require('../models/Contract');
const mongoose = require('mongoose');

class DashboardService {
  // Get overview data for representative dashboard
  static async getOverviewData(userId, startDate, endDate) {
    try {
      const overviewData = await Promise.all([
        // Total Export Orders - All Representatives
        ExportOrder.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
        }),

        // Total Import Orders - All Representatives
        ImportOrder.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
        }),

        // Total Contracts - All Representatives
        Contract.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
        }),

        // Total Value from Export Orders - All Representatives
        ExportOrder.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $unwind: '$details',
          },
          {
            $group: {
              _id: null,
              totalValue: {
                $sum: {
                  $multiply: ['$details.expected_quantity', '$details.unit_price'],
                },
              },
            },
          },
        ]),
      ]);

      const result = {
        totalExportOrders: overviewData[0],
        totalImportOrders: overviewData[1],
        totalContracts: overviewData[2],
        totalValue: overviewData[3][0]?.totalValue || 0,
      };

      return result;
    } catch (error) {
      console.error('getOverviewData Error:', error);
      throw new Error(`Failed to get overview data: ${error.message}`);
    }
  }

  // Get monthly chart data - All Representatives
  static async getMonthlyChartData(userId, months = 12) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const monthlyData = await ExportOrder.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $unwind: '$details',
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
            totalValue: {
              $sum: {
                $multiply: ['$details.expected_quantity', '$details.unit_price'],
              },
            },
          },
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 },
        },
      ]);

      return monthlyData.map((item) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        count: item.count,
        value: item.totalValue,
      }));
    } catch (error) {
      throw new Error(`Failed to get monthly chart data: ${error.message}`);
    }
  }

  // Get export vs import comparison data - All Representatives
  static async getComparisonData(userId, months = 12) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const [exportData, importData] = await Promise.all([
        ExportOrder.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
            },
          },
          {
            $unwind: '$details',
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              exportCount: { $sum: 1 },
              exportValue: {
                $sum: {
                  $multiply: ['$details.expected_quantity', '$details.unit_price'],
                },
              },
            },
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1 },
          },
        ]),

        ImportOrder.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
            },
          },
          {
            $unwind: '$details',
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              importCount: { $sum: 1 },
              importValue: {
                $sum: {
                  $multiply: ['$details.quantity', '$details.unit_price'],
                },
              },
            },
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1 },
          },
        ]),
      ]);

      return {
        export: exportData.map((item) => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          count: item.exportCount,
          value: item.exportValue,
        })),
        import: importData.map((item) => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          count: item.importCount,
          value: item.importValue,
        })),
      };
    } catch (error) {
      throw new Error(`Failed to get comparison data: ${error.message}`);
    }
  }

  // Get top export orders by month - All Representatives
  static async getTopExportData(userId, limit = 10) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - limit);

      const topExportData = await ExportOrder.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $unwind: '$details',
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
            totalValue: {
              $sum: {
                $multiply: ['$details.expected_quantity', '$details.unit_price'],
              },
            },
          },
        },
        {
          $sort: { totalValue: -1 },
        },
        {
          $limit: limit,
        },
      ]);

      return topExportData.map((item) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        count: item.count,
        value: item.totalValue,
      }));
    } catch (error) {
      throw new Error(`Failed to get top export data: ${error.message}`);
    }
  }

  // Get recent activity - All Representatives
  static async getRecentActivity(userId, limit = 10) {
    try {
      const recentActivity = await ExportOrder.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('contract_id', 'contract_code')
        .populate('created_by', 'email');

      return recentActivity.map((order) => ({
        id: order._id,
        orderCode: order.order_code,
        contractCode: order.contract_id?.contract_code || 'N/A',
        warehouseManager: order.created_by?.email || 'N/A',
        status: order.status,
        totalValue: order.details && Array.isArray(order.details) ? order.details.reduce((sum, detail) => sum + (detail.expected_quantity * detail.unit_price), 0) : 0,
        createdAt: order.createdAt,
      }));
    } catch (error) {
      throw new Error(`Failed to get recent activity: ${error.message}`);
    }
  }

  // Get dashboard statistics by date range
  static async getDashboardStats(userId, startDate, endDate) {
    try {
      const [exportOrders, importOrders, contracts] = await Promise.all([
        ExportOrder.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $unwind: '$details',
          },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalValue: {
                $sum: {
                  $multiply: ['$details.expected_quantity', '$details.unit_price'],
                },
              },
            },
          },
        ]),

        ImportOrder.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $unwind: '$details',
          },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalValue: {
                $sum: {
                  $multiply: ['$details.quantity', '$details.unit_price'],
                },
              },
            },
          },
        ]),

        Contract.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
        }),
      ]);

      return {
        exportOrders: {
          totalOrders: exportOrders[0]?.totalOrders || 0,
          totalValue: exportOrders[0]?.totalValue || 0,
          avgValue: exportOrders[0]?.totalOrders ? Math.round(exportOrders[0].totalValue / exportOrders[0].totalOrders) : 0,
        },
        importOrders: {
          totalOrders: importOrders[0]?.totalOrders || 0,
          totalValue: importOrders[0]?.totalValue || 0,
          avgValue: importOrders[0]?.totalOrders ? Math.round(importOrders[0].totalValue / importOrders[0].totalOrders) : 0,
        },
        contracts: {
          totalContracts: contracts,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  // Get warehouse manager dashboard data
  static async getWarehouseManagerDashboard(userId) {
    try {
      const [stats, recentImportOrders, recentExportOrders, lowStockMedicines] = await Promise.all([
        this.getWarehouseManagerStats(userId),
        this.getRecentImportOrders(userId, 5),
        this.getRecentExportOrders(userId, 5),
        this.getLowStockMedicines(userId, 5),
      ]);

      return {
        stats,
        recentImportOrders,
        recentExportOrders,
        lowStockMedicines,
      };
    } catch (error) {
      console.error('getWarehouseManagerDashboard Error:', error);
      throw new Error(`Failed to get warehouse manager dashboard: ${error.message}`);
    }
  }

  // Get warehouse manager statistics
  static async getWarehouseManagerStats(userId) {
    try {
      // This would need to be implemented based on your inventory model
      // For now, returning mock data
      return {
        totalInventory: 150,
        pendingImportOrders: 5,
        pendingExportOrders: 3,
        completedOrders: 25,
        lowStockItems: 8,
        totalValue: 15000000,
      };
    } catch (error) {
      throw new Error(`Failed to get warehouse manager stats: ${error.message}`);
    }
  }

  // Get recent import orders for warehouse manager
  static async getRecentImportOrders(userId, limit = 5) {
    try {
      const orders = await ImportOrder.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('order_code status details createdAt');

      return orders.map((order) => ({
        id: order._id,
        orderCode: order.order_code,
        status: order.status,
        totalValue: order.details && Array.isArray(order.details) ? order.details.reduce((sum, detail) => sum + (detail.quantity * detail.unit_price), 0) : 0,
        createdAt: order.createdAt,
      }));
    } catch (error) {
      throw new Error(`Failed to get recent import orders: ${error.message}`);
    }
  }

  // Get recent export orders for warehouse manager
  static async getRecentExportOrders(userId, limit = 5) {
    try {
      const orders = await ExportOrder.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('order_code status details createdAt');

      return orders.map((order) => ({
        id: order._id,
        orderCode: order.order_code,
        status: order.status,
        totalValue: order.details && Array.isArray(order.details) ? order.details.reduce((sum, detail) => sum + (detail.expected_quantity * detail.unit_price), 0) : 0,
        createdAt: order.createdAt,
      }));
    } catch (error) {
      throw new Error(`Failed to get recent export orders: ${error.message}`);
    }
  }

  // Get low stock medicines for warehouse manager
  static async getLowStockMedicines(userId, limit = 5) {
    try {
      // This would need to be implemented based on your inventory model
      // For now, returning mock data
      return [
        {
          id: '1',
          name: 'Paracetamol 500mg',
          currentStock: 50,
          minStock: 100,
          status: 'low',
        },
        {
          id: '2',
          name: 'Ibuprofen 400mg',
          currentStock: 30,
          minStock: 80,
          status: 'critical',
        },
      ];
    } catch (error) {
      throw new Error(`Failed to get low stock medicines: ${error.message}`);
    }
  }

  // Get warehouse manager chart data
  static async getWarehouseManagerChartData(userId, months = 6) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const [importData, exportData] = await Promise.all([
        ImportOrder.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
            },
          },
          {
            $unwind: '$details',
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              count: { $sum: 1 },
              totalValue: {
                $sum: {
                  $multiply: ['$details.quantity', '$details.unit_price'],
                },
              },
            },
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1 },
          },
        ]),

        ExportOrder.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
            },
          },
          {
            $unwind: '$details',
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              count: { $sum: 1 },
              totalValue: {
                $sum: {
                  $multiply: ['$details.expected_quantity', '$details.unit_price'],
                },
              },
            },
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1 },
          },
        ]),
      ]);

      // Generate labels for last 6 months
      const labels = [];
      const importDataArray = [];
      const exportDataArray = [];
      const importValues = [];
      const exportValues = [];

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        labels.push(`${month}/${year}`);

        // Find data for this month
        const importMonthData = importData.find(
          (item) => item._id.year === year && item._id.month === month,
        );
        const exportMonthData = exportData.find(
          (item) => item._id.year === year && item._id.month === month,
        );

        importDataArray.push(importMonthData?.count || 0);
        exportDataArray.push(exportMonthData?.count || 0);
        importValues.push(importMonthData?.totalValue || 0);
        exportValues.push(exportMonthData?.totalValue || 0);
      }

      return {
        labels,
        datasets: [
          {
            label: 'Import Orders',
            data: importDataArray,
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Export Orders',
            data: exportDataArray,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4,
          },
        ],
        valueDatasets: [
          {
            label: 'Import Value (VND)',
            data: importValues,
            borderColor: '#FF9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Export Value (VND)',
            data: exportValues,
            borderColor: '#9C27B0',
            backgroundColor: 'rgba(156, 39, 176, 0.1)',
            tension: 0.4,
          },
        ],
      };
    } catch (error) {
      console.error('getWarehouseManagerChartData Error:', error);
      throw new Error(`Failed to get warehouse manager chart data: ${error.message}`);
    }
  }

  // Get supervisor dashboard data
  static async getSupervisorDashboard(userId) {
    try {
      const [overview, chartData, topData] = await Promise.all([
        this.getSupervisorOverview(userId),
        this.getSupervisorChartData(userId, 12),
        this.getSupervisorTopData(userId),
      ]);

      return {
        overview,
        chartData,
        topData,
      };
    } catch (error) {
      console.error('getSupervisorDashboard Error:', error);
      throw new Error(`Failed to get supervisor dashboard: ${error.message}`);
    }
  }

  // Get supervisor overview statistics
  static async getSupervisorOverview(userId) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const [totalUsers, totalImportOrders, totalExportOrders, totalContracts] = await Promise.all([
        // Total users (you might need to import User model)
        // User.countDocuments(),
        Promise.resolve(25), // Mock data for now

        // Total import orders this month
        ImportOrder.countDocuments({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        }),

        // Total export orders this month
        ExportOrder.countDocuments({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        }),

        // Total contracts
        Contract.countDocuments(),
      ]);

      return {
        totalUsers,
        totalImportOrders,
        totalExportOrders,
        totalContracts,
      };
    } catch (error) {
      throw new Error(`Failed to get supervisor overview: ${error.message}`);
    }
  }

  // Get supervisor chart data
  static async getSupervisorChartData(userId, months = 12) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const [importData, exportData] = await Promise.all([
        ImportOrder.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
            },
          },
          {
            $unwind: '$details',
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              count: { $sum: 1 },
              totalValue: {
                $sum: {
                  $multiply: ['$details.quantity', '$details.unit_price'],
                },
              },
            },
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1 },
          },
        ]),

        ExportOrder.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
            },
          },
          {
            $unwind: '$details',
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              count: { $sum: 1 },
              totalValue: {
                $sum: {
                  $multiply: ['$details.expected_quantity', '$details.unit_price'],
                },
              },
            },
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1 },
          },
        ]),
      ]);

      // Generate labels for last 12 months
      const labels = [];
      const importDataArray = [];
      const exportDataArray = [];

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        labels.push(`${month}/${year}`);

        // Find data for this month
        const importMonthData = importData.find(
          (item) => item._id.year === year && item._id.month === month,
        );
        const exportMonthData = exportData.find(
          (item) => item._id.year === year && item._id.month === month,
        );

        importDataArray.push(importMonthData?.count || 0);
        exportDataArray.push(exportMonthData?.count || 0);
      }

      return {
        labels,
        datasets: [
          {
            label: 'Import Orders',
            data: importDataArray,
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Export Orders',
            data: exportDataArray,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get supervisor chart data: ${error.message}`);
    }
  }

  // Get supervisor top data
  static async getSupervisorTopData(userId) {
    try {
      // Mock data for now - you can implement real data aggregation here
      return {
        topUsers: [
          { name: 'John Doe', value: 150 },
          { name: 'Jane Smith', value: 120 },
          { name: 'Bob Johnson', value: 100 },
        ],
        topContracts: [
          { name: 'Contract A', value: 5000000 },
          { name: 'Contract B', value: 3000000 },
          { name: 'Contract C', value: 2000000 },
        ],
        topMedicines: [
          { name: 'Paracetamol', value: 1000 },
          { name: 'Ibuprofen', value: 800 },
          { name: 'Aspirin', value: 600 },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get supervisor top data: ${error.message}`);
    }
  }

  // Get supervisor recent activity
  static async getSupervisorRecentActivity(userId, limit = 10) {
    try {
      const [importOrders, exportOrders] = await Promise.all([
        ImportOrder.find()
          .sort({ createdAt: -1 })
          .limit(Math.ceil(limit / 2))
          .populate('contract_id', 'contract_code')
          .populate('created_by', 'email'),

        ExportOrder.find()
          .sort({ createdAt: -1 })
          .limit(Math.ceil(limit / 2))
          .populate('contract_id', 'contract_code')
          .populate('created_by', 'email'),
      ]);

      const activities = [];

      // Add import orders
      importOrders.forEach((order) => {
        activities.push({
          id: order._id,
          type: 'import',
          title: `Import Order ${order.order_code}`,
          description: `Contract: ${order.contract_id?.contract_code || 'N/A'} | Created by ${order.created_by?.email || 'N/A'}`,
          status: order.status,
          timestamp: order.createdAt,
          value: order.details && Array.isArray(order.details) ? order.details.reduce((sum, detail) => sum + (detail.quantity * detail.unit_price), 0) : 0,
          contractCode: order.contract_id?.contract_code || 'N/A',
          orderCode: order.order_code,
        });
      });

      // Add export orders
      exportOrders.forEach((order) => {
        activities.push({
          id: order._id,
          type: 'export',
          title: `Export Order ${order.order_code}`,
          description: `Contract: ${order.contract_id?.contract_code || 'N/A'} | Created by ${order.created_by?.email || 'N/A'}`,
          status: order.status,
          timestamp: order.createdAt,
          value: order.details && Array.isArray(order.details) ? order.details.reduce((sum, detail) => sum + (detail.expected_quantity * detail.unit_price), 0) : 0,
          contractCode: order.contract_id?.contract_code || 'N/A',
          orderCode: order.order_code,
        });
      });

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to get supervisor recent activity: ${error.message}`);
    }
  }
}

module.exports = DashboardService;
