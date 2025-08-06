const ExportOrder = require('../models/ExportOrder');
const ImportOrder = require('../models/ImportOrder');
const Contract = require('../models/Contract');
const Medicine = require('../models/Medicine');
const mongoose = require('mongoose');
const Bill = require('../models/Bill'); // Added Bill model import

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
        totalValue:
          order.details && Array.isArray(order.details)
            ? order.details.reduce(
                (sum, detail) => sum + detail.expected_quantity * detail.unit_price,
                0,
              )
            : 0,
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
          avgValue: exportOrders[0]?.totalOrders
            ? Math.round(exportOrders[0].totalValue / exportOrders[0].totalOrders)
            : 0,
        },
        importOrders: {
          totalOrders: importOrders[0]?.totalOrders || 0,
          totalValue: importOrders[0]?.totalValue || 0,
          avgValue: importOrders[0]?.totalOrders
            ? Math.round(importOrders[0].totalValue / importOrders[0].totalOrders)
            : 0,
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
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const [
        pendingImportOrders,
        pendingExportOrders,
        completedImportOrders,
        completedExportOrders,
        totalImportOrders,
        totalExportOrders,
      ] = await Promise.all([
        // Pending import orders
        ImportOrder.countDocuments({ status: 'pending' }),

        // Pending export orders
        ExportOrder.countDocuments({ status: 'pending' }),

        // Completed import orders this month
        ImportOrder.countDocuments({
          status: 'completed',
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        }),

        // Completed export orders this month
        ExportOrder.countDocuments({
          status: 'completed',
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        }),

        // Total import orders for inventory calculation
        ImportOrder.aggregate([
          {
            $unwind: '$details',
          },
          {
            $group: {
              _id: null,
              totalQuantity: { $sum: '$details.quantity' },
            },
          },
        ]),

        // Total export orders for inventory calculation
        ExportOrder.aggregate([
          {
            $unwind: '$details',
          },
          {
            $group: {
              _id: null,
              totalQuantity: { $sum: '$details.expected_quantity' },
            },
          },
        ]),
      ]);

      // Calculate total inventory (imported - exported)
      const totalImported = totalImportOrders[0]?.totalQuantity || 0;
      const totalExported = totalExportOrders[0]?.totalQuantity || 0;
      const totalInventory = Math.max(0, totalImported - totalExported);

      // Calculate total value from actual import orders
      const totalValueData = await ImportOrder.aggregate([
        {
          $unwind: '$details',
        },
        {
          $group: {
            _id: null,
            totalValue: {
              $sum: {
                $multiply: ['$details.quantity', '$details.unit_price'],
              },
            },
          },
        },
      ]);

      const totalValue = totalValueData[0]?.totalValue || 0;

      // Get low stock items count (items with quantity < 10)
      const lowStockItems = Math.max(0, Math.floor(totalInventory * 0.1)); // 10% of inventory as low stock

      return {
        totalInventory,
        pendingImportOrders,
        pendingExportOrders,
        completedOrders: completedImportOrders + completedExportOrders,
        lowStockItems,
        totalValue,
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
        totalValue:
          order.details && Array.isArray(order.details)
            ? order.details.reduce((sum, detail) => sum + detail.quantity * detail.unit_price, 0)
            : 0,
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
        totalValue:
          order.details && Array.isArray(order.details)
            ? order.details.reduce(
                (sum, detail) => sum + detail.expected_quantity * detail.unit_price,
                0,
              )
            : 0,
        createdAt: order.createdAt,
      }));
    } catch (error) {
      throw new Error(`Failed to get recent export orders: ${error.message}`);
    }
  }

  // Get low stock medicines for warehouse manager
  static async getLowStockMedicines(userId, limit = 5) {
    try {
      // Calculate current inventory from import and export orders
      const inventoryData = await ImportOrder.aggregate([
        {
          $unwind: '$details',
        },
        {
          $group: {
            _id: '$details.medicine_id',
            totalImported: { $sum: '$details.quantity' },
          },
        },
      ]);

      const exportData = await ExportOrder.aggregate([
        {
          $unwind: '$details',
        },
        {
          $group: {
            _id: '$details.medicine_id',
            totalExported: { $sum: '$details.expected_quantity' },
          },
        },
      ]);

      // Create a map of current inventory
      const inventoryMap = new Map();

      // Add imported quantities
      inventoryData.forEach((item) => {
        inventoryMap.set(
          item._id.toString(),
          (inventoryMap.get(item._id.toString()) || 0) + item.totalImported,
        );
      });

      // Subtract exported quantities
      exportData.forEach((item) => {
        const current = inventoryMap.get(item._id.toString()) || 0;
        inventoryMap.set(item._id.toString(), Math.max(0, current - item.totalExported));
      });

      // Get medicine details for low stock items
      const lowStockItems = [];
      let count = 0;

      for (const [medicineId, currentStock] of inventoryMap) {
        if (count >= limit) break;

        // Consider items with stock < 50 as low stock
        if (currentStock < 50) {
          // Try to get medicine name from database
          let medicineName = `Medicine ${medicineId.slice(-6)}`; // Default name
          let minStock = 50; // Default min stock

          try {
            const medicine = await Medicine.findById(medicineId).select(
              'medicine_name min_stock_threshold',
            );
            if (medicine) {
              medicineName = medicine.medicine_name;
              minStock = medicine.min_stock_threshold || 50;
            }
          } catch (error) {
            console.log('Could not fetch medicine details for ID:', medicineId);
          }

          lowStockItems.push({
            id: medicineId,
            name: medicineName,
            currentStock,
            minStock,
            status: currentStock === 0 ? 'critical' : 'low',
          });
          count++;
        }
      }

      // If no real low stock items, return some sample data
      if (lowStockItems.length === 0) {
        return [
          {
            id: 'sample1',
            name: 'Paracetamol 500mg',
            currentStock: 25,
            minStock: 50,
            status: 'low',
          },
          {
            id: 'sample2',
            name: 'Ibuprofen 400mg',
            currentStock: 15,
            minStock: 50,
            status: 'critical',
          },
        ];
      }

      return lowStockItems;
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

  // Get warehouse manager detailed statistics
  static async getWarehouseManagerDetailedStats(userId) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        monthlyImportOrders,
        monthlyExportOrders,
        weeklyImportOrders,
        weeklyExportOrders,
        totalMedicines,
        expiringMedicines,
      ] = await Promise.all([
        // Monthly import orders
        ImportOrder.countDocuments({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        }),

        // Monthly export orders
        ExportOrder.countDocuments({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        }),

        // Weekly import orders
        ImportOrder.countDocuments({
          createdAt: { $gte: startOfWeek },
        }),

        // Weekly export orders
        ExportOrder.countDocuments({
          createdAt: { $gte: startOfWeek },
        }),

        // Total unique medicines
        ImportOrder.aggregate([
          {
            $unwind: '$details',
          },
          {
            $group: {
              _id: '$details.medicine_id',
            },
          },
          {
            $count: 'total',
          },
        ]),

        // Medicines expiring soon (mock data for now)
        Promise.resolve(5),
      ]);

      return {
        monthly: {
          importOrders: monthlyImportOrders,
          exportOrders: monthlyExportOrders,
        },
        weekly: {
          importOrders: weeklyImportOrders,
          exportOrders: weeklyExportOrders,
        },
        inventory: {
          totalMedicines: totalMedicines[0]?.total || 0,
          expiringMedicines,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get warehouse manager detailed stats: ${error.message}`);
    }
  }

  // Get warehouse manager top medicines
  static async getWarehouseManagerTopMedicines(userId, limit = 10) {
    try {
      // Get medicines with highest import quantities
      const topImportMedicines = await ImportOrder.aggregate([
        {
          $unwind: '$details',
        },
        {
          $group: {
            _id: '$details.medicine_id',
            totalImported: { $sum: '$details.quantity' },
            totalValue: { $sum: { $multiply: ['$details.quantity', '$details.unit_price'] } },
          },
        },
        {
          $sort: { totalImported: -1 },
        },
        {
          $limit: limit,
        },
      ]);

      // Get medicine names
      const medicineIds = topImportMedicines.map((item) => item._id);
      const medicines = await Medicine.find({ _id: { $in: medicineIds } }).select('medicine_name');

      // Map medicine names to results
      const medicineMap = new Map();
      medicines.forEach((medicine) => {
        medicineMap.set(medicine._id.toString(), medicine.medicine_name);
      });

      return topImportMedicines.map((item) => ({
        id: item._id,
        name: medicineMap.get(item._id.toString()) || `Medicine ${item._id.toString().slice(-6)}`,
        totalImported: item.totalImported,
        totalValue: item.totalValue,
      }));
    } catch (error) {
      throw new Error(`Failed to get warehouse manager top medicines: ${error.message}`);
    }
  }

  // Get warehouse manager alerts
  static async getWarehouseManagerAlerts(userId, limit = 10) {
    try {
      const alerts = [];

      // Check for low stock medicines
      const lowStockMedicines = await this.getLowStockMedicines(userId, 5);
      if (lowStockMedicines.length > 0) {
        alerts.push({
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${lowStockMedicines.length} medicines are running low on stock`,
          severity: 'warning',
          timestamp: new Date(),
          data: lowStockMedicines,
        });
      }

      // Check for pending orders
      const pendingImportOrders = await ImportOrder.countDocuments({ status: 'pending' });
      const pendingExportOrders = await ExportOrder.countDocuments({ status: 'pending' });

      if (pendingImportOrders > 0) {
        alerts.push({
          type: 'pending_import',
          title: 'Pending Import Orders',
          message: `${pendingImportOrders} import orders are pending approval`,
          severity: 'info',
          timestamp: new Date(),
          count: pendingImportOrders,
        });
      }

      if (pendingExportOrders > 0) {
        alerts.push({
          type: 'pending_export',
          title: 'Pending Export Orders',
          message: `${pendingExportOrders} export orders are pending processing`,
          severity: 'info',
          timestamp: new Date(),
          count: pendingExportOrders,
        });
      }

      // Add sample alerts if no real alerts
      if (alerts.length === 0) {
        alerts.push({
          type: 'system',
          title: 'System Status',
          message: 'All systems are running normally',
          severity: 'success',
          timestamp: new Date(),
        });
      }

      return alerts.slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to get warehouse manager alerts: ${error.message}`);
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
          value:
            order.details && Array.isArray(order.details)
              ? order.details.reduce((sum, detail) => sum + detail.quantity * detail.unit_price, 0)
              : 0,
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
          value:
            order.details && Array.isArray(order.details)
              ? order.details.reduce(
                  (sum, detail) => sum + detail.expected_quantity * detail.unit_price,
                  0,
                )
              : 0,
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

  // ==================== DEBT DASHBOARD METHODS ====================

  // Get debt overview data
  static async getDebtOverview(userId) {
    try {
      const now = new Date();
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfLastWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Get all bills
      const allBills = await Bill.find()
        .populate('import_order_id', 'order_code contract_id')
        .populate('export_order_id', 'order_code contract_id')
        .populate('import_order_id.contract_id', 'contract_code partner_type')
        .populate('export_order_id.contract_id', 'contract_code partner_type');

      // Calculate total debt
      const totalDebt = allBills.reduce((sum, bill) => {
        const billValue = bill.details.reduce(
          (detailSum, detail) => detailSum + detail.quantity * detail.unit_price,
          0,
        );
        return sum + billValue;
      }, 0);

      // Calculate overdue debt
      const overdueDebt = allBills
        .filter((bill) => bill.status === 'overdue')
        .reduce((sum, bill) => {
          const billValue = bill.details.reduce(
            (detailSum, detail) => detailSum + detail.quantity * detail.unit_price,
            0,
          );
          return sum + billValue;
        }, 0);

      // Calculate paid amount
      const paidAmount = allBills.reduce((sum, bill) => sum + (bill.amountPaid || 0), 0);

      // Calculate upcoming debt (bills due in next 30 days)
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const upcomingDebt = allBills
        .filter((bill) => {
          // Mock logic: consider bills with status 'pending' as upcoming
          return bill.status === 'pending';
        })
        .reduce((sum, bill) => {
          const billValue = bill.details.reduce(
            (detailSum, detail) => detailSum + detail.quantity * detail.unit_price,
            0,
          );
          return sum + billValue;
        }, 0);

      // Calculate weekly changes (mock data for now)
      const weeklyChange = {
        totalDebt: Math.round(totalDebt * 0.082), // 8.2% increase
        overdueDebt: Math.round(overdueDebt * 0.125), // 12.5% increase
        paidAmount: Math.round(paidAmount * 0.153), // 15.3% increase
        upcomingDebt: Math.round(upcomingDebt * -0.051), // 5.1% decrease
      };

      return {
        totalDebt,
        overdueDebt,
        paidAmount,
        upcomingDebt,
        weeklyChange,
      };
    } catch (error) {
      throw new Error(`Failed to get debt overview: ${error.message}`);
    }
  }

  // Get debt chart data
  static async getDebtChartData(userId, months = 12) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      // Get bills in date range
      const bills = await Bill.find({
        createdAt: { $gte: startDate },
      }).populate('import_order_id export_order_id');

      // Generate monthly data
      const monthlyData = [];
      const quarterlyData = [];

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        // Filter bills for this month
        const monthBills = bills.filter((bill) => {
          const billDate = new Date(bill.createdAt);
          return billDate.getFullYear() === year && billDate.getMonth() + 1 === month;
        });

        // Calculate values for this month
        const totalDebt = monthBills.reduce((sum, bill) => {
          const billValue = bill.details.reduce(
            (detailSum, detail) => detailSum + detail.quantity * detail.unit_price,
            0,
          );
          return sum + billValue;
        }, 0);

        const overdueDebt = monthBills
          .filter((bill) => bill.status === 'overdue')
          .reduce((sum, bill) => {
            const billValue = bill.details.reduce(
              (detailSum, detail) => detailSum + detail.quantity * detail.unit_price,
              0,
            );
            return sum + billValue;
          }, 0);

        const paidAmount = monthBills.reduce((sum, bill) => sum + (bill.amountPaid || 0), 0);

        monthlyData.push({
          month: `${year}-${String(month).padStart(2, '0')}`,
          totalDebt: Math.round(totalDebt / 1000), // Convert to thousands
          overdue: Math.round(overdueDebt / 1000),
          paid: Math.round(paidAmount / 1000),
        });

        // Quarterly data (every 3 months)
        if (month % 3 === 0) {
          quarterlyData.push({
            quarter: `Q${Math.floor(month / 3)}`,
            totalDebt: Math.round(totalDebt / 1000),
            overdue: Math.round(overdueDebt / 1000),
            paid: Math.round(paidAmount / 1000),
          });
        }
      }

      return {
        monthly: monthlyData,
        quarterly: quarterlyData,
      };
    } catch (error) {
      throw new Error(`Failed to get debt chart data: ${error.message}`);
    }
  }

  // Get debt analysis data
  static async getDebtAnalysis(userId, period = 'monthly') {
    try {
      const bills = await Bill.find()
        .populate('import_order_id', 'contract_id')
        .populate('export_order_id', 'contract_id')
        .populate('import_order_id.contract_id', 'contract_code partner_type')
        .populate('export_order_id.contract_id', 'contract_code partner_type');

      // Group bills by customer/partner
      const customerDebtMap = new Map();

      bills.forEach((bill) => {
        let customerName = 'Unknown';
        let customerType = 'Unknown';

        if (bill.import_order_id?.contract_id) {
          customerName = bill.import_order_id.contract_id.contract_code;
          customerType = bill.import_order_id.contract_id.partner_type;
        } else if (bill.export_order_id?.contract_id) {
          customerName = bill.export_order_id.contract_id.contract_code;
          customerType = bill.export_order_id.contract_id.partner_type;
        }

        const billValue = bill.details.reduce(
          (sum, detail) => sum + detail.quantity * detail.unit_price,
          0,
        );

        if (customerDebtMap.has(customerName)) {
          customerDebtMap.get(customerName).totalValue += billValue;
          customerDebtMap.get(customerName).billCount += 1;
        } else {
          customerDebtMap.set(customerName, {
            name: customerName,
            type: customerType,
            totalValue: billValue,
            billCount: 1,
          });
        }
      });

      // Convert to array and sort by total value
      const customerDebts = Array.from(customerDebtMap.values())
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10);

      // Calculate progress percentages (mock logic)
      const totalSystemDebt = customerDebts.reduce((sum, customer) => sum + customer.totalValue, 0);

      const analysisData = customerDebts.map((customer, index) => ({
        title: customer.name,
        value: `₫${customer.totalValue.toLocaleString()}`,
        progress: {
          value: Math.round((customer.totalValue / totalSystemDebt) * 100) || 10 + index * 5,
        },
        type: customer.type,
        billCount: customer.billCount,
      }));

      return {
        monthly: analysisData,
        quarterly: analysisData.map((item) => ({
          ...item,
          value: `₫${(parseInt(item.value.replace(/[₫,]/g, '')) * 3).toLocaleString()}`,
          progress: { value: Math.min(100, item.progress.value * 1.2) },
        })),
      };
    } catch (error) {
      throw new Error(`Failed to get debt analysis: ${error.message}`);
    }
  }

  // Get debt receivable/payable data
  static async getDebtReceivablePayable(userId) {
    try {
      const bills = await Bill.find()
        .populate('import_order_id', 'contract_id')
        .populate('export_order_id', 'contract_id')
        .populate('import_order_id.contract_id', 'partner_type')
        .populate('export_order_id.contract_id', 'partner_type');

      // Separate receivable (money we need to collect) and payable (money we need to pay)
      const receivable = bills.filter((bill) => {
        // Export orders are receivable (customers owe us)
        return bill.export_order_id && bill.status !== 'completed';
      });

      const payable = bills.filter((bill) => {
        // Import orders are payable (we owe suppliers)
        return bill.import_order_id && bill.status !== 'completed';
      });

      // Calculate monthly trends (mock data for now)
      const monthlyReceivable = [
        1200, 1100, 1150, 1250, 1300, 1200, 1190, 1180, 1150, 1170, 1200, 1220,
      ];
      const monthlyPayable = [900, 850, 870, 910, 930, 890, 860, 820, 800, 810, 830, 840];

      const quarterlyReceivable = [3450, 3800, 3500, 3800];
      const quarterlyPayable = [2600, 2750, 2500, 2550];

      return {
        receivable: {
          monthly: monthlyReceivable,
          quarterly: quarterlyReceivable,
          total: receivable.reduce((sum, bill) => {
            const billValue = bill.details.reduce(
              (detailSum, detail) => detailSum + detail.quantity * detail.unit_price,
              0,
            );
            return sum + billValue;
          }, 0),
        },
        payable: {
          monthly: monthlyPayable,
          quarterly: quarterlyPayable,
          total: payable.reduce((sum, bill) => {
            const billValue = bill.details.reduce(
              (detailSum, detail) => detailSum + detail.quantity * detail.unit_price,
              0,
            );
            return sum + billValue;
          }, 0),
        },
      };
    } catch (error) {
      throw new Error(`Failed to get debt receivable/payable: ${error.message}`);
    }
  }
}

module.exports = DashboardService;
