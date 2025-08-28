const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const ReportService = require('../services/reportService');
const ExcelJS = require('exceljs');

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
    const {
      startDate,
      endDate,
      period = 'monthly',
      status,
      type,
      partnerType,
      reportType = 'comprehensive',
    } = req.query;

    let reportData;
    let reportTitle = 'BÁO CÁO';

    switch (reportType) {
      case 'comprehensive':
        const filters = { startDate, endDate, period, status, type, partnerType };
        const comprehensiveReport = await ReportService.getComprehensiveReport(filters);
        if (!comprehensiveReport.success) {
          return res.status(400).json({
            success: false,
            error: 'Failed to generate comprehensive report',
            details: comprehensiveReport.error,
          });
        }
        reportData = comprehensiveReport.data.bills || [];
        reportTitle = 'TỔNG HỢP BÁO CÁO HÓA ĐƠN';
        break;

      case 'period':
        const periodReport = await ReportService.getReportByPeriod(period, startDate, endDate);
        if (!periodReport.success) {
          return res.status(400).json({
            success: false,
            error: 'Failed to generate period report',
            details: periodReport.error,
          });
        }
        reportData = periodReport.data || [];
        reportTitle = `${period.toUpperCase()} REPORT`;
        break;

      case 'partner':
        const partnerReport = await ReportService.getPartnerAnalysisReport(startDate, endDate);
        if (!partnerReport.success) {
          return res.status(400).json({
            success: false,
            error: 'Failed to generate partner report',
            details: partnerReport.error,
          });
        }
        reportData = partnerReport.data || [];
        reportTitle = 'BÁO CÁO PHÂN TÍCH ĐỐI TÁC';
        break;

      case 'medicine':
        const medicineReport = await ReportService.getMedicineAnalysisReport(startDate, endDate);
        if (!medicineReport.success) {
          return res.status(400).json({
            success: false,
            error: 'Failed to generate medicine report',
            details: medicineReport.error,
          });
        }
        reportData = medicineReport.data || [];
        reportTitle = 'BÁO CÁO PHÂN TÍCH THUỐC';
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid report type',
          validTypes: ['comprehensive', 'period', 'partner', 'medicine'],
        });
    }

    if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data available for export',
      });
    }

    const cleanData = reportData.map((item, idx) => {
      const cleanItem = { STT: idx + 1 };
      Object.keys(item).forEach((key) => {
        let value = item[key];
        if (value === null || value === undefined) value = '';
        else if (value instanceof Date) value = value.toISOString().split('T')[0];
        else if (typeof value === 'object') {
          value = Array.isArray(value) ? `${value.length} items` : JSON.stringify(value);
        }
        cleanItem[key] = value;
      });
      return cleanItem;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo cáo');

    // ==== CẤU HÌNH CỘT ====
    const columns = Object.keys(cleanData[0]).map((key) => ({
      header: key.toUpperCase(),
      key,
      width: 10, // ✨ thu nhỏ cột
    }));
    worksheet.columns = columns;

    // Lấy chữ cái cột cuối cùng để merge tiêu đề
    const lastColIndex = worksheet.columns.length;
    const lastColLetter = worksheet.getColumn(lastColIndex).letter;

    // ==== TIÊU ĐỀ ====
    worksheet.mergeCells(`A1:${lastColLetter}1`);
    worksheet.getCell('A1').value = 'ĐƠN VỊ: ...................................................';
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };

    worksheet.mergeCells(`A2:${lastColLetter}2`);
    worksheet.getCell('A2').value = 'Địa chỉ: ...................................................';
    worksheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'left' };

    worksheet.mergeCells(`A4:${lastColLetter}4`);
    worksheet.getCell('A4').value = reportTitle;
    worksheet.getCell('A4').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getCell('A4').font = { bold: true, size: 14 };

    worksheet.mergeCells(`A5:${lastColLetter}5`);
    worksheet.getCell('A5').value = `KHO: TẤT CẢ CÁC KHO`;
    worksheet.getCell('A5').alignment = { horizontal: 'left' };

    worksheet.mergeCells(`A6:${lastColLetter}6`);
    worksheet.getCell('A6').value =
      `BÁO CÁO TỪ NGÀY: ${startDate || '...'}   ĐẾN NGÀY: ${endDate || '...'}`;
    worksheet.getCell('A6').alignment = { horizontal: 'left' };

    worksheet.addRow([]);
    worksheet.addRow([]);

    // ==== HEADER CỘT ====
    const headerRow = worksheet.getRow(9);
    headerRow.values = columns.map((c) => c.header);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FF000000' } }; // đậm đen
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD966' } }; // nền vàng
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // ==== DATA ROWS ====
    cleanData.forEach((row) => worksheet.addRow(row));

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 9) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0.00';
            cell.alignment = { horizontal: 'right' };
          }
        });
      }
    });

    worksheet.views = [{ state: 'frozen', ySplit: 9 }];

    // ==== CHỮ KÝ ====
    const lastRow = worksheet.lastRow.number + 3;
    worksheet.mergeCells(`F${lastRow}:${lastColLetter}${lastRow}`);
    worksheet.getCell(`F${lastRow}`).value = `Ngày ..... tháng ..... năm ..........`;
    worksheet.getCell(`F${lastRow}`).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`B${lastRow + 1}:C${lastRow + 1}`);
    worksheet.getCell(`B${lastRow + 1}`).value = 'NGƯỜI LẬP BIỂU';
    worksheet.getCell(`B${lastRow + 1}`).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`F${lastRow + 1}:${lastColLetter}${lastRow + 1}`);
    worksheet.getCell(`F${lastRow + 1}`).value = 'KẾ TOÁN TRƯỞNG';
    worksheet.getCell(`F${lastRow + 1}`).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`B${lastRow + 2}:C${lastRow + 2}`);
    worksheet.getCell(`B${lastRow + 2}`).value = '(Họ và tên)';
    worksheet.getCell(`B${lastRow + 2}`).alignment = { horizontal: 'center', italic: true };

    worksheet.mergeCells(`F${lastRow + 2}:${lastColLetter}${lastRow + 2}`);
    worksheet.getCell(`F${lastRow + 2}`).value = '(Họ và tên)';
    worksheet.getCell(`F${lastRow + 2}`).alignment = { horizontal: 'center', italic: true };

    // ==== TRẢ FILE ====
    const filename = `Báo cáo_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('❌ Error exporting report:', error);
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

    // Validate pagination parameters
    const validatedPage = page ? parseInt(page) : 1;
    const validatedLimit = limit ? parseInt(limit) : 10;

    if (validatedPage < 1) {
      return res.status(400).json({
        success: false,
        error: 'Page must be a positive number',
      });
    }

    if (validatedLimit < 1 || validatedLimit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 100',
      });
    }

    const filters = {
      startDate,
      endDate,
      period,
      status,
      supplierId,
      page: validatedPage,
      limit: validatedLimit,
    };

    console.log('Import orders report filters:', filters);
    console.log('Pagination - Page:', validatedPage, 'Limit:', validatedLimit);

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
    const { startDate, endDate, period, status, supplierId, reportType } = req.query;

    const result = await ReportService.exportImportOrdersReport({
      startDate,
      endDate,
      period,
      status,
      supplierId,
      reportType,
    });

    res.setHeader('Content-Disposition', `attachment; filename=${result.filename}`);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(result.data);
  } catch (error) {
    console.error('Error exporting import orders report:', error);
    res.status(500).json({ error: error.message || 'Server error' });
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
