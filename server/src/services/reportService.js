const Bill = require('../models/Bill');
const ImportOrder = require('../models/ImportOrder');
const ExportOrder = require('../models/ExportOrder');
const Contract = require('../models/Contract');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const mongoose = require('mongoose');

class ReportService {
  // Helper function to get medicine information by license code
  static async getMedicineInfo(licenseCode) {
    try {
      if (!licenseCode || licenseCode === 'N/A') return null;

      const medicine = await Medicine.findOne({
        $or: [
          { license_code: licenseCode },
          { medicine_code: licenseCode },
          { medicine_lisence_code: licenseCode },
        ],
      })
        .select('name medicine_name license_code medicine_code')
        .lean();

      return medicine;
    } catch (error) {
      console.warn('⚠️ Error fetching medicine info for:', licenseCode, error);
      return null;
    }
  }

  // Helper function to clean bill data and remove error fields
  static cleanBillData(bill) {
    try {
      if (!bill || typeof bill !== 'object') {
        return null;
      }

      // Remove error fields and internal fields
      const cleanBill = { ...bill };
      delete cleanBill.error;
      delete cleanBill._id;
      delete cleanBill.__v;

      // Clean details array
      if (cleanBill.details && Array.isArray(cleanBill.details)) {
        cleanBill.details = cleanBill.details
          .map((detail) => {
            if (detail && typeof detail === 'object') {
              const cleanDetail = { ...detail };
              delete cleanDetail.error;
              return cleanDetail;
            }
            return null;
          })
          .filter((detail) => detail !== null);
      }

      return cleanBill;
    } catch (error) {
      console.warn('⚠️ Error cleaning bill data:', error);
      return null;
    }
  }

