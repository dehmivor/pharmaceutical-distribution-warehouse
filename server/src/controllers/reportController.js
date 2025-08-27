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

    if (reportData.success) {
      res.status(200).json(reportData);
    } else {
      res.status(400).json(reportData);
    }
  } catch (error) {
    console.error('Error getting report by period:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report by period',
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
    console.log('🚀 Export function started');
    console.log('📊 Request headers:', req.headers);
    console.log('📊 Request query:', req.query);

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
      console.log('🔍 Starting report generation...');

      switch (reportType) {
        case 'comprehensive':
          console.log('🔍 Generating comprehensive report...');
          const filters = { startDate, endDate, period, status, type, partnerType };
          const comprehensiveReport = await ReportService.getComprehensiveReport(filters);

          console.log('🔍 Comprehensive report result:', {
            success: comprehensiveReport.success,
            dataLength: comprehensiveReport.data?.bills?.length || 0,
            error: comprehensiveReport.error,
          });

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
          console.log('🔍 Generating period report...');
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
          console.log('🔍 Generating partner report...');
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
          console.log('🔍 Generating medicine report...');
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

      console.log('🔍 Report data retrieved:', {
        reportType,
        reportTitle,
        dataLength: reportData?.length || 0,
        dataType: typeof reportData,
        isArray: Array.isArray(reportData),
      });

      // Validate report data
      if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
        console.warn('⚠️ No data available for export');
        return res.status(404).json({
          success: false,
          error: 'No data available for export',
          message: 'Please check your filters and try again',
        });
      }

      console.log('🔍 Starting data cleaning...');

      // Clean and prepare data for Excel export
      const cleanData = reportData
        .map((item, index) => {
          try {
            if (!item || typeof item !== 'object') {
              console.warn(`⚠️ Invalid item at index ${index}:`, item);
              return null;
            }

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
                  } else {
                    value = `${value.length} items`;
                  }
                } else {
                  // For objects, convert to string representation
                  try {
                    value = JSON.stringify(value);
                  } catch (stringifyError) {
                    value = 'N/A';
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

      console.log('🔍 Data cleaning completed:', {
        originalLength: reportData.length,
        cleanLength: cleanData.length,
      });

      // Final validation - ensure we have clean data
      if (cleanData.length === 0) {
        console.warn('⚠️ No clean data available after processing');
        return res.status(404).json({
          success: false,
          error: 'No clean data available for export',
          message: 'All data contained errors and was filtered out',
        });
      }

      console.log('🔍 Starting Excel generation...');

      // Create workbook and worksheet with clean data
      try {
        const workbook = xlsx.utils.book_new();

        // Ensure we have valid data for Excel
        if (!cleanData || cleanData.length === 0) {
          throw new Error('No valid data to export');
        }

        // Convert data to Excel format - ensure all values are strings or numbers
        const excelData = cleanData.map((item) => {
          const cleanItem = {};
          Object.keys(item).forEach((key) => {
            let value = item[key];

            // Convert null/undefined to empty string
            if (value === null || value === undefined) {
              value = '';
            }

            // Convert objects to strings
            if (typeof value === 'object' && !Array.isArray(value)) {
              try {
                value = JSON.stringify(value);
              } catch (stringifyError) {
                value = 'N/A';
              }
            }

            // Convert arrays to string representation
            if (Array.isArray(value)) {
              value = value.length > 0 ? `${value.length} items` : 'No items';
            }

            // Ensure numbers are valid
            if (typeof value === 'number' && isNaN(value)) {
              value = 0;
            }

            // Convert all values to strings for Excel compatibility
            cleanItem[key] = String(value);
          });
          return cleanItem;
        });

        console.log('🔍 Excel data prepared:', {
          rows: excelData.length,
          columns: excelData.length > 0 ? Object.keys(excelData[0]).length : 0,
          sampleRow: excelData.length > 0 ? excelData[0] : null,
        });

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
          `✅ Successfully exported ${reportType} report with ${cleanData.length} records, file size: ${buffer.length} bytes`,
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
    console.error('❌ General error during export:', error);
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
        name: 'Báo cáo phân tích đối tác',
        description: 'Báo cáo thống kê theo đối tác',
        fields: [
          'partnerType',
          'partnerName',
          'totalBills',
          'totalValue',
          'totalPaid',
          'totalRemaining',
        ],
      },
      {
        id: 'medicine',
        name: 'Báo cáo phân tích thuốc',
        description: 'Báo cáo thống kê theo thuốc',
        fields: ['medicineCode', 'medicineName', 'totalQuantity', 'totalValue', 'averagePrice'],
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

// Get import orders report
const getImportOrdersReport = async (req, res) => {
  try {
    const { startDate, endDate, period = 'monthly', status, supplierId, page, limit } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }

    // Validate date format
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Please use ISO date format (YYYY-MM-DD)',
      });
    }

    const filters = {
      startDate,
      endDate,
      period,
      status,
      supplierId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    };

    console.log('Import orders report filters:', filters);

    const reportData = await ReportService.getImportOrdersReport(filters);

    if (reportData.success) {
      res.status(200).json(reportData);
    } else {
      res.status(400).json(reportData);
    }
  } catch (error) {
    console.error('Error getting import orders report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate import orders report',
      details: error.message,
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

    // Convert array of arrays to worksheet
    const worksheet = xlsx.utils.aoa_to_sheet(result.data);

    // Define column widths for better formatting
    const columnWidths = {
      A: 8, // STT
      B: 15, // MÃ VẬT TƯ
      C: 30, // TÊN VẬT TƯ
      D: 10, // ĐVT
      E: 12, // SỐ LƯỢNG
      F: 12, // SẴN CÓ
      G: 12, // NHẬP
      H: 15, // SỐ LÔ
      I: 20, // MÃ ĐƠN HÀNG
      J: 15, // MÃ HĐ
      K: 25, // NHÀ CUNG CẤP
      L: 15, // TRẠNG THÁI
    };

    // Apply column widths
    worksheet['!cols'] = Object.keys(columnWidths).map((key) => ({
      wch: columnWidths[key],
    }));

    // Apply styling to specific cells
    // Main title styling
    if (worksheet['A1']) {
      worksheet['A1'].s = {
        font: { bold: true, size: 16, color: { rgb: '1F4E79' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: 'E3F2FD' } },
      };
    }

    // Subtitle styling
    if (worksheet['A3']) {
      worksheet['A3'].s = {
        font: { bold: true, size: 14, color: { rgb: '2E7D32' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: 'E8F5E8' } },
      };
    }

    // Header row styling
    const headerRow = 7; // Row index for headers
    for (let col = 0; col < 12; col++) {
      const cellRef = xlsx.utils.encode_cell({ r: headerRow, c: col });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          font: { bold: true, size: 12, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: '1976D2' } },
          border: {
            top: { style: 'thin', color: { rgb: 'FFFFFF' } },
            bottom: { style: 'thin', color: { rgb: 'FFFFFF' } },
            left: { style: 'thin', color: { rgb: 'FFFFFF' } },
            right: { style: 'thin', color: { rgb: 'FFFFFF' } },
          },
        };
      }
    }

    // Data rows styling (alternating colors)
    const dataStartRow = 8;
    const dataEndRow = result.data.length - 2; // Exclude total row

    for (let row = dataStartRow; row <= dataEndRow; row++) {
      const bgColor = row % 2 === 0 ? 'F8F9FA' : 'FFFFFF';
      for (let col = 0; col < 12; col++) {
        const cellRef = xlsx.utils.encode_cell({ r: row, c: col });
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = {
            font: { size: 11 },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: bgColor } },
            border: {
              top: { style: 'thin', color: { rgb: 'E0E0E0' } },
              bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
              left: { style: 'thin', color: { rgb: 'E0E0E0' } },
              right: { style: 'thin', color: { rgb: 'E0E0E0' } },
            },
          };
        }
      }
    }

    // Total row styling
    const totalRow = result.data.length - 1;
    for (let col = 0; col < 12; col++) {
      const cellRef = xlsx.utils.encode_cell({ r: totalRow, c: col });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          font: { bold: true, size: 12, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: '388E3C' } },
          border: {
            top: { style: 'thin', color: { rgb: 'FFFFFF' } },
            bottom: { style: 'thin', color: { rgb: 'FFFFFF' } },
            left: { style: 'thin', color: { rgb: 'FFFFFF' } },
            right: { style: 'thin', color: { rgb: 'FFFFFF' } },
          },
        };
      }
    }

    // Merge cells for main title
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // Main title
      { s: { r: 2, c: 0 }, e: { r: 2, c: 11 } }, // Subtitle
      { s: { r: 3, c: 0 }, e: { r: 3, c: 11 } }, // Warehouse info
      { s: { r: 4, c: 0 }, e: { r: 4, c: 11 } }, // Date range
    ];

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
      error: 'Internal server error while fetching import report dashboard data',
    });
  }
};

