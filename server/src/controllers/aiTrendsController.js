const AiTrendsService = require('../services/aiTrendsService');
const AITrendsDatabaseService = require('../services/aiTrendsDatabaseService');

/**
 * Lấy dự đoán nhu cầu cho một thuốc cụ thể
 */
const getMedicineDemandPrediction = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { months = 6 } = req.query;

    if (!medicineId) {
      return res.status(400).json({
        success: false,
        error: 'Medicine ID is required',
      });
    }

    const prediction = await AiTrendsService.predictMedicineDemand(medicineId, parseInt(months));

    res.status(200).json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get medicine demand prediction',
    });
  }
};

/**
 * Lấy dự đoán nhu cầu cho tất cả thuốc
 */
const getAllMedicineDemandPredictions = async (req, res) => {
  try {
    const { months = 6 } = req.query;

    const predictions = await AiTrendsService.predictAllMedicineDemand(parseInt(months));

    res.status(200).json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get all medicine demand predictions',
    });
  }
};

/**
 * Lấy gợi ý nhập thuốc từ AI
 */
const getImportRecommendations = async (req, res) => {
  try {
    const recommendations = await AiTrendsService.generateImportRecommendations();

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get import recommendations',
    });
  }
};

/**
 * Lấy phân tích xu hướng thị trường
 */
const getMarketTrends = async (req, res) => {
  try {
    const marketTrends = await AiTrendsService.analyzeMarketTrends();

    res.status(200).json({
      success: true,
      data: marketTrends,
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get market trends',
    });
  }
};

/**
 * Lấy danh sách bất thường trong nhu cầu
 */
const getDemandAnomalies = async (req, res) => {
  try {
    const anomalies = await AiTrendsService.detectDemandAnomalies();

    res.status(200).json({
      success: true,
      data: anomalies,
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get demand anomalies',
    });
  }
};

/**
 * Lấy báo cáo tổng hợp AI
 */
const getAIReport = async (req, res) => {
  try {
    const report = await AiTrendsService.generateAIReport();

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get AI report',
    });
  }
};

/**
 * Lấy thông tin tồn kho hiện tại
 */
const getCurrentInventoryLevels = async (req, res) => {
  try {
    const inventory = await AiTrendsService.getCurrentInventoryLevels();

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get current inventory levels',
    });
  }
};

/**
 * Lấy hợp đồng nhà cung cấp đang hoạt động
 */
const getActiveSupplierContracts = async (req, res) => {
  try {
    const contracts = await AiTrendsService.getActiveSupplierContracts();

    res.status(200).json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get active supplier contracts',
    });
  }
};

/**
 * Lấy dự đoán nhu cầu theo khoảng thời gian
 */
const getDemandPredictionsByPeriod = async (req, res) => {
  try {
    const { period = '6months' } = req.query;

    let months;
    switch (period) {
      case '3months':
        months = 3;
        break;
      case '6months':
        months = 6;
        break;
      case '12months':
        months = 12;
        break;
      default:
        months = 6;
    }

    const predictions = await AiTrendsService.predictAllMedicineDemand(months);

    res.status(200).json({
      success: true,
      data: {
        period,
        months,
        predictions,
      },
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get demand predictions by period',
    });
  }
};

/**
 * Lấy gợi ý nhập thuốc theo độ ưu tiên
 */
const getImportRecommendationsByPriority = async (req, res) => {
  try {
    const { priority } = req.query; // high, medium, low, all

    const recommendations = await AiTrendsService.generateImportRecommendations();

    let filteredRecommendations = recommendations.recommendations;

    if (priority && priority !== 'all') {
      filteredRecommendations = recommendations.recommendations.filter(
        (rec) => rec.priority === priority,
      );
    }

    res.status(200).json({
      success: true,
      data: {
        ...recommendations,
        recommendations: filteredRecommendations,
        filteredByPriority: priority || 'all',
      },
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get import recommendations by priority',
    });
  }
};

