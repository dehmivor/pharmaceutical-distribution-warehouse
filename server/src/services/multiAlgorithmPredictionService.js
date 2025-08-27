const moment = require('moment');

/**
 * Multi-Algorithm Prediction Service
 * Sử dụng nhiều thuật toán để dự báo nhu cầu thuốc
 * TUYỆT ĐỐI KHÔNG SỬ DỤNG MOCK DATA - CHỈ XỬ LÝ DATA THỰC TẾ
 */
class MultiAlgorithmPredictionService {
  constructor() {
    this.algorithms = {
      linearRegression: this.linearRegressionPrediction.bind(this),
      timeSeriesAnalysis: this.timeSeriesAnalysisPrediction.bind(this),
      seasonalDecomposition: this.seasonalDecompositionPrediction.bind(this),
      riskAssessment: this.riskAssessmentPrediction.bind(this),
      policyImpactAnalysis: this.policyImpactAnalysisPrediction.bind(this),
    };
  }

  /**
   * Dự báo sử dụng Linear Regression
   */
  linearRegressionPrediction(historicalData, forecastPeriod = 2) {
    try {
      if (!historicalData || historicalData.length < 2) {
        throw new Error('Insufficient historical data for linear regression');
      }

      // Tính toán trend line
      const n = historicalData.length;
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumX2 = 0;

      historicalData.forEach((dataPoint, index) => {
        const x = index;
        const y = dataPoint.quantity || 0;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      });

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Tính R-squared để đánh giá độ tin cậy
      const meanY = sumY / n;
      let totalSS = 0;
      let residualSS = 0;

      historicalData.forEach((dataPoint, index) => {
        const x = index;
        const y = dataPoint.quantity || 0;
        const predictedY = slope * x + intercept;
        totalSS += Math.pow(y - meanY, 2);
        residualSS += Math.pow(y - predictedY, 2);
      });

      const rSquared = 1 - residualSS / totalSS;

      // Dự báo cho tương lai
      const predictions = [];
      for (let i = 0; i < forecastPeriod; i++) {
        const futureIndex = n + i;
        const predictedQuantity = Math.max(0, slope * futureIndex + intercept);
        predictions.push({
          period: i + 1,
          predictedQuantity: Math.round(predictedQuantity),
          confidence: Math.max(0.1, Math.min(0.95, rSquared)),
        });
      }

      return {
        algorithm: 'Linear Regression',
        predictions,
        metrics: {
          slope,
          intercept,
          rSquared,
          trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
        },
        confidence: Math.max(0.1, Math.min(0.95, rSquared)),
      };
    } catch (error) {
      console.error('MultiAlgorithmPrediction: Linear regression error:', error);
      throw new Error(`Linear regression prediction failed: ${error.message}`);
    }
  }

  /**
   * Dự báo sử dụng Time Series Analysis
   */
  timeSeriesAnalysisPrediction(historicalData, forecastPeriod = 2) {
    try {
      if (!historicalData || historicalData.length < 4) {
        throw new Error('Insufficient historical data for time series analysis');
      }

      // Tính moving average
      const movingAverage = this.calculateMovingAverage(historicalData, 3);

      // Tính trend component
      const trendComponent = this.calculateTrendComponent(historicalData);

      // Tính seasonal component (nếu có đủ data)
      const seasonalComponent = this.calculateSeasonalComponent(historicalData);

      // Dự báo kết hợp
      const predictions = [];
      const lastIndex = historicalData.length - 1;

      for (let i = 0; i < forecastPeriod; i++) {
        const futureIndex = lastIndex + i + 1;
        let predictedQuantity = movingAverage[movingAverage.length - 1] || 0;

        // Thêm trend component
        predictedQuantity += trendComponent * (i + 1);

        // Thêm seasonal component nếu có
        if (seasonalComponent && seasonalComponent.length > 0) {
          const seasonalIndex = futureIndex % seasonalComponent.length;
          predictedQuantity += seasonalComponent[seasonalIndex] || 0;
        }

        predictions.push({
          period: i + 1,
          predictedQuantity: Math.max(0, Math.round(predictedQuantity)),
          confidence: 0.75, // Time series thường có độ tin cậy cao hơn
        });
      }

      return {
        algorithm: 'Time Series Analysis',
        predictions,
        metrics: {
          movingAverage: movingAverage[movingAverage.length - 1] || 0,
          trendComponent,
          seasonalComponent: seasonalComponent ? seasonalComponent.length : 0,
        },
        confidence: 0.75,
      };
    } catch (error) {
      console.error('MultiAlgorithmPrediction: Time series analysis error:', error);
      throw new Error(`Time series analysis prediction failed: ${error.message}`);
    }
  }