  // Get comprehensive report data
  static async getComprehensiveReport(filters = {}) {
    try {
      console.log('🔍 getComprehensiveReport called with filters:', filters);
      const {
        startDate,
        endDate,
        period = 'monthly',
        status,
        type,
        partnerType,
        page = 1,
        limit = 10,
      } = filters;

      // Validate and sanitize pagination parameters
      const validatedPage = Math.max(1, parseInt(filters.page) || 1);
      const validatedLimit = Math.min(100, Math.max(1, parseInt(filters.limit) || 10));

      // Build query with filters
      const query = {};

      // Date range filter
      if (startDate && endDate) {
        try {
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // End of day

          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return {
              success: false,
              error: 'Invalid date format',
              data: [],
            };
          }

          query.createdAt = {
            $gte: start,
            $lte: end,
          };
        } catch (dateError) {
          console.warn('⚠️ Invalid date format for comprehensive report:', { startDate, endDate });
          return {
            success: false,
            error: 'Invalid date format',
            data: [],
          };
        }
      }

      // Status filter
      if (status && status !== 'all') {
        query.status = status;
      }

      // Type filter
      if (type && type !== 'all') {
        query.type = type;
      }

      // Partner type filter
      if (partnerType && partnerType !== 'all') {
        try {
          // This will be handled after population
          query.partnerType = partnerType;
        } catch (partnerError) {
          console.warn('⚠️ Error setting partner type filter:', partnerError);
        }
      }

      console.log('🔍 Query filters:', query);

      // Fetch bills with populated data
      let bills = await Bill.find(query)
        .populate({
          path: 'import_order_id',
          populate: [
            {
              path: 'contract_id',
              select: 'contract_code partner_type partner_id',
              populate: {
                path: 'partner_id',
                select: 'name company_name',
              },
            },
          ],
        })
        .populate({
          path: 'export_order_id',
          populate: [
            {
              path: 'contract_id',
              select: 'contract_code partner_type partner_id',
              populate: {
                path: 'partner_id',
                select: 'name company_name',
              },
            },
          ],
        })
        .lean();

      console.log('🔍 Found bills count:', bills.length);

      // Check if no bills found
      if (!bills || bills.length === 0) {
        console.log('🔍 No bills found for the given filters');
        return {
          success: true,
          data: {
            bills: [],
            summary: {
              totalBills: 0,
              totalValue: 0,
              totalPaid: 0,
              totalRemaining: 0,
              overdueBills: 0,
              pendingBills: 0,
              completedBills: 0,
              importBills: 0,
              exportBills: 0,
            },
            pagination: {
              page: validatedPage,
              limit: validatedLimit,
              total: 0,
              totalPages: 0,
            },
            filters: {
              startDate,
              endDate,
              period,
              status,
              type,
              partnerType,
            },
            message: 'No bills found for the selected criteria',
          },
        };
      }

      // Filter by partnerType if provided (since partnerType is nested)
      if (partnerType && partnerType !== 'all') {
        bills = bills.filter((bill) => {
          try {
            const importPartnerType = bill.import_order_id?.contract_id?.partner_type;
            const exportPartnerType = bill.export_order_id?.contract_id?.partner_type;
            return importPartnerType === partnerType || exportPartnerType === partnerType;
          } catch (error) {
            console.warn('⚠️ Error filtering by partnerType for bill:', bill._id, error);
            return false;
          }
        });
        console.log('🔍 Bills after partnerType filter:', bills.length);
      }

      // Process bills with better error handling
      console.log('🔍 Processing bills...');
      const processedBills = await Promise.all(
        bills.map(async (bill) => {
          try {
            console.log('🔍 Processing bill:', bill._id, 'details:', bill.details);

            // Validate bill structure
            if (!bill || !bill._id) {
              console.warn('⚠️ Invalid bill structure:', bill);
              return null;
            }

            // Check if details exists and is array
            if (!bill.details || !Array.isArray(bill.details)) {
              console.warn('⚠️ Bill has no details or details is not array:', bill._id);
              // Return a clean bill object without error field
              return {
                id: bill._id.toString(),
                billCode:
                  bill.voucher_code || bill.bill_code || `BILL-${bill._id.toString().slice(-6)}`,
                voucherCode: bill.voucher_code || bill.bill_code || 'N/A',
                contractCode: 'N/A',
                partnerType: 'N/A',
                partnerName: 'N/A',
                orderCode: 'N/A',
                orderType: 'N/A',
                billType: bill.type || 'N/A',
                status: bill.status?.toLowerCase() || 'unknown',
                totalValue: 0,
                amountPaid: bill.amountPaid || 0,
                remainingAmount: 0,
                paymentDate: bill.payment_date || bill.paymentDate || null,
                dueDate: bill.due_date || bill.dueDate || null,
                createdAt: bill.createdAt,
                updatedAt: bill.updatedAt,
                details: [],
                // Medicine details fields
                medicineCount: 0,
                totalQuantity: 0,
                averageUnitPrice: 0,
                medicineDetails: [],
              };
            }

            // Calculate bill value with safe math operations
            const billValue = bill.details.reduce((sum, detail) => {
              try {
                if (!detail || typeof detail !== 'object') return sum;
                const quantity = parseFloat(detail.quantity) || 0;
                const unitPrice = parseFloat(detail.unit_price) || 0;
                return sum + quantity * unitPrice;
              } catch (calcError) {
                console.warn('⚠️ Error calculating detail value:', detail, calcError);
                return sum;
              }
            }, 0);

            let contractCode = 'N/A';
            let partnerTypeVal = 'N/A';
            let partnerName = 'N/A';
            let orderCode = 'N/A';
            let orderType = 'N/A';

            try {
              if (bill.import_order_id) {
                console.log('🔍 Import order populated:', {
                  order_code: bill.import_order_id.order_code,
                  contract_code: bill.import_order_id.contract_id?.contract_code,
                  partner_type: bill.import_order_id.contract_id?.partner_type,
                  partner_name:
                    bill.import_order_id.contract_id?.partner_id?.name ||
                    bill.import_order_id.contract_id?.partner_id?.company_name,
                  supplier_name:
                    bill.import_order_id.supplier_id?.name ||
                    bill.import_order_id.supplier_id?.company_name,
                });

                contractCode = bill.import_order_id.contract_id?.contract_code || 'N/A';
                partnerTypeVal = bill.import_order_id.contract_id?.partner_type || 'Supplier';
                partnerName =
                  bill.import_order_id.contract_id?.partner_id?.name ||
                  bill.import_order_id.contract_id?.partner_id?.company_name ||
                  bill.import_order_id.supplier_id?.name ||
                  bill.import_order_id.supplier_id?.company_name ||
                  'N/A';
                orderCode = bill.import_order_id.order_code || 'N/A';
                orderType = 'IMPORT';
              } else if (bill.export_order_id) {
                console.log('🔍 Export order populated:', {
                  order_code: bill.export_order_id.order_code,
                  contract_code: bill.export_order_id.contract_id?.contract_code,
                  partner_type: bill.export_order_id.contract_id?.partner_type,
                  partner_name:
                    bill.export_order_id.contract_id?.partner_id?.name ||
                    bill.export_order_id.contract_id?.partner_id?.company_name,
                  retailer_name:
                    bill.export_order_id.retailer_id?.name ||
                    bill.export_order_id.retailer_id?.company_name,
                });

                contractCode = bill.export_order_id.contract_id?.contract_code || 'N/A';
                partnerTypeVal = bill.export_order_id.contract_id?.partner_type || 'Retailer';
                partnerName =
                  bill.export_order_id.contract_id?.partner_id?.name ||
                  bill.export_order_id.contract_id?.partner_id?.company_name ||
                  bill.export_order_id.retailer_id?.name ||
                  bill.export_order_id.retailer_id?.company_name ||
                  'N/A';
                orderCode = bill.export_order_id.order_code || 'N/A';
                orderType = 'EXPORT';
              }
            } catch (populateError) {
              console.warn('⚠️ Error processing populated data for bill:', bill._id, populateError);
            }

            // Process details with error handling - filter out error fields and add medicine details
            const processedDetails = await Promise.all(
              bill.details.map(async (detail) => {
                try {
                  if (!detail || typeof detail !== 'object') {
                    return null;
                  }

                  // Try to get medicine information from database
                  const medicineInfo = await this.getMedicineInfo(detail.medicine_lisence_code);

                  const cleanDetail = {
                    medicineCode:
                      detail.medicine_lisence_code ||
                      detail.medicine_license_code ||
                      detail.medicine_code ||
                      'N/A',
                    medicineName:
                      medicineInfo?.name ||
                      medicineInfo?.medicine_name ||
                      detail.medicine_name ||
                      detail.name ||
                      'N/A',
                    quantity: parseFloat(detail.quantity) || 0,
                    unitPrice: parseFloat(detail.unit_price) || parseFloat(detail.unitPrice) || 0,
                    totalPrice:
                      (parseFloat(detail.quantity) || 0) *
                      (parseFloat(detail.unit_price) || parseFloat(detail.unitPrice) || 0),
                    unit: detail.unit || 'N/A',
                    batchNumber: detail.batch_number || detail.batchNumber || 'N/A',
                    expiryDate: detail.expiry_date || detail.expiryDate || null,
                    // Additional medicine info if available
                    medicineLicenseCode:
                      medicineInfo?.license_code || medicineInfo?.medicine_code || 'N/A',
                    hasMedicineInfo: !!medicineInfo,
                  };

                  // Only return detail if it has valid data
                  if (
                    cleanDetail.medicineCode !== 'N/A' ||
                    cleanDetail.quantity > 0 ||
                    cleanDetail.unitPrice > 0
                  ) {
                    return cleanDetail;
                  }
                  return null;
                } catch (detailError) {
                  console.warn('⚠️ Error processing detail:', detail, detailError);
                  return null;
                }
              }),
            );

            // Filter out null details
            const validDetails = processedDetails.filter((detail) => detail !== null);

            // Calculate medicine statistics
            const medicineCount = validDetails.length;
            const totalQuantity = validDetails.reduce(
              (sum, detail) => sum + (detail.quantity || 0),
              0,
            );
            const averageUnitPrice =
              medicineCount > 0
                ? validDetails.reduce((sum, detail) => sum + (detail.unitPrice || 0), 0) /
                  medicineCount
                : 0;

            return {
              id: bill._id.toString(),
              billCode:
                bill.voucher_code || bill.bill_code || `BILL-${bill._id.toString().slice(-6)}`,
              voucherCode: bill.voucher_code || bill.bill_code || 'N/A',
              contractCode,
              partnerType: partnerTypeVal,
              partnerName,
              orderCode,
              orderType,
              billType: bill.type || 'N/A',
              status: bill.status?.toLowerCase() || 'unknown',
              totalValue: billValue,
              amountPaid: parseFloat(bill.amountPaid) || 0,
              remainingAmount: Math.max(0, billValue - (parseFloat(bill.amountPaid) || 0)),
              paymentDate: bill.payment_date || bill.paymentDate || null,
              dueDate: bill.due_date || bill.dueDate || null,
              createdAt: bill.createdAt,
              updatedAt: bill.updatedAt,
              details: validDetails,
              // Medicine details fields
              medicineCount,
              totalQuantity,
              averageUnitPrice: Math.round(averageUnitPrice * 100) / 100, // Round to 2 decimal places
              medicineDetails: validDetails,
            };
          } catch (billError) {
            console.error('❌ Error processing bill:', bill._id, billError);
            // Return a minimal clean bill object instead of error-ridden one
            return {
              id: bill._id?.toString() || 'unknown',
              billCode: bill.voucher_code || bill.bill_code || 'N/A',
              voucherCode: bill.voucher_code || bill.bill_code || 'N/A',
              contractCode: 'N/A',
              partnerType: 'N/A',
              partnerName: 'N/A',
              orderCode: 'N/A',
              orderType: 'N/A',
              billType: bill.type || 'N/A',
              status: bill.status?.toLowerCase() || 'unknown',
              totalValue: 0,
              amountPaid: 0,
              remainingAmount: 0,
              paymentDate: bill.payment_date || bill.paymentDate || null,
              dueDate: bill.due_date || bill.dueDate || null,
              createdAt: bill.createdAt || null,
              updatedAt: bill.updatedAt || null,
              details: [],
              // Medicine details fields
              medicineCount: 0,
              totalQuantity: 0,
              averageUnitPrice: 0,
              medicineDetails: [],
            };
          }
        }),
      );

      // Filter out null bills and create summary
      const validBills = processedBills.filter((bill) => bill !== null);
      console.log('🔍 Valid bills count:', validBills.length);

      // Clean all bills to remove any error fields
      const cleanBills = validBills
        .map((bill) => this.cleanBillData(bill))
        .filter((bill) => bill !== null);

      console.log('🔍 Clean bills count:', cleanBills.length);

      // Summary statistics with safe calculations
      const summary = {
        totalBills: cleanBills.length,
        totalValue: cleanBills.reduce((sum, bill) => sum + (parseFloat(bill.totalValue) || 0), 0),
        totalPaid: cleanBills.reduce((sum, bill) => sum + (parseFloat(bill.amountPaid) || 0), 0),
        totalRemaining: cleanBills.reduce(
          (sum, bill) => sum + (parseFloat(bill.remainingAmount) || 0),
          0,
        ),
        overdueBills: cleanBills.filter((bill) => bill.status === 'overdue').length,
        pendingBills: cleanBills.filter((bill) => bill.status === 'pending').length,
        completedBills: cleanBills.filter((bill) => bill.status === 'completed').length,
        importBills: cleanBills.filter((bill) => bill.orderType === 'IMPORT').length,
        exportBills: cleanBills.filter((bill) => bill.orderType === 'EXPORT').length,
      };

      // Apply pagination
      const skip = (validatedPage - 1) * validatedLimit;
      const paginatedBills = cleanBills.slice(skip, skip + validatedLimit);
      console.log(
        '🔍 Pagination: page',
        validatedPage,
        'limit',
        validatedLimit,
        'skip',
        skip,
        'total',
        cleanBills.length,
      );

      return {
        success: true,
        data: {
          bills: paginatedBills,
          summary,
          pagination: {
            page: validatedPage,
            limit: validatedLimit,
            total: cleanBills.length,
            totalPages: Math.ceil(cleanBills.length / validatedLimit),
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
      console.error('❌ Error generating comprehensive report:', error);
      // Return a safe error response instead of throwing
      return {
        success: false,
        error: 'Failed to generate comprehensive report',
        details: error.message,
        data: {
          bills: [],
          summary: {
            totalBills: 0,
            totalValue: 0,
            totalPaid: 0,
            totalRemaining: 0,
            overdueBills: 0,
            pendingBills: 0,
            completedBills: 0,
            importBills: 0,
            exportBills: 0,
          },
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
          filters: filters,
        },
      };
    }
  }

  // Get report by period (weekly, monthly, quarterly)
  static async getReportByPeriod(period = 'monthly', startDate, endDate) {
    try {
      // Validate date parameters
      if (!startDate || !endDate) {
        console.warn('⚠️ Missing date parameters for period report');
        return {
          success: false,
          error: 'Start date and end date are required',
          data: [],
        };
      }

      let start, end;
      try {
        start = new Date(startDate);
        end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error('Invalid date format');
        }
      } catch (dateError) {
        console.warn('⚠️ Invalid date format for period report:', { startDate, endDate });
        return {
          success: false,
          error: 'Invalid date format',
          data: [],
        };
      }

      const bills = await Bill.find({
        createdAt: {
          $gte: start,
          $lte: end,
        },
      })
        .populate('import_order_id export_order_id')
        .lean();

      if (!bills || bills.length === 0) {
        console.log('🔍 No bills found for period report');
        return {
          success: true,
          data: [],
          message: 'No bills found for the selected period',
        };
      }

      // Group by period
      const groupedData = {};

      bills.forEach((bill) => {
        try {
          if (!bill || !bill.createdAt) {
            console.warn('⚠️ Bill missing createdAt:', bill._id);
            return;
          }

          const billDate = new Date(bill.createdAt);
          if (isNaN(billDate.getTime())) {
            console.warn('⚠️ Invalid bill date:', bill.createdAt);
            return;
          }

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

          // Safe calculation of bill value
          let billValue = 0;
          try {
            if (bill.details && Array.isArray(bill.details)) {
              billValue = bill.details.reduce((sum, detail) => {
                const quantity = parseFloat(detail.quantity) || 0;
                const unitPrice = parseFloat(detail.unit_price) || 0;
                return sum + quantity * unitPrice;
              }, 0);
            }
          } catch (calcError) {
            console.warn('⚠️ Error calculating bill value:', bill._id, calcError);
            billValue = 0;
          }

          const amountPaid = parseFloat(bill.amountPaid) || 0;
          const remainingAmount = Math.max(0, billValue - amountPaid);

          groupedData[periodKey].totalBills++;
          groupedData[periodKey].totalValue += billValue;
          groupedData[periodKey].totalPaid += amountPaid;
          groupedData[periodKey].totalRemaining += remainingAmount;

          const status = bill.status?.toLowerCase() || 'unknown';
          if (status === 'overdue') groupedData[periodKey].overdueBills++;
          if (status === 'pending') groupedData[periodKey].pendingBills++;
          if (status === 'completed') groupedData[periodKey].completedBills++;
        } catch (billError) {
          console.warn('⚠️ Error processing bill for period report:', bill._id, billError);
        }
      });

      const result = Object.values(groupedData).sort((a, b) => a.period.localeCompare(b.period));

      return {
        success: true,
        data: result,
        totalPeriods: result.length,
      };
    } catch (error) {
      console.error('❌ Error generating period report:', error);
      return {
        success: false,
        error: 'Failed to generate period report',
        details: error.message,
        data: [],
      };
    }
  }

  // Get partner analysis report
  static async getPartnerAnalysisReport(startDate, endDate) {
    try {
      // Validate date parameters
      if (!startDate || !endDate) {
        console.warn('⚠️ Missing date parameters for partner analysis report');
        return {
          success: false,
          error: 'Start date and end date are required',
          data: [],
        };
      }

      let start, end;
      try {
        start = new Date(startDate);
        end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error('Invalid date format');
        }
      } catch (dateError) {
        console.warn('⚠️ Invalid date format for partner analysis report:', { startDate, endDate });
        return {
          success: false,
          error: 'Invalid date format',
          data: [],
        };
      }

      const bills = await Bill.find({
        createdAt: {
          $gte: start,
          $lte: end,
        },
      })
        .populate({
          path: 'import_order_id export_order_id',
          populate: {
            path: 'contract_id',
            select: 'contract_code partner_type partner_id',
          },
        })
        .lean();

      if (!bills || bills.length === 0) {
        console.log('🔍 No bills found for partner analysis report');
        return {
          success: true,
          data: [],
          message: 'No bills found for the selected period',
        };
      }

      const partnerAnalysis = {};

      bills.forEach((bill) => {
        try {
          if (!bill || !bill._id) {
            console.warn('⚠️ Invalid bill structure in partner analysis');
            return;
          }

          let contractCode = 'N/A';
          let partnerType = 'N/A';
          let partnerId = 'N/A';

          try {
            if (bill.import_order_id?.contract_id) {
              contractCode = bill.import_order_id.contract_id.contract_code || 'N/A';
              partnerType = bill.import_order_id.contract_id.partner_type || 'N/A';
              partnerId = bill.import_order_id.contract_id.partner_id || 'N/A';
            } else if (bill.export_order_id?.contract_id) {
              contractCode = bill.export_order_id.contract_id.contract_code || 'N/A';
              partnerType = bill.export_order_id.contract_id.partner_type || 'N/A';
              partnerId = bill.export_order_id.contract_id.partner_id || 'N/A';
            }
          } catch (populateError) {
            console.warn('⚠️ Error processing populated data for bill:', bill._id, populateError);
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

          // Safe calculation of bill value
          let billValue = 0;
          try {
            if (bill.details && Array.isArray(bill.details)) {
              billValue = bill.details.reduce((sum, detail) => {
                const quantity = parseFloat(detail.quantity) || 0;
                const unitPrice = parseFloat(detail.unit_price) || 0;
                return sum + quantity * unitPrice;
              }, 0);
            }
          } catch (calcError) {
            console.warn(
              '⚠️ Error calculating bill value for partner analysis:',
              bill._id,
              calcError,
            );
            billValue = 0;
          }

          const amountPaid = parseFloat(bill.amountPaid) || 0;
          const remainingAmount = Math.max(0, billValue - amountPaid);

          partnerAnalysis[key].totalBills++;
          partnerAnalysis[key].totalValue += billValue;
          partnerAnalysis[key].totalPaid += amountPaid;
          partnerAnalysis[key].totalRemaining += remainingAmount;

          const status = bill.status?.toLowerCase() || 'unknown';
          if (status === 'overdue') partnerAnalysis[key].overdueBills++;
          if (status === 'pending') partnerAnalysis[key].pendingBills++;
          if (status === 'completed') partnerAnalysis[key].completedBills++;
        } catch (billError) {
          console.warn('⚠️ Error processing bill for partner analysis:', bill._id, billError);
        }
      });

      const result = Object.values(partnerAnalysis).sort((a, b) => b.totalValue - a.totalValue);

      return {
        success: true,
        data: result,
        totalPartners: result.length,
      };
    } catch (error) {
      console.error('❌ Error generating partner analysis report:', error);
      return {
        success: false,
        error: 'Failed to generate partner analysis report',
        details: error.message,
        data: [],
      };
    }
  }

  // Get medicine analysis report
  static async getMedicineAnalysisReport(startDate, endDate) {
    try {
      // Validate date parameters
      if (!startDate || !endDate) {
        console.warn('⚠️ Missing date parameters for medicine analysis report');
        return {
          success: false,
          error: 'Start date and end date are required',
          data: [],
        };
      }

      let start, end;
      try {
        start = new Date(startDate);
        end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error('Invalid date format');
        }
      } catch (dateError) {
        console.warn('⚠️ Invalid date format for medicine analysis report:', {
          startDate,
          endDate,
        });
        return {
          success: false,
          error: 'Invalid date format',
          data: [],
        };
      }

      const bills = await Bill.find({
        createdAt: {
          $gte: start,
          $lte: end,
        },
      }).lean();

      if (!bills || bills.length === 0) {
        console.log('🔍 No bills found for medicine analysis report');
        return {
          success: true,
          data: [],
          message: 'No bills found for the selected period',
        };
      }

      const medicineAnalysis = {};

      bills.forEach((bill) => {
        try {
          if (!bill || !bill._id || !bill.details || !Array.isArray(bill.details)) {
            console.warn('⚠️ Bill missing details for medicine analysis:', bill._id);
            return;
          }

          bill.details.forEach((detail) => {
            try {
              if (!detail) {
                console.warn('⚠️ Invalid detail in bill:', bill._id);
                return;
              }

              const medicineCode =
                detail.medicine_lisence_code || detail.medicine_license_code || 'UNKNOWN';

              if (!medicineAnalysis[medicineCode]) {
                medicineAnalysis[medicineCode] = {
                  medicineCode,
                  totalQuantity: 0,
                  totalValue: 0,
                  averagePrice: 0,
                  billCount: 0,
                };
              }

              const quantity = parseFloat(detail.quantity) || 0;
              const unitPrice = parseFloat(detail.unit_price) || 0;
              const detailValue = quantity * unitPrice;

              if (!isNaN(quantity) && !isNaN(unitPrice) && !isNaN(detailValue)) {
                medicineAnalysis[medicineCode].totalQuantity += quantity;
                medicineAnalysis[medicineCode].totalValue += detailValue;
                medicineAnalysis[medicineCode].billCount++;
              } else {
                console.warn('⚠️ Invalid quantity or unit price in detail:', detail);
              }
            } catch (detailError) {
              console.warn(
                '⚠️ Error processing detail for medicine analysis:',
                detail,
                detailError,
              );
            }
          });
        } catch (billError) {
          console.warn('⚠️ Error processing bill for medicine analysis:', bill._id, billError);
        }
      });

      // Calculate average prices with safe division
      Object.values(medicineAnalysis).forEach((medicine) => {
        try {
          if (medicine.totalQuantity > 0) {
            medicine.averagePrice = medicine.totalValue / medicine.totalQuantity;
          } else {
            medicine.averagePrice = 0;
          }
        } catch (calcError) {
          console.warn(
            '⚠️ Error calculating average price for medicine:',
            medicine.medicineCode,
            calcError,
          );
          medicine.averagePrice = 0;
        }
      });

      const result = Object.values(medicineAnalysis).sort((a, b) => b.totalValue - a.totalValue);

      return {
        success: true,
        data: result,
        totalMedicines: result.length,
      };
    } catch (error) {
      console.error('❌ Error generating medicine analysis report:', error);
      return {
        success: false,
        error: 'Failed to generate medicine analysis report',
        details: error.message,
        data: [],
      };
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

  // ===== EXPORT ORDERS REPORT FUNCTIONS =====

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
          orderType: order.order_type || 'EXPORT',
          totalValue: Math.round(totalValue),
          amountPaid: order.amount_paid ? Math.round(order.amount_paid / 1000) : 0,
          remainingAmount: order.remaining_amount ? Math.round(order.remaining_amount / 1000) : 0,
          paymentDate: order.payment_date || null,
          dueDate: order.due_date || null,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          createdBy: order.created_by?.full_name || order.created_by?.username || 'N/A',
          approvedBy: order.approval_by?.full_name || order.approval_by?.username || 'N/A',
          warehouseManager:
            order.warehouse_manager_id?.full_name || order.warehouse_manager_id?.username || 'N/A',
          medicineCount: order.details?.length || 0,
          totalQuantity:
            order.details?.reduce((sum, detail) => sum + (detail.quantity || 0), 0) || 0,
          averageUnitPrice:
            order.details?.length > 0
              ? Math.round(
                  order.details.reduce((sum, detail) => sum + (detail.unit_price || 0), 0) /
                    order.details.length /
                    1000,
                )
              : 0,
          details:
            order.details?.map((detail) => ({
              medicineCode: detail.medicine_id?.medicine_code || 'N/A',
              medicineName: detail.medicine_id?.name || detail.medicine_id?.medicine_name || 'N/A',
              quantity: detail.quantity || 0,
              unitPrice: Math.round((detail.unit_price || 0) / 1000), // Convert to thousands
              totalPrice: Math.round(((detail.quantity || 0) * (detail.unit_price || 0)) / 1000), // Convert to thousands
            })) || [],
        };
      });

      console.log('Processed export orders:', processedOrders.length);

      return {
        success: true,
        data: {
          exportOrders: processedOrders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalOrders,
            pages: Math.ceil(totalOrders / limit),
          },
          filters: {
            startDate,
            endDate,
            period,
            status,
            partnerType,
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
      const filters = { startDate, endDate, period };
      const reportData = await this.getExportOrdersReport(filters);

      if (!reportData.success) {
        return reportData;
      }

      // Group by period
      const groupedData = {};
      const exportOrders = reportData.data.exportOrders;

      exportOrders.forEach((order) => {
        const orderDate = new Date(order.createdAt);
        let periodKey;

        switch (period) {
          case 'weekly':
            const weekStart = new Date(orderDate);
            weekStart.setDate(orderDate.getDate() - orderDate.getDay());
            periodKey = weekStart.toISOString().split('T')[0];
            break;
          case 'monthly':
            periodKey = orderDate.toISOString().slice(0, 7); // YYYY-MM
            break;
          case 'quarterly':
            const quarter = Math.floor(orderDate.getMonth() / 3) + 1;
            periodKey = `${orderDate.getFullYear()}-Q${quarter}`;
            break;
          default:
            periodKey = orderDate.toISOString().slice(0, 7);
        }

        if (!groupedData[periodKey]) {
          groupedData[periodKey] = {
            period: periodKey,
            totalOrders: 0,
            totalValue: 0,
            totalQuantity: 0,
            orders: [],
          };
        }

        groupedData[periodKey].totalOrders += 1;
        groupedData[periodKey].totalValue += order.totalValue;
        groupedData[periodKey].totalQuantity += order.totalQuantity;
        groupedData[periodKey].orders.push(order);
      });

      return {
        success: true,
        data: Object.values(groupedData),
        summary: {
          totalPeriods: Object.keys(groupedData).length,
          totalOrders: exportOrders.length,
          totalValue: exportOrders.reduce((sum, order) => sum + order.totalValue, 0),
          totalQuantity: exportOrders.reduce((sum, order) => sum + order.totalQuantity, 0),
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

  // Get export orders partner analysis report
  static async getExportOrdersPartnerAnalysis(startDate, endDate) {
    try {
      const filters = { startDate, endDate };
      const reportData = await this.getExportOrdersReport(filters);

      if (!reportData.success) {
        return reportData;
      }

      const exportOrders = reportData.data.exportOrders;
      const partnerAnalysis = {};

      exportOrders.forEach((order) => {
        const partnerId = order.partnerId;
        const partnerName = order.partnerType;

        if (!partnerAnalysis[partnerId]) {
          partnerAnalysis[partnerId] = {
            partnerId,
            partnerName,
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

module.exports = ReportService;
