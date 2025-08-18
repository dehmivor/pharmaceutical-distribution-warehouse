const ExportOrder = require('../models/ExportOrder');
const Contract = require('../models/Contract');
const User = require('../models/User');
const mongoose = require('mongoose');

class ExportReportService {
  // Get export orders report data
  static async getExportOrdersReport(filters = {}) {
    try {
      const { startDate, endDate, period = 'monthly', status, partnerType, page, limit } = filters;

      console.log('Export report filters received:', filters);

      const statusFilter = status && status !== 'all' ? { status: status.toUpperCase() } : {};
      const partnerTypeFilter = partnerType ? { partner_type: partnerType.toLowerCase() } : {};

      console.log('Status filter:', statusFilter);
      console.log('Partner type filter:', partnerTypeFilter);

      // Find export orders and populate nested references
      let exportOrders = await ExportOrder.find(statusFilter)
        .populate({
          path: 'contract_id',
          select: 'contract_code partner_type partner_id',
          match: partnerTypeFilter,
        })
        .populate({
          path: 'created_by',
          select: 'username email full_name',
        })
        .populate({
          path: 'approval_by',
          select: 'username email full_name',
        })
        .populate({
          path: 'warehouse_manager_id',
          select: 'username email full_name',
        })
        .sort({ createdAt: -1 });

      console.log('Found export orders:', exportOrders.length);

      // Filter by date range if provided
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        console.log('Date filter range:', { startDate, endDate, start, end });

        exportOrders = exportOrders.filter((order) => {
          const orderDate = order.createdAt;
          console.log(`Export order ${order._id}: createdAt =`, orderDate);

          const isInRange = orderDate && orderDate >= start && orderDate <= end;
          console.log(
            `Export order ${order._id}: Date in range? ${isInRange} (${orderDate} >= ${start} && ${orderDate} <= ${end})`,
          );

          return isInRange;
        });

        console.log('Export orders after date filtering:', exportOrders.length);
      }

      // Filter by partner type if provided
      if (partnerType) {
        exportOrders = exportOrders.filter((order) => {
          return (
            order.contract_id &&
            order.contract_id.partner_type.toLowerCase() === partnerType.toLowerCase()
          );
        });
        console.log('Export orders after partner type filtering:', exportOrders.length);
      }

      // Apply pagination
      const totalOrders = exportOrders.length;
      const skip = (page - 1) * limit;
      const paginatedOrders = exportOrders.slice(skip, skip + limit);

      console.log(
        `Pagination: page=${page}, limit=${limit}, total=${totalOrders}, showing=${paginatedOrders.length}`,
      );

      // Process export orders
      const processedOrders = paginatedOrders.map((order) => {
        // Calculate total value from details (convert to thousands VND)
        const totalValue =
          order.details.reduce(
            (sum, detail) => sum + (detail.quantity || 0) * (detail.unit_price || 0),
            0,
          ) / 1000; // Convert to thousands VND

        return {
          id: order._id.toString(),
          orderCode: order.order_code || `EXP_${order._id.toString().slice(-8)}`,
          contractCode: order.contract_id?.contract_code || 'N/A',
          partnerType: order.contract_id?.partner_type || 'N/A',
          partnerId: order.contract_id?.partner_id || 'N/A',
          status: order.status,
          orderType: 'EXPORT',
          totalValue: totalValue,
          totalQuantity: order.details.reduce((sum, detail) => sum + (detail.quantity || 0), 0),
          createdBy:
            order.created_by?.email ||
            order.created_by?.full_name ||
            order.created_by?.username ||
            'N/A',
          approvedBy:
            order.approval_by?.email ||
            order.approval_by?.full_name ||
            order.approval_by?.username ||
            'N/A',
          warehouseManager:
            order.warehouse_manager_id?.full_name || order.warehouse_manager_id?.username || 'N/A',
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          details: order.details.map((detail) => ({
            medicineCode: detail.medicine_lisence_code || 'N/A',
            quantity: detail.quantity || 0,
            unitPrice: detail.unit_price || 0,
            totalPrice: (detail.quantity || 0) * (detail.unit_price || 0),
          })),
        };
      });

      // Calculate total value for summary (already in thousands VND)
      const totalValue = processedOrders.reduce((sum, order) => sum + order.totalValue, 0);

      // Summary statistics
      const summary = {
        totalOrders: totalOrders,
        totalValue: totalValue,
        totalQuantity: processedOrders.reduce((sum, order) => sum + order.totalQuantity, 0),
        draftOrders: processedOrders.filter((order) => order.status === 'draft').length,
        pendingOrders: processedOrders.filter((order) => order.status === 'pending').length,
        processingOrders: processedOrders.filter((order) => order.status === 'processing').length,
        completedOrders: processedOrders.filter((order) => order.status === 'completed').length,
        cancelledOrders: processedOrders.filter((order) => order.status === 'cancelled').length,
        rejectedOrders: processedOrders.filter((order) => order.status === 'rejected').length,
        averageOrderValue: totalOrders > 0 ? Math.round(totalValue / totalOrders) : 0,
      };

      console.log('Processed export orders:', processedOrders.length);
      console.log('Summary:', summary);

      return {
        success: true,
        data: {
          exportOrders: processedOrders,
          summary,
          pagination: {
            page,
            limit,
            total: totalOrders,
            pages: Math.ceil(totalOrders / limit),
          },
        },
      };
    } catch (error) {
      console.error('Error in getExportOrdersReport:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get export orders report by period
  static async getExportOrdersReportByPeriod(period, startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      let exportOrders = await ExportOrder.find({
        createdAt: { $gte: start, $lte: end },
      })
        .populate({
          path: 'contract_id',
          select: 'contract_code partner_type partner_id',
        })
        .populate({
          path: 'created_by',
          select: 'username full_name',
        })
        .sort({ createdAt: -1 });

      // Group by period
      let groupedData = {};

      if (period === 'weekly') {
        // Group by week
        exportOrders.forEach((order) => {
          const weekStart = new Date(order.createdAt);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekKey = weekStart.toISOString().split('T')[0];

          if (!groupedData[weekKey]) {
            groupedData[weekKey] = {
              period: weekKey,
              orders: [],
              totalValue: 0,
              totalQuantity: 0,
            };
          }

          const totalValue = order.details.reduce(
            (sum, detail) => sum + (detail.quantity || 0) * (detail.unit_price || 0),
            0,
          );

          groupedData[weekKey].orders.push(order);
          groupedData[weekKey].totalValue += totalValue;
          groupedData[weekKey].totalQuantity += order.details.reduce(
            (sum, detail) => sum + (detail.quantity || 0),
            0,
          );
        });
      } else if (period === 'monthly') {
        // Group by month
        exportOrders.forEach((order) => {
          const monthKey = order.createdAt.toISOString().slice(0, 7); // YYYY-MM

          if (!groupedData[monthKey]) {
            groupedData[monthKey] = {
              period: monthKey,
              orders: [],
              totalValue: 0,
              totalQuantity: 0,
            };
          }

          const totalValue = order.details.reduce(
            (sum, detail) => sum + (detail.quantity || 0) * (detail.unit_price || 0),
            0,
          );

          groupedData[monthKey].orders.push(order);
          groupedData[monthKey].totalValue += totalValue;
          groupedData[monthKey].totalQuantity += order.details.reduce(
            (sum, detail) => sum + (detail.quantity || 0),
            0,
          );
        });
      } else if (period === 'quarterly') {
        // Group by quarter
        exportOrders.forEach((order) => {
          const month = order.createdAt.getMonth();
          const quarter = Math.floor(month / 3) + 1;
          const year = order.createdAt.getFullYear();
          const quarterKey = `Q${quarter} ${year}`;

          if (!groupedData[quarterKey]) {
            groupedData[quarterKey] = {
              period: quarterKey,
              orders: [],
              totalValue: 0,
              totalQuantity: 0,
            };
          }

          const totalValue = order.details.reduce(
            (sum, detail) => sum + (detail.quantity || 0) * (detail.unit_price || 0),
            0,
          );

          groupedData[quarterKey].orders.push(order);
          groupedData[quarterKey].totalValue += totalValue;
          groupedData[quarterKey].totalQuantity += order.details.reduce(
            (sum, detail) => sum + (detail.quantity || 0),
            0,
          );
        });
      }

      return {
        success: true,
        data: {
          period,
          startDate,
          endDate,
          groupedData: Object.values(groupedData),
          summary: {
            totalOrders: exportOrders.length,
            totalValue: exportOrders.reduce((sum, order) => {
              return (
                sum +
                order.details.reduce(
                  (detailSum, detail) =>
                    detailSum + (detail.quantity || 0) * (detail.unit_price || 0),
                  0,
                )
              );
            }, 0),
            totalQuantity: exportOrders.reduce(
              (sum, order) =>
                sum +
                order.details.reduce((detailSum, detail) => detailSum + (detail.quantity || 0), 0),
              0,
            ),
          },
        },
      };
    } catch (error) {
      console.error('Error in getExportOrdersReportByPeriod:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get partner analysis report for export orders
  static async getExportOrdersPartnerAnalysis(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const exportOrders = await ExportOrder.find({
        createdAt: { $gte: start, $lte: end },
      })
        .populate({
          path: 'contract_id',
          select: 'contract_code partner_type partner_id',
        })
        .populate({
          path: 'created_by',
          select: 'username full_name',
        });

      // Group by partner
      const partnerAnalysis = {};

      exportOrders.forEach((order) => {
        if (order.contract_id) {
          const partnerId = order.contract_id.partner_id;
          const partnerType = order.contract_id.partner_type;

          if (!partnerAnalysis[partnerId]) {
            partnerAnalysis[partnerId] = {
              partnerId,
              partnerType,
              totalOrders: 0,
              totalValue: 0,
              totalQuantity: 0,
              orders: [],
            };
          }

          const totalValue = order.details.reduce(
            (sum, detail) => sum + (detail.quantity || 0) * (detail.unit_price || 0),
            0,
          );

          partnerAnalysis[partnerId].totalOrders += 1;
          partnerAnalysis[partnerId].totalValue += totalValue;
          partnerAnalysis[partnerId].totalQuantity += order.details.reduce(
            (sum, detail) => sum + (detail.quantity || 0),
            0,
          );
          partnerAnalysis[partnerId].orders.push(order);
        }
      });

      return {
        success: true,
        data: {
          startDate,
          endDate,
          partnerAnalysis: Object.values(partnerAnalysis),
          summary: {
            totalPartners: Object.keys(partnerAnalysis).length,
            totalOrders: exportOrders.length,
            totalValue: exportOrders.reduce((sum, order) => {
              return (
                sum +
                order.details.reduce(
                  (detailSum, detail) =>
                    detailSum + (detail.quantity || 0) * (detail.unit_price || 0),
                  0,
                )
              );
            }, 0),
          },
        },
      };
    } catch (error) {
      console.error('Error in getExportOrdersPartnerAnalysis:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Export export orders report to Excel
  static async exportExportOrdersToExcel(filters = {}) {
    try {
      const reportData = await this.getExportOrdersReport(filters);

      if (!reportData.success) {
        throw new Error(reportData.error);
      }

      // This would typically use a library like xlsx to create Excel file
      // For now, return the data structure
      return {
        success: true,
        data: reportData.data,
        filename: `export_orders_report_${new Date().toISOString().split('T')[0]}.xlsx`,
      };
    } catch (error) {
      console.error('Error exporting export orders to Excel:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get partner types from database for filtering
  static async getPartnerTypes() {
    try {
      // Get unique partner types from contracts
      const partnerTypes = await Contract.distinct('partner_type');

      // Filter out null/undefined values and sort alphabetically
      const validPartnerTypes = partnerTypes.filter((type) => type && type.trim() !== '').sort();

      console.log('Found partner types:', validPartnerTypes);

      return {
        success: true,
        data: validPartnerTypes,
      };
    } catch (error) {
      console.error('Error getting partner types:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = ExportReportService;