  /**
   * Dự báo sử dụng Seasonal Decomposition
   */
  seasonalDecompositionPrediction(historicalData, forecastPeriod = 2) {
    try {
      if (!historicalData || historicalData.length < 12) {
        throw new Error('Insufficient historical data for seasonal decomposition');
      }

      // Phân tích mùa vụ (giả định data theo tháng)
      const monthlyData = this.groupDataByMonth(historicalData);
      const seasonalPattern = this.calculateSeasonalPattern(monthlyData);

      // Tính trend
      const trend = this.calculateTrend(historicalData);

      // Dự báo kết hợp trend và seasonal
      const predictions = [];
      const currentMonth = new Date().getMonth();

      for (let i = 0; i < forecastPeriod; i++) {
        const futureMonth = (currentMonth + i + 1) % 12;
        const seasonalFactor = seasonalPattern[futureMonth] || 1;
        const trendValue = trend * (i + 1);

        const baseQuantity = this.calculateBaseQuantity(historicalData);
        const predictedQuantity = baseQuantity * seasonalFactor + trendValue;

        predictions.push({
          period: i + 1,
          predictedQuantity: Math.max(0, Math.round(predictedQuantity)),
          confidence: 0.8,
          seasonalFactor,
          trendValue,
        });
      }

      return {
        algorithm: 'Seasonal Decomposition',
        predictions,
        metrics: {
          seasonalPattern,
          trend,
          baseQuantity: this.calculateBaseQuantity(historicalData),
        },
        confidence: 0.8,
      };
    } catch (error) {
      console.error('MultiAlgorithmPrediction: Seasonal decomposition error:', error);
      throw new Error(`Seasonal decomposition prediction failed: ${error.message}`);
    }
  }

  /**
   * Dự báo sử dụng Risk Assessment
   */
  riskAssessmentPrediction(historicalData, externalFactors, forecastPeriod = 2) {
    try {
      if (!historicalData || historicalData.length < 2) {
        throw new Error('Insufficient historical data for risk assessment');
      }

      // Đánh giá rủi ro từ external factors
      const riskScore = this.calculateRiskScore(externalFactors);
      const baseQuantity = this.calculateBaseQuantity(historicalData);

      // Điều chỉnh dựa trên risk score
      const riskAdjustment = this.calculateRiskAdjustment(riskScore);

      const predictions = [];
      for (let i = 0; i < forecastPeriod; i++) {
        const adjustedQuantity = baseQuantity * riskAdjustment;
        const confidence = Math.max(0.3, 1 - riskScore * 0.7);

        predictions.push({
          period: i + 1,
          predictedQuantity: Math.max(0, Math.round(adjustedQuantity)),
          confidence,
          riskScore,
          riskAdjustment,
        });
      }

      return {
        algorithm: 'Risk Assessment',
        predictions,
        metrics: {
          riskScore,
          riskAdjustment,
          baseQuantity,
        },
        confidence: Math.max(0.3, 1 - riskScore * 0.7),
      };
    } catch (error) {
      console.error('MultiAlgorithmPrediction: Risk assessment error:', error);
      throw new Error(`Risk assessment prediction failed: ${error.message}`);
    }
  }

