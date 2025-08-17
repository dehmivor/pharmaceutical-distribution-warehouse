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

    let reportData;

    switch (reportType) {
      case 'comprehensive':
        const filters = { startDate, endDate, period, status, type, partnerType };
        const comprehensiveReport = await ReportService.getComprehensiveReport(filters);
        reportData = comprehensiveReport.data.bills;
        break;
      case 'period':
        reportData = await ReportService.getReportByPeriod(period, startDate, endDate);
        reportData = reportData.data;
        break;
      case 'partner':
        reportData = await ReportService.getPartnerAnalysisReport(startDate, endDate);
        reportData = reportData.data;
        break;
      case 'medicine':
        reportData = await ReportService.getMedicineAnalysisReport(startDate, endDate);
        reportData = reportData.data;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid report type',
        });
    }

    // Create workbook and worksheet
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(reportData);

    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Report');

    // Generate filename with date range
    let filename = 'report_bill';
    if (startDate && endDate) {
      const startDateStr = new Date(startDate).toISOString().split('T')[0];
      const endDateStr = new Date(endDate).toISOString().split('T')[0];
      filename = `report_bill (${startDateStr} - ${endDateStr})`;
    } else {
      const timestamp = new Date().toISOString().split('T')[0];
      filename = `report_bill (${timestamp})`;
    }
    filename += '.xlsx';

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write to response
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting report to Excel:', error);
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

module.exports = {
  getComprehensiveReport,
  getReportByPeriod,
  getPartnerAnalysisReport,
  getMedicineAnalysisReport,
  exportReportToExcel,
  uploadExcelFile,
  getReportTemplates,
  upload,
};