// ===== EXPORT ORDERS REPORT FUNCTIONS =====

// Get export orders report
const getExportOrdersReport = async (req, res) => {
  try {
    const { startDate, endDate, period = 'monthly', status, partnerType, page, limit } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }

    // Validate date format
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Please use ISO date format (YYYY-MM-DD)',
      });
    }

    const filters = {
      startDate,
      endDate,
      period,
      status,
      partnerType,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    };

    console.log('Export orders report filters:', filters);

    const reportData = await ReportService.getExportOrdersReport(filters);

    if (reportData.success) {
      res.status(200).json(reportData);
    } else {
      res.status(400).json(reportData);
    }
  } catch (error) {
    console.error('Error getting export orders report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate export orders report',
      details: error.message,
    });
  }
};

// Get export orders report by period
const getExportOrdersReportByPeriod = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }

    const reportData = await ReportService.getExportOrdersReportByPeriod(
      period,
      startDate,
      endDate,
    );

    if (reportData.success) {
      res.status(200).json(reportData);
    } else {
      res.status(400).json(reportData);
    }
  } catch (error) {
    console.error('Error getting export orders period report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate export orders period report',
      details: error.message,
    });
  }
};

// Get export orders partner analysis report
const getExportOrdersPartnerAnalysis = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }

    const reportData = await ReportService.getExportOrdersPartnerAnalysis(startDate, endDate);

    if (reportData.success) {
      res.status(200).json(reportData);
    } else {
      res.status(400).json(reportData);
    }
  } catch (error) {
    console.error('Error getting export orders partner analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate export orders partner analysis',
      details: error.message,
    });
  }
};

