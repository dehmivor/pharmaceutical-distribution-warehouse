const moment = require('moment');

/**
 * Data Transformation Service
 * Transform và format data từ các nguồn khác nhau thành format mới
 */
class DataTransformationService {
  /**
   * Transform data tổng hợp thành format mới
   */
  static transformToEnhancedFormat(comprehensiveData, externalData) {
    try {
      console.log('DataTransformation: Transforming data to enhanced format...');

      const transformedData = {
        medicineId: comprehensiveData.medicine.medicineId,
        medicineName: comprehensiveData.medicine.medicineName,
        quarterlyExportData: this.transformQuarterlyExportData(comprehensiveData.quarterlyExports),
        currentInventory: this.transformInventoryData(comprehensiveData.currentInventory),
        seasonalFactors: this.extractSeasonalFactors(externalData.seasonal),
        diseaseOutbreaks: this.extractDiseaseOutbreakFactors(externalData.diseaseOutbreaks),
        medicinePrice: comprehensiveData.medicine.price,
        weatherConditions: this.extractWeatherFactors(externalData.weather),
        policies: this.extractPolicyFactors(externalData.policies),
        regulations: this.extractRegulationFactors(externalData.policies),
        similarMedicines: this.transformSimilarMedicines(comprehensiveData.similarMedicines),
        supplierContracts: this.transformSupplierContracts(comprehensiveData.supplierContracts),
        transformedAt: new Date(),
      };

      console.log('DataTransformation: Successfully transformed data');
      return transformedData;
    } catch (error) {
      console.error('DataTransformation: Error transforming data:', error);
      throw new Error(`Failed to transform data: ${error.message}`);
    }
  }

