// const ExportOrder = require('../models/ExportOrder');
// const ImportOrder = require('../models/ImportOrder');
// const Contract = require('../models/Contract');
// const mongoose = require('mongoose');

// class DashboardService {
//   // Get overview data for representative dashboard
//   static async getOverviewData(userId, startDate, endDate) {
//     try {
//       const overviewData = await Promise.all([
//         // Total Export Orders - All Representatives
//         ExportOrder.countDocuments({
//           createdAt: { $gte: startDate, $lte: endDate },
//         }),

//         // Total Import Orders - All Representatives
//         ImportOrder.countDocuments({
//           createdAt: { $gte: startDate, $lte: endDate },
//         }),

//         // Total Contracts - All Representatives
//         Contract.countDocuments({
//           createdAt: { $gte: startDate, $lte: endDate },
//         }),

//         // Total Value from Export Orders - All Representatives
//         ExportOrder.aggregate([
//           {
//             $match: {
//               createdAt: { $gte: startDate, $lte: endDate },
//             },
//           },
//           {
//             $unwind: '$details',
//           },
//           {
//             $group: {
//               _id: null,
//               totalValue: {
//                 $sum: {
//                   $multiply: ['$details.expected_quantity', '$details.unit_price'],
//                 },
//               },
//             },
//           },
//         ]),
//       ]);

//       const result = {
//         totalExportOrders: overviewData[0],
//         totalImportOrders: overviewData[1],
//         totalContracts: overviewData[2],
//         totalValue: overviewData[3][0]?.totalValue || 0,
//       };

//       return result;
//     } catch (error) {
//       console.error('getOverviewData Error:', error);
//       throw new Error(`Failed to get overview data: ${error.message}`);
//     }
//   }

//   // Get monthly chart data - All Representatives
//   static async getMonthlyChartData(userId, months = 12) {
//     try {
//       const startDate = new Date();
//       startDate.setMonth(startDate.getMonth() - months);

//       const monthlyData = await ExportOrder.aggregate([
//         {
//           $match: {
//             createdAt: { $gte: startDate },
//           },
//         },
//         {
//           $unwind: '$details',
//         },
//         {
//           $group: {
//             _id: {
//               year: { $year: '$createdAt' },
//               month: { $month: '$createdAt' },
//             },
//             count: { $sum: 1 },
//             totalValue: {
//               $sum: {
//                 $multiply: ['$details.expected_quantity', '$details.unit_price'],
//               },
//             },
//           },
//         },
//         {
//           $sort: { '_id.year': 1, '_id.month': 1 },
//         },
//       ]);

//       return monthlyData.map((item) => ({
//         month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
//         count: item.count,
//         value: item.totalValue,
//       }));
//     } catch (error) {
//       throw new Error(`Failed to get monthly chart data: ${error.message}`);
//     }
//   }

//   // Get export vs import comparison data - All Representatives
//   static async getComparisonData(userId, months = 12) {
//     try {
//       const startDate = new Date();
//       startDate.setMonth(startDate.getMonth() - months);

//       const [exportData, importData] = await Promise.all([
//         ExportOrder.aggregate([
//           {
//             $match: {
//               createdAt: { $gte: startDate },
//             },
//           },
//           {
//             $unwind: '$details',
//           },
//           {
//             $group: {
//               _id: {
//                 year: { $year: '$createdAt' },
//                 month: { $month: '$createdAt' },
//               },
//               exportCount: { $sum: 1 },
//               exportValue: {
//                 $sum: {
//                   $multiply: ['$details.expected_quantity', '$details.unit_price'],
//                 },
//               },
//             },
//           },
//           {
//             $sort: { '_id.year': 1, '_id.month': 1 },
//           },
//         ]),

//         ImportOrder.aggregate([
//           {
//             $match: {
//               createdAt: { $gte: startDate },
//             },
//           },
//           {
//             $group: {
//               _id: {
//                 year: { $year: '$createdAt' },
//                 month: { $month: '$createdAt' },
//               },
//               importCount: { $sum: 1 },
//               importValue: { $sum: '$total_value' },
//             },
//           },
//           {
//             $sort: { '_id.year': 1, '_id.month': 1 },
//           },
//         ]),
//       ]);

//       return {
//         export: exportData.map((item) => ({
//           month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
//           count: item.exportCount,
//           value: item.exportValue,
//         })),
//         import: importData.map((item) => ({
//           month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
//           count: item.importCount,
//           value: item.importValue,
//         })),
//       };
//     } catch (error) {
//       throw new Error(`Failed to get comparison data: ${error.message}`);
//     }
//   }

