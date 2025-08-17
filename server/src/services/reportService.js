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
        period = 'monthly',
        status,
        type,
        partnerType,
        page,
        limit,
      } = filters;

      console.log('Filters received:', filters);

      const statusFilter = status && status !== 'all' ? { status: status.toUpperCase() } : {};
      const typeFilter = type && type !== 'all' ? { type } : {};

      const combinedFilter = {
        ...statusFilter,
        ...typeFilter,
      };

      console.log('Combined filter:', JSON.stringify(combinedFilter, null, 2));

      // Find bills and populate nested references
      let bills = await Bill.find(combinedFilter)
        .populate({
          path: 'import_order_id',
          select: 'order_code contract_id status updatedAt',
          populate: {
            path: 'contract_id',
            select: 'contract_code partner_type partner_id',
          },
        })
        .populate({
          path: 'export_order_id',
          select: 'order_code contract_id status updatedAt',
          populate: {
            path: 'contract_id',
            select: 'contract_code partner_type partner_id',
          },
        })
        .sort({ createdAt: -1 });

      console.log('Found bills:', bills.length);

      // Debug: Check if bills have populated import_order_id
      bills.forEach((bill, index) => {
        console.log(`Bill ${index + 1} (${bill._id}):`);
        console.log('  - createdAt:', bill.createdAt);
        console.log('  - updatedAt:', bill.updatedAt);
        console.log('  - import_order_id:', bill.import_order_id ? 'EXISTS' : 'NULL');
        console.log('  - import_order_id.updatedAt:', bill.import_order_id?.updatedAt);
        console.log('  - import_order_id.status:', bill.import_order_id?.status);
        console.log('  - export_order_id:', bill.export_order_id ? 'EXISTS' : 'NULL');
        console.log('  - export_order_id.updatedAt:', bill.export_order_id?.updatedAt);
        console.log('  - export_order_id.status:', bill.export_order_id?.status);
      });

      // Apply date filtering based on Bill's createdAt/updatedAt
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        console.log('Date filter range:', { startDate, endDate, start, end });

        bills = bills.filter((bill) => {
          // Use Bill's createdAt for date filtering since it has timestamps now
          const billDateToFilter = bill.createdAt;
          console.log(`Bill ${bill._id}: createdAt =`, billDateToFilter);

          const isInRange =
            billDateToFilter && billDateToFilter >= start && billDateToFilter <= end;
          console.log(
            `Bill ${bill._id}: Date in range? ${isInRange} (${billDateToFilter} >= ${start} && ${billDateToFilter} <= ${end})`,
          );

          return isInRange;
        });

        console.log('Bills after date filtering:', bills.length);
      }

      // Filter by partnerType if provided (since partnerType is nested)
      if (partnerType) {
        bills = bills.filter((bill) => {
          const importPartnerType = bill.import_order_id?.contract_id?.partner_type;
          const exportPartnerType = bill.export_order_id?.contract_id?.partner_type;
          return importPartnerType === partnerType || exportPartnerType === partnerType;
        });
      }

      // Apply pagination
      const totalBills = bills.length;
      const skip = (page - 1) * limit;
      const paginatedBills = bills.slice(skip, skip + limit);

      console.log(
        `Pagination: page=${page}, limit=${limit}, total=${totalBills}, showing=${paginatedBills.length}`,
      );

      // Process bills
      const processedBills = paginatedBills.map((bill) => {
        const billValue = bill.details.reduce(
          (sum, detail) => sum + detail.quantity * detail.unit_price,
          0,
        );

        let contractCode = 'N/A';
        let partnerTypeVal = 'N/A';
        let partnerId = 'N/A';
        let orderCode = 'N/A';
        let orderType = 'N/A';
        let billCreatedAt = bill.createdAt; // Use Bill's createdAt
        let billUpdatedAt = bill.updatedAt; // Use Bill's updatedAt

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

        // Determine bill status based on amount paid
        let billStatus = 'pending';
        if (bill.amountPaid > 0) {
          if (bill.amountPaid >= billValue) {
            billStatus = 'completed';
          } else {
            billStatus = 'partial';
          }
        }

        return {
          id: bill._id.toString(),
          billCode: bill.bill_code || `BILL_${bill._id.toString().slice(-8)}`,
          voucherCode: bill.voucher_code || 'N/A',
          contractCode,
          partnerType: partnerTypeVal,
          partnerId,
          orderCode,
          orderType,
          billType: bill.type,
          status: billStatus,
          totalValue: billValue,
          amountPaid: bill.amountPaid || 0,
          remainingAmount: billValue - (bill.amountPaid || 0),
          paymentDate: bill.payment_date || null,
          dueDate: bill.due_date || null,
          createdAt: billCreatedAt,
          updatedAt: billUpdatedAt,
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
        totalBills: totalBills, // Use total count, not just current page
        totalValue: processedBills.reduce((sum, bill) => sum + bill.totalValue, 0),
        totalPaid: processedBills.reduce((sum, bill) => sum + bill.amountPaid, 0),
        totalRemaining: processedBills.reduce((sum, bill) => sum + bill.remainingAmount, 0),
        overdueBills: processedBills.filter((bill) => bill.status === 'overdue').length,
        pendingBills: processedBills.filter((bill) => bill.status === 'pending').length,
        completedBills: processedBills.filter((bill) => bill.status === 'completed').length,
        partialBills: processedBills.filter((bill) => bill.status === 'partial').length,
        importBills: processedBills.filter((bill) => bill.orderType === 'IMPORT').length,
        exportBills: processedBills.filter((bill) => bill.orderType === 'EXPORT').length,
      };

      console.log('Processed bills:', processedBills.length);
      console.log('Summary:', summary);

      return {
        success: true,
        data: {
          bills: processedBills,
          summary,
          pagination: {
            page,
            limit,
            total: totalBills,
            totalPages: Math.ceil(totalBills / limit),
          },
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
