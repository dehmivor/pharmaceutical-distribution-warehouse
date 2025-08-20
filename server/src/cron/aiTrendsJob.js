const cron = require('node-cron');
const AiTrendsService = require('../services/aiTrendsService');
const AITrendsDatabaseService = require('../services/aiTrendsDatabaseService');

/**
 * Cron job để chạy AI predictions hàng tuần
 * Chạy vào 2h sáng thứ 2 hàng tuần
 */
function startAITrendsJob() {
  console.log('AI Trends Cron Job: Starting...');

  // Chạy AI predictions hàng tuần vào 2h sáng thứ 2
  cron.schedule(
    '0 2 * * 1',
    async () => {
      console.log('AI Trends Cron: Running weekly AI predictions at 2 AM Monday');

      try {
        // Chạy dự đoán nhu cầu cho tất cả thuốc
        const demandPredictions = await AiTrendsService.predictAllMedicineDemand(6);
        console.log(
          `AI Trends Cron: Generated predictions for ${demandPredictions.totalMedicines} medicines`,
        );

        // Tạo gợi ý nhập thuốc
        const importRecommendations = await AiTrendsService.generateImportRecommendations();
        console.log(
          `AI Trends Cron: Generated ${importRecommendations.totalRecommendations} import recommendations`,
        );

        // Phát hiện bất thường
        const anomalies = await AiTrendsService.detectDemandAnomalies();
        console.log(`AI Trends Cron: Detected ${anomalies.length} demand anomalies`);

        // Phân tích xu hướng thị trường
        const marketTrends = await AiTrendsService.analyzeMarketTrends();
        console.log(
          `AI Trends Cron: Analyzed market trends with ${marketTrends.whoAlerts.length + marketTrends.drugBankUpdates.length} alerts`,
        );

        // Cleanup expired predictions
        await AITrendsDatabaseService.cleanupExpiredPredictions();

        console.log('AI Trends Cron: Weekly AI analysis completed successfully');
      } catch (error) {
        console.error('AI Trends Cron: Error running weekly AI analysis:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'Asia/Ho_Chi_Minh',
    },
  );

  // Chạy AI predictions hàng ngày vào 6h sáng (chỉ cho thuốc có độ ưu tiên cao)
  cron.schedule(
    '0 6 * * *',
    async () => {
      console.log('AI Trends Cron: Running daily AI predictions at 6 AM');

      try {
        // Chỉ chạy dự đoán cho thuốc có gợi ý nhập hàng ưu tiên cao
        const importRecommendations = await AiTrendsService.generateImportRecommendations();
        const highPriorityRecommendations = importRecommendations.recommendations.filter(
          (r) => r.priority === 'high',
        );

        if (highPriorityRecommendations.length > 0) {
          console.log(
            `AI Trends Cron: Running daily predictions for ${highPriorityRecommendations.length} high-priority medicines`,
          );

          for (const recommendation of highPriorityRecommendations) {
            try {
              await AiTrendsService.predictMedicineDemand(recommendation.medicineId, 3);
            } catch (error) {
              console.warn(
                `AI Trends Cron: Failed to predict for medicine ${recommendation.medicineId}:`,
                error.message,
              );
            }
          }
        }

        console.log('AI Trends Cron: Daily AI analysis completed successfully');
      } catch (error) {
        console.error('AI Trends Cron: Error running daily AI analysis:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'Asia/Ho_Chi_Minh',
    },
  );

  // Chạy market analysis hàng tháng vào 3h sáng ngày đầu tháng
  cron.schedule(
    '0 3 1 * *',
    async () => {
      console.log('AI Trends Cron: Running monthly market analysis at 3 AM on 1st of month');

      try {
        const marketTrends = await AiTrendsService.analyzeMarketTrends();
        console.log(
          `AI Trends Cron: Monthly market analysis completed with ${marketTrends.whoAlerts.length + marketTrends.drugBankUpdates.length} alerts`,
        );
      } catch (error) {
        console.error('AI Trends Cron: Error running monthly market analysis:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'Asia/Ho_Chi_Minh',
    },
  );

  // Chạy anomaly detection hàng ngày vào 8h sáng
  cron.schedule(
    '0 8 * * *',
    async () => {
      console.log('AI Trends Cron: Running daily anomaly detection at 8 AM');

      try {
        const anomalies = await AiTrendsService.detectDemandAnomalies();

        if (anomalies.length > 0) {
          console.log(
            `AI Trends Cron: Detected ${anomalies.length} anomalies, high severity: ${anomalies.filter((a) => a.severity === 'high').length}`,
          );

          // TODO: Gửi notifications cho supervisor về anomalies
          // await notificationService.sendAnomalyAlert(anomalies);
        }

        console.log('AI Trends Cron: Daily anomaly detection completed successfully');
      } catch (error) {
        console.error('AI Trends Cron: Error running daily anomaly detection:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'Asia/Ho_Chi_Minh',
    },
  );

  // Chạy database cleanup hàng ngày vào 1h sáng
  cron.schedule(
    '0 1 * * *',
    async () => {
      console.log('AI Trends Cron: Running daily database cleanup at 1 AM');

      try {
        const result = await AITrendsDatabaseService.cleanupExpiredPredictions();
        console.log(
          `AI Trends Cron: Database cleanup completed, cleaned ${result.modifiedCount || 0} expired predictions`,
        );
      } catch (error) {
        console.error('AI Trends Cron: Error running database cleanup:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'Asia/Ho_Chi_Minh',
    },
  );

  // Chạy database health check hàng tuần vào 4h sáng chủ nhật
  cron.schedule(
    '0 4 * * 0',
    async () => {
      console.log('AI Trends Cron: Running weekly database health check at 4 AM Sunday');

      try {
        const stats = await AITrendsDatabaseService.getAIStatisticsFromDatabase();
        console.log(
          `AI Trends Cron: Database health check completed, found ${stats.length} prediction types`,
        );

        // Log statistics for monitoring
        for (const stat of stats) {
          console.log(
            `AI Trends Cron: ${stat._id}: ${stat.count} predictions, avg confidence: ${(stat.avgConfidence || 0).toFixed(2)}`,
          );
        }
      } catch (error) {
        console.error('AI Trends Cron: Error running database health check:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'Asia/Ho_Chi_Minh',
    },
  );

  console.log('AI Trends Cron Job: Started successfully');
}

/**
 * Chạy AI analysis ngay lập tức (cho testing hoặc manual trigger)
 */
async function runAIAnalysisNow() {
  console.log('AI Trends: Running immediate AI analysis...');

  try {
    const startTime = Date.now();

    // Chạy tất cả AI analysis
    const [demandPredictions, importRecommendations, marketTrends, anomalies] = await Promise.all([
      AiTrendsService.predictAllMedicineDemand(6),
      AiTrendsService.generateImportRecommendations(),
      AiTrendsService.analyzeMarketTrends(),
      AiTrendsService.detectDemandAnomalies(),
    ]);

    // Cleanup expired predictions
    await AITrendsDatabaseService.cleanupExpiredPredictions();

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`AI Trends: Immediate analysis completed in ${duration}ms`);
    console.log(`- Predictions: ${demandPredictions.totalMedicines} medicines`);
    console.log(`- Recommendations: ${importRecommendations.totalRecommendations} items`);
    console.log(
      `- Market alerts: ${marketTrends.whoAlerts.length + marketTrends.drugBankUpdates.length}`,
    );
    console.log(`- Anomalies: ${anomalies.length}`);

    return {
      success: true,
      duration,
      results: {
        demandPredictions,
        importRecommendations,
        marketTrends,
        anomalies,
      },
    };
  } catch (error) {
    console.error('AI Trends: Error running immediate analysis:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Chạy database cleanup ngay lập tức
 */
async function runDatabaseCleanupNow() {
  console.log('AI Trends: Running immediate database cleanup...');

  try {
    const startTime = Date.now();
    const result = await AITrendsDatabaseService.cleanupExpiredPredictions();
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`AI Trends: Database cleanup completed in ${duration}ms`);
    console.log(`- Cleaned up ${result.modifiedCount || 0} expired predictions`);

    return {
      success: true,
      duration,
      result,
    };
  } catch (error) {
    console.error('AI Trends: Error running database cleanup:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Dừng tất cả AI Trends cron jobs
 */
function stopAITrendsJob() {
  console.log('AI Trends Cron Job: Stopping...');
  // Cron jobs sẽ tự động dừng khi process kết thúc
  console.log('AI Trends Cron Job: Stopped');
}

module.exports = {
  startAITrendsJob,
  runAIAnalysisNow,
  runDatabaseCleanupNow,
  stopAITrendsJob,
};
