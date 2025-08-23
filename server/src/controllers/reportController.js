const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const ReportService = require('../services/reportService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/reports';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Get comprehensive report
const getComprehensiveReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      period = 'monthly',
      status,
      type,
      page,
      limit,
      partnerType,
    } = req.query;

    const filters = {
      startDate,
      endDate,
      period,
      status,
      type,
      partnerType,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    };

    const reportData = await ReportService.getComprehensiveReport(filters);

    res.status(200).json(reportData);
  } catch (error) {
    console.error('Error getting comprehensive report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate comprehensive report',
      details: error.message,
    });
  }
};

// Get report by period
const getReportByPeriod = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }

    const reportData = await ReportService.getReportByPeriod(period, startDate, endDate);

    res.status(200).json(reportData);
  } catch (error) {
    console.error('Error getting period report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate period report',
      details: error.message,
    });
  }
};

// Get partner analysis report
const getPartnerAnalysisReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }

    const reportData = await ReportService.getPartnerAnalysisReport(startDate, endDate);

    res.status(200).json(reportData);
  } catch (error) {
    console.error('Error getting partner analysis report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate partner analysis report',
      details: error.message,
    });
  }
};

// Get medicine analysis report
const getMedicineAnalysisReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }

    const reportData = await ReportService.getMedicineAnalysisReport(startDate, endDate);

    res.status(200).json(reportData);
  } catch (error) {
    console.error('Error getting medicine analysis report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate medicine analysis report',
      details: error.message,
    });
  }
};