/**
 * Lấy thống kê tổng quan AI
 */
const getAIStatistics = async (req, res) => {
  try {
    const [demandPredictions, importRecommendations, marketTrends, demandAnomalies] =
      await Promise.all([
        AiTrendsService.predictAllMedicineDemand(6),
        AiTrendsService.generateImportRecommendations(),
        AiTrendsService.analyzeMarketTrends(),
        AiTrendsService.detectDemandAnomalies(),
      ]);

    const statistics = {
      totalMedicines: demandPredictions.totalMedicines,
      totalRecommendations: importRecommendations.totalRecommendations,
      totalAnomalies: demandAnomalies.length,
      marketAlerts: marketTrends.whoAlerts.length + marketTrends.drugBankUpdates.length,

      // Thống kê theo xu hướng
      trends: {
        increasing: demandPredictions.predictions.filter((p) => p.trend === 'increasing').length,
        decreasing: demandPredictions.predictions.filter((p) => p.trend === 'decreasing').length,
        stable: demandPredictions.predictions.filter((p) => p.trend === 'stable').length,
      },

      // Thống kê theo độ ưu tiên
      priorities: {
        high: importRecommendations.recommendations.filter((r) => r.priority === 'high').length,
        medium: importRecommendations.recommendations.filter((r) => r.priority === 'medium').length,
        low: importRecommendations.recommendations.filter((r) => r.priority === 'low').length,
      },

      // Thống kê theo độ tin cậy
      confidence: {
        high: demandPredictions.predictions.filter((p) => p.confidence >= 0.8).length,
        medium: demandPredictions.predictions.filter(
          (p) => p.confidence >= 0.6 && p.confidence < 0.8,
        ).length,
        low: demandPredictions.predictions.filter((p) => p.confidence < 0.6).length,
      },

      generatedAt: new Date(),
    };

    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get AI statistics',
    });
  }
};

// ===== NEW DATABASE-BASED METHODS =====

/**
 * Lấy predictions từ database
 */
const getPredictionsFromDatabase = async (req, res) => {
  try {
    const { medicineId, predictionType = 'demand', limit = 50 } = req.query;

    const predictions = await AITrendsDatabaseService.getPredictionsFromDatabase(
      medicineId,
      predictionType,
      parseInt(limit),
    );

    res.status(200).json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get predictions from database',
    });
  }
};

/**
 * Lấy predictions theo loại và thời gian
 */
const getPredictionsByTypeAndTime = async (req, res) => {
  try {
    const { predictionType = 'demand', days = 30 } = req.query;

    const predictions = await AITrendsDatabaseService.getPredictionsByTypeAndTime(
      predictionType,
      parseInt(days),
    );

    res.status(200).json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get predictions by type and time',
    });
  }
};

/**
 * Lấy predictions có độ tin cậy cao
 */
const getHighConfidencePredictions = async (req, res) => {
  try {
    const { confidenceThreshold = 0.8 } = req.query;

    const predictions = await AITrendsDatabaseService.getHighConfidencePredictions(
      parseFloat(confidenceThreshold),
    );

    res.status(200).json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get high confidence predictions',
    });
  }
};

/**
 * Lấy predictions theo trend
 */
const getPredictionsByTrend = async (req, res) => {
  try {
    const { trend } = req.params;

    if (!trend || !['increasing', 'decreasing', 'stable'].includes(trend)) {
      return res.status(400).json({
        success: false,
        error: 'Valid trend parameter is required (increasing, decreasing, stable)',
      });
    }

    const predictions = await AITrendsDatabaseService.getPredictionsByTrend(trend);

    res.status(200).json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get predictions by trend',
    });
  }
};

/**
 * Lấy thống kê AI từ database
 */
const getAIStatisticsFromDatabase = async (req, res) => {
  try {
    const stats = await AITrendsDatabaseService.getAIStatisticsFromDatabase();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get AI statistics from database',
    });
  }
};

/**
 * Cleanup expired predictions
 */
