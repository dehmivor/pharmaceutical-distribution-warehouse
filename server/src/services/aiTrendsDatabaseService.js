const AIPrediction = require('../models/AIPrediction');
const moment = require('moment');

class AITrendsDatabaseService {
  /**
   * Lưu prediction vào database
   */
  static async savePredictionToDatabase(prediction, userId = null) {
    try {
      // Kiểm tra xem đã có prediction gần đây chưa
      const existingPrediction = await AIPrediction.findOne({
        medicine_id: prediction.medicineId,
        prediction_type: 'demand',
        status: 'active',
        generated_at: { $gte: moment().subtract(1, 'day').toDate() }
      });

      if (existingPrediction) {
        console.log(`AI: Prediction for medicine ${prediction.medicineId} already exists, updating...`);
        existingPrediction.predictions = prediction.predictions;
        existingPrediction.trend = prediction.trend;
        existingPrediction.overall_confidence = prediction.confidence;
        existingPrediction.historical_data = prediction.historicalData;
        existingPrediction.algorithm = prediction.algorithm;
        existingPrediction.generated_at = new Date();
        existingPrediction.valid_until = moment().add(30, 'days').toDate();
        
        if (userId) existingPrediction.created_by = userId;
        
        await existingPrediction.save();
        return existingPrediction;
      }

      // Tạo prediction mới
      const aiPrediction = new AIPrediction({
        medicine_id: prediction.medicineId,
        prediction_type: 'demand',
        predictions: prediction.predictions,
        trend: prediction.trend,
        overall_confidence: prediction.confidence,
        algorithm: prediction.algorithm,
        historical_data: prediction.historicalData,
        generated_at: new Date(),
        valid_until: moment().add(30, 'days').toDate(),
        created_by: userId,
        tags: ['demand_prediction', 'auto_generated']
      });

      await aiPrediction.save();
      console.log(`AI: Saved new prediction to database for medicine ${prediction.medicineId}`);
      
      return aiPrediction;
    } catch (error) {
      console.error('AI: Error saving prediction to database:', error);
      // Không throw error để không ảnh hưởng đến prediction chính
    }
  }

  /**
   * Lấy predictions từ database
   */
  static async getPredictionsFromDatabase(medicineId = null, predictionType = 'demand', limit = 50) {
    try {
      let query = { prediction_type: predictionType, status: 'active' };
      
      if (medicineId) {
        query.medicine_id = medicineId;
      }

      const predictions = await AIPrediction.find(query)
        .populate('medicine_id', 'medicine_name unit_of_measure')
        .sort({ generated_at: -1 })
        .limit(limit);

      return predictions;
    } catch (error) {
      console.error('AI: Error getting predictions from database:', error);
      return [];
    }
  }

  /**
   * Lưu recommendations vào database
   */
  static async saveRecommendationsToDatabase(recommendations) {
    try {
      for (const rec of recommendations) {
        // Kiểm tra xem đã có recommendation gần đây chưa
        const existingRec = await AIPrediction.findOne({
          medicine_id: rec.medicineId,
          prediction_type: 'import_recommendation',
          status: 'active',
          generated_at: { $gte: moment().subtract(1, 'day').toDate() }
        });

        if (existingRec) {
          // Cập nhật recommendation hiện có
          existingRec.import_recommendation = {
            priority: rec.priority,
            reason: rec.reason,
            recommendedQuantity: rec.recommendedQuantity,
            urgency: rec.urgency,
            estimatedCost: rec.estimatedCost,
            supplier: rec.supplier
          };
          existingRec.overall_confidence = rec.confidence;
          existingRec.generated_at = new Date();
          existingRec.valid_until = moment().add(30, 'days').toDate();
          
          await existingRec.save();
        } else {
          // Tạo recommendation mới
          const aiRec = new AIPrediction({
            medicine_id: rec.medicineId,
            prediction_type: 'import_recommendation',
            trend: 'stable', // Không có trend cho recommendations
            overall_confidence: rec.confidence,
            algorithm: 'business_logic',
            import_recommendation: {
              priority: rec.priority,
              reason: rec.reason,
              recommendedQuantity: rec.recommendedQuantity,
              urgency: rec.urgency,
              estimatedCost: rec.estimatedCost,
              supplier: rec.supplier
            },
            generated_at: new Date(),
            valid_until: moment().add(30, 'days').toDate(),
            tags: ['import_recommendation', 'auto_generated']
          });

          await aiRec.save();
        }
      }

      console.log(`AI: Saved ${recommendations.length} recommendations to database`);
    } catch (error) {
      console.error('AI: Error saving recommendations to database:', error);
    }
  }