  /**
   * Dự báo sử dụng Policy Impact Analysis
   */
  policyImpactAnalysisPrediction(historicalData, policyData, forecastPeriod = 2) {
    try {
      if (!historicalData || historicalData.length < 2) {
        throw new Error('Insufficient historical data for policy impact analysis');
      }

      // Phân tích tác động của chính sách
      const policyImpact = this.analyzePolicyImpact(policyData);
      const baseQuantity = this.calculateBaseQuantity(historicalData);

      // Điều chỉnh dựa trên policy impact
      const policyAdjustment = this.calculatePolicyAdjustment(policyImpact);

      const predictions = [];
      for (let i = 0; i < forecastPeriod; i++) {
        const adjustedQuantity = baseQuantity * policyAdjustment;
        const confidence = Math.max(0.4, 1 - policyImpact.uncertainty * 0.6);

        predictions.push({
          period: i + 1,
          predictedQuantity: Math.max(0, Math.round(adjustedQuantity)),
          confidence,
          policyImpact: policyImpact.level,
          policyAdjustment,
        });
      }

      return {
        algorithm: 'Policy Impact Analysis',
        predictions,
        metrics: {
          policyImpact: policyImpact.level,
          policyAdjustment,
          baseQuantity,
          affectedPolicies: policyImpact.affectedPolicies,
        },
        confidence: Math.max(0.4, 1 - policyImpact.uncertainty * 0.6),
      };
    } catch (error) {
      console.error('MultiAlgorithmPrediction: Policy impact analysis error:', error);
      throw new Error(`Policy impact analysis prediction failed: ${error.message}`);
    }
  }

  /**
   * Ensemble Method - Kết hợp tất cả algorithms
   */
  async ensemblePrediction(historicalData, externalFactors, policyData, forecastPeriod = 2) {
    try {
      console.log('MultiAlgorithmPrediction: Running ensemble prediction...');

      // Chạy tất cả algorithms
      const results = await Promise.allSettled([
        this.linearRegressionPrediction(historicalData, forecastPeriod),
        this.timeSeriesAnalysisPrediction(historicalData, forecastPeriod),
        this.seasonalDecompositionPrediction(historicalData, forecastPeriod),
        this.riskAssessmentPrediction(historicalData, externalFactors, forecastPeriod),
        this.policyImpactAnalysisPrediction(historicalData, policyData, forecastPeriod),
      ]);

      // Lọc kết quả thành công
      const successfulResults = results
        .map((result, index) => {
          if (result.status === 'fulfilled') {
            return { ...result.value, algorithmIndex: index };
          }
          return null;
        })
        .filter((result) => result !== null);

      if (successfulResults.length === 0) {
        throw new Error('All prediction algorithms failed');
      }

      // Tính toán ensemble prediction
      const ensemblePredictions = this.calculateEnsemblePredictions(
        successfulResults,
        forecastPeriod,
      );

      // Tính confidence tổng hợp
      const overallConfidence = this.calculateOverallConfidence(successfulResults);

      console.log(
        `MultiAlgorithmPrediction: Ensemble completed with ${successfulResults.length} algorithms`,
      );

      return {
        algorithm: 'Ensemble Method',
        predictions: ensemblePredictions,
        algorithmsUsed: successfulResults.map((r) => r.algorithm),
        individualResults: successfulResults,
        metrics: {
          algorithmsCount: successfulResults.length,
          overallConfidence,
          algorithmConfidences: successfulResults.map((r) => ({
            algorithm: r.algorithm,
            confidence: r.confidence,
          })),
        },
        confidence: overallConfidence,
      };
    } catch (error) {
      console.error('MultiAlgorithmPrediction: Ensemble prediction error:', error);
      throw new Error(`Ensemble prediction failed: ${error.message}`);
    }
  }

  // Helper methods
  calculateMovingAverage(data, windowSize) {
    const movingAverage = [];
    for (let i = windowSize - 1; i < data.length; i++) {
      const sum = data
        .slice(i - windowSize + 1, i + 1)
        .reduce((acc, item) => acc + (item.quantity || 0), 0);
      movingAverage.push(sum / windowSize);
    }
    return movingAverage;
  }

  calculateTrendComponent(data) {
    if (data.length < 2) return 0;
    const firstQuantity = data[0].quantity || 0;
    const lastQuantity = data[data.length - 1].quantity || 0;
    return (lastQuantity - firstQuantity) / (data.length - 1);
  }

