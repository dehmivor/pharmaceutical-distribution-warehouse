const Bill = require('../models/Bill');
const ImportOrder = require('../models/ImportOrder');
const ExportOrder = require('../models/ExportOrder');
const Contract = require('../models/Contract');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const mongoose = require('mongoose');

class ReportService {
  // Get comprehensive report data
  static async getComprehensiveReport(filters = {}) {
    try {
      const { startDate, endDate, period = 'monthly', status, type, partnerType } = filters;

      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const statusFilter = status ? { status } : {};
      const typeFilter = type ? { type } : {};

      // Filter partnerType requires checking in nested populated data, so handle later after fetching bills

      const combinedFilter = {
        ...dateFilter,
        ...statusFilter,
        ...typeFilter,
      };

      // Find bills and populate nested references
      let bills = await Bill.find(combinedFilter)
        .populate({
          path: 'import_order_id',
          select: 'order_code contract_id',
          populate: {
            path: 'contract_id',
            select: 'contract_code partner_type partner_id',
          },
        })
        .populate({
          path: 'export_order_id',
          select: 'order_code contract_id',
          populate: {
            path: 'contract_id',
            select: 'contract_code partner_type partner_id',
          },
        })
        .sort({ createdAt: -1 });

      // Filter by partnerType if provided (since partnerType is nested)
      if (partnerType) {
        bills = bills.filter((bill) => {
          const importPartnerType = bill.import_order_id?.contract_id?.partner_type;
          const exportPartnerType = bill.export_order_id?.contract_id?.partner_type;
          return importPartnerType === partnerType || exportPartnerType === partnerType;
        });
      }

      // Process bills
      const processedBills = bills.map((bill) => {
        const billValue = bill.details.reduce(
          (sum, detail) => sum + detail.quantity * detail.unit_price,
          0,
        );

        let contractCode = 'N/A';
        let partnerTypeVal = 'N/A';
        let partnerId = 'N/A';
        let orderCode = 'N/A';
        let orderType = 'N/A';

        if (bill.import_order_id) {
          contractCode = bill.import_order_id.contract_id?.contract_code || 'N/A';
          partnerTypeVal = bill.import_order_id.contract_id?.partner_type || 'N/A';
          partnerId = bill.import_order_id.contract_id?.partner_id || 'N/A';
          orderCode = bill.import_order_id.order_code || 'N/A';
          orderType = 'IMPORT';
        } else if (bill.export_order_id) {
          contractCode = bill.export_order_id.contract_id?.contract_code || 'N/A';
          partnerTypeVal = bill.export_order_id.contract_id?.partner_type || 'N/A';
          partnerId = bill.export_order_id.contract_id?.partner_id || 'N/A';
          orderCode = bill.export_order_id.order_code || 'N/A';
          orderType = 'EXPORT';
        }

        return {
          id: bill._id.toString(),
          billCode: bill.bill_code || 'N/A',
          voucherCode: bill.voucher_code || 'N/A',
          contractCode,
          partnerType: partnerTypeVal,
          partnerId,
          orderCode,
          orderType,
          billType: bill.type,
          status: bill.status.toLowerCase(),
          totalValue: billValue,
          amountPaid: bill.amountPaid || 0,
          remainingAmount: billValue - (bill.amountPaid || 0),
          paymentDate: bill.payment_date || null,
          dueDate: bill.due_date || null,
          createdAt: bill.createdAt,
          updatedAt: bill.updatedAt,
          details: bill.details.map((detail) => ({
            medicineCode: detail.medicine_lisence_code,
            quantity: detail.quantity,
            unitPrice: detail.unit_price,
            totalPrice: detail.quantity * detail.unit_price,
          })),
        };
      });

      // Summary statistics
      const summary = {
        totalBills: processedBills.length,
        totalValue: processedBills.reduce((sum, bill) => sum + bill.totalValue, 0),
        totalPaid: processedBills.reduce((sum, bill) => sum + bill.amountPaid, 0),
        totalRemaining: processedBills.reduce((sum, bill) => sum + bill.remainingAmount, 0),
        overdueBills: processedBills.filter((bill) => bill.status === 'overdue').length,
        pendingBills: processedBills.filter((bill) => bill.status === 'pending').length,
        completedBills: processedBills.filter((bill) => bill.status === 'completed').length,
        importBills: processedBills.filter((bill) => bill.orderType === 'IMPORT').length,
        exportBills: processedBills.filter((bill) => bill.orderType === 'EXPORT').length,
      };

      return {
        success: true,
        data: {
          bills: processedBills,
          summary,
          filters: {
            startDate,
            endDate,
            period,
            status,
            type,
            partnerType,
          },
        },
      };
    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      throw error;
    }
  }

