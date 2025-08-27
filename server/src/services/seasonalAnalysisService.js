const moment = require('moment');

/**
 * Seasonal Analysis Service
 * Phân tích mô hình nhu cầu thuốc theo mùa vụ
 * TUYỆT ĐỐI KHÔNG SỬ DỤNG MOCK DATA - CHỈ XỬ LÝ DATA THỰC TẾ
 */
class SeasonalAnalysisService {
  constructor() {
    this.seasons = {
      Spring: { months: [3, 4, 5], name: 'Mùa Xuân' },
      Summer: { months: [6, 7, 8], name: 'Mùa Hè' },
      Autumn: { months: [9, 10, 11], name: 'Mùa Thu' },
      Winter: { months: [12, 1, 2], name: 'Mùa Đông' },
    };

    this.seasonalMedicinePatterns = {
      Spring: {
        allergies: 'high',
        respiratory: 'medium',
        vitamins: 'medium',
        antibiotics: 'low',
      },
      Summer: {
        heatstroke: 'high',
        dehydration: 'high',
        skin: 'medium',
        antibiotics: 'low',
      },
      Autumn: {
        flu: 'high',
        respiratory: 'high',
        vitamins: 'medium',
        antibiotics: 'medium',
      },
      Winter: {
        flu: 'very_high',
        cold: 'very_high',
        respiratory: 'high',
        antibiotics: 'high',
      },
    };
  }

  /**
   * Phân tích mô hình mùa vụ cho một thuốc
   */
  async analyzeMedicineSeasonalPattern(medicineId, historicalData, forecastPeriod = 2) {
    try {
      console.log(`SeasonalAnalysis: Analyzing seasonal pattern for medicine ${medicineId}...`);

      if (!historicalData || historicalData.length === 0) {
        throw new Error('No historical data available for seasonal analysis');
      }

      // 1. Phân tích mô hình mùa vụ từ historical data
      const seasonalPattern = this.extractSeasonalPattern(historicalData);

      // 2. Xác định mùa hiện tại
      const currentSeason = this.getCurrentSeason();

      // 3. Phân tích tác động mùa vụ
      const seasonalImpact = this.analyzeSeasonalImpact(seasonalPattern, currentSeason);

      // 4. Dự báo nhu cầu theo mùa
      const seasonalForecast = this.forecastSeasonalDemand(
        seasonalPattern,
        currentSeason,
        forecastPeriod,
      );

      // 5. Tạo khuyến nghị mùa vụ
      const seasonalRecommendations = this.generateSeasonalRecommendations(
        seasonalImpact,
        currentSeason,
        forecastPeriod,
      );

      console.log(
        `SeasonalAnalysis: Successfully analyzed seasonal pattern for medicine ${medicineId}`,
      );

      return {
        medicineId,
        currentSeason: currentSeason.name,
        seasonalPattern,
        seasonalImpact,
        seasonalForecast,
        seasonalRecommendations,
        confidence: this.calculateSeasonalConfidence(seasonalPattern, historicalData),
        analyzedAt: new Date(),
      };
    } catch (error) {
      console.error(
        `SeasonalAnalysis: Error analyzing seasonal pattern for medicine ${medicineId}:`,
        error,
      );
      throw new Error(
        `Seasonal pattern analysis failed for medicine ${medicineId}: ${error.message}`,
      );
    }
  }