// Export report to Excel
const exportReportToExcel = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      period = 'monthly',
      status,
      type,
      partnerType,
      reportType = 'comprehensive', // comprehensive, period, partner, medicine
    } = req.query;

    console.log('📊 Export request:', {
      startDate,
      endDate,
      period,
      status,
      type,
      partnerType,
      reportType,
    });

    let reportData;
    let reportTitle = 'Report';

    try {
      switch (reportType) {
        case 'comprehensive':
          const filters = { startDate, endDate, period, status, type, partnerType };
          const comprehensiveReport = await ReportService.getComprehensiveReport(filters);

          if (!comprehensiveReport.success) {
            console.error('❌ Comprehensive report failed:', comprehensiveReport.error);
            return res.status(400).json({
              success: false,
              error: 'Failed to generate comprehensive report',
              details: comprehensiveReport.error,
            });
          }

          reportData = comprehensiveReport.data.bills || [];
          reportTitle = 'Comprehensive Bill Report';
          break;

        case 'period':
          const periodReport = await ReportService.getReportByPeriod(period, startDate, endDate);

          if (!periodReport.success) {
            console.error('❌ Period report failed:', periodReport.error);
            return res.status(400).json({
              success: false,
              error: 'Failed to generate period report',
              details: periodReport.error,
            });
          }

          reportData = periodReport.data || [];
          reportTitle = `${period.charAt(0).toUpperCase() + period.slice(1)} Report`;
          break;

        case 'partner':
          const partnerReport = await ReportService.getPartnerAnalysisReport(startDate, endDate);

          if (!partnerReport.success) {
            console.error('❌ Partner report failed:', partnerReport.error);
            return res.status(400).json({
              success: false,
              error: 'Failed to generate partner report',
              details: partnerReport.error,
            });
          }

          reportData = partnerReport.data || [];
          reportTitle = 'Partner Analysis Report';
          break;

        case 'medicine':
          const medicineReport = await ReportService.getMedicineAnalysisReport(startDate, endDate);

          if (!medicineReport.success) {
            console.error('❌ Medicine report failed:', medicineReport.error);
            return res.status(400).json({
              success: false,
              error: 'Failed to generate medicine report',
              details: medicineReport.error,
            });
          }

          reportData = medicineReport.data || [];
          reportTitle = 'Medicine Analysis Report';
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid report type',
            validTypes: ['comprehensive', 'period', 'partner', 'medicine'],
          });
      }

      // Validate report data
      if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
        console.warn('⚠️ No data available for export');
        return res.status(404).json({
          success: false,
          error: 'No data available for export',
          message: 'Please check your filters and try again',
        });
      }

      console.log(`📊 Exporting ${reportData.length} records for ${reportType} report`);

      // Clean and validate data for Excel export
      const cleanData = reportData
        .map((item, index) => {
          try {
            const cleanItem = {};

            // Process each field safely
            Object.keys(item).forEach((key) => {
              let value = item[key];

              // Skip error fields and internal fields
              if (key === 'error' || key === 'originalData' || key === '_id' || key === '__v') {
                return; // Skip this field
              }

              // Handle different data types
              if (value === null || value === undefined) {
                value = '';
              } else if (typeof value === 'object') {
                // Handle nested objects and arrays
                if (Array.isArray(value)) {
                  if (value.length === 0) {
                    value = 'No items';
                  } else if (value.some((v) => v && typeof v === 'object' && v.error)) {
                    // Filter out error items from arrays
                    const cleanArray = value.filter(
                      (v) => !(v && typeof v === 'object' && v.error),
                    );
                    value = cleanArray.length > 0 ? `${cleanArray.length} items` : 'No items';
                  } else {
                    value = `${value.length} items`;
                  }
                } else {
                  // For objects, check if they contain error fields
                  if (value.error) {
                    value = 'N/A'; // Replace error objects with N/A
                  } else {
                    value = JSON.stringify(value);
                  }
                }
              } else if (typeof value === 'number') {
                // Ensure numbers are valid
                value = isNaN(value) ? 0 : value;
              } else if (typeof value === 'string') {
                // Clean strings and remove error indicators
                value = value.toString().trim();
                if (value.toLowerCase().includes('error')) {
                  value = 'N/A';
                }
              } else if (value instanceof Date) {
                // Format dates
                value = value.toISOString().split('T')[0];
              }

              cleanItem[key] = value;
            });

            return cleanItem;
          } catch (itemError) {
            console.warn(`⚠️ Error cleaning item ${index}:`, itemError);
            // Return a minimal clean item instead of error-ridden one
            return {
              id: item.id || `Item ${index}`,
              billCode: item.billCode || 'N/A',
              voucherCode: item.voucherCode || 'N/A',
              contractCode: item.contractCode || 'N/A',
              partnerType: item.partnerType || 'N/A',
              partnerName: item.partnerName || 'N/A',
              orderCode: item.orderCode || 'N/A',
              orderType: item.orderType || 'N/A',
              billType: item.billType || 'N/A',
              status: item.status || 'N/A',
              totalValue: item.totalValue || 0,
              amountPaid: item.amountPaid || 0,
              remainingAmount: item.remainingAmount || 0,
              paymentDate: item.paymentDate || '',
              dueDate: item.dueDate || '',
              createdAt: item.createdAt || '',
              updatedAt: item.updatedAt || '',
              medicineCount: item.medicineCount || 0,
              totalQuantity: item.totalQuantity || 0,
              averageUnitPrice: item.averageUnitPrice || 0,
              details: item.details ? `${item.details.length} items` : 'No items',
            };
          }
        })
        .filter((item) => item !== null); // Remove any null items

      // Additional data validation and cleaning
      const finalCleanData = cleanData.map((item, index) => {
        try {
          // Ensure all required fields are present and clean
          const finalItem = {
            id: item.id || `Item ${index + 1}`,
            billCode: item.billCode || 'N/A',
            voucherCode: item.voucherCode || 'N/A',
            contractCode: item.contractCode || 'N/A',
            partnerType: item.partnerType || 'N/A',
            partnerName: item.partnerName || 'N/A',
            orderCode: item.orderCode || 'N/A',
            orderType: item.orderType || 'N/A',
            billType: item.billType || 'N/A',
            status: item.status || 'N/A',
            totalValue: typeof item.totalValue === 'number' ? item.totalValue : 0,
            amountPaid: typeof item.amountPaid === 'number' ? item.amountPaid : 0,
            remainingAmount: typeof item.remainingAmount === 'number' ? item.remainingAmount : 0,
            paymentDate: item.paymentDate || '',
            dueDate: item.dueDate || '',
            createdAt: item.createdAt || '',
            updatedAt: item.updatedAt || '',
            // Medicine summary fields
            medicineCount: typeof item.medicineCount === 'number' ? item.medicineCount : 0,
            totalQuantity: typeof item.totalQuantity === 'number' ? item.totalQuantity : 0,
            averageUnitPrice: typeof item.averageUnitPrice === 'number' ? item.averageUnitPrice : 0,
            // Details summary
            details: item.details ? `${item.details.length} items` : 'No items',
          };

          // Validate numeric fields
          if (isNaN(finalItem.totalValue)) finalItem.totalValue = 0;
          if (isNaN(finalItem.amountPaid)) finalItem.amountPaid = 0;
          if (isNaN(finalItem.remainingAmount)) finalItem.remainingAmount = 0;
          if (isNaN(finalItem.medicineCount)) finalItem.medicineCount = 0;
          if (isNaN(finalItem.totalQuantity)) finalItem.totalQuantity = 0;
          if (isNaN(finalItem.averageUnitPrice)) finalItem.averageUnitPrice = 0;

          // Ensure status is clean
          if (finalItem.status && typeof finalItem.status === 'string') {
            const cleanStatus = finalItem.status.toLowerCase().trim();
            if (cleanStatus.includes('error') || cleanStatus === 'unknown') {
              finalItem.status = 'N/A';
            }
          }

          // Clean partner and company names
          if (finalItem.partnerName && typeof finalItem.partnerName === 'string') {
            if (finalItem.partnerName.toLowerCase().includes('error')) {
              finalItem.partnerName = 'N/A';
            }
          }

          // Format dates properly
          if (finalItem.paymentDate) {
            try {
              const paymentDate = new Date(finalItem.paymentDate);
              if (!isNaN(paymentDate.getTime())) {
                finalItem.paymentDate = paymentDate.toISOString().split('T')[0];
              } else {
                finalItem.paymentDate = '';
              }
            } catch (dateError) {
              finalItem.paymentDate = '';
            }
          }

          if (finalItem.dueDate) {
            try {
              const dueDate = new Date(finalItem.dueDate);
              if (!isNaN(dueDate.getTime())) {
                finalItem.dueDate = dueDate.toISOString().split('T')[0];
              } else {
                finalItem.dueDate = '';
              }
            } catch (dateError) {
              finalItem.dueDate = '';
            }
          }

          if (finalItem.createdAt) {
            try {
              const createdAt = new Date(finalItem.createdAt);
              if (!isNaN(createdAt.getTime())) {
                finalItem.createdAt = createdAt.toISOString().split('T')[0];
              } else {
                finalItem.createdAt = '';
              }
            } catch (dateError) {
              finalItem.createdAt = '';
            }
          }

          if (finalItem.updatedAt) {
            try {
              const updatedAt = new Date(finalItem.updatedAt);
              if (!isNaN(updatedAt.getTime())) {
                finalItem.updatedAt = updatedAt.toISOString().split('T')[0];
              } else {
                finalItem.updatedAt = '';
              }
            } catch (dateError) {
              finalItem.updatedAt = '';
            }
          }

          return finalItem;
        } catch (finalError) {
          console.warn(`⚠️ Error in final cleaning for item ${index}:`, finalError);
          // Return a completely clean fallback item
          return {
            id: `Item ${index + 1}`,
            billCode: 'N/A',
            voucherCode: 'N/A',
            contractCode: 'N/A',
            partnerType: 'N/A',
            partnerName: 'N/A',
            orderCode: 'N/A',
            orderType: 'N/A',
            billType: 'N/A',
            status: 'N/A',
            totalValue: 0,
            amountPaid: 0,
            remainingAmount: 0,
            paymentDate: '',
            dueDate: '',
            createdAt: '',
            updatedAt: '',
            medicineCount: 0,
            totalQuantity: 0,
            averageUnitPrice: 0,
            details: 'No items',
          };
        }
      });

      // Final validation - ensure we have clean data
      if (finalCleanData.length === 0) {
        console.warn('⚠️ No clean data available after processing');
        return res.status(404).json({
          success: false,
          error: 'No clean data available for export',
          message: 'All data contained errors and was filtered out',
        });
      }

      console.log(`📊 Exporting ${finalCleanData.length} clean records for ${reportType} report`);

      // Create workbook and worksheet with clean data
      try {
        const workbook = xlsx.utils.book_new();

        // Ensure we have valid data for Excel
        if (!finalCleanData || finalCleanData.length === 0) {
          throw new Error('No valid data to export');
        }

        // Convert data to Excel format
        const excelData = finalCleanData.map((item) => {
          const cleanItem = {};
          Object.keys(item).forEach((key) => {
            let value = item[key];

            // Convert null/undefined to empty string
            if (value === null || value === undefined) {
              value = '';
            }

            // Convert objects to strings
            if (typeof value === 'object' && !Array.isArray(value)) {
              value = JSON.stringify(value);
            }

            // Convert arrays to string representation
            if (Array.isArray(value)) {
              value = value.length > 0 ? `${value.length} items` : 'No items';
            }

            // Ensure numbers are valid
            if (typeof value === 'number' && isNaN(value)) {
              value = 0;
            }

            cleanItem[key] = value;
          });
          return cleanItem;
        });

        console.log('📊 Excel data prepared:', excelData.length, 'rows');

        const worksheet = xlsx.utils.json_to_sheet(excelData);

        // Auto-size columns
        const columnWidths = {};
        excelData.forEach((row) => {
          Object.keys(row).forEach((key) => {
            const value = String(row[key] || '');
            const currentWidth = columnWidths[key] || 0;
            columnWidths[key] = Math.max(currentWidth, value.length, key.length);
          });
        });

        worksheet['!cols'] = Object.keys(columnWidths).map((key) => ({
          wch: Math.min(Math.max(columnWidths[key], 10), 50), // Min 10, Max 50
        }));

        // Add worksheet to workbook
        xlsx.utils.book_append_sheet(workbook, worksheet, reportTitle);

        // Generate filename with date range
        let filename = `report_${reportType}`;
        if (startDate && endDate) {
          try {
            const startDateStr = new Date(startDate).toISOString().split('T')[0];
            const endDateStr = new Date(endDate).toISOString().split('T')[0];
            filename = `report_${reportType}_${startDateStr}_to_${endDateStr}`;
          } catch (dateError) {
            console.warn('⚠️ Error formatting filename dates:', dateError);
            filename = `report_${reportType}_${new Date().toISOString().split('T')[0]}`;
          }
        } else {
          const timestamp = new Date().toISOString().split('T')[0];
          filename = `report_${reportType}_${timestamp}`;
        }
        filename += '.xlsx';

        console.log('📊 Generating Excel file:', filename);

        // Set response headers
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Write to buffer
        const buffer = xlsx.write(workbook, {
          type: 'buffer',
          bookType: 'xlsx',
          compression: true,
        });

        // Set content length
        res.setHeader('Content-Length', buffer.length);

        console.log(
          `✅ Successfully exported ${reportType} report with ${finalCleanData.length} records, file size: ${buffer.length} bytes`,
        );

        // Send buffer
        res.send(buffer);
      } catch (excelError) {
        console.error('❌ Error creating Excel file:', excelError);
        return res.status(500).json({
          success: false,
          error: 'Failed to create Excel file',
          details: excelError.message,
        });
      }
    } catch (serviceError) {
      console.error('❌ Service error during export:', serviceError);
      return res.status(500).json({
        success: false,
        error: 'Service error during export',
        details: serviceError.message,
      });
    }
  } catch (error) {
    console.error('❌ Error exporting report to Excel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export report to Excel',
      details: error.message,
    });
  }
};