//   // Get top export orders by month - All Representatives
//   static async getTopExportData(userId, limit = 10) {
//     try {
//       const startDate = new Date();
//       startDate.setMonth(startDate.getMonth() - limit);

//       const topExportData = await ExportOrder.aggregate([
//         {
//           $match: {
//             createdAt: { $gte: startDate },
//           },
//         },
//         {
//           $unwind: '$details',
//         },
//         {
//           $group: {
//             _id: {
//               year: { $year: '$createdAt' },
//               month: { $month: '$createdAt' },
//             },
//             count: { $sum: 1 },
//             totalValue: {
//               $sum: {
//                 $multiply: ['$details.expected_quantity', '$details.unit_price'],
//               },
//             },
//           },
//         },
//         {
//           $sort: { '_id.year': 1, '_id.month': 1 },
//         },
//         {
//           $limit: limit,
//         },
//       ]);

//       return topExportData.map((item) => ({
//         month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
//         count: item.count,
//         value: item.totalValue,
//       }));
//     } catch (error) {
//       throw new Error(`Failed to get top export data: ${error.message}`);
//     }
//   }

//   // Get recent activity - All Representatives
//   static async getRecentActivity(userId, limit = 10) {
//     try {
//       const recentActivity = await ExportOrder.find({})
//         .populate('contract_id', 'contract_code')
//         .populate('warehouse_manager_id', 'email')
//         .populate('created_by', 'email') // Thêm thông tin Representative
//         .sort({ createdAt: -1 })
//         .limit(limit)
//         .select('order_code contract_id warehouse_manager_id status details createdAt created_by');

//       return recentActivity.map((order) => {
//         const totalValue = order.details.reduce((sum, detail) => {
//           return sum + detail.expected_quantity * detail.unit_price;
//         }, 0);

//         return {
//           id: order._id,
//           orderCode: order.order_code,
//           contractCode: order.contract_id?.contract_code,
//           warehouseManager: order.warehouse_manager_id?.email,
//           representative: order.created_by?.email, // Thêm thông tin Representative
//           status: order.status,
//           totalValue: totalValue,
//           createdAt: order.createdAt,
//         };
//       });
//     } catch (error) {
//       throw new Error(`Failed to get recent activity: ${error.message}`);
//     }
//   }

//   // Get dashboard statistics by date range - All Representatives
//   static async getDashboardStats(userId, startDate, endDate) {
//     try {
//       const stats = await Promise.all([
//         // Export Orders Stats
//         ExportOrder.aggregate([
//           {
//             $match: {
//               createdAt: { $gte: startDate, $lte: endDate },
//             },
//           },
//           {
//             $group: {
//               _id: null,
//               totalOrders: { $sum: 1 },
//               totalValue: { $sum: '$total_value' },
//               avgValue: { $avg: '$total_value' },
//             },
//           },
//         ]),

//         // Import Orders Stats
//         ImportOrder.aggregate([
//           {
//             $match: {
//               createdAt: { $gte: startDate, $lte: endDate },
//             },
//           },
//           {
//             $group: {
//               _id: null,
//               totalOrders: { $sum: 1 },
//               totalValue: { $sum: '$total_value' },
//               avgValue: { $avg: '$total_value' },
//             },
//           },
//         ]),

//         // Contracts Stats
//         Contract.aggregate([
//           {
//             $match: {
//               createdAt: { $gte: startDate, $lte: endDate },
//             },
//           },
//           {
//             $group: {
//               _id: null,
//               totalContracts: { $sum: 1 },
//             },
//           },
//         ]),
//       ]);

//       return {
//         exportOrders: stats[0][0] || { totalOrders: 0, totalValue: 0, avgValue: 0 },
//         importOrders: stats[1][0] || { totalOrders: 0, totalValue: 0, avgValue: 0 },
//         contracts: stats[2][0] || { totalContracts: 0 },
//       };
//     } catch (error) {
//       throw new Error(`Failed to get dashboard stats: ${error.message}`);
//     }
//   }

//   // Get warehouse manager dashboard data
//   static async getWarehouseManagerDashboard(userId) {
//     try {
//       const currentDate = new Date();
//       const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
//       const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

//       const [
//         totalInventory,
//         pendingImportOrders,
//         pendingExportOrders,
//         completedOrders,
//         lowStockItems,
//         totalInventoryValue,
//         recentImportOrders,
//         recentExportOrders,
//         lowStockMedicines,
//         chartData,
//       ] = await Promise.all([
//         // Total inventory items
//         Inventory.countDocuments({}),

//         // Pending import orders
//         ImportOrder.countDocuments({
//           status: { $in: ['draft', 'approved', 'delivered'] },
//         }),