  /**
   * Phân tích mô hình mùa vụ cho tất cả thuốc
   */
  async analyzeAllMedicinesSeasonalPattern(medicinesData, forecastPeriod = 2) {
    try {
      console.log('SeasonalAnalysis: Analyzing seasonal patterns for all medicines...');

      const results = [];
      const errors = [];
      const currentSeason = this.getCurrentSeason();

      // Phân tích từng thuốc
      for (const medicine of medicinesData) {
        try {
          if (medicine.historicalData && medicine.historicalData.length > 0) {
            const seasonalAnalysis = await this.analyzeMedicineSeasonalPattern(
              medicine._id,
              medicine.historicalData,
              forecastPeriod,
            );
            results.push(seasonalAnalysis);
          }
        } catch (error) {
          console.warn(
            `SeasonalAnalysis: Failed to analyze medicine ${medicine._id}:`,
            error.message,
          );
          errors.push({
            medicineId: medicine._id,
            medicineName: medicine.medicine_name,
            error: error.message,
          });
        }
      }

      // Tạo summary report
      const summary = this.createSeasonalSummaryReport(results, currentSeason, forecastPeriod);

      console.log(`SeasonalAnalysis: Completed analysis for ${results.length} medicines`);

      return {
        success: true,
        currentSeason: currentSeason.name,
        summary,
        results,
        errors,
        totalProcessed: medicinesData.length,
        successfulCount: results.length,
        errorCount: errors.length,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('SeasonalAnalysis: Error analyzing all medicines seasonal patterns:', error);
      throw new Error(`All medicines seasonal analysis failed: ${error.message}`);
    }
  }

  /**
   * Phân tích mô hình mùa vụ theo category
   */
  async analyzeCategorySeasonalPattern(category, medicinesData, forecastPeriod = 2) {
    try {
      console.log(`SeasonalAnalysis: Analyzing seasonal pattern for category ${category}...`);

      // Lọc thuốc theo category
      const categoryMedicines = medicinesData.filter((medicine) => medicine.category === category);

      if (categoryMedicines.length === 0) {
        throw new Error(`No medicines found for category: ${category}`);
      }

      // Phân tích seasonal pattern cho category
      const categorySeasonalPattern = this.analyzeCategorySeasonalTrends(
        categoryMedicines,
        forecastPeriod,
      );

      // Tạo khuyến nghị cho category
      const categoryRecommendations = this.generateCategorySeasonalRecommendations(
        category,
        categorySeasonalPattern,
        forecastPeriod,
      );

      console.log(
        `SeasonalAnalysis: Successfully analyzed seasonal pattern for category ${category}`,
      );

      return {
        category,
        categorySeasonalPattern,
        categoryRecommendations,
        totalMedicines: categoryMedicines.length,
        forecastPeriod,
        analyzedAt: new Date(),
      };
    } catch (error) {
      console.error(
        `SeasonalAnalysis: Error analyzing category seasonal pattern for ${category}:`,
        error,
      );
      throw new Error(`Category seasonal analysis failed for ${category}: ${error.message}`);
    }
  }

  /**
   * Phân tích mô hình mùa vụ theo khu vực
   */
  async analyzeRegionalSeasonalPattern(region, medicinesData, forecastPeriod = 2) {
    try {
      console.log(`SeasonalAnalysis: Analyzing seasonal pattern for region ${region}...`);

      // Lọc thuốc theo khu vực
      const regionalMedicines = this.filterMedicinesByRegion(medicinesData, region);

      if (regionalMedicines.length === 0) {
        throw new Error(`No medicines found for region: ${region}`);
      }

      // Phân tích seasonal pattern cho khu vực
      const regionalSeasonalPattern = this.analyzeRegionalSeasonalTrends(
        regionalMedicines,
        region,
        forecastPeriod,
      );

      // Tạo khuyến nghị cho khu vực
      const regionalRecommendations = this.generateRegionalSeasonalRecommendations(
        region,
        regionalSeasonalPattern,
        forecastPeriod,
      );

      console.log(`SeasonalAnalysis: Successfully analyzed seasonal pattern for region ${region}`);

      return {
        region,
        regionalSeasonalPattern,
        regionalRecommendations,
        totalMedicines: regionalMedicines.length,
        forecastPeriod,
        analyzedAt: new Date(),
      };
    } catch (error) {
      console.error(
        `SeasonalAnalysis: Error analyzing regional seasonal pattern for ${region}:`,
        error,
      );
      throw new Error(`Regional seasonal analysis failed for ${region}: ${error.message}`);
    }
  }

  // Helper methods
  extractSeasonalPattern(historicalData) {
    try {
      const seasonalData = {
        Spring: { totalQuantity: 0, count: 0, averageQuantity: 0 },
        Summer: { totalQuantity: 0, count: 0, averageQuantity: 0 },
        Autumn: { totalQuantity: 0, count: 0, averageQuantity: 0 },
        Winter: { totalQuantity: 0, count: 0, averageQuantity: 0 },
      };

      // Phân loại data theo mùa
      historicalData.forEach((dataPoint) => {
        const date = new Date(dataPoint.date || dataPoint.createdAt);
        const month = date.getMonth() + 1; // 0-11 -> 1-12
        const season = this.getSeasonByMonth(month);

        if (season && seasonalData[season]) {
          seasonalData[season].totalQuantity += dataPoint.quantity || 0;
          seasonalData[season].count += 1;
        }
      });

      // Tính average quantity cho mỗi mùa
      Object.keys(seasonalData).forEach((season) => {
        if (seasonalData[season].count > 0) {
          seasonalData[season].averageQuantity = Math.round(
            seasonalData[season].totalQuantity / seasonalData[season].count,
          );
        }
      });

      // Xác định mùa có nhu cầu cao nhất và thấp nhất
      const quantities = Object.values(seasonalData).map((s) => s.averageQuantity);
      const maxQuantity = Math.max(...quantities);
      const minQuantity = Math.min(...quantities);

      seasonalData.peakSeason = Object.keys(seasonalData).find(
        (season) => seasonalData[season].averageQuantity === maxQuantity,
      );
      seasonalData.lowSeason = Object.keys(seasonalData).find(
        (season) => seasonalData[season].averageQuantity === minQuantity,
      );

      return seasonalData;
    } catch (error) {
      console.error('SeasonalAnalysis: Error extracting seasonal pattern:', error);
      throw new Error(`Seasonal pattern extraction failed: ${error.message}`);
    }
  }

  getCurrentSeason() {
    const currentMonth = new Date().getMonth() + 1; // 0-11 -> 1-12

    for (const [season, info] of Object.entries(this.seasons)) {
      if (info.months.includes(currentMonth)) {
        return { name: season, ...info };
      }
    }

    return { name: 'Unknown', months: [], name: 'Không xác định' };
  }

  getSeasonByMonth(month) {
    for (const [season, info] of Object.entries(this.seasons)) {
      if (info.months.includes(month)) {
        return season;
      }
    }
    return null;
  }

  analyzeSeasonalImpact(seasonalPattern, currentSeason) {
    try {
      const currentSeasonData = seasonalPattern[currentSeason.name];
      if (!currentSeasonData) {
        return { impact: 'unknown', multiplier: 1.0, reason: 'No data for current season' };
      }

      // Tính toán tác động mùa vụ
      let impact = 'low';
      let multiplier = 1.0;
      let reason = '';

      // So sánh với mùa có nhu cầu cao nhất
      if (seasonalPattern.peakSeason && seasonalPattern.peakSeason !== currentSeason.name) {
        const peakData = seasonalPattern[seasonalPattern.peakSeason];
        const currentData = currentSeasonData;

        if (peakData.averageQuantity > 0 && currentData.averageQuantity > 0) {
          const ratio = currentData.averageQuantity / peakData.averageQuantity;

          if (ratio >= 0.8) {
            impact = 'high';
            multiplier = 1.2;
            reason = `Nhu cầu cao trong ${currentSeason.name}`;
          } else if (ratio >= 0.6) {
            impact = 'medium';
            multiplier = 1.1;
            reason = `Nhu cầu trung bình trong ${currentSeason.name}`;
          } else {
            impact = 'low';
            multiplier = 0.9;
            reason = `Nhu cầu thấp trong ${currentSeason.name}`;
          }
        }
      }

      // Điều chỉnh theo mô hình mùa vụ của thuốc
      const medicineSeasonalPattern = this.seasonalMedicinePatterns[currentSeason.name];
      if (medicineSeasonalPattern) {
        // Có thể mở rộng để tính toán dựa trên loại thuốc
        if (impact === 'high') {
          multiplier *= 1.1;
        }
      }

      return {
        impact,
        multiplier: Math.round(multiplier * 100) / 100,
        reason,
        currentSeasonData,
        comparisonWithPeak: seasonalPattern.peakSeason
          ? {
              peakSeason: seasonalPattern.peakSeason,
              peakQuantity: seasonalPattern[seasonalPattern.peakSeason]?.averageQuantity || 0,
              currentQuantity: currentSeasonData?.averageQuantity || 0,
            }
          : null,
      };
    } catch (error) {
      console.error('SeasonalAnalysis: Error analyzing seasonal impact:', error);
      return { impact: 'unknown', multiplier: 1.0, reason: 'Error analyzing impact' };
    }
  }

  forecastSeasonalDemand(seasonalPattern, currentSeason, forecastPeriod) {
    try {
      const forecast = [];
      const currentSeasonData = seasonalPattern[currentSeason.name];

      if (!currentSeasonData) {
        throw new Error('No data available for current season');
      }

      for (let i = 0; i < forecastPeriod; i++) {
        // Tính toán tháng tương lai
        const futureMonth = (currentSeason.months[0] + i) % 12 || 12;
        const futureSeason = this.getSeasonByMonth(futureMonth);

        if (futureSeason && seasonalPattern[futureSeason]) {
          const seasonData = seasonalPattern[futureSeason];
          const predictedQuantity = seasonData.averageQuantity || 0;

          forecast.push({
            period: i + 1,
            month: futureMonth,
            season: futureSeason,
            predictedQuantity,
            confidence: this.calculateForecastConfidence(seasonData, i),
            seasonalFactor: this.calculateSeasonalFactor(futureSeason, currentSeason.name),
          });
        }
      }

      return forecast;
    } catch (error) {
      console.error('SeasonalAnalysis: Error forecasting seasonal demand:', error);
      throw new Error(`Seasonal demand forecasting failed: ${error.message}`);
    }
  }

  generateSeasonalRecommendations(seasonalImpact, currentSeason, forecastPeriod) {
    try {
      const recommendations = [];

      // Khuyến nghị dựa trên tác động mùa vụ
      if (seasonalImpact.impact === 'high') {
        recommendations.push(`Tăng cường nhập hàng trong ${currentSeason.name} do nhu cầu cao`);
        recommendations.push('Chuẩn bị đủ stock để đáp ứng nhu cầu mùa vụ');
      } else if (seasonalImpact.impact === 'medium') {
        recommendations.push(`Duy trì mức nhập hàng ổn định trong ${currentSeason.name}`);
        recommendations.push('Theo dõi biến động nhu cầu');
      } else if (seasonalImpact.impact === 'low') {
        recommendations.push(`Giảm nhập hàng trong ${currentSeason.name} do nhu cầu thấp`);
        recommendations.push('Tập trung vào các thuốc có nhu cầu ổn định');
      }

      // Khuyến nghị dựa trên mùa cụ thể
      if (currentSeason.name === 'Winter') {
        recommendations.push('Tăng cường thuốc cảm cúm, thuốc ho, thuốc kháng sinh');
        recommendations.push('Chuẩn bị cho mùa dịch bệnh đường hô hấp');
      } else if (currentSeason.name === 'Summer') {
        recommendations.push('Tăng cường thuốc hạ sốt, thuốc chống mất nước');
        recommendations.push('Chuẩn bị cho các bệnh mùa hè');
      } else if (currentSeason.name === 'Autumn') {
        recommendations.push('Tăng cường thuốc cảm cúm, vitamin tăng cường miễn dịch');
        recommendations.push('Chuẩn bị cho mùa thay đổi thời tiết');
      } else if (currentSeason.name === 'Spring') {
        recommendations.push('Tăng cường thuốc dị ứng, thuốc hô hấp');
        recommendations.push('Chuẩn bị cho mùa phấn hoa');
      }

      // Khuyến nghị dựa trên forecast period
      if (forecastPeriod > 2) {
        recommendations.push('Lập kế hoạch nhập hàng dài hạn dựa trên dự báo mùa vụ');
        recommendations.push('Đánh giá lại kế hoạch mỗi tháng');
      }

      return recommendations.length > 0 ? recommendations : ['Duy trì chiến lược hiện tại'];
    } catch (error) {
      console.error('SeasonalAnalysis: Error generating seasonal recommendations:', error);
      return ['Không thể tạo khuyến nghị do lỗi phân tích'];
    }
  }

  calculateSeasonalConfidence(seasonalPattern, historicalData) {
    try {
      let confidence = 0.5; // Base confidence

      // Tăng confidence dựa trên số lượng data points
      const totalDataPoints = historicalData.length;
      if (totalDataPoints > 12) confidence += 0.2;
      else if (totalDataPoints > 6) confidence += 0.1;

      // Tăng confidence dựa trên data quality của các mùa
      const seasonsWithData = Object.values(seasonalPattern).filter(
        (season) => season.count > 0,
      ).length;

      if (seasonsWithData >= 4) confidence += 0.2;
      else if (seasonsWithData >= 3) confidence += 0.1;

      // Tăng confidence dựa trên consistency của data
      const quantities = Object.values(seasonalPattern)
        .filter((season) => season.count > 0)
        .map((season) => season.averageQuantity);

      if (quantities.length > 1) {
        const variance = this.calculateVariance(quantities);
        const mean = quantities.reduce((a, b) => a + b, 0) / quantities.length;
        const coefficientOfVariation = variance > 0 ? Math.sqrt(variance) / mean : 0;

        if (coefficientOfVariation < 0.3) confidence += 0.1; // Low variance = high confidence
      }

      return Math.min(0.95, confidence);
    } catch (error) {
      console.error('SeasonalAnalysis: Error calculating seasonal confidence:', error);
      return 0.5;
    }
  }

  calculateForecastConfidence(seasonData, periodIndex) {
    let confidence = 0.7; // Base confidence for seasonal forecast

    // Giảm confidence theo thời gian
    confidence -= periodIndex * 0.1;

    // Tăng confidence dựa trên data quality
    if (seasonData.count > 5) confidence += 0.1;
    if (seasonData.averageQuantity > 0) confidence += 0.1;

    return Math.max(0.3, Math.min(0.9, confidence));
  }

  calculateSeasonalFactor(futureSeason, currentSeason) {
    // Tính toán factor dựa trên mô hình mùa vụ
    const seasonalFactors = {
      Winter: { Winter: 1.0, Spring: 0.8, Summer: 0.6, Autumn: 0.9 },
      Spring: { Winter: 0.7, Spring: 1.0, Summer: 0.8, Autumn: 0.9 },
      Summer: { Winter: 0.6, Spring: 0.8, Summer: 1.0, Autumn: 0.7 },
      Autumn: { Winter: 0.9, Spring: 0.8, Summer: 0.7, Autumn: 1.0 },
    };

    return seasonalFactors[currentSeason]?.[futureSeason] || 1.0;
  }

  calculateVariance(values) {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDifferences = values.map((value) => Math.pow(value - mean, 2));
    return squaredDifferences.reduce((a, b) => a + b, 0) / values.length;
  }

  filterMedicinesByRegion(medicinesData, region) {
    if (region === 'Toàn quốc') {
      return medicinesData;
    }

    return medicinesData.filter((medicine) => {
      // Kiểm tra inventory data để xác định khu vực
      if (medicine.currentInventory && Array.isArray(medicine.currentInventory)) {
        return medicine.currentInventory.some((inv) => inv.geographicRegion === region);
      }
      return false;
    });
  }

  analyzeCategorySeasonalTrends(categoryMedicines, forecastPeriod) {
    try {
      const seasonalTrends = {};

      // Phân tích trend cho từng mùa
      Object.keys(this.seasons).forEach((season) => {
        seasonalTrends[season] = {
          totalMedicines: 0,
          averageDemand: 0,
          trend: 'stable',
        };
      });

      // Tính toán trend cho category
      categoryMedicines.forEach((medicine) => {
        if (medicine.seasonalAnalysis) {
          Object.keys(this.seasons).forEach((season) => {
            if (medicine.seasonalAnalysis.seasonalPattern[season]) {
              seasonalTrends[season].totalMedicines += 1;
              seasonalTrends[season].averageDemand +=
                medicine.seasonalAnalysis.seasonalPattern[season].averageQuantity || 0;
            }
          });
        }
      });

      // Tính average demand và xác định trend
      Object.keys(seasonalTrends).forEach((season) => {
        if (seasonalTrends[season].totalMedicines > 0) {
          seasonalTrends[season].averageDemand = Math.round(
            seasonalTrends[season].averageDemand / seasonalTrends[season].totalMedicines,
          );

          // Xác định trend (đơn giản hóa)
          seasonalTrends[season].trend = 'stable';
        }
      });

      return seasonalTrends;
    } catch (error) {
      console.error('SeasonalAnalysis: Error analyzing category seasonal trends:', error);
      throw new Error(`Category seasonal trends analysis failed: ${error.message}`);
    }
  }

  analyzeRegionalSeasonalTrends(regionalMedicines, region, forecastPeriod) {
    try {
      const regionalTrends = {
        region,
        seasonalPatterns: {},
        overallTrend: 'stable',
        recommendations: [],
      };

      // Phân tích seasonal pattern cho từng mùa
      Object.keys(this.seasons).forEach((season) => {
        regionalTrends.seasonalPatterns[season] = {
          totalMedicines: 0,
          averageDemand: 0,
          peakMedicines: [],
        };
      });

      // Tính toán trend cho khu vực
      regionalMedicines.forEach((medicine) => {
        if (medicine.seasonalAnalysis) {
          Object.keys(this.seasons).forEach((season) => {
            if (medicine.seasonalAnalysis.seasonalPattern[season]) {
              regionalTrends.seasonalPatterns[season].totalMedicines += 1;
              regionalTrends.seasonalPatterns[season].averageDemand +=
                medicine.seasonalAnalysis.seasonalPattern[season].averageQuantity || 0;
            }
          });
        }
      });

      // Tính average demand và xác định peak medicines
      Object.keys(regionalTrends.seasonalPatterns).forEach((season) => {
        const pattern = regionalTrends.seasonalPatterns[season];
        if (pattern.totalMedicines > 0) {
          pattern.averageDemand = Math.round(pattern.averageDemand / pattern.totalMedicines);
        }
      });

      return regionalTrends;
    } catch (error) {
      console.error('SeasonalAnalysis: Error analyzing regional seasonal trends:', error);
      throw new Error(`Regional seasonal trends analysis failed: ${error.message}`);
    }
  }

  generateCategorySeasonalRecommendations(category, categorySeasonalPattern, forecastPeriod) {
    const recommendations = [];

    // Khuyến nghị dựa trên seasonal pattern của category
    if (categorySeasonalPattern) {
      const seasons = Object.keys(categorySeasonalPattern);
      const demands = seasons.map((season) => categorySeasonalPattern[season].averageDemand);

      if (demands.length > 0) {
        const maxDemand = Math.max(...demands);
        const minDemand = Math.min(...demands);
        const peakSeason = seasons.find(
          (season) => categorySeasonalPattern[season].averageDemand === maxDemand,
        );

        if (peakSeason) {
          recommendations.push(`Tăng cường nhập hàng ${category} trong ${peakSeason}`);
        }

        if (maxDemand > minDemand * 1.5) {
          recommendations.push(`Có sự chênh lệch lớn về nhu cầu ${category} theo mùa`);
          recommendations.push('Cần lập kế hoạch nhập hàng theo mùa vụ');
        }
      }
    }

    return recommendations.length > 0
      ? recommendations
      : [`Duy trì chiến lược nhập hàng ${category} hiện tại`];
  }

  generateRegionalSeasonalRecommendations(region, regionalSeasonalPattern, forecastPeriod) {
    const recommendations = [];

    // Khuyến nghị dựa trên regional seasonal pattern
    if (regionalSeasonalPattern?.seasonalPatterns) {
      const patterns = regionalSeasonalPattern.seasonalPatterns;
      const seasons = Object.keys(patterns);

      // Xác định mùa có nhu cầu cao nhất
      const demands = seasons.map((season) => patterns[season].averageDemand);
      if (demands.length > 0) {
        const maxDemand = Math.max(...demands);
        const peakSeason = seasons.find((season) => patterns[season].averageDemand === maxDemand);

        if (peakSeason) {
          recommendations.push(`Tăng cường nhập hàng cho ${region} trong ${peakSeason}`);
        }
      }

      // Khuyến nghị dựa trên đặc điểm khu vực
      if (region === 'Miền Bắc') {
        recommendations.push('Chuẩn bị cho mùa đông lạnh với thuốc cảm cúm, thuốc ho');
      } else if (region === 'Miền Nam') {
        recommendations.push('Chuẩn bị cho mùa mưa với thuốc kháng sinh, thuốc hạ sốt');
      } else if (region === 'Miền Trung') {
        recommendations.push('Chuẩn bị cho mùa bão với thuốc khẩn cấp, thuốc sát trùng');
      }
    }

    return recommendations.length > 0
      ? recommendations
      : [`Duy trì chiến lược nhập hàng cho ${region} hiện tại`];
  }

  createSeasonalSummaryReport(results, currentSeason, forecastPeriod) {
    try {
      const totalMedicines = results.length;
      let highImpactCount = 0;
      let mediumImpactCount = 0;
      let lowImpactCount = 0;

      results.forEach((result) => {
        if (result.seasonalImpact?.impact === 'high') highImpactCount++;
        else if (result.seasonalImpact?.impact === 'medium') mediumImpactCount++;
        else if (result.seasonalImpact?.impact === 'low') lowImpactCount++;
      });

      return {
        currentSeason: currentSeason.name,
        forecastPeriod,
        totalMedicines,
        impactDistribution: {
          high: highImpactCount,
          medium: mediumImpactCount,
          low: lowImpactCount,
        },
        averageConfidence:
          totalMedicines > 0
            ? Math.round(
                (results.reduce((sum, r) => sum + (r.confidence || 0), 0) / totalMedicines) * 100,
              ) / 100
            : 0,
        topRecommendations: this.extractTopRecommendations(results),
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('SeasonalAnalysis: Error creating seasonal summary report:', error);
      return {
        error: error.message,
        status: 'failed',
      };
    }
  }

  extractTopRecommendations(results) {
    try {
      const allRecommendations = [];
      results.forEach((result) => {
        if (result.seasonalRecommendations) {
          allRecommendations.push(...result.seasonalRecommendations);
        }
      });

      // Đếm tần suất xuất hiện của mỗi khuyến nghị
      const recommendationCounts = {};
      allRecommendations.forEach((rec) => {
        recommendationCounts[rec] = (recommendationCounts[rec] || 0) + 1;
      });

      // Sắp xếp theo tần suất và trả về top 5
      return Object.entries(recommendationCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([recommendation, count]) => ({ recommendation, count }));
    } catch (error) {
      return [];
    }
  }
}

module.exports = SeasonalAnalysisService;