// Upload and process Excel file
const uploadExcelFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Process the uploaded data (you can customize this based on your needs)
    const processedData = {
      filename: req.file.originalname,
      rows: data.length,
      data: data.slice(0, 10), // Return first 10 rows for preview
    };

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      message: 'File uploaded and processed successfully',
      data: processedData,
    });
  } catch (error) {
    console.error('Error uploading Excel file:', error);

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process uploaded file',
      details: error.message,
    });
  }
};

// Get report templates
const getReportTemplates = async (req, res) => {
  try {
    const templates = [
      {
        id: 'comprehensive',
        name: 'Báo cáo tổng hợp',
        description: 'Báo cáo chi tiết tất cả bills với đầy đủ thông tin',
        fields: [
          'billCode',
          'contractCode',
          'partnerType',
          'orderType',
          'status',
          'totalValue',
          'amountPaid',
          'remainingAmount',
        ],
      },
      {
        id: 'period',
        name: 'Báo cáo theo thời gian',
        description: 'Báo cáo thống kê theo tuần/tháng/quý',
        fields: [
          'period',
          'totalBills',
          'totalValue',
          'totalPaid',
          'totalRemaining',
          'overdueBills',
          'pendingBills',
          'completedBills',
        ],
      },
      {
        id: 'partner',
        name: 'Báo cáo theo đối tác',
        description: 'Phân tích công nợ theo từng đối tác',
        fields: [
          'contractCode',
          'partnerType',
          'partnerId',
          'totalBills',
          'totalValue',
          'totalPaid',
          'totalRemaining',
        ],
      },
      {
        id: 'medicine',
        name: 'Báo cáo theo thuốc',
        description: 'Phân tích theo từng loại thuốc',
        fields: ['medicineCode', 'totalQuantity', 'totalValue', 'averagePrice', 'billCount'],
      },
    ];

    res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error getting report templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get report templates',
      details: error.message,
    });
  }
};