// Export export orders report to Excel
const exportExportOrdersToExcel = async (req, res) => {
  try {
    console.log('🚀 Export export orders function started');
    console.log('📊 Request headers:', req.headers);
    console.log('📊 Request query:', req.query);

    const { startDate, endDate, period = 'monthly', status, partnerType } = req.query;

    const filters = {
      startDate,
      endDate,
      period,
      status,
      partnerType,
      page: 1, // For export, we want all data, so start from page 1
      limit: 10000, // Set a high limit to get all data for export
    };

    console.log('Export export orders to Excel filters:', filters);

    const exportResult = await ReportService.exportExportOrdersToExcel(filters);

    if (!exportResult.success) {
      return res.status(400).json(exportResult);
    }

    const reportData = exportResult.data;

    if (
      !reportData ||
      !reportData.exportOrders ||
      !Array.isArray(reportData.exportOrders) ||
      reportData.exportOrders.length === 0
    ) {
      return res.status(404).json({
        success: false,
        error: 'No data available for export',
        message: 'Please check your filters and try again',
      });
    }

    console.log('🔍 Starting Excel generation for export orders...');

    // Create workbook and worksheet
    const workbook = xlsx.utils.book_new();

    // Clean and prepare data for Excel
    const cleanData = reportData.exportOrders
      .map((item, index) => {
        try {
          if (!item || typeof item !== 'object') {
            return null;
          }

          const cleanItem = {};
          Object.keys(item).forEach((key) => {
            let value = item[key];

            // Skip error fields and internal fields
            if (key === 'error' || key === '_id' || key === '__v') {
              return;
            }

            // Handle different data types
            if (value === null || value === undefined) {
              value = '';
            } else if (typeof value === 'object') {
              if (Array.isArray(value)) {
                value = value.length > 0 ? `${value.length} items` : 'No items';
              } else {
                try {
                  value = JSON.stringify(value);
                } catch (stringifyError) {
                  value = 'N/A';
                }
              }
            } else if (typeof value === 'number') {
              value = isNaN(value) ? 0 : value;
            } else if (typeof value === 'string') {
              value = value.toString().trim();
              if (value.toLowerCase().includes('error')) {
                value = 'N/A';
              }
            } else if (value instanceof Date) {
              value = value.toISOString().split('T')[0];
            }

            cleanItem[key] = value;
          });

          return cleanItem;
        } catch (itemError) {
          console.warn(`⚠️ Error cleaning item ${index}:`, itemError);
          return null;
        }
      })
      .filter((item) => item !== null);

    if (cleanData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No clean data available for export',
        message: 'All data contained errors and was filtered out',
      });
    }

    // Convert data to Excel format
    const excelData = cleanData.map((item) => {
      const cleanItem = {};
      Object.keys(item).forEach((key) => {
        let value = item[key];

        if (value === null || value === undefined) {
          value = '';
        }

        if (typeof value === 'object' && !Array.isArray(value)) {
          try {
            value = JSON.stringify(value);
          } catch (stringifyError) {
            value = 'N/A';
          }
        }

        if (Array.isArray(value)) {
          value = value.length > 0 ? `${value.length} items` : 'No items';
        }

        if (typeof value === 'number' && isNaN(value)) {
          value = 0;
        }

        cleanItem[key] = String(value);
      });
      return cleanItem;
    });

    console.log('🔍 Excel data prepared:', {
      rows: excelData.length,
      columns: excelData.length > 0 ? Object.keys(excelData[0]).length : 0,
    });

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
      wch: Math.min(Math.max(columnWidths[key], 10), 50),
    }));

    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Export Orders Report');

    // Generate filename
    let filename = 'export_orders_report';
    if (startDate && endDate) {
      try {
        const startDateStr = new Date(startDate).toISOString().split('T')[0];
        const endDateStr = new Date(endDate).toISOString().split('T')[0];
        filename = `export_orders_report_${startDateStr}_to_${endDateStr}`;
      } catch (dateError) {
        filename = `export_orders_report_${new Date().toISOString().split('T')[0]}`;
      }
    } else {
      filename = `export_orders_report_${new Date().toISOString().split('T')[0]}`;
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
      `✅ Successfully exported export orders report with ${cleanData.length} records, file size: ${buffer.length} bytes`,
    );

    // Send buffer
    res.send(buffer);
  } catch (error) {
    console.error('❌ Error exporting export orders to Excel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export export orders report to Excel',
      details: error.message,
    });
  }
};

// Get partner types for filtering
const getPartnerTypes = async (req, res) => {
  try {
    const partnerTypes = await ReportService.getPartnerTypes();

    if (partnerTypes.success) {
      res.status(200).json(partnerTypes);
    } else {
      res.status(400).json(partnerTypes);
    }
  } catch (error) {
    console.error('Error getting partner types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get partner types',
      details: error.message,
    });
  }
};

module.exports = {
  // Bills report functions
  getComprehensiveReport,
  getReportByPeriod,
  getPartnerAnalysisReport,
  getMedicineAnalysisReport,
  exportReportToExcel,

  // Export orders report functions
  getExportOrdersReport,
  getExportOrdersReportByPeriod,
  getExportOrdersPartnerAnalysis,
  exportExportOrdersToExcel,
  getPartnerTypes,

  // Import orders report functions
  getImportOrdersReport,
  exportImportOrdersReport,
  getImportReportSummary,
  getImportReportDashboard,

  // File upload functions
  upload,
  uploadExcelFile,

  // Template functions
  getReportTemplates,
};
