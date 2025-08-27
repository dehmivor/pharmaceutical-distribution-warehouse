const moment = require('moment');

/**
 * Regional Analysis Service
 * Phân tích nhu cầu và cung cấp thuốc theo khu vực địa lý
 * TUYỆT ĐỐI KHÔNG SỬ DỤNG MOCK DATA - CHỈ XỬ LÝ DATA THỰC TẾ
 */
class RegionalAnalysisService {
  constructor() {
    this.regions = ['Miền Bắc', 'Miền Trung', 'Miền Nam', 'Toàn quốc'];
    this.regionFactors = {
      'Miền Bắc': {
        populationDensity: 'high',
        healthcareInfrastructure: 'developed',
        seasonalFactors: ['cold_weather', 'flu_season'],
        economicFactors: 'stable',
      },
      'Miền Trung': {
        populationDensity: 'medium',
        healthcareInfrastructure: 'developing',
        seasonalFactors: ['typhoon_season', 'heat_waves'],
        economicFactors: 'growing',
      },
      'Miền Nam': {
        populationDensity: 'very_high',
        healthcareInfrastructure: 'developed',
        seasonalFactors: ['rainy_season', 'dengue_fever'],
        economicFactors: 'strong',
      },
      'Toàn quốc': {
        populationDensity: 'mixed',
        healthcareInfrastructure: 'mixed',
        seasonalFactors: ['all_seasons'],
        economicFactors: 'mixed',
      },
    };
  }

  /**
   * Phân tích nhu cầu theo khu vực
   */
  async analyzeRegionalDemand(medicineData, externalFactors, forecastPeriod = 2) {
    try {
      console.log('RegionalAnalysis: Analyzing regional demand...');

      const regionalAnalysis = {};

      for (const region of this.regions) {
        try {
          const regionData = await this.analyzeSingleRegion(
            region,
            medicineData,
            externalFactors,
            forecastPeriod,
          );
          regionalAnalysis[region] = regionData;
        } catch (error) {
          console.warn(`RegionalAnalysis: Failed to analyze region ${region}:`, error.message);
          regionalAnalysis[region] = {
            error: error.message,
            status: 'failed',
          };
        }
      }

      // Phân tích so sánh giữa các khu vực
      const comparativeAnalysis = this.performComparativeAnalysis(regionalAnalysis);

      console.log('RegionalAnalysis: Regional demand analysis completed');

      return {
        regionalAnalysis,
        comparativeAnalysis,
        summary: this.generateRegionalSummary(regionalAnalysis),
        analyzedAt: new Date(),
      };
    } catch (error) {
      console.error('RegionalAnalysis: Error analyzing regional demand:', error);
      throw new Error(`Regional demand analysis failed: ${error.message}`);
    }
  }