// ===== IMPORT ORDERS REPORT METHODS =====

// Get import orders report
const getImportOrdersReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      period = 'monthly',
      status,
      supplierId,
      page = 1,
      limit = 10,
    } = req.query;

    const filters = {
      startDate,
      endDate,
      period,
      status,
      supplierId,
      page: parseInt(page),
      limit: parseInt(limit),
    };

    console.log('Import report filters:', filters);

    const result = await ReportService.getImportOrdersReport(filters);

    if (result.success) {
      res.json({
        success: true,
        message: 'Import orders report retrieved successfully',
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error in getImportOrdersReport controller:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching import orders report',
    });
  }
};

// Export import orders report to Excel
const exportImportOrdersReport = async (req, res) => {
  try {
    const { startDate, endDate, period = 'monthly', status, supplierId } = req.query;

    const filters = {
      startDate,
      endDate,
      period,
      status,
      supplierId,
    };

    console.log('Export import report filters:', filters);

    const result = await ReportService.exportImportOrdersReport(filters);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    // Create Excel workbook using xlsx package
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(result.data);

    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Import Orders Report');

    // Set response headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=import_orders_report_${new Date().toISOString().split('T')[0]}.xlsx`,
    );

    // Write to response as buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.send(buffer);
  } catch (error) {
    console.error('Error in exportImportOrdersReport controller:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while exporting import orders report',
    });
  }
};