  calculateSeasonalComponent(data) {
    // Đơn giản hóa - có thể mở rộng sau
    return null;
  }

  groupDataByMonth(data) {
    const monthlyData = new Array(12).fill(0).map(() => []);
    data.forEach((item) => {
      const month = new Date(item.date || item.createdAt).getMonth();
      monthlyData[month].push(item.quantity || 0);
    });
    return monthlyData;
  }

  calculateSeasonalPattern(monthlyData) {
    const pattern = [];
    monthlyData.forEach((monthData) => {
      if (monthData.length > 0) {
        const avg = monthData.reduce((a, b) => a + b, 0) / monthData.length;
        pattern.push(avg);
      } else {
        pattern.push(1);
      }
    });
    return pattern;
  }

  calculateTrend(data) {
    if (data.length < 2) return 0;
    const firstQuantity = data[0].quantity || 0;
    const lastQuantity = data[data.length - 1].quantity || 0;
    return (lastQuantity - firstQuantity) / (data.length - 1);
  }

  calculateBaseQuantity(data) {
    if (!data || data.length === 0) return 0;
    const quantities = data.map((item) => item.quantity || 0);
    return quantities.reduce((a, b) => a + b, 0) / quantities.length;
  }

  calculateRiskScore(externalFactors) {
    let riskScore = 0;

    if (externalFactors.diseaseOutbreaks?.overallRisk === 'high') riskScore += 0.4;
    else if (externalFactors.diseaseOutbreaks?.overallRisk === 'medium') riskScore += 0.2;

    if (externalFactors.weather) {
      const extremeWeather = Object.values(externalFactors.weather).some(
        (weather) => weather.temperature > 35 || weather.temperature < 10,
      );
      if (extremeWeather) riskScore += 0.3;
    }

    return Math.min(1, riskScore);
  }

  calculateRiskAdjustment(riskScore) {
    // Risk cao -> tăng nhu cầu
    return 1 + riskScore * 0.5;
  }

  analyzePolicyImpact(policyData) {
    let impactLevel = 'low';
    let uncertainty = 0.3;
    const affectedPolicies = [];

    if (policyData?.healthcare?.newRegulations) {
      const highImpactCount = policyData.healthcare.newRegulations.filter(
        (policy) => policy.impact === 'high',
      ).length;

      if (highImpactCount >= 2) impactLevel = 'high';
      else if (highImpactCount >= 1) impactLevel = 'medium';

      affectedPolicies.push(...policyData.healthcare.newRegulations);
    }

    // Điều chỉnh uncertainty dựa trên số lượng policies
    if (affectedPolicies.length > 0) {
      uncertainty = Math.max(0.1, 0.5 - affectedPolicies.length * 0.1);
    }

    return { level: impactLevel, uncertainty, affectedPolicies };
  }

  calculatePolicyAdjustment(policyImpact) {
    const adjustments = { high: 1.3, medium: 1.15, low: 1.0 };
    return adjustments[policyImpact.level] || 1.0;
  }

  calculateEnsemblePredictions(results, forecastPeriod) {
    const ensemblePredictions = [];

    for (let period = 0; period < forecastPeriod; period++) {
      let totalQuantity = 0;
      let totalWeight = 0;

      results.forEach((result) => {
        const prediction = result.predictions[period];
        if (prediction) {
          const weight = result.confidence;
          totalQuantity += prediction.predictedQuantity * weight;
          totalWeight += weight;
        }
      });

      if (totalWeight > 0) {
        ensemblePredictions.push({
          period: period + 1,
          predictedQuantity: Math.round(totalQuantity / totalWeight),
          confidence: totalWeight / results.length,
        });
      }
    }

    return ensemblePredictions;
  }

  calculateOverallConfidence(results) {
    if (results.length === 0) return 0;
    const totalConfidence = results.reduce((sum, result) => sum + result.confidence, 0);
    return Math.min(0.95, totalConfidence / results.length);
  }
}

module.exports = MultiAlgorithmPredictionService;