  // Get report by period (weekly, monthly, quarterly)
  static async getReportByPeriod(period = 'monthly', startDate, endDate) {
    try {
      const bills = await Bill.find({
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      }).populate('import_order_id export_order_id');

      // Group by period
      const groupedData = {};

      bills.forEach((bill) => {
        const billDate = new Date(bill.createdAt);
        let periodKey;

        switch (period) {
          case 'weekly':
            const weekStart = new Date(billDate);
            weekStart.setDate(billDate.getDate() - billDate.getDay());
            periodKey = weekStart.toISOString().split('T')[0];
            break;
          case 'monthly':
            periodKey = `${billDate.getFullYear()}-${String(billDate.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'quarterly':
            const quarter = Math.ceil((billDate.getMonth() + 1) / 3);
            periodKey = `${billDate.getFullYear()}-Q${quarter}`;
            break;
          default:
            periodKey = billDate.toISOString().split('T')[0];
        }

        if (!groupedData[periodKey]) {
          groupedData[periodKey] = {
            period: periodKey,
            totalBills: 0,
            totalValue: 0,
            totalPaid: 0,
            totalRemaining: 0,
            overdueBills: 0,
            pendingBills: 0,
            completedBills: 0,
          };
        }

        const billValue = bill.details.reduce(
          (sum, detail) => sum + detail.quantity * detail.unit_price,
          0,
        );

        groupedData[periodKey].totalBills++;
        groupedData[periodKey].totalValue += billValue;
        groupedData[periodKey].totalPaid += bill.amountPaid || 0;
        groupedData[periodKey].totalRemaining += billValue - (bill.amountPaid || 0);

        if (bill.status === 'overdue') groupedData[periodKey].overdueBills++;
        if (bill.status === 'pending') groupedData[periodKey].pendingBills++;
        if (bill.status === 'completed') groupedData[periodKey].completedBills++;
      });

      return {
        success: true,
        data: Object.values(groupedData).sort((a, b) => a.period.localeCompare(b.period)),
      };
    } catch (error) {
      console.error('Error generating period report:', error);
      throw error;
    }
  }

  // Get partner analysis report
  static async getPartnerAnalysisReport(startDate, endDate) {
    try {
      const bills = await Bill.find({
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      }).populate({
        path: 'import_order_id export_order_id',
        populate: {
          path: 'contract_id',
          select: 'contract_code partner_type partner_id',
        },
      });

      const partnerAnalysis = {};

      bills.forEach((bill) => {
        let contractCode = 'N/A';
        let partnerType = 'N/A';
        let partnerId = 'N/A';

        if (bill.import_order_id?.contract_id) {
          contractCode = bill.import_order_id.contract_id.contract_code;
          partnerType = bill.import_order_id.contract_id.partner_type;
          partnerId = bill.import_order_id.contract_id.partner_id;
        } else if (bill.export_order_id?.contract_id) {
          contractCode = bill.export_order_id.contract_id.contract_code;
          partnerType = bill.export_order_id.contract_id.partner_type;
          partnerId = bill.export_order_id.contract_id.partner_id;
        }

        const key = `${contractCode}-${partnerType}`;

        if (!partnerAnalysis[key]) {
          partnerAnalysis[key] = {
            contractCode,
            partnerType,
            partnerId,
            totalBills: 0,
            totalValue: 0,
            totalPaid: 0,
            totalRemaining: 0,
            overdueBills: 0,
            pendingBills: 0,
            completedBills: 0,
          };
        }

        const billValue = bill.details.reduce(
          (sum, detail) => sum + detail.quantity * detail.unit_price,
          0,
        );

        partnerAnalysis[key].totalBills++;
        partnerAnalysis[key].totalValue += billValue;
        partnerAnalysis[key].totalPaid += bill.amountPaid || 0;
        partnerAnalysis[key].totalRemaining += billValue - (bill.amountPaid || 0);

        if (bill.status === 'overdue') partnerAnalysis[key].overdueBills++;
        if (bill.status === 'pending') partnerAnalysis[key].pendingBills++;
        if (bill.status === 'completed') partnerAnalysis[key].completedBills++;
      });

      return {
        success: true,
        data: Object.values(partnerAnalysis).sort((a, b) => b.totalValue - a.totalValue),
      };
    } catch (error) {
      console.error('Error generating partner analysis report:', error);
      throw error;
    }
  }

  // Get medicine analysis report
  static async getMedicineAnalysisReport(startDate, endDate) {
    try {
      const bills = await Bill.find({
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      });

      const medicineAnalysis = {};

      bills.forEach((bill) => {
        bill.details.forEach((detail) => {
          const medicineCode = detail.medicine_lisence_code;

          if (!medicineAnalysis[medicineCode]) {
            medicineAnalysis[medicineCode] = {
              medicineCode,
              totalQuantity: 0,
              totalValue: 0,
              averagePrice: 0,
              billCount: 0,
            };
          }

          medicineAnalysis[medicineCode].totalQuantity += detail.quantity;
          medicineAnalysis[medicineCode].totalValue += detail.quantity * detail.unit_price;
          medicineAnalysis[medicineCode].billCount++;
        });
      });

      // Calculate average prices
      Object.values(medicineAnalysis).forEach((medicine) => {
        medicine.averagePrice = medicine.totalValue / medicine.totalQuantity;
      });

      return {
        success: true,
        data: Object.values(medicineAnalysis).sort((a, b) => b.totalValue - a.totalValue),
      };
    } catch (error) {
      console.error('Error generating medicine analysis report:', error);
      throw error;
    }
  }

  // Get import orders report
  static async getImportOrdersReport(filters = {}) {
    try {
      const {
        startDate,
        endDate,
        period = 'monthly',
        status,
        supplierId,
        page = 1,
        limit = 10,
      } = filters;

      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const statusFilter = status && status !== 'all' ? { status } : {};
      const supplierFilter =
        supplierId && supplierId !== 'All Supplier' ? { 'contract_id.partner_id': supplierId } : {};

      const combinedFilter = {
        ...dateFilter,
        ...statusFilter,
        ...supplierFilter,
      };

      const skip = (page - 1) * limit;

      // Find import orders with populated references
      const importOrders = await ImportOrder.find(combinedFilter)
        .populate({
          path: 'contract_id',
          select: 'contract_code partner_id status',
          populate: {
            path: 'partner_id',
            select: 'name',
          },
        })
        .populate({
          path: 'warehouse_manager_id',
          select: 'full_name',
        })
        .populate({
          path: 'created_by',
          select: 'full_name',
        })
        .populate({
          path: 'approval_by',
          select: 'full_name',
        })
        .populate({
          path: 'details.medicine_id',
          select: 'medicine_name license_code unit_of_measure category status',
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Get total count for pagination
      const totalCount = await ImportOrder.countDocuments(combinedFilter);

      // Process import orders data
      const processedOrders = importOrders.map((order) => {
        const contractCode = order.contract_id?.contract_code || 'N/A';
        const contractStatus = order.contract_id?.status || 'N/A';
        const supplierName = order.contract_id?.partner_id?.name || 'N/A';
        const warehouseManager = order.warehouse_manager_id?.full_name || 'N/A';
        const createdBy = order.created_by?.full_name || 'N/A';
        const approvedBy = order.approval_by?.full_name || 'N/A';

        // Calculate total value from medicine details
        const totalValue = order.details.reduce((sum, detail) => {
          const unitPrice = 1000; // Placeholder value since unit_price is not available
          return sum + detail.quantity * unitPrice;
        }, 0);

        return {
          id: order._id.toString(),
          orderCode: `IMP_${order._id.toString().slice(-8)}`,
          contractCode,
          contractStatus,
          supplierName,
          warehouseManager,
          status: order.status,
          orderType: order.order_type || 'IMPORT',
          totalValue: Math.round(totalValue / 1000), // Convert to thousands for VND display
          createdBy,
          approvedBy,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          // Medicine details for detailed view
          medicineDetails: order.details.map((detail) => ({
            medicineName: detail.medicine_id?.medicine_name || 'Unknown Medicine',
            medicineCode: detail.medicine_id?.license_code || 'N/A',
            quantity: detail.quantity,
            unitPrice: 1000, // Placeholder value since unit_price is not available
            totalPrice: detail.quantity * 1000,
            category: detail.medicine_id?.category || 'N/A',
            unitOfMeasure: detail.medicine_id?.unit_of_measure || 'N/A',
            status: detail.medicine_id?.status || 'N/A',
          })),
        };
      });

      return {
        success: true,
        data: {
          importOrders: processedOrders,
          pagination: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
          },
        },
      };
    } catch (error) {
      console.error('Error getting import orders report:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Export import orders report to Excel
  static async exportImportOrdersReport(filters = {}) {
    try {
      const { startDate, endDate, period = 'monthly', status, supplierId } = filters;

      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const statusFilter = status && status !== 'all' ? { status } : {};
      const supplierFilter =
        supplierId && supplierId !== 'All Supplier' ? { 'contract_id.partner_id': supplierId } : {};

      const combinedFilter = {
        ...dateFilter,
        ...statusFilter,
        ...supplierFilter,
      };

      // Find all import orders for export (no pagination)
      const importOrders = await ImportOrder.find(combinedFilter)
        .populate({
          path: 'contract_id',
          select: 'contract_code partner_id status',
          populate: {
            path: 'partner_id',
            select: 'name',
          },
        })
        .populate({
          path: 'warehouse_manager_id',
          select: 'full_name',
        })
        .populate({
          path: 'created_by',
          select: 'full_name',
        })
        .populate({
          path: 'approval_by',
          select: 'full_name',
        })
        .populate({
          path: 'details.medicine_id',
          select: 'medicine_name license_code unit_of_measure category status',
        })
        .sort({ createdAt: -1 });

      // Process export data
      const exportData = importOrders.map((order) => {
        const contractCode = order.contract_id?.contract_code || 'N/A';
        const supplierName = order.contract_id?.partner_id?.name || 'N/A';
        const warehouseManager = order.warehouse_manager_id?.full_name || 'N/A';
        const createdBy = order.created_by?.full_name || 'N/A';
        const approvedBy = order.approval_by?.full_name || 'N/A';

        // Calculate total value
        const totalValue = order.details.reduce((sum, detail) => {
          const unitPrice = 1000; // Placeholder value
          return sum + detail.quantity * unitPrice;
        }, 0);

        return {
          'Order Code': `IMP_${order._id.toString().slice(-8)}`,
          'Contract Code': contractCode,
          'Supplier Name': supplierName,
          'Warehouse Manager': warehouseManager,
          Status: order.status,
          'Order Type': order.order_type || 'IMPORT',
          'Total Value (VND)': totalValue,
          'Created By': createdBy,
          'Approved By': approvedBy || 'N/A',
          'Created At': order.createdAt.toISOString().split('T')[0],
          'Updated At': order.updatedAt.toISOString().split('T')[0],
        };
      });

      return {
        success: true,
        data: exportData,
      };
    } catch (error) {
      console.error('Error exporting import orders report:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get import report summary
  static async getImportReportSummary(filters = {}) {
    try {
      const { startDate, endDate, period = 'monthly' } = filters;

      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // Get summary statistics
      const totalOrders = await ImportOrder.countDocuments(dateFilter);
      const completedOrders = await ImportOrder.countDocuments({
        ...dateFilter,
        status: 'completed',
      });
      const pendingOrders = await ImportOrder.countDocuments({ ...dateFilter, status: 'pending' });
      const cancelledOrders = await ImportOrder.countDocuments({
        ...dateFilter,
        status: 'cancelled',
      });

      // Get total value
      const ordersWithValue = await ImportOrder.find(dateFilter).populate('details.medicine_id');
      const totalValue = ordersWithValue.reduce((sum, order) => {
        const orderValue = order.details.reduce((detailSum, detail) => {
          const unitPrice = 1000; // Placeholder value
          return detailSum + detail.quantity * unitPrice;
        }, 0);
        return sum + orderValue;
      }, 0);

      return {
        success: true,
        data: {
          totalOrders,
          completedOrders,
          pendingOrders,
          cancelledOrders,
          totalValue: Math.round(totalValue / 1000), // Convert to thousands
          completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
        },
      };
    } catch (error) {
      console.error('Error getting import report summary:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get import report dashboard data
  static async getImportReportDashboard(filters = {}) {
    try {
      const { startDate, endDate, period = 'monthly' } = filters;

      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // Get both report data and summary
      const [reportResult, summaryResult] = await Promise.all([
        this.getImportOrdersReport({ ...filters, page: 1, limit: 10 }),
        this.getImportReportSummary(filters),
      ]);

      if (reportResult.success && summaryResult.success) {
        return {
          success: true,
          data: {
            recentOrders: reportResult.data.importOrders,
            summary: summaryResult.data,
            filters,
          },
        };
      } else {
        return {
          success: false,
          error: 'Failed to retrieve dashboard data',
        };
      }
    } catch (error) {
      console.error('Error getting import report dashboard:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = ReportService;