const cleanupExpiredPredictions = async (req, res) => {
  try {
    const result = await AITrendsDatabaseService.cleanupExpiredPredictions();

    res.status(200).json({
      success: true,
      data: result,
      message: 'Expired predictions cleaned up successfully',
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cleanup expired predictions',
    });
  }
};

// ==================== OPENAI INTEGRATION CONTROLLERS ====================

/**
 * Lấy phân tích xu hướng thị trường với OpenAI
 */
const getAIPoweredMarketTrends = async (req, res) => {
  try {
    console.log('Controller: Getting AI-powered market trends');

    const marketTrends = await AiTrendsService.analyzeMarketTrendsWithAI();

    res.status(200).json({
      success: true,
      data: marketTrends,
      message: 'AI-powered market trends retrieved successfully',
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get AI-powered market trends',
    });
  }
};

/**
 * Lấy gợi ý nhập thuốc với OpenAI
 */
const getAIPoweredImportRecommendations = async (req, res) => {
  try {
    console.log('Controller: Getting AI-powered import recommendations');

    const recommendations = await AiTrendsService.generateImportRecommendationsWithAI();

    res.status(200).json({
      success: true,
      data: recommendations,
      message: 'AI-powered import recommendations retrieved successfully',
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get AI-powered import recommendations',
    });
  }
};

/**
 * Dự đoán nhu cầu thuốc với OpenAI
 */
const getAIPoweredMedicineDemandPrediction = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { months = 6 } = req.query;

    if (!medicineId) {
      return res.status(400).json({
        success: false,
        error: 'Medicine ID is required',
      });
    }

    console.log(`Controller: Getting AI-powered demand prediction for medicine ${medicineId}`);

    const prediction = await AiTrendsService.predictMedicineDemandWithAI(
      medicineId,
      parseInt(months),
    );

    res.status(200).json({
      success: true,
      data: prediction,
      message: 'AI-powered medicine demand prediction retrieved successfully',
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get AI-powered medicine demand prediction',
    });
  }
};

/**
 * Phân tích bất thường với OpenAI
 */
const getAIPoweredAnomalies = async (req, res) => {
  try {
    console.log('Controller: Getting AI-powered anomalies analysis');

    const anomalies = await AiTrendsService.analyzeAnomaliesWithAI();

    res.status(200).json({
      success: true,
      data: anomalies,
      message: 'AI-powered anomalies analysis retrieved successfully',
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get AI-powered anomalies analysis',
    });
  }
};

/**
 * Kiểm tra trạng thái OpenAI
 */
const getOpenAIStatus = async (req, res) => {
  try {
    const OpenAIService = require('../services/openaiService');
    const openaiService = new OpenAIService();

    const status = {
      available: openaiService.isAvailable(),
      configured: !!process.env.OPENAI_API_KEY,
      timestamp: new Date(),
    };

    res.status(200).json({
      success: true,
      data: status,
      message: 'OpenAI status retrieved successfully',
    });
  } catch (error) {
    console.error('AI Trends Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get OpenAI status',
    });
  }
};

module.exports = {
  getMedicineDemandPrediction,
  getAllMedicineDemandPredictions,
  getImportRecommendations,
  getMarketTrends,
  getDemandAnomalies,
  getAIReport,
  getCurrentInventoryLevels,
  getActiveSupplierContracts,
  getDemandPredictionsByPeriod,
  getImportRecommendationsByPriority,
  getAIStatistics,

  // New database methods
  getPredictionsFromDatabase,
  getPredictionsByTypeAndTime,
  getHighConfidencePredictions,
  getPredictionsByTrend,
  getAIStatisticsFromDatabase,
  cleanupExpiredPredictions,

  // OpenAI integration methods
  getAIPoweredMarketTrends,
  getAIPoweredImportRecommendations,
  getAIPoweredMedicineDemandPrediction,
  getAIPoweredAnomalies,
  getOpenAIStatus,
};