  /**
   * Phân tích một khu vực cụ thể
   */
  async analyzeSingleRegion(region, medicineData, externalFactors, forecastPeriod) {
    try {
      // Lọc data theo khu vực
      const regionalMedicineData = this.filterDataByRegion(medicineData, region);

      if (!regionalMedicineData || regionalMedicineData.length === 0) {
        throw new Error(`No medicine data available for region: ${region}`);
      }

      // Phân tích nhu cầu cơ bản
      const demandAnalysis = this.analyzeBasicDemand(regionalMedicineData);

      // Phân tích yếu tố mùa vụ
      const seasonalAnalysis = this.analyzeSeasonalFactors(region, externalFactors);

      // Phân tích yếu tố kinh tế
      const economicAnalysis = this.analyzeEconomicFactors(region, externalFactors);

      // Phân tích yếu tố y tế
      const healthcareAnalysis = this.analyzeHealthcareFactors(region, externalFactors);

      // Tính toán nhu cầu tổng hợp
      const totalDemand = this.calculateTotalDemand(
        demandAnalysis,
        seasonalAnalysis,
        economicAnalysis,
        healthcareAnalysis,
      );

      // Dự báo nhu cầu theo thời gian
      const demandForecast = this.forecastRegionalDemand(totalDemand, forecastPeriod, region);

      return {
        region,
        status: 'success',
        demandAnalysis,
        seasonalAnalysis,
        economicAnalysis,
        healthcareAnalysis,
        totalDemand,
        demandForecast,
        confidence: this.calculateRegionalConfidence(
          demandAnalysis,
          seasonalAnalysis,
          economicAnalysis,
          healthcareAnalysis,
        ),
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error(`RegionalAnalysis: Error analyzing region ${region}:`, error);
      throw new Error(`Region analysis failed for ${region}: ${error.message}`);
    }
  }

  /**
   * Lọc data theo khu vực
   */
  filterDataByRegion(medicineData, region) {
    if (region === 'Toàn quốc') {
      return medicineData;
    }

    // Lọc theo geographic region
    return medicineData.filter((medicine) => {
      if (medicine.currentInventory && Array.isArray(medicine.currentInventory)) {
        return medicine.currentInventory.some((inventory) => inventory.geographicRegion === region);
      }
      return false;
    });
  }

  /**
   * Phân tích nhu cầu cơ bản
   */
  analyzeBasicDemand(regionalMedicineData) {
    try {
      const totalMedicines = regionalMedicineData.length;
      let totalQuantity = 0;
      let totalValue = 0;
      const medicineTypes = new Set();
      const manufacturers = new Set();

      regionalMedicineData.forEach((medicine) => {
        if (medicine.currentInventory && Array.isArray(medicine.currentInventory)) {
          medicine.currentInventory.forEach((inventory) => {
            totalQuantity += inventory.totalQuantity || 0;
            totalValue += (inventory.totalQuantity || 0) * (medicine.medicine?.price || 0);
          });
        }

        if (medicine.medicine) {
          medicineTypes.add(medicine.medicine.category || 'Unknown');
          manufacturers.add(medicine.medicine.manufacturer || 'Unknown');
        }
      });

      const averageQuantity = totalMedicines > 0 ? totalQuantity / totalMedicines : 0;
      const averageValue = totalMedicines > 0 ? totalValue / totalMedicines : 0;

      return {
        totalMedicines,
        totalQuantity,
        totalValue,
        averageQuantity: Math.round(averageQuantity),
        averageValue: Math.round(averageValue),
        medicineTypes: Array.from(medicineTypes),
        manufacturers: Array.from(manufacturers),
        demandLevel: this.calculateDemandLevel(averageQuantity),
      };
    } catch (error) {
      console.error('RegionalAnalysis: Error analyzing basic demand:', error);
      throw new Error(`Basic demand analysis failed: ${error.message}`);
    }
  }

  /**
   * Phân tích yếu tố mùa vụ
   */
  analyzeSeasonalFactors(region, externalFactors) {
    try {
      const regionInfo = this.regionFactors[region];
      if (!regionInfo) {
        throw new Error(`Unknown region: ${region}`);
      }

      const currentSeason = externalFactors.seasonal?.currentSeason || 'Unknown';
      const seasonalFactors = regionInfo.seasonalFactors || [];

      // Tính toán tác động mùa vụ
      let seasonalImpact = 'low';
      let seasonalMultiplier = 1.0;

      if (currentSeason === 'Winter' && seasonalFactors.includes('cold_weather')) {
        seasonalImpact = 'high';
        seasonalMultiplier = 1.3; // Tăng nhu cầu thuốc cảm cúm
      } else if (currentSeason === 'Summer' && seasonalFactors.includes('heat_waves')) {
        seasonalImpact = 'medium';
        seasonalMultiplier = 1.2; // Tăng nhu cầu thuốc hạ sốt
      } else if (
        seasonalFactors.includes('typhoon_season') ||
        seasonalFactors.includes('rainy_season')
      ) {
        seasonalImpact = 'medium';
        seasonalMultiplier = 1.15; // Tăng nhu cầu thuốc kháng sinh
      }

      return {
        currentSeason,
        seasonalFactors,
        seasonalImpact,
        seasonalMultiplier,
        seasonalRecommendations: this.generateSeasonalRecommendations(
          currentSeason,
          seasonalFactors,
        ),
      };
    } catch (error) {
      console.error('RegionalAnalysis: Error analyzing seasonal factors:', error);
      throw new Error(`Seasonal analysis failed: ${error.message}`);
    }
  }

  /**
   * Phân tích yếu tố kinh tế
   */
  analyzeEconomicFactors(region, externalFactors) {
    try {
      const regionInfo = this.regionFactors[region];
      if (!regionInfo) {
        throw new Error(`Unknown region: ${region}`);
      }

      const economicStatus = regionInfo.economicFactors;
      let economicImpact = 'low';
      let economicMultiplier = 1.0;

      // Đánh giá tác động kinh tế dựa trên external factors
      if (externalFactors.policies?.healthcare?.newRegulations) {
        const highImpactPolicies = externalFactors.policies.healthcare.newRegulations.filter(
          (policy) => policy.impact === 'high',
        ).length;

        if (highImpactPolicies > 0) {
          economicImpact = 'medium';
          economicMultiplier = 1.1; // Chính sách mới có thể ảnh hưởng giá
        }
      }

      return {
        economicStatus,
        economicImpact,
        economicMultiplier,
        policyInfluence: externalFactors.policies?.healthcare?.newRegulations?.length || 0,
        recommendations: this.generateEconomicRecommendations(economicStatus, economicImpact),
      };
    } catch (error) {
      console.error('RegionalAnalysis: Error analyzing economic factors:', error);
      throw new Error(`Economic analysis failed: ${error.message}`);
    }
  }

  /**
   * Phân tích yếu tố y tế
   */
  analyzeHealthcareFactors(region, externalFactors) {
    try {
      const regionInfo = this.regionFactors[region];
      if (!regionInfo) {
        throw new Error(`Unknown region: ${region}`);
      }

      const healthcareInfrastructure = regionInfo.healthcareInfrastructure;
      let healthcareImpact = 'low';
      let healthcareMultiplier = 1.0;

      // Đánh giá tác động y tế từ external factors
      if (externalFactors.diseaseOutbreaks?.overallRisk === 'high') {
        healthcareImpact = 'high';
        healthcareMultiplier = 1.4; // Dịch bệnh cao -> tăng nhu cầu
      } else if (externalFactors.diseaseOutbreaks?.overallRisk === 'medium') {
        healthcareImpact = 'medium';
        healthcareMultiplier = 1.2;
      }

      // Đánh giá theo mật độ dân số
      if (regionInfo.populationDensity === 'very_high') {
        healthcareMultiplier *= 1.1; // Mật độ dân số cao -> tăng nhu cầu
      } else if (regionInfo.populationDensity === 'low') {
        healthcareMultiplier *= 0.9; // Mật độ dân số thấp -> giảm nhu cầu
      }

      return {
        healthcareInfrastructure,
        populationDensity: regionInfo.populationDensity,
        healthcareImpact,
        healthcareMultiplier,
        diseaseRisk: externalFactors.diseaseOutbreaks?.overallRisk || 'unknown',
        recommendations: this.generateHealthcareRecommendations(
          healthcareInfrastructure,
          healthcareImpact,
        ),
      };
    } catch (error) {
      console.error('RegionalAnalysis: Error analyzing healthcare factors:', error);
      throw new Error(`Healthcare analysis failed: ${error.message}`);
    }
  }

  /**
   * Tính toán nhu cầu tổng hợp
   */
  calculateTotalDemand(demandAnalysis, seasonalAnalysis, economicAnalysis, healthcareAnalysis) {
    try {
      const baseDemand = demandAnalysis.averageQuantity || 0;

      // Áp dụng các multipliers
      let adjustedDemand = baseDemand;
      adjustedDemand *= seasonalAnalysis.seasonalMultiplier || 1.0;
      adjustedDemand *= economicAnalysis.economicMultiplier || 1.0;
      adjustedDemand *= healthcareAnalysis.healthcareMultiplier || 1.0;

      // Tính toán confidence score
      const confidence = this.calculateDemandConfidence(
        demandAnalysis,
        seasonalAnalysis,
        economicAnalysis,
        healthcareAnalysis,
      );

      return {
        baseDemand: Math.round(baseDemand),
        adjustedDemand: Math.round(adjustedDemand),
        totalMultiplier:
          (seasonalAnalysis.seasonalMultiplier || 1.0) *
          (economicAnalysis.economicMultiplier || 1.0) *
          (healthcareAnalysis.healthcareMultiplier || 1.0),
        confidence,
        factors: {
          seasonal: seasonalAnalysis.seasonalMultiplier || 1.0,
          economic: economicAnalysis.economicMultiplier || 1.0,
          healthcare: healthcareAnalysis.healthcareMultiplier || 1.0,
        },
      };
    } catch (error) {
      console.error('RegionalAnalysis: Error calculating total demand:', error);
      throw new Error(`Total demand calculation failed: ${error.message}`);
    }
  }

  /**
   * Dự báo nhu cầu theo khu vực
   */
  forecastRegionalDemand(totalDemand, forecastPeriod, region) {
    try {
      const forecast = [];
      const baseDemand = totalDemand.adjustedDemand;

      for (let i = 0; i < forecastPeriod; i++) {
        // Thêm yếu tố tăng trưởng theo thời gian
        const growthFactor = 1 + i * 0.05; // Tăng 5% mỗi tháng
        const predictedDemand = Math.round(baseDemand * growthFactor);

        forecast.push({
          period: i + 1,
          predictedDemand,
          growthFactor,
          confidence: Math.max(0.3, totalDemand.confidence - i * 0.1),
        });
      }

      return forecast;
    } catch (error) {
      console.error('RegionalAnalysis: Error forecasting regional demand:', error);
      throw new Error(`Regional demand forecasting failed: ${error.message}`);
    }
  }

  /**
   * Phân tích so sánh giữa các khu vực
   */
  performComparativeAnalysis(regionalAnalysis) {
    try {
      const successfulRegions = Object.entries(regionalAnalysis)
        .filter(([_, data]) => data.status === 'success')
        .map(([region, data]) => ({ region, ...data }));

      if (successfulRegions.length < 2) {
        return { message: 'Insufficient data for comparative analysis' };
      }

      // So sánh nhu cầu
      const demandComparison = this.compareRegionalDemand(successfulRegions);

      // So sánh confidence
      const confidenceComparison = this.compareRegionalConfidence(successfulRegions);

      // Xác định khu vực có nhu cầu cao nhất
      const highestDemandRegion = successfulRegions.reduce((max, current) =>
        (current.totalDemand?.adjustedDemand || 0) > (max.totalDemand?.adjustedDemand || 0)
          ? current
          : max,
      );

      return {
        demandComparison,
        confidenceComparison,
        highestDemandRegion: highestDemandRegion.region,
        recommendations: this.generateComparativeRecommendations(successfulRegions),
      };
    } catch (error) {
      console.error('RegionalAnalysis: Error performing comparative analysis:', error);
      return { error: error.message };
    }
  }

  // Helper methods
  calculateDemandLevel(averageQuantity) {
    if (averageQuantity > 1000) return 'very_high';
    if (averageQuantity > 500) return 'high';
    if (averageQuantity > 200) return 'medium';
    if (averageQuantity > 50) return 'low';
    return 'very_low';
  }

  calculateRegionalConfidence(
    demandAnalysis,
    seasonalAnalysis,
    economicAnalysis,
    healthcareAnalysis,
  ) {
    let confidence = 0.5; // Base confidence

    // Tăng confidence dựa trên data quality
    if (demandAnalysis.totalMedicines > 10) confidence += 0.2;
    if (seasonalAnalysis.currentSeason !== 'Unknown') confidence += 0.1;
    if (economicAnalysis.policyInfluence > 0) confidence += 0.1;
    if (healthcareAnalysis.diseaseRisk !== 'unknown') confidence += 0.1;

    return Math.min(0.95, confidence);
  }

  calculateDemandConfidence(
    demandAnalysis,
    seasonalAnalysis,
    economicAnalysis,
    healthcareAnalysis,
  ) {
    let confidence = 0.5;

    // Tăng confidence dựa trên các yếu tố
    if (demandAnalysis.totalMedicines > 5) confidence += 0.2;
    if (seasonalAnalysis.seasonalImpact !== 'low') confidence += 0.1;
    if (economicAnalysis.economicImpact !== 'low') confidence += 0.1;
    if (healthcareAnalysis.healthcareImpact !== 'low') confidence += 0.1;

    return Math.min(0.95, confidence);
  }

  generateSeasonalRecommendations(currentSeason, seasonalFactors) {
    const recommendations = [];

    if (currentSeason === 'Winter') {
      recommendations.push('Tăng cường nhập thuốc cảm cúm, thuốc ho');
    }
    if (seasonalFactors.includes('typhoon_season')) {
      recommendations.push('Chuẩn bị thuốc kháng sinh, thuốc sát trùng');
    }
    if (seasonalFactors.includes('dengue_fever')) {
      recommendations.push('Tăng cường thuốc hạ sốt, thuốc giảm đau');
    }

    return recommendations.length > 0 ? recommendations : ['Duy trì mức nhập hàng hiện tại'];
  }

  generateEconomicRecommendations(economicStatus, economicImpact) {
    if (economicImpact === 'high') {
      return ['Theo dõi chặt chẽ thay đổi giá', 'Điều chỉnh kế hoạch nhập hàng'];
    }
    if (economicStatus === 'growing') {
      return ['Tăng cường đầu tư vào khu vực này'];
    }
    return ['Duy trì chiến lược hiện tại'];
  }

  generateHealthcareRecommendations(healthcareInfrastructure, healthcareImpact) {
    if (healthcareImpact === 'high') {
      return ['Tăng cường nhập thuốc khẩn cấp', 'Chuẩn bị cho tình huống khẩn cấp'];
    }
    if (healthcareInfrastructure === 'developing') {
      return ['Hỗ trợ phát triển cơ sở y tế', 'Đào tạo nhân viên y tế'];
    }
    return ['Duy trì mức độ phục vụ hiện tại'];
  }

  compareRegionalDemand(regions) {
    const demands = regions.map((r) => ({
      region: r.region,
      demand: r.totalDemand?.adjustedDemand || 0,
    }));

    demands.sort((a, b) => b.demand - a.demand);

    return {
      highest: demands[0],
      lowest: demands[demands.length - 1],
      average: Math.round(demands.reduce((sum, r) => sum + r.demand, 0) / demands.length),
    };
  }

  compareRegionalConfidence(regions) {
    const confidences = regions.map((r) => ({
      region: r.region,
      confidence: r.confidence || 0,
    }));

    confidences.sort((a, b) => b.confidence - a.confidence);

    return {
      highest: confidences[0],
      lowest: confidences[confidences.length - 1],
      average:
        Math.round(
          (confidences.reduce((sum, r) => sum + r.confidence, 0) / confidences.length) * 100,
        ) / 100,
    };
  }

  generateComparativeRecommendations(regions) {
    const recommendations = [];

    // So sánh nhu cầu giữa các khu vực
    const demands = regions.map((r) => r.totalDemand?.adjustedDemand || 0);
    const maxDemand = Math.max(...demands);
    const minDemand = Math.min(...demands);

    if (maxDemand > minDemand * 2) {
      recommendations.push('Có sự chênh lệch lớn về nhu cầu giữa các khu vực');
      recommendations.push('Cần điều chỉnh phân phối thuốc giữa các khu vực');
    }

    return recommendations;
  }

  generateRegionalSummary(regionalAnalysis) {
    const successfulRegions = Object.entries(regionalAnalysis).filter(
      ([_, data]) => data.status === 'success',
    );

    return {
      totalRegions: this.regions.length,
      successfulRegions: successfulRegions.length,
      failedRegions: this.regions.length - successfulRegions.length,
      overallStatus: successfulRegions.length > 0 ? 'partial_success' : 'failed',
    };
  }
}

module.exports = RegionalAnalysisService;
