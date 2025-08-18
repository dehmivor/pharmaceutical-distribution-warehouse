const ExportReportService = require('../services/exportReportService');

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

    const reportData = await ExportReportService.getExportOrdersReport(filters);

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

    const reportData = await ExportReportService.getExportOrdersReportByPeriod(
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

    const reportData = await ExportReportService.getExportOrdersPartnerAnalysis(startDate, endDate);

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
    const { startDate, endDate, period = 'monthly', status, partnerType } = req.query;

    const filters = {
      startDate,
      endDate,
      period,
      status,
      partnerType,
    };

    console.log('Export export orders to Excel filters:', filters);

    const exportResult = await ExportReportService.exportExportOrdersToExcel(filters);

    if (exportResult.success) {
      // For now, return JSON data
      // In production, this would create and return an Excel file
      res.status(200).json({
        success: true,
        message: 'Export orders report exported successfully',
        data: exportResult.data,
        filename: exportResult.filename,
      });
    } else {
      res.status(400).json(exportResult);
    }
  } catch (error) {
    console.error('Error exporting export orders to Excel:', error);
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
    const partnerTypes = await ExportReportService.getPartnerTypes();
    
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
  getExportOrdersReport,
  getExportOrdersReportByPeriod,
  getExportOrdersPartnerAnalysis,
  exportExportOrdersToExcel,
  getPartnerTypes,
};