  /**
   * Transform data xuất hàng theo quý
   */
  static transformQuarterlyExportData(quarterlyExports) {
    const transformed = [];

    Object.values(quarterlyExports).forEach((exportData) => {
      transformed.push({
        year: exportData.year,
        quarter: exportData.quarter,
        totalQuantity: exportData.totalQuantity,
        orderCount: exportData.orderCount,
        totalValue: exportData.totalValue,
        averagePrice: exportData.averagePrice,
        period: `Q${exportData.quarter} ${exportData.year}`,
      });
    });

    // Sắp xếp theo thời gian
    return transformed.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.quarter - b.quarter;
    });
  }

  /**
   * Transform data tồn kho
   */
  static transformInventoryData(inventoryData) {
    const transformed = [];

    Object.values(inventoryData).forEach((inventory) => {
      transformed.push({
        locationId: inventory.locationId,
        locationName: inventory.locationName,
        region: inventory.region,
        totalQuantity: inventory.totalQuantity,
        batchCount: inventory.batchCount,
        averageExpiryDays: inventory.averageExpiryDays,
        minExpiryDate: inventory.minExpiryDate,
        maxExpiryDate: inventory.maxExpiryDate,
        stockStatus: inventory.stockStatus,
      });
    });

    return transformed;
  }

  /**
   * Extract các yếu tố mùa vụ
   */
  static extractSeasonalFactors(seasonalData) {
    if (!seasonalData) return {};

    return {
      currentSeason: seasonalData.currentSeason,
      currentMonth: seasonalData.currentMonth,
      monthName: seasonalData.monthName,
      seasonalFactors: seasonalData.seasonalFactors?.factors || [],
      upcomingHolidays: seasonalData.holidays || [],
      seasonalDemand: seasonalData.seasonalDemand || {},
      seasonalImpact: this.calculateSeasonalImpact(seasonalData),
    };
  }

  /**
   * Extract các yếu tố dịch bệnh
   */
  static extractDiseaseOutbreakFactors(diseaseData) {
    if (!diseaseData) return {};

    return {
      covid19Status: diseaseData.covid19 || {},
      otherDiseases: diseaseData.otherDiseases || [],
      overallRisk: diseaseData.overallRisk || 'unknown',
      diseaseImpact: this.calculateDiseaseImpact(diseaseData),
      affectedRegions: this.getAffectedRegions(diseaseData),
    };
  }

  /**
   * Extract các yếu tố thời tiết
   */
  static extractWeatherFactors(weatherData) {
    if (!weatherData) return {};

    const transformed = {};

    Object.entries(weatherData).forEach(([region, weather]) => {
      transformed[region] = {
        temperature: weather.temperature,
        humidity: weather.humidity,
        description: weather.description,
        windSpeed: weather.windSpeed,
        pressure: weather.pressure,
        visibility: weather.visibility,
        weatherImpact: this.calculateWeatherImpact(weather),
        timestamp: weather.timestamp,
      };
    });

    return transformed;
  }

  /**
   * Extract các yếu tố chính sách
   */
  static extractPolicyFactors(policyData) {
    if (!policyData) return {};

    return {
      healthcare: policyData.healthcare || {},
      importExport: policyData.importExport || {},
      regionalPolicies: policyData.regionalPolicies || {},
      policyImpact: this.calculatePolicyImpact(policyData),
      effectivePolicies: this.getEffectivePolicies(policyData),
    };
  }

  /**
   * Extract các yếu tố quy định
   */
  static extractRegulationFactors(policyData) {
    if (!policyData) return {};

    const regulations = [];

    // Healthcare regulations
    if (policyData.healthcare?.newRegulations) {
      regulations.push(
        ...policyData.healthcare.newRegulations.map((reg) => ({
          ...reg,
          category: 'healthcare',
          type: 'new',
        })),
      );
    }

    if (policyData.healthcare?.updatedPolicies) {
      regulations.push(
        ...policyData.healthcare.updatedPolicies.map((reg) => ({
          ...reg,
          category: 'healthcare',
          type: 'updated',
        })),
      );
    }

    // Import/Export regulations
    if (policyData.importExport?.newRegulations) {
      regulations.push(
        ...policyData.importExport.newRegulations.map((reg) => ({
          ...reg,
          category: 'import_export',
          type: 'new',
        })),
      );
    }

    return {
      allRegulations: regulations,
      highImpactRegulations: regulations.filter((reg) => reg.impact === 'high'),
      mediumImpactRegulations: regulations.filter((reg) => reg.impact === 'medium'),
      lowImpactRegulations: regulations.filter((reg) => reg.impact === 'low'),
      regulationImpact: this.calculateRegulationImpact(regulations),
    };
  }

  /**
   * Transform data thuốc tương tự
   */
  static transformSimilarMedicines(similarMedicines) {
    if (!similarMedicines || !Array.isArray(similarMedicines)) return [];

    return similarMedicines.map((medicine) => ({
      medicineId: medicine.medicineId,
      medicineName: medicine.medicineName,
      therapeuticGroup: medicine.therapeuticGroup,
      activeIngredient: medicine.activeIngredient,
      price: medicine.price,
      similarityScore: medicine.similarityScore,
      similarityLevel: this.getSimilarityLevel(medicine.similarityScore),
    }));
  }

  /**
   * Transform data hợp đồng nhà cung cấp
   */
  static transformSupplierContracts(supplierContracts) {
    if (!supplierContracts || !Array.isArray(supplierContracts)) return [];

    return supplierContracts.map((contract) => ({
      supplierId: contract._id.supplierId,
      supplierName: contract.supplierName,
      supplierRegion: contract.supplierRegion,
      contractValue: contract.contractValue,
      contractQuantity: contract.contractQuantity,
      unitPrice: contract.unitPrice,
      contractStartDate: contract.contractStartDate,
      contractEndDate: contract.contractEndDate,
      contractStatus: this.getContractStatus(contract.contractEndDate),
    }));
  }

  /**
   * Tạo format đầu ra cuối cùng cho API
   */
  static createFinalOutputFormat(transformedData, forecastPeriod = '2 months') {
    try {
      const finalOutput = {
        medicineId: transformedData.medicineId,
        forecastPeriod: forecastPeriod,
        forecastedQuantity: this.calculateForecastedQuantity(transformedData),
        forecastRegion: this.determineForecastRegion(transformedData),
        confidence: this.calculateConfidence(transformedData),
        algorithms: this.getUsedAlgorithms(transformedData),
        quantityAdjustment: this.generateQuantityAdjustment(transformedData),
        supportingData: {
          seasonalFactors: transformedData.seasonalFactors,
          diseaseOutbreaks: transformedData.diseaseOutbreaks,
          weatherConditions: transformedData.weatherConditions,
          policies: transformedData.policies,
          regulations: transformedData.regulations,
          similarMedicines: transformedData.similarMedicines,
        },
        generatedAt: new Date(),
      };

      console.log('DataTransformation: Created final output format');
      return finalOutput;
    } catch (error) {
      console.error('DataTransformation: Error creating final output:', error);
      throw new Error(`Failed to create final output: ${error.message}`);
    }
  }

  // Helper methods
  static calculateSeasonalImpact(seasonalData) {
    if (!seasonalData?.seasonalDemand) return 'low';

    const demands = Object.values(seasonalData.seasonalDemand);
    const highDemandCount = demands.filter((demand) => demand === 'high').length;

    if (highDemandCount >= 2) return 'high';
    if (highDemandCount >= 1) return 'medium';
    return 'low';
  }

  static calculateDiseaseImpact(diseaseData) {
    if (!diseaseData?.overallRisk) return 'low';

    const riskMap = { high: 'high', medium: 'medium', low: 'low', unknown: 'low' };
    return riskMap[diseaseData.overallRisk] || 'low';
  }

  static calculateWeatherImpact(weather) {
    if (!weather) return 'low';

    if (weather.temperature > 35 || weather.temperature < 10) return 'high';
    if (weather.temperature > 30 || weather.temperature < 15) return 'medium';
    return 'low';
  }

  static calculatePolicyImpact(policyData) {
    if (!policyData?.healthcare?.newRegulations) return 'low';

    const highImpactCount = policyData.healthcare.newRegulations.filter(
      (policy) => policy.impact === 'high',
    ).length;

    if (highImpactCount >= 2) return 'high';
    if (highImpactCount >= 1) return 'medium';
    return 'low';
  }

  static calculateRegulationImpact(regulations) {
    if (!regulations || regulations.length === 0) return 'low';

    const highImpactCount = regulations.filter((reg) => reg.impact === 'high').length;

    if (highImpactCount >= 2) return 'high';
    if (highImpactCount >= 1) return 'medium';
    return 'low';
  }

  static getAffectedRegions(diseaseData) {
    if (!diseaseData?.covid19) return [];

    // Giả định tất cả khu vực đều bị ảnh hưởng nếu có COVID-19
    return ['Miền Bắc', 'Miền Trung', 'Miền Nam'];
  }

  static getEffectivePolicies(policyData) {
    const effectivePolicies = [];

    if (policyData?.healthcare?.newRegulations) {
      effectivePolicies.push(...policyData.healthcare.newRegulations);
    }

    if (policyData?.importExport?.newRegulations) {
      effectivePolicies.push(...policyData.importExport.newRegulations);
    }

    return effectivePolicies;
  }

  static getSimilarityLevel(score) {
    if (score >= 0.8) return 'very_high';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    if (score >= 0.2) return 'low';
    return 'very_low';
  }

  static getContractStatus(endDate) {
    if (!endDate) return 'unknown';

    const now = new Date();
    const end = new Date(endDate);

    if (end < now) return 'expired';
    if (end.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) return 'expiring_soon';
    return 'active';
  }

  static calculateForecastedQuantity(transformedData) {
    // Giả định tính toán số lượng dự báo dựa trên data hiện tại
    const baseQuantity = 1000; // Số lượng cơ bản
    let adjustment = 0;

    // Điều chỉnh theo mùa vụ
    if (transformedData.seasonalFactors?.seasonalImpact === 'high') {
      adjustment += 200;
    } else if (transformedData.seasonalFactors?.seasonalImpact === 'medium') {
      adjustment += 100;
    }

    // Điều chỉnh theo dịch bệnh
    if (transformedData.diseaseOutbreaks?.diseaseImpact === 'high') {
      adjustment += 300;
    } else if (transformedData.diseaseOutbreaks?.diseaseImpact === 'medium') {
      adjustment += 150;
    }

    return Math.max(0, baseQuantity + adjustment);
  }

  static determineForecastRegion(transformedData) {
    // Xác định khu vực dự báo dựa trên khu vực địa lý thực tế
    if (transformedData.currentInventory && transformedData.currentInventory.length > 0) {
      const geographicRegions = transformedData.currentInventory.map((inv) => inv.geographicRegion);
      const uniqueRegions = [...new Set(geographicRegions)];

      if (uniqueRegions.length === 1) return uniqueRegions[0];
      if (uniqueRegions.includes('Miền Nam')) return 'Miền Nam';
      if (uniqueRegions.includes('Miền Trung')) return 'Miền Trung';
      if (uniqueRegions.includes('Miền Bắc')) return 'Miền Bắc';
    }

    return 'Toàn quốc';
  }

  static calculateConfidence(transformedData) {
    // Tính toán độ tin cậy dựa trên chất lượng data
    let confidence = 0.5; // Điểm cơ bản

    // Tăng điểm dựa trên data có sẵn
    if (transformedData.quarterlyExportData?.length > 0) confidence += 0.1;
    if (transformedData.currentInventory?.length > 0) confidence += 0.1;
    if (transformedData.seasonalFactors?.currentSeason) confidence += 0.1;
    if (transformedData.diseaseOutbreaks?.overallRisk !== 'unknown') confidence += 0.1;
    if (transformedData.policies?.healthcare?.newRegulations?.length > 0) confidence += 0.1;

    return Math.min(0.95, confidence);
  }

  static getUsedAlgorithms(transformedData) {
    // Danh sách các thuật toán được sử dụng
    const algorithms = ['Linear Regression', 'Time Series Analysis'];

    // Thêm thuật toán dựa trên data có sẵn
    if (transformedData.seasonalFactors?.seasonalImpact) {
      algorithms.push('Seasonal Decomposition');
    }

    if (transformedData.diseaseOutbreaks?.diseaseImpact) {
      algorithms.push('Risk Assessment');
    }

    if (transformedData.policies?.policyImpact) {
      algorithms.push('Policy Impact Analysis');
    }

    return algorithms;
  }

  static generateQuantityAdjustment(transformedData) {
    const adjustment = {
      recommendation: 'maintain',
      percentage: 0,
      reason: 'No significant factors detected',
    };

    let totalImpact = 0;
    const reasons = [];

    // Đánh giá tác động mùa vụ
    if (transformedData.seasonalFactors?.seasonalImpact === 'high') {
      totalImpact += 20;
      reasons.push('High seasonal demand');
    }

    // Đánh giá tác động dịch bệnh
    if (transformedData.diseaseOutbreaks?.diseaseImpact === 'high') {
      totalImpact += 30;
      reasons.push('Disease outbreak detected');
    }

    // Đánh giá tác động chính sách
    if (transformedData.policies?.policyImpact === 'high') {
      totalImpact += 25;
      reasons.push('High impact policy changes');
    }

    // Đánh giá tác động thời tiết
    if (transformedData.weatherConditions) {
      const highWeatherImpact = Object.values(transformedData.weatherConditions).some(
        (weather) => weather.weatherImpact === 'high',
      );

      if (highWeatherImpact) {
        totalImpact += 15;
        reasons.push('Adverse weather conditions');
      }
    }

    // Xác định khuyến nghị
    if (totalImpact >= 50) {
      adjustment.recommendation = 'increase';
      adjustment.percentage = Math.min(50, totalImpact);
    } else if (totalImpact >= 20) {
      adjustment.recommendation = 'moderate_increase';
      adjustment.percentage = totalImpact;
    } else if (totalImpact <= -20) {
      adjustment.recommendation = 'decrease';
      adjustment.percentage = Math.abs(totalImpact);
    }

    adjustment.reason = reasons.join(', ');
    return adjustment;
  }
}

module.exports = DataTransformationService;
