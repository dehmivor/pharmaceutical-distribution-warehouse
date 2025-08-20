const ExportOrder = require('../models/ExportOrder');
const ImportOrder = require('../models/ImportOrder');
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const Package = require('../models/Package');
const Contract = require('../models/Contract');
const Bill = require('../models/Bill');
const AITrendsDatabaseService = require('./aiTrendsDatabaseService');
const moment = require('moment');
const regression = require('regression');
const ss = require('simple-statistics');
// Sử dụng axios thay vì node-fetch để tránh lỗi ESM
const axios = require('axios');

class AITrendsService {
  /**
   * Dự đoán nhu cầu thuốc trong tương lai dựa trên lịch sử xuất hàng
   */
  static async predictMedicineDemand(medicineId, months = 6, userId = null) {
    try {
      console.log(`AI: Predicting demand for medicine ${medicineId} for next ${months} months`);

      // Lấy lịch sử xuất hàng của thuốc trong 12 tháng gần nhất
      const startDate = moment().subtract(12, 'months').toDate();
      const endDate = new Date();

      const exportHistory = await ExportOrder.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            'details.medicine_id': medicineId,
          },
        },
        {
          $unwind: '$details',
        },
        {
          $match: {
            'details.medicine_id': medicineId,
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            totalQuantity: { $sum: '$details.expected_quantity' },
            orderCount: { $sum: 1 },
          },
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 },
        },
      ]);

      if (exportHistory.length < 3) {
        console.log(`AI: Insufficient data for medicine ${medicineId}, using default prediction`);
        const defaultPrediction = this.generateDefaultPrediction(medicineId, months);
        
        // Lưu default prediction vào database
        await AITrendsDatabaseService.savePredictionToDatabase(defaultPrediction, userId);
        
        return defaultPrediction;
      }

      // Chuẩn bị dữ liệu cho regression
      const data = exportHistory.map((item, index) => [index, item.totalQuantity]);

      // Thực hiện linear regression
      const result = regression.linear(data);
      const { equation, r2 } = result;

      // Dự đoán cho các tháng tới
      const predictions = [];
      for (let i = 0; i < months; i++) {
        const monthIndex = exportHistory.length + i;
        const predictedQuantity = Math.max(0, Math.round(equation[0] * monthIndex + equation[1]));

        predictions.push({
          month: moment()
            .add(i + 1, 'months')
            .format('YYYY-MM'),
          predictedQuantity,
          confidence: Math.min(0.95, Math.max(0.5, r2)),
        });
      }

      // Tính toán độ tin cậy dựa trên R-squared
      const confidence = Math.min(0.95, Math.max(0.5, r2));
      const trend = equation[0] > 0 ? 'increasing' : equation[0] < 0 ? 'decreasing' : 'stable';

      const predictionResult = {
        medicineId,
        predictions,
        confidence,
        trend,
        historicalData: exportHistory,
        algorithm: 'linear_regression',
        lastUpdated: new Date(),
      };

      // Lưu prediction vào database
      await AITrendsDatabaseService.savePredictionToDatabase(predictionResult, userId);

      console.log(
        `AI: Prediction completed for medicine ${medicineId}, confidence: ${confidence}, trend: ${trend}`,
      );

      return predictionResult;
    } catch (error) {
      console.error('AI: Error predicting medicine demand:', error);
      throw new Error(`Failed to predict demand: ${error.message}`);
    }
  }

  /**
   * Dự đoán nhu cầu cho tất cả thuốc
   */
  static async predictAllMedicineDemand(months = 6, userId = null) {
    try {
      console.log(`AI: Predicting demand for all medicines for next ${months} months`);

      // Lấy danh sách tất cả thuốc
      const medicines = await Medicine.find({ status: 'active' });

      const predictions = [];
      for (const medicine of medicines) {
        try {
          const prediction = await this.predictMedicineDemand(medicine._id, months, userId);
          predictions.push(prediction);
        } catch (error) {
          console.warn(
            `AI: Failed to predict for medicine ${medicine.medicine_name}:`,
            error.message,
          );
          // Thêm prediction mặc định
          const defaultPrediction = this.generateDefaultPrediction(medicine._id, months);
          await AITrendsDatabaseService.savePredictionToDatabase(defaultPrediction, userId);
          predictions.push(defaultPrediction);
        }
      }

      return {
        totalMedicines: predictions.length,
        predictions,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('AI: Error predicting all medicine demand:', error);
      throw new Error(`Failed to predict all medicine demand: ${error.message}`);
    }
  }

  /**
   * Phân tích xu hướng thị trường từ WHO và Drug Bank
   */
  static async analyzeMarketTrends() {
    try {
      console.log('AI: Analyzing market trends from external sources');

      const marketData = {
        whoAlerts: [],
        drugBankUpdates: [],
        vietnamHealthNews: [],
        analyzedAt: new Date(),
      };

      // TODO: Implement WHO data crawling using axios instead of node-fetch
      // TODO: Implement Drug Bank data crawling using axios
      // TODO: Implement Vietnam health news analysis using axios

      // Tạm thời trả về dữ liệu mẫu
      marketData.whoAlerts = [
        {
          type: 'disease_alert',
          title: 'Seasonal flu season approaching',
          description: 'WHO predicts increased demand for flu medications',
          severity: 'medium',
          affectedMedicines: ['Tamiflu', 'Relenza', 'Antiviral drugs'],
          source: 'WHO',
          date: new Date(),
        },
      ];

      marketData.drugBankUpdates = [
        {
          type: 'new_approval',
          title: 'New diabetes medication approved',
          description: 'FDA approves new oral diabetes treatment',
          affectedCategory: 'diabetes',
          source: 'Drug Bank',
          date: new Date(),
        },
      ];

      console.log('AI: Market trends analysis completed');
      return marketData;
    } catch (error) {
      console.error('AI: Error analyzing market trends:', error);
      throw new Error(`Failed to analyze market trends: ${error.message}`);
    }
  }

  /**
   * Tạo gợi ý nhập thuốc dựa trên AI predictions
   */
  static async generateImportRecommendations() {
    try {
      console.log('AI: Generating import recommendations');

      // Lấy dự đoán nhu cầu cho 3 tháng tới
      const demandPredictions = await this.predictAllMedicineDemand(3);

      // Lấy thông tin tồn kho hiện tại
      const currentInventory = await this.getCurrentInventoryLevels();

      // Lấy thông tin hợp đồng với nhà cung cấp
      const supplierContracts = await this.getActiveSupplierContracts();

      const recommendations = [];

      for (const prediction of demandPredictions.predictions) {
        const medicineId = prediction.medicineId;
        const currentStock = currentInventory.find(
          (inv) => inv.medicineId.toString() === medicineId.toString(),
        );
        const supplierContract = supplierContracts.find((contract) =>
          contract.items.some((item) => item.medicine_id.toString() === medicineId.toString()),
        );

        if (!currentStock) continue;

        // Tính toán nhu cầu dự kiến trong 3 tháng tới
        const totalPredictedDemand = prediction.predictions.reduce(
          (sum, pred) => sum + pred.predictedQuantity,
          0,
        );

        // Tính toán thời gian tồn kho hiện tại
        const monthsOfStock = currentStock.totalQuantity / (totalPredictedDemand / 3);

        // Tạo gợi ý dựa trên logic nghiệp vụ
        if (monthsOfStock < 2) {
          // Cần nhập gấp - tồn kho dưới 2 tháng
          recommendations.push({
            medicineId,
            medicineName: currentStock.medicineName,
            priority: 'high',
            reason: 'Low stock level - below 2 months supply',
            recommendedQuantity: Math.ceil(totalPredictedDemand * 0.8), // Nhập 80% nhu cầu dự kiến
            urgency: 'immediate',
            estimatedCost: this.estimateImportCost(
              medicineId,
              Math.ceil(totalPredictedDemand * 0.8),
            ),
            supplier: supplierContract?.supplier?.name || 'Multiple suppliers',
            confidence: prediction.confidence,
          });
        } else if (monthsOfStock < 4) {
          // Cần nhập sớm - tồn kho dưới 4 tháng
          recommendations.push({
            medicineId,
            medicineName: currentStock.medicineName,
            priority: 'medium',
            reason: 'Stock level below 4 months supply',
            recommendedQuantity: Math.ceil(totalPredictedDemand * 0.6),
            urgency: 'within_month',
            estimatedCost: this.estimateImportCost(
              medicineId,
              Math.ceil(totalPredictedDemand * 0.6),
            ),
            supplier: supplierContract?.supplier?.name || 'Multiple suppliers',
            confidence: prediction.confidence,
          });
        } else if (prediction.trend === 'increasing' && monthsOfStock < 6) {
          // Xu hướng tăng - cần chuẩn bị
          recommendations.push({
            medicineId,
            medicineName: currentStock.medicineName,
            priority: 'low',
            reason: 'Increasing demand trend detected',
            recommendedQuantity: Math.ceil(totalPredictedDemand * 0.4),
            urgency: 'within_quarter',
            estimatedCost: this.estimateImportCost(
              medicineId,
              Math.ceil(totalPredictedDemand * 0.4),
            ),
            supplier: supplierContract?.supplier?.name || 'Multiple suppliers',
            confidence: prediction.confidence,
          });
        }
      }

      // Sắp xếp theo độ ưu tiên
      recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      // Lưu recommendations vào database
      await AITrendsDatabaseService.saveRecommendationsToDatabase(recommendations);

      console.log(`AI: Generated ${recommendations.length} import recommendations`);
      return {
        totalRecommendations: recommendations.length,
        recommendations,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('AI: Error generating import recommendations:', error);
      throw new Error(`Failed to generate import recommendations: ${error.message}`);
    }
  }

  /**
   * Phát hiện bất thường trong nhu cầu
   */
  static async detectDemandAnomalies() {
    try {
      console.log('AI: Detecting demand anomalies');

      const anomalies = [];
      const demandPredictions = await this.predictAllMedicineDemand(3);

      for (const prediction of demandPredictions.predictions) {
        if (prediction.historicalData.length < 6) continue;

        // Tính toán độ lệch chuẩn
        const quantities = prediction.historicalData.map((item) => item.totalQuantity);
        const mean = ss.mean(quantities);
        const standardDeviation = ss.standardDeviation(quantities);

        // Phát hiện outliers (dữ liệu nằm ngoài 2 standard deviations)
        const outliers = quantities.filter((qty) => Math.abs(qty - mean) > 2 * standardDeviation);

        if (outliers.length > 0) {
          const anomaly = {
            medicineId: prediction.medicineId,
            anomalyType: 'demand_spike',
            description: `Unusual demand pattern detected: ${outliers.length} outliers found`,
            severity: outliers.length > 2 ? 'high' : 'medium',
            data: {
              mean,
              standardDeviation,
              outliers,
              historicalData: prediction.historicalData,
            },
            detectedAt: new Date(),
          };

          anomalies.push(anomaly);

          // Lưu anomaly vào database
          await AITrendsDatabaseService.saveAnomalyToDatabase(anomaly);
        }
      }

      console.log(`AI: Detected ${anomalies.length} demand anomalies`);
      return anomalies;
    } catch (error) {
      console.error('AI: Error detecting demand anomalies:', error);
      throw new Error(`Failed to detect demand anomalies: ${error.message}`);
    }
  }

  /**
   * Lấy thông tin tồn kho hiện tại
   */
  static async getCurrentInventoryLevels() {
    try {
      const now = new Date();

      // Lấy tất cả batch còn hạn sử dụng
      const validBatches = await Batch.find({
        expiry_date: { $gt: now },
      }).populate('medicine_id');

      const inventoryMap = new Map();

      for (const batch of validBatches) {
        const medicineId = batch.medicine_id._id;
        const packages = await Package.find({ batch_id: batch._id });
        const batchQuantity = packages.reduce((sum, pkg) => sum + pkg.quantity, 0);

        if (inventoryMap.has(medicineId.toString())) {
          inventoryMap.get(medicineId.toString()).totalQuantity += batchQuantity;
        } else {
          inventoryMap.set(medicineId.toString(), {
            medicineId: batch.medicine_id._id,
            medicineName: batch.medicine_id.medicine_name,
            totalQuantity: batchQuantity,
            unit: batch.medicine_id.unit_of_measure,
            minStockThreshold: batch.medicine_id.min_stock_threshold || 0,
          });
        }
      }

      return Array.from(inventoryMap.values());
    } catch (error) {
      console.error('AI: Error getting current inventory levels:', error);
      throw error;
    }
  }

  /**
   * Lấy hợp đồng nhà cung cấp đang hoạt động
   */
  static async getActiveSupplierContracts() {
    try {
      const contracts = await Contract.find({
        contract_type: 'import',
        status: 'active',
        end_date: { $gte: new Date() },
      })
        .populate('partner_id')
        .populate('items.medicine_id');

      return contracts;
    } catch (error) {
      console.error('AI: Error getting active supplier contracts:', error);
      throw error;
    }
  }

  /**
   * Ước tính chi phí nhập thuốc
   */
  static async estimateImportCost(medicineId, quantity) {
    try {
      // Lấy giá trung bình từ các hợp đồng gần đây
      const recentContracts = await Contract.find({
        'items.medicine_id': medicineId,
        contract_type: 'import',
        status: 'active',
      }).populate('items.medicine_id');

      if (recentContracts.length === 0) {
        return null; // Không có dữ liệu giá
      }

      let totalValue = 0;
      let totalQuantity = 0;

      for (const contract of recentContracts) {
        for (const item of contract.items) {
          if (item.medicine_id.toString() === medicineId.toString()) {
            totalValue += (item.unit_price || 0) * (item.quantity || 0);
            totalQuantity += item.quantity || 0;
          }
        }
      }

      const averagePrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;
      return Math.round(averagePrice * quantity);
    } catch (error) {
      console.error('AI: Error estimating import cost:', error);
      return null;
    }
  }

  /**
   * Tạo dự đoán mặc định khi không đủ dữ liệu
   */
  static generateDefaultPrediction(medicineId, months) {
    return {
      medicineId,
      predictions: Array.from({ length: months }, (_, i) => ({
        month: moment()
          .add(i + 1, 'months')
          .format('YYYY-MM'),
        predictedQuantity: 100, // Số lượng mặc định
        confidence: 0.3, // Độ tin cậy thấp
      })),
      confidence: 0.3,
      trend: 'stable',
      historicalData: [],
      algorithm: 'default_prediction',
      lastUpdated: new Date(),
    };
  }

  /**
   * Tạo báo cáo tổng hợp AI
   */
  static async generateAIReport() {
    try {
      console.log('AI: Generating comprehensive AI report');

      const [demandPredictions, importRecommendations, marketTrends, demandAnomalies] =
        await Promise.all([
          this.predictAllMedicineDemand(6),
          this.generateImportRecommendations(),
          this.analyzeMarketTrends(),
          this.detectDemandAnomalies(),
        ]);

      const report = {
        generatedAt: new Date(),
        summary: {
          totalMedicines: demandPredictions.totalMedicines,
          totalRecommendations: importRecommendations.totalRecommendations,
          totalAnomalies: demandAnomalies.length,
          marketAlerts: marketTrends.whoAlerts.length + marketTrends.drugBankUpdates.length,
        },
        demandPredictions,
        importRecommendations,
        marketTrends,
        demandAnomalies,
        insights: this.generateInsights(demandPredictions, importRecommendations, demandAnomalies),
      };

      console.log('AI: Comprehensive report generated successfully');
      return report;
    } catch (error) {
      console.error('AI: Error generating AI report:', error);
      throw new Error(`Failed to generate AI report: ${error.message}`);
    }
  }

  /**
   * Tạo insights từ dữ liệu AI
   */
  static generateInsights(demandPredictions, importRecommendations, demandAnomalies) {
    const insights = [];

    // Insight về xu hướng tổng thể
    const trends = demandPredictions.predictions.map((p) => p.trend);
    const increasingTrends = trends.filter((t) => t === 'increasing').length;
    const decreasingTrends = trends.filter((t) => t === 'decreasing').length;

    if (increasingTrends > decreasingTrends) {
      insights.push({
        type: 'market_trend',
        title: 'Overall Market Growth',
        description: `${increasingTrends} out of ${trends.length} medicines show increasing demand trends`,
        severity: 'info',
        actionable: true,
      });
    }

    // Insight về khuyến nghị nhập hàng
    const highPriorityRecommendations = importRecommendations.recommendations.filter(
      (r) => r.priority === 'high',
    );
    if (highPriorityRecommendations.length > 0) {
      insights.push({
        type: 'inventory_alert',
        title: 'High Priority Import Needed',
        description: `${highPriorityRecommendations.length} medicines require immediate import attention`,
        severity: 'high',
        actionable: true,
        details: highPriorityRecommendations.map((r) => r.medicineName),
      });
    }

    // Insight về bất thường
    if (demandAnomalies.length > 0) {
      insights.push({
        type: 'demand_anomaly',
        title: 'Demand Pattern Changes',
        description: `${demandAnomalies.length} unusual demand patterns detected`,
        severity: 'medium',
        actionable: true,
      });
    }

    return insights;
  }

  /**
   * Cleanup predictions cũ
   */
  static async cleanupExpiredPredictions() {
    try {
      const result = await AITrendsDatabaseService.cleanupExpiredPredictions();
      console.log(`AI: Cleaned up ${result.modifiedCount || 0} expired predictions`);
      return result;
    } catch (error) {
      console.error('AI: Error cleaning up expired predictions:', error);
    }
  }

  /**
   * Lấy thống kê AI từ database
   */
  static async getAIStatisticsFromDatabase() {
    try {
      const stats = await AITrendsDatabaseService.getAIStatisticsFromDatabase();
      return stats;
    } catch (error) {
      console.error('AI: Error getting statistics from database:', error);
      return [];
    }
  }
}

module.exports = AITrendsService;
