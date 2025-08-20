const express = require('express');
const router = express.Router();
const aiTrendsController = require('../controllers/aiTrendsController');
const AiTrendsService = require('../services/aiTrendsService'); // Added import for AiTrendsService

/**
 * @route   GET /api/ai-trends/health
 * @desc    Health check cho AI Trends service
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Trends Service is running',
    timestamp: new Date(),
    version: '1.0.0',
  });
});

/**
 * @route   GET /api/ai-trends/test-public
 * @desc    Test endpoint không cần authentication
 * @access  Public
 */
router.get('/test-public', async (req, res) => {
  try {
    // Test các service cơ bản
    const [statistics, recommendations, marketTrends, anomalies] = await Promise.all([
      AiTrendsService.getAIStatisticsFromDatabase(),
      AiTrendsService.generateImportRecommendations(),
      AiTrendsService.analyzeMarketTrends(),
      AiTrendsService.detectDemandAnomalies(),
    ]);

    res.status(200).json({
      success: true,
      message: 'AI Trends Test Public Endpoint',
      data: {
        statistics: statistics || [],
        recommendations: recommendations || { totalRecommendations: 0, recommendations: [] },
        marketTrends: marketTrends || { whoAlerts: [], drugBankUpdates: [] },
        anomalies: anomalies || [],
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('AI Trends Test Public Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Test failed',
    });
  }
});

/**
 * @route   GET /api/ai-trends/test-news
 * @desc    Test endpoint để kiểm tra việc lấy tin tức thực tế
 * @access  Public (tạm thời để test)
 */
router.get('/test-news', async (req, res) => {
  try {
    const NewsService = require('../services/newsService');

    console.log('AI Trends: Testing real news fetching...');

    const allNews = await NewsService.getAllNews();

    res.status(200).json({
      success: true,
      message: 'Real News Test Endpoint',
      data: {
        totalNews: allNews.length,
        newsBySource: {
          moh: allNews.filter((n) => n.source.includes('Bộ Y tế')).length,
          drugAdmin: allNews.filter((n) => n.source.includes('Cục Quản lý Dược')).length,
          hospitals: allNews.filter((n) => n.source.includes('Bệnh viện')).length,
          associations: allNews.filter((n) => n.source.includes('Hiệp hội')).length,
          media: allNews.filter((n) => n.source.includes('Sức khỏe')).length,
        },
        sampleNews: allNews.slice(0, 3),
        fetchStatus: 'success',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('AI Trends Test News Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'News test failed',
      timestamp: new Date(),
    });
  }
});

/**
 * @route   GET /api/ai-trends/test-news-source/:source
 * @desc    Test endpoint để kiểm tra việc lấy tin tức từ nguồn cụ thể
 * @access  Public (tạm thời để test)
 */
router.get('/test-news-source/:source', async (req, res) => {
  try {
    const NewsService = require('../services/newsService');
    const { source } = req.params;

    console.log(`AI Trends: Testing news fetching from source: ${source}`);

    let news = [];
    let sourceName = '';

    switch (source) {
      case 'moh':
        news = await NewsService.getMOHNews();
        sourceName = 'Bộ Y tế Việt Nam';
        break;
      case 'drug-admin':
        news = await NewsService.getDrugAdminNews();
        sourceName = 'Cục Quản lý Dược';
        break;
      case 'hospitals':
        news = await NewsService.getHospitalRSSNews();
        sourceName = 'Bệnh viện';
        break;
      case 'pharma':
        news = await NewsService.getPharmaAssociationNews();
        sourceName = 'Hiệp hội Dược phẩm';
        break;
      case 'media':
        news = await NewsService.getHealthMediaNews();
        sourceName = 'Truyền thông Y tế';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid source. Use: moh, drug-admin, hospitals, pharma, media',
        });
    }

    res.status(200).json({
      success: true,
      message: `News Test from ${sourceName}`,
      data: {
        source: sourceName,
        totalNews: news.length,
        news: news,
        fetchStatus: 'success',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error(`AI Trends Test News Source Error:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'News source test failed',
      timestamp: new Date(),
    });
  }
});

/**
 * @route   GET /api/ai-trends/predictions/:medicineId
 * @desc    Lấy dự đoán nhu cầu cho một thuốc cụ thể
 * @access  Private (Supervisor only)
 */
router.get('/predictions/:medicineId', aiTrendsController.getMedicineDemandPrediction);

/**
 * @route   GET /api/ai-trends/predictions
 * @desc    Lấy dự đoán nhu cầu cho tất cả thuốc
 * @access  Private (Supervisor only)
 */
router.get('/predictions', aiTrendsController.getAllMedicineDemandPredictions);

/**
 * @route   GET /api/ai-trends/predictions/period/:period
 * @desc    Lấy dự đoán nhu cầu theo khoảng thời gian (3months, 6months, 12months)
 * @access  Private (Supervisor only)
 */
router.get('/predictions/period/:period', aiTrendsController.getDemandPredictionsByPeriod);

/**
 * @route   GET /api/ai-trends/recommendations
 * @desc    Lấy gợi ý nhập thuốc từ AI
 * @access  Private (Supervisor only)
 */
router.get('/recommendations', aiTrendsController.getImportRecommendations);

/**
 * @route   GET /api/ai-trends/recommendations/priority/:priority
 * @desc    Lấy gợi ý nhập thuốc theo độ ưu tiên (high, medium, low, all)
 * @access  Private (Supervisor only)
 */
router.get(
  '/recommendations/priority/:priority',
  aiTrendsController.getImportRecommendationsByPriority,
);

/**
 * @route   GET /api/ai-trends/market-trends
 * @desc    Lấy phân tích xu hướng thị trường
 * @access  Private (Supervisor only)
 */
router.get('/market-trends', aiTrendsController.getMarketTrends);

/**
 * @route   GET /api/ai-trends/anomalies
 * @desc    Lấy danh sách bất thường trong nhu cầu
 * @access  Private (Supervisor only)
 */
router.get('/anomalies', aiTrendsController.getDemandAnomalies);

/**
 * @route   GET /api/ai-trends/report
 * @desc    Lấy báo cáo tổng hợp AI
 * @access  Private (Supervisor only)
 */
router.get('/report', aiTrendsController.getAIReport);

/**
 * @route   GET /api/ai-trends/inventory
 * @desc    Lấy thông tin tồn kho hiện tại
 * @access  Private (Supervisor only)
 */
router.get('/inventory', aiTrendsController.getCurrentInventoryLevels);

/**
 * @route   GET /api/ai-trends/supplier-contracts
 * @desc    Lấy hợp đồng nhà cung cấp đang hoạt động
 * @access  Private (Supervisor only)
 */
router.get('/supplier-contracts', aiTrendsController.getActiveSupplierContracts);

/**
 * @route   GET /api/ai-trends/statistics
 * @desc    Lấy thống kê tổng quan AI
 * @access  Private (Supervisor only)
 */
router.get('/statistics', aiTrendsController.getAIStatistics);

/**
 * @route   GET /api/ai-trends/dashboard
 * @desc    Lấy dữ liệu tổng hợp cho dashboard
 * @access  Private (Supervisor only)
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Lấy dữ liệu tổng hợp cho dashboard
    const [statistics, recommendations, marketTrends, anomalies] = await Promise.all([
      AiTrendsService.getAIStatisticsFromDatabase(),
      AiTrendsService.generateImportRecommendations(),
      AiTrendsService.analyzeMarketTrends(),
      AiTrendsService.detectDemandAnomalies(),
    ]);

    // Tạo response tổng hợp
    const dashboardData = {
      statistics: statistics || [],
      recommendations: recommendations || { totalRecommendations: 0, recommendations: [] },
      marketTrends: marketTrends || { whoAlerts: [], drugBankUpdates: [] },
      anomalies: anomalies || [],
      generatedAt: new Date(),
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('AI Trends Dashboard Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get dashboard data',
    });
  }
});

/**
 * @route   GET /api/ai-trends/quick-insights
 * @desc    Lấy insights nhanh cho supervisor
 * @access  Private (Supervisor only)
 */
router.get('/quick-insights', async (req, res) => {
  try {
    const [recommendations, anomalies] = await Promise.all([
      AiTrendsService.generateImportRecommendations(),
      AiTrendsService.detectDemandAnomalies(),
    ]);

    const quickInsights = {
      urgentActions: (recommendations?.recommendations || [])
        .filter((r) => r.priority === 'high')
        .slice(0, 3),
      warnings: (anomalies || []).slice(0, 3),
      summary: {
        urgentRecommendations: (recommendations?.recommendations || []).filter(
          (r) => r.priority === 'high',
        ).length,
        totalAnomalies: (anomalies || []).length,
        lastUpdated: new Date(),
      },
    };

    res.status(200).json({
      success: true,
      data: quickInsights,
    });
  } catch (error) {
    console.error('AI Trends Quick Insights Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get quick insights',
    });
  }
});

// ===== NEW DATABASE-BASED ROUTES =====

/**
 * @route   GET /api/ai-trends/database/predictions
 * @desc    Lấy predictions từ database
 * @access  Private (Supervisor only)
 */
router.get('/database/predictions', aiTrendsController.getPredictionsFromDatabase);

/**
 * @route   GET /api/ai-trends/database/predictions/type-time
 * @desc    Lấy predictions theo loại và thời gian
 * @access  Private (Supervisor only)
 */
router.get('/database/predictions/type-time', aiTrendsController.getPredictionsByTypeAndTime);

/**
 * @route   GET /api/ai-trends/database/predictions/high-confidence
 * @desc    Lấy predictions có độ tin cậy cao
 * @access  Private (Supervisor only)
 */
router.get(
  '/database/predictions/high-confidence',
  aiTrendsController.getHighConfidencePredictions,
);

/**
 * @route   GET /api/ai-trends/database/predictions/trend/:trend
 * @desc    Lấy predictions theo trend (increasing, decreasing, stable)
 * @access  Private (Supervisor only)
 */
router.get('/database/predictions/trend/:trend', aiTrendsController.getPredictionsByTrend);

/**
 * @route   GET /api/ai-trends/database/statistics
 * @desc    Lấy thống kê AI từ database
 * @access  Private (Supervisor only)
 */
router.get('/database/statistics', aiTrendsController.getAIStatisticsFromDatabase);

/**
 * @route   POST /api/ai-trends/database/cleanup
 * @desc    Cleanup expired predictions
 * @access  Private (Supervisor only)
 */
router.post('/database/cleanup', aiTrendsController.cleanupExpiredPredictions);

module.exports = router;