//         // Pending export orders
//         ExportOrder.countDocuments({
//           status: { $in: ['draft', 'approved'] },
//         }),

//         // Completed orders this month
//         Promise.all([
//           ImportOrder.countDocuments({
//             status: 'completed',
//             createdAt: { $gte: startOfMonth, $lte: endOfMonth },
//           }),
//           ExportOrder.countDocuments({
//             status: 'completed',
//             createdAt: { $gte: startOfMonth, $lte: endOfMonth },
//           }),
//         ]).then(([importCompleted, exportCompleted]) => importCompleted + exportCompleted),

//         // Low stock items
//         Inventory.countDocuments({
//           $expr: { $lte: ['$quantity', { $ifNull: ['$min_quantity', 10] }] },
//         }),

//         // Total inventory value
//         Inventory.aggregate([
//           {
//             $group: {
//               _id: null,
//               totalValue: { $sum: { $multiply: ['$quantity', { $ifNull: ['$unit_price', 0] }] } },
//             },
//           },
//         ]),

//         // Recent import orders
//         ImportOrder.find({})
//           .populate('contract_id', 'contract_code')
//           .populate('created_by', 'email')
//           .sort({ createdAt: -1 })
//           .limit(5)
//           .select('_id status createdAt contract_id created_by'),

//         // Recent export orders
//         ExportOrder.find({})
//           .populate('contract_id', 'contract_code')
//           .populate('created_by', 'email')
//           .sort({ createdAt: -1 })
//           .limit(5)
//           .select('_id status createdAt contract_id created_by'),

//         // Low stock medicines
//         Inventory.find({
//           $expr: { $lte: ['$quantity', { $ifNull: ['$min_quantity', 10] }] },
//         })
//           .populate('medicine_id', 'medicine_name license_code')
//           .sort({ quantity: 1 })
//           .limit(5)
//           .select('_id quantity min_quantity medicine_id'),

//         // Chart data for last 6 months
//         this.getWarehouseManagerChartData(userId, 6),
//       ]);

//       return {
//         stats: {
//           totalInventory,
//           pendingImportOrders,
//           pendingExportOrders,
//           completedOrders,
//           lowStockItems,
//           totalValue: totalInventoryValue[0]?.totalValue || 0,
//         },
//         recentImportOrders,
//         recentExportOrders,
//         lowStockMedicines,
//         chartData,
//       };
//     } catch (error) {
//       console.error('getWarehouseManagerDashboard Error:', error);
//       throw new Error(`Failed to get warehouse manager dashboard data: ${error.message}`);
//     }
//   }

//   // Get supervisor recent activity
//   static async getSupervisorRecentActivity(userId, limit = 10) {
//     try {
//       const recentActivity = await Promise.all([
//         // Recent import orders
//         ImportOrder.find({})
//           .populate('contract_id', 'contract_code')
//           .populate('created_by', 'email')
//           .sort({ createdAt: -1 })
//           .limit(limit)
//           .select('_id status createdAt contract_id created_by total_value'),

//         // Recent export orders
//         ExportOrder.find({})
//           .populate('contract_id', 'contract_code')
//           .populate('created_by', 'email')
//           .sort({ createdAt: -1 })
//           .limit(limit)
//           .select('_id status createdAt contract_id created_by total_value'),

//         // Recent inventory checks (if model exists)
//         // InventoryCheck.find({})
//         //   .populate('created_by', 'email')
//         //   .sort({ createdAt: -1 })
//         //   .limit(limit)
//         //   .select('_id check_code status createdAt created_by'),

//         // Recent user activities
//         // Account.find({})
//         //   .sort({ createdAt: -1 })
//         //   .limit(limit)
//         //   .select('_id email role status createdAt')
//       ]);

//       // Combine and format activities
//       const allActivities = [
//         ...(recentActivity[0] || []).map((order) => ({
//           id: order._id,
//           type: 'import',
//           title: `Import Order ${order._id.toString().slice(-6).toUpperCase()}`,
//           description: `Contract: ${order.contract_id?.contract_code || 'N/A'} | Created by ${order.created_by?.email || 'Unknown'}`,
//           status: order.status,
//           timestamp: order.createdAt,
//           value: order.total_value || 0,
//           contractCode: order.contract_id?.contract_code,
//           orderCode: order._id.toString().slice(-6).toUpperCase(),
//         })),
//         ...(recentActivity[1] || []).map((order) => ({
//           id: order._id,
//           type: 'export',
//           title: `Export Order ${order._id.toString().slice(-6).toUpperCase()}`,
//           description: `Contract: ${order.contract_id?.contract_code || 'N/A'} | Created by ${order.created_by?.email || 'Unknown'}`,
//           status: order.status,
//           timestamp: order.createdAt,
//           value: order.total_value || 0,
//           contractCode: order.contract_id?.contract_code,
//           orderCode: order._id.toString().slice(-6).toUpperCase(),
//         })),
//       ];