// Get import report summary
const getImportReportSummary = async (req, res) => {
  try {
    const { startDate, endDate, period = 'monthly' } = req.query;

    const filters = {
      startDate,
      endDate,
      period,
    };

    console.log('Import report summary filters:', filters);

    const result = await ReportService.getImportReportSummary(filters);

    if (result.success) {
      res.json({
        success: true,
        message: 'Import report summary retrieved successfully',
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error in getImportReportSummary controller:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching import report summary',
    });
  }
};

// Get import report dashboard data
const getImportReportDashboard = async (req, res) => {
  try {
    const { startDate, endDate, period = 'monthly' } = req.query;

    const filters = {
      startDate,
      endDate,
      period,
    };

    console.log('Import report dashboard filters:', filters);

    const result = await ReportService.getImportReportDashboard(filters);

    if (result.success) {
      res.json({
        success: true,
        message: 'Import report dashboard data retrieved successfully',
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error in getImportReportDashboard controller:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching import report dashboard',
    });
  }
};

module.exports = {
  getComprehensiveReport,
  getReportByPeriod,
  getPartnerAnalysisReport,
  getMedicineAnalysisReport,
  exportReportToExcel,
  testExcelExport,
  uploadExcelFile,
  getReportTemplates,
  upload,
  // Import report methods
  getImportOrdersReport,
  exportImportOrdersReport,
  getImportReportSummary,
  getImportReportDashboard,
};
