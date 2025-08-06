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
      const {
        startDate,
        endDate,
        period = 'monthly', // monthly, quarterly, weekly
        status,
        type,
        partnerType,
      } = filters;

      // Build date filter
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // Build status filter
      const statusFilter = status ? { status } : {};

      // Build type filter
      const typeFilter = type ? { type } : {};

      // Combine filters
      const combinedFilter = {
        ...dateFilter,
        ...statusFilter,
        ...typeFilter,
      };

      // Get bills with populated data
      const bills = await Bill.find(combinedFilter)
        .populate('import_order_id', 'order_code contract_id')
        .populate('export_order_id', 'order_code contract_id')
        .populate({
          path: 'import_order_id',
          populate: {
            path: 'contract_id',
            select: 'contract_code partner_type partner_id',
          },
        })
        .populate({
          path: 'export_order_id',
          populate: {
            path: 'contract_id',
            select: 'contract_code partner_type partner_id',
          },
        })
        .sort({ createdAt: -1 });

      // Process bills data
      const processedBills = bills.map((bill) => {
        const billValue = bill.details.reduce(
          (sum, detail) => sum + detail.quantity * detail.unit_price,
          0,
        );

        let contractCode = 'N/A';
        let partnerType = 'N/A';
        let partnerId = 'N/A';
        let orderCode = 'N/A';
        let orderType = 'N/A';

        if (bill.import_order_id) {
          contractCode = bill.import_order_id.contract_id?.contract_code || 'N/A';
          partnerType = bill.import_order_id.contract_id?.partner_type || 'N/A';
          partnerId = bill.import_order_id.contract_id?.partner_id || 'N/A';
          orderCode = bill.import_order_id.order_code || 'N/A';
          orderType = 'IMPORT';
        } else if (bill.export_order_id) {
          contractCode = bill.export_order_id.contract_id?.contract_code || 'N/A';
          partnerType = bill.export_order_id.contract_id?.partner_type || 'N/A';
          partnerId = bill.export_order_id.contract_id?.partner_id || 'N/A';
          orderCode = bill.export_order_id.order_code || 'N/A';
          orderType = 'EXPORT';
        }

        return {
          id: bill._id,
          billCode: bill.bill_code || 'N/A',
          voucherCode: bill.voucher_code || 'N/A',
          contractCode,
          partnerType,
          partnerId,
          orderCode,
          orderType,
          billType: bill.type,
          status: bill.status,
          totalValue: billValue,
          amountPaid: bill.amountPaid || 0,
          remainingAmount: billValue - (bill.amountPaid || 0),
          paymentDate: bill.payment_date,
          dueDate: bill.due_date,
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

      // Calculate summary statistics
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
}

module.exports = ReportService;