//       // Sort by timestamp and take top limit
//       const sortedActivities = allActivities
//         .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
//         .slice(0, limit);

//       return sortedActivities;
//     } catch (error) {
//       console.error('getSupervisorRecentActivity Error:', error);
//       throw new Error(`Failed to get supervisor recent activity: ${error.message}`);
//     }
//   }

//   // Get warehouse manager chart data
//   static async getWarehouseManagerChartData(userId, months = 6) {
//     try {
//       const startDate = new Date();
//       startDate.setMonth(startDate.getMonth() - months);

//       const monthlyData = await Promise.all([
//         // Import orders monthly data
//         ImportOrder.aggregate([
//           {
//             $match: {
//               createdAt: { $gte: startDate },
//             },
//           },
//           {
//             $group: {
//               _id: {
//                 year: { $year: '$createdAt' },
//                 month: { $month: '$createdAt' },
//               },
//               count: { $sum: 1 },
//               totalValue: {
//                 $sum: {
//                   $reduce: {
//                     input: '$details',
//                     initialValue: 0,
//                     in: {
//                       $add: ['$$value', { $multiply: ['$$this.quantity', '$$this.unit_price'] }],
//                     },
//                   },
//                 },
//               },
//             },
//           },
//           {
//             $sort: { '_id.year': 1, '_id.month': 1 },
//           },
//         ]),

//         // Export orders monthly data
//         ExportOrder.aggregate([
//           {
//             $match: {
//               createdAt: { $gte: startDate },
//             },
//           },
//           {
//             $group: {
//               _id: {
//                 year: { $year: '$createdAt' },
//                 month: { $month: '$createdAt' },
//               },
//               count: { $sum: 1 },
//               totalValue: {
//                 $sum: {
//                   $reduce: {
//                     input: '$details',
//                     initialValue: 0,
//                     in: {
//                       $add: [
//                         '$$value',
//                         { $multiply: ['$$this.expected_quantity', '$$this.unit_price'] },
//                       ],
//                     },
//                   },
//                 },
//               },
//             },
//           },
//           {
//             $sort: { '_id.year': 1, '_id.month': 1 },
//           },
//         ]),
//       ]);

//       // Generate labels for last 6 months
//       const labels = [];
//       const importData = [];
//       const exportData = [];
//       const importValues = [];
//       const exportValues = [];

//       for (let i = months - 1; i >= 0; i--) {
//         const date = new Date();
//         date.setMonth(date.getMonth() - i);
//         const year = date.getFullYear();
//         const month = date.getMonth() + 1;

//         labels.push(`${month}/${year}`);

//         // Find data for this month
//         const importMonthData = monthlyData[0].find(
//           (item) => item._id.year === year && item._id.month === month,
//         );
//         const exportMonthData = monthlyData[1].find(
//           (item) => item._id.year === year && item._id.month === month,
//         );

//         importData.push(importMonthData?.count || 0);
//         exportData.push(exportMonthData?.count || 0);
//         importValues.push(importMonthData?.totalValue || 0);
//         exportValues.push(exportMonthData?.totalValue || 0);
//       }

//       return {
//         labels,
//         datasets: [
//           {
//             label: 'Import Orders',
//             data: importData,
//             borderColor: '#2196F3',
//             backgroundColor: 'rgba(33, 150, 243, 0.1)',
//             tension: 0.4,
//           },
//           {
//             label: 'Export Orders',
//             data: exportData,
//             borderColor: '#4CAF50',
//             backgroundColor: 'rgba(76, 175, 80, 0.1)',
//             tension: 0.4,
//           },
//         ],
//         valueDatasets: [
//           {
//             label: 'Import Value (VND)',
//             data: importValues,
//             borderColor: '#FF9800',
//             backgroundColor: 'rgba(255, 152, 0, 0.1)',
//             tension: 0.4,
//           },
//           {
//             label: 'Export Value (VND)',
//             data: exportValues,
//             borderColor: '#9C27B0',
//             backgroundColor: 'rgba(156, 39, 176, 0.1)',
//             tension: 0.4,
//           },
//         ],
//       };
//     } catch (error) {
//       console.error('getWarehouseManagerChartData Error:', error);
//       throw new Error(`Failed to get warehouse manager chart data: ${error.message}`);
//     }
//   }
// }

// module.exports = DashboardService;