  /**
   * Lưu anomaly vào database
   */
  static async saveAnomalyToDatabase(anomaly) {
    try {
      const aiAnomaly = new AIPrediction({
        medicine_id: anomaly.medicineId,
        prediction_type: 'anomaly',
        trend: 'stable',
        overall_confidence: 0.8, // Độ tin cậy cao cho anomaly detection
        algorithm: 'statistical_analysis',
        anomaly_data: {
          anomalyType: anomaly.anomalyType,
          description: anomaly.description,
          severity: anomaly.severity,
          data: anomaly.data
        },
        generated_at: new Date(),
        valid_until: moment().add(7, 'days').toDate(), // Anomaly có hiệu lực 7 ngày
        tags: ['anomaly_detection', 'auto_generated']
      });

      await aiAnomaly.save();
      console.log(`AI: Saved anomaly to database for medicine ${anomaly.medicineId}`);
    } catch (error) {
      console.error('AI: Error saving anomaly to database:', error);
    }
  }

  /**
   * Cleanup predictions cũ
   */
  static async cleanupExpiredPredictions() {
    try {
      const result = await AIPrediction.cleanupExpired();
      console.log(`AI: Cleaned up ${result.modifiedCount} expired predictions`);
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
      const stats = await AIPrediction.aggregate([
        {
          $match: { status: 'active' }
        },
        {
          $group: {
            _id: '$prediction_type',
            count: { $sum: 1 },
            avgConfidence: { $avg: '$overall_confidence' },
            trends: { $addToSet: '$trend' }
          }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('AI: Error getting statistics from database:', error);
      return [];
    }
  }

  /**
   * Lấy predictions theo loại và thời gian
   */
  static async getPredictionsByTypeAndTime(predictionType, days = 30) {
    try {
      const startDate = moment().subtract(days, 'days').toDate();
      
      const predictions = await AIPrediction.find({
        prediction_type: predictionType,
        status: 'active',
        generated_at: { $gte: startDate }
      })
        .populate('medicine_id', 'medicine_name unit_of_measure')
        .sort({ generated_at: -1 });

      return predictions;
    } catch (error) {
      console.error('AI: Error getting predictions by type and time:', error);
      return [];
    }
  }

  /**
   * Lấy predictions có độ tin cậy cao
   */
  static async getHighConfidencePredictions(confidenceThreshold = 0.8) {
    try {
      const predictions = await AIPrediction.find({
        status: 'active',
        overall_confidence: { $gte: confidenceThreshold }
      })
        .populate('medicine_id', 'medicine_name unit_of_measure')
        .sort({ overall_confidence: -1, generated_at: -1 });

      return predictions;
    } catch (error) {
      console.error('AI: Error getting high confidence predictions:', error);
      return [];
    }
  }

  /**
   * Lấy predictions theo trend
   */
  static async getPredictionsByTrend(trend) {
    try {
      const predictions = await AIPrediction.find({
        status: 'active',
        trend: trend
      })
        .populate('medicine_id', 'medicine_name unit_of_measure')
        .sort({ generated_at: -1 });

      return predictions;
    } catch (error) {
      console.error('AI: Error getting predictions by trend:', error);
      return [];
    }
  }
}

module.exports = AITrendsDatabaseService;
