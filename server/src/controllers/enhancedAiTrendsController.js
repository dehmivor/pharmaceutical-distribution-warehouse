const EnhancedAiTrendsService = require('../services/enhancedAiTrendsService');
const { validateObjectId } = require('../utils/validators');

class EnhancedAiTrendsController {
  static async generateMedicineAiTrends(req, res) {
    try {
      const { medicineId, forecastPeriod = 2 } = req.body;

      if (!medicineId || !validateObjectId(medicineId)) {
        return res.status(400).json({
          success: false,
          message: 'Medicine ID không hợp lệ',
        });
      }

      if (forecastPeriod < 1 || forecastPeriod > 12) {
        return res.status(400).json({
          success: false,
          message: 'Khoảng thời gian dự báo phải từ 1-12 tháng',
        });
      }

      const aiTrends = await EnhancedAiTrendsService.generateMedicineAiTrends(
        medicineId,
        forecastPeriod,
      );

      res.json({
        success: true,
        data: aiTrends,
      });
    } catch (error) {
      console.error('Error generating medicine AI trends:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo AI trends cho thuốc',
        error: error.message,
      });
    }
  }

  static async generateAllMedicinesAiTrends(req, res) {
    try {
      const { forecastPeriod = 2, limit = 50 } = req.query;

      if (forecastPeriod < 1 || forecastPeriod > 12) {
        return res.status(400).json({
          success: false,
          message: 'Khoảng thời gian dự báo phải từ 1-12 tháng',
        });
      }

      if (limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Giới hạn phải từ 1-100',
        });
      }

      const aiTrends = await EnhancedAiTrendsService.generateAllMedicinesAiTrends(
        parseInt(forecastPeriod),
        parseInt(limit),
      );

      res.json({
        success: true,
        data: aiTrends,
        total: aiTrends.length,
      });
    } catch (error) {
      console.error('Error generating all medicines AI trends:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo AI trends cho tất cả thuốc',
        error: error.message,
      });
    }
  }

  static async generateRegionalAiTrends(req, res) {
    try {
      const { region, forecastPeriod = 2 } = req.params;

      if (!region) {
        return res.status(400).json({
          success: false,
          message: 'Khu vực không được để trống',
        });
      }

      if (forecastPeriod < 1 || forecastPeriod > 12) {
        return res.status(400).json({
          success: false,
          message: 'Khoảng thời gian dự báo phải từ 1-12 tháng',
        });
      }

      const aiTrends = await EnhancedAiTrendsService.generateRegionalAiTrends(
        region,
        parseInt(forecastPeriod),
      );

      res.json({
        success: true,
        data: aiTrends,
        region,
        total: aiTrends.length,
      });
    } catch (error) {
      console.error('Error generating regional AI trends:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo AI trends theo khu vực',
        error: error.message,
      });
    }
  }

  static async generateCategoryAiTrends(req, res) {
    try {
      const { category, forecastPeriod = 2 } = req.params;

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Danh mục không được để trống',
        });
      }

      if (forecastPeriod < 1 || forecastPeriod > 12) {
        return res.status(400).json({
          success: false,
          message: 'Khoảng thời gian dự báo phải từ 1-12 tháng',
        });
      }

      const aiTrends = await EnhancedAiTrendsService.generateCategoryAiTrends(
        category,
        parseInt(forecastPeriod),
      );

      res.json({
        success: true,
        data: aiTrends,
        category,
        total: aiTrends.length,
      });
    } catch (error) {
      console.error('Error generating category AI trends:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo AI trends theo danh mục',
        error: error.message,
      });
    }
  }

  static async generateComprehensiveReport(req, res) {
    try {
      const { forecastPeriod = 2 } = req.query;

      if (forecastPeriod < 1 || forecastPeriod > 12) {
        return res.status(400).json({
          success: false,
          message: 'Khoảng thời gian dự báo phải từ 1-12 tháng',
        });
      }

      const report = await EnhancedAiTrendsService.generateComprehensiveAiTrendsReport(
        parseInt(forecastPeriod),
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo báo cáo tổng hợp',
        error: error.message,
      });
    }
  }

  static async getMedicineRecommendations(req, res) {
    try {
      const { medicineId, forecastPeriod = 2 } = req.query;

      if (medicineId && !validateObjectId(medicineId)) {
        return res.status(400).json({
          success: false,
          message: 'Medicine ID không hợp lệ',
        });
      }

      if (forecastPeriod < 1 || forecastPeriod > 12) {
        return res.status(400).json({
          success: false,
          message: 'Khoảng thời gian dự báo phải từ 1-12 tháng',
        });
      }

      let recommendations;
      if (medicineId) {
        const aiTrends = await EnhancedAiTrendsService.generateMedicineAiTrends(
          medicineId,
          parseInt(forecastPeriod),
        );
        recommendations = aiTrends.quantityAdjustmentRecommendation;
      } else {
        const allTrends = await EnhancedAiTrendsService.generateAllMedicinesAiTrends(
          parseInt(forecastPeriod),
          50,
        );
        recommendations = allTrends.map((trend) => ({
          medicineId: trend.medicineId,
          medicineName: trend.medicineName,
          recommendation: trend.quantityAdjustmentRecommendation,
        }));
      }

      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      console.error('Error getting medicine recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy khuyến nghị thuốc',
        error: error.message,
      });
    }
  }

  static async getMarketInsights(req, res) {
    try {
      const { region, category, forecastPeriod = 2 } = req.query;

      if (forecastPeriod < 1 || forecastPeriod > 12) {
        return res.status(400).json({
          success: false,
          message: 'Khoảng thời gian dự báo phải từ 1-12 tháng',
        });
      }

      let insights;
      if (region) {
        insights = await EnhancedAiTrendsService.generateRegionalAiTrends(
          region,
          parseInt(forecastPeriod),
        );
      } else if (category) {
        insights = await EnhancedAiTrendsService.generateCategoryAiTrends(
          category,
          parseInt(forecastPeriod),
        );
      } else {
        insights = await EnhancedAiTrendsService.generateAllMedicinesAiTrends(
          parseInt(forecastPeriod),
          100,
        );
      }

      const marketInsights = {
        totalMedicines: insights.length,
        averageConfidence:
          insights.reduce((sum, item) => sum + item.confidenceLevel, 0) / insights.length,
        topTrendingMedicines: insights
          .sort((a, b) => b.confidenceLevel - a.confidenceLevel)
          .slice(0, 10),
        regionalBreakdown: region ? null : this.calculateRegionalBreakdown(insights),
        categoryBreakdown: category ? null : this.calculateCategoryBreakdown(insights),
      };

      res.json({
        success: true,
        data: marketInsights,
      });
    } catch (error) {
      console.error('Error getting market insights:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin thị trường',
        error: error.message,
      });
    }
  }

  static calculateRegionalBreakdown(insights) {
    const breakdown = {};
    insights.forEach((item) => {
      const region = item.forecastRegion || 'Unknown';
      if (!breakdown[region]) {
        breakdown[region] = { count: 0, totalConfidence: 0 };
      }
      breakdown[region].count++;
      breakdown[region].totalConfidence += item.confidenceLevel;
    });

    Object.keys(breakdown).forEach((region) => {
      breakdown[region].averageConfidence =
        breakdown[region].totalConfidence / breakdown[region].count;
    });

    return breakdown;
  }

  static calculateCategoryBreakdown(insights) {
    const breakdown = {};
    insights.forEach((item) => {
      const category = item.medicineCategory || 'Unknown';
      if (!breakdown[category]) {
        breakdown[category] = { count: 0, totalConfidence: 0 };
      }
      breakdown[category].count++;
      breakdown[category].totalConfidence += item.confidenceLevel;
    });

    Object.keys(breakdown).forEach((category) => {
      breakdown[category].averageConfidence =
        breakdown[category].totalConfidence / breakdown[category].count;
    });

    return breakdown;
  }
}

module.exports = EnhancedAiTrendsController;
