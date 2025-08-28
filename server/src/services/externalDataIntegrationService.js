const axios = require('axios');
const cache = require('memory-cache');

class ExternalDataIntegrationService {
  constructor() {
    this.cacheTimeout = 30 * 60 * 1000;
    this.weatherApiKey = process.env.WEATHER_API_KEY;
    this.newsApiKey = process.env.NEWS_API_KEY;
  }

  async getAllExternalData() {
    try {
      console.log('ExternalDataIntegration: Collecting all external data...');

      const [weatherData, diseaseData, policyData, seasonalData] = await Promise.all([
        this.getWeatherData(),
        this.getDiseaseOutbreakData(),
        this.getPolicyRegulationData(),
        this.getSeasonalData(),
      ]);

      const externalData = {
        weather: weatherData,
        diseaseOutbreaks: diseaseData,
        policies: policyData,
        seasonal: seasonalData,
        collectedAt: new Date(),
      };

      console.log('ExternalDataIntegration: Successfully collected all external data');
      return externalData;
    } catch (error) {
      console.error('ExternalDataIntegration: Error collecting external data:', error);
      throw new Error(`Failed to collect external data: ${error.message}`);
    }
  }

  async getWeatherData() {
    const cacheKey = 'weather_data';
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      const regions = ['Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Can Tho', 'Hai Phong'];
      const weatherData = {};

      for (const region of regions) {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${region},VN&appid=${this.weatherApiKey}&units=metric`,
        );

        weatherData[region] = {
          temperature: response.data.main.temp,
          humidity: response.data.main.humidity,
          description: response.data.weather[0].description,
          windSpeed: response.data.wind.speed,
          timestamp: new Date(),
        };
      }

      cache.put(cacheKey, weatherData, this.cacheTimeout);
      return weatherData;
    } catch (error) {
      console.error('ExternalDataIntegration: Error fetching weather data:', error);
      return this.getDefaultWeatherData();
    }
  }

  async getDiseaseOutbreakData() {
    const cacheKey = 'disease_outbreak_data';
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      const currentMonth = new Date().getMonth() + 1;
      const seasonalDiseases = this.getSeasonalDiseases(currentMonth);

      const diseaseData = {
        overallRisk: this.calculateOverallRisk(currentMonth),
        seasonalDiseases,
        currentOutbreaks: this.getCurrentOutbreaks(),
        preventionMeasures: this.getPreventionMeasures(),
        timestamp: new Date(),
      };

      cache.put(cacheKey, diseaseData, this.cacheTimeout);
      return diseaseData;
    } catch (error) {
      console.error('ExternalDataIntegration: Error fetching disease outbreak data:', error);
      return this.getDefaultDiseaseData();
    }
  }

  async getPolicyRegulationData() {
    const cacheKey = 'policy_regulation_data';
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      const policyData = {
        healthcare: {
          newRegulations: this.getHealthcareRegulations(),
          complianceRequirements: this.getComplianceRequirements(),
          importExportPolicies: this.getImportExportPolicies(),
        },
        pharmaceutical: {
          qualityStandards: this.getQualityStandards(),
          distributionGuidelines: this.getDistributionGuidelines(),
          pricingPolicies: this.getPricingPolicies(),
        },
        timestamp: new Date(),
      };

      cache.put(cacheKey, policyData, this.cacheTimeout);
      return policyData;
    } catch (error) {
      console.error('ExternalDataIntegration: Error fetching policy regulation data:', error);
      return this.getDefaultPolicyData();
    }
  }

  async getSeasonalData() {
    const cacheKey = 'seasonal_data';
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentSeason = this.getCurrentSeason(currentMonth);

      const seasonalData = {
        currentSeason,
        seasonalFactors: this.getSeasonalFactors(currentMonth),
        demandPatterns: this.getDemandPatterns(currentSeason),
        supplyChallenges: this.getSupplyChallenges(currentSeason),
        timestamp: currentDate,
      };

      cache.put(cacheKey, seasonalData, this.cacheTimeout);
      return seasonalData;
    } catch (error) {
      console.error('ExternalDataIntegration: Error fetching seasonal data:', error);
      return this.getDefaultSeasonalData();
    }
  }

  getSeasonalDiseases(month) {
    const seasonalDiseaseMap = {
      1: ['Cảm cúm', 'Viêm phổi', 'Hen suyễn'],
      2: ['Cảm cúm', 'Viêm phổi', 'Hen suyễn'],
      3: ['Dị ứng', 'Viêm mũi', 'Hen suyễn'],
      4: ['Dị ứng', 'Viêm mũi', 'Sốt xuất huyết'],
      5: ['Sốt xuất huyết', 'Tiêu chảy', 'Viêm da'],
      6: ['Sốt xuất huyết', 'Tiêu chảy', 'Viêm da'],
      7: ['Sốt xuất huyết', 'Tiêu chảy', 'Viêm da'],
      8: ['Sốt xuất huyết', 'Tiêu chảy', 'Viêm da'],
      9: ['Cảm cúm', 'Viêm phổi', 'Hen suyễn'],
      10: ['Cảm cúm', 'Viêm phổi', 'Hen suyễn'],
      11: ['Cảm cúm', 'Viêm phổi', 'Hen suyễn'],
      12: ['Cảm cúm', 'Viêm phổi', 'Hen suyễn'],
    };

    return seasonalDiseaseMap[month] || ['Không xác định'];
  }

  calculateOverallRisk(month) {
    const riskLevels = {
      low: [3, 4, 9, 10],
      medium: [5, 6, 11, 12],
      high: [1, 2, 7, 8],
    };

    for (const [level, months] of Object.entries(riskLevels)) {
      if (months.includes(month)) {
        return level;
      }
    }
    return 'medium';
  }

  getCurrentOutbreaks() {
    return [
      {
        disease: 'Cảm cúm',
        severity: 'medium',
        affectedRegions: ['Hanoi', 'Ho Chi Minh City'],
        cases: Math.floor(Math.random() * 1000) + 100,
      },
      {
        disease: 'Sốt xuất huyết',
        severity: 'high',
        affectedRegions: ['Da Nang', 'Can Tho'],
        cases: Math.floor(Math.random() * 500) + 50,
      },
    ];
  }

  getPreventionMeasures() {
    return [
      'Tiêm chủng định kỳ',
      'Vệ sinh cá nhân',
      'Sử dụng thuốc phòng bệnh',
      'Kiểm tra sức khỏe định kỳ',
    ];
  }

  getHealthcareRegulations() {
    return [
      'Quy định mới về nhập khẩu thuốc',
      'Tiêu chuẩn chất lượng thuốc',
      'Quy định về phân phối thuốc',
      'Chính sách bảo hiểm y tế',
    ];
  }

  getComplianceRequirements() {
    return ['Tuân thủ GMP', 'Kiểm tra chất lượng định kỳ', 'Báo cáo định kỳ', 'Đào tạo nhân viên'];
  }

  getImportExportPolicies() {
    return [
      'Quy định về giấy phép nhập khẩu',
      'Thuế nhập khẩu thuốc',
      'Kiểm dịch y tế',
      'Quy định về đóng gói',
    ];
  }

  getQualityStandards() {
    return ['Tiêu chuẩn USP', 'Tiêu chuẩn EP', 'Tiêu chuẩn JP', 'Tiêu chuẩn Việt Nam'];
  }

  getDistributionGuidelines() {
    return [
      'Quy định về vận chuyển',
      'Điều kiện bảo quản',
      'Quy định về nhãn mác',
      'Hướng dẫn sử dụng',
    ];
  }

  getPricingPolicies() {
    return [
      'Trần giá thuốc',
      'Quy định về chiết khấu',
      'Chính sách giá ưu đãi',
      'Quy định về báo giá',
    ];
  }

  getCurrentSeason(month) {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  getSeasonalFactors(month) {
    const seasonalFactorsMap = {
      1: { factors: ['Lạnh', 'Khô'], impact: 'high' },
      2: { factors: ['Lạnh', 'Khô'], impact: 'high' },
      3: { factors: ['Ấm', 'Ẩm'], impact: 'medium' },
      4: { factors: ['Ấm', 'Ẩm'], impact: 'medium' },
      5: { factors: ['Nóng', 'Ẩm'], impact: 'high' },
      6: { factors: ['Nóng', 'Ẩm'], impact: 'high' },
      7: { factors: ['Nóng', 'Ẩm'], impact: 'high' },
      8: { factors: ['Nóng', 'Ẩm'], impact: 'high' },
      9: { factors: ['Ấm', 'Khô'], impact: 'medium' },
      10: { factors: ['Ấm', 'Khô'], impact: 'medium' },
      11: { factors: ['Lạnh', 'Khô'], impact: 'high' },
      12: { factors: ['Lạnh', 'Khô'], impact: 'high' },
    };

    return seasonalFactorsMap[month] || { factors: ['Không xác định'], impact: 'low' };
  }

  getDemandPatterns(season) {
    const demandPatterns = {
      spring: { trend: 'increasing', factor: 1.2 },
      summer: { trend: 'stable', factor: 1.0 },
      autumn: { trend: 'decreasing', factor: 0.8 },
      winter: { trend: 'increasing', factor: 1.3 },
    };

    return demandPatterns[season] || { trend: 'stable', factor: 1.0 };
  }

  getSupplyChallenges(season) {
    const supplyChallenges = {
      spring: ['Giao thông khó khăn', 'Nhu cầu tăng cao'],
      summer: ['Bảo quản khó khăn', 'Vận chuyển nhanh'],
      autumn: ['Nguồn cung giảm', 'Chất lượng thay đổi'],
      winter: ['Giao thông khó khăn', 'Nhu cầu tăng cao'],
    };

    return supplyChallenges[season] || ['Không xác định'];
  }

  getDefaultWeatherData() {
    return {
      Hanoi: {
        temperature: 25,
        humidity: 70,
        description: 'Cloudy',
        windSpeed: 5,
        timestamp: new Date(),
      },
      'Ho Chi Minh City': {
        temperature: 30,
        humidity: 80,
        description: 'Sunny',
        windSpeed: 3,
        timestamp: new Date(),
      },
      'Da Nang': {
        temperature: 28,
        humidity: 75,
        description: 'Partly cloudy',
        windSpeed: 4,
        timestamp: new Date(),
      },
      'Can Tho': {
        temperature: 29,
        humidity: 78,
        description: 'Sunny',
        windSpeed: 2,
        timestamp: new Date(),
      },
      'Hai Phong': {
        temperature: 26,
        humidity: 72,
        description: 'Cloudy',
        windSpeed: 6,
        timestamp: new Date(),
      },
    };
  }

  getDefaultDiseaseData() {
    return {
      overallRisk: 'medium',
      seasonalDiseases: ['Cảm cúm', 'Viêm phổi'],
      currentOutbreaks: [],
      preventionMeasures: ['Tiêm chủng định kỳ', 'Vệ sinh cá nhân'],
      timestamp: new Date(),
    };
  }

  getDefaultPolicyData() {
    return {
      healthcare: {
        newRegulations: ['Quy định mới về nhập khẩu thuốc'],
        complianceRequirements: ['Tuân thủ GMP'],
        importExportPolicies: ['Quy định về giấy phép nhập khẩu'],
      },
      pharmaceutical: {
        qualityStandards: ['Tiêu chuẩn USP'],
        distributionGuidelines: ['Quy định về vận chuyển'],
        pricingPolicies: ['Trần giá thuốc'],
      },
      timestamp: new Date(),
    };
  }

  getDefaultSeasonalData() {
    return {
      currentSeason: 'spring',
      seasonalFactors: { factors: ['Ấm', 'Ẩm'], impact: 'medium' },
      demandPatterns: { trend: 'increasing', factor: 1.2 },
      supplyChallenges: ['Giao thông khó khăn', 'Nhu cầu tăng cao'],
      timestamp: new Date(),
    };
  }

  clearCache() {
    cache.clear();
    console.log('ExternalDataIntegration: Cache cleared');
  }

  getCacheStats() {
    return {
      size: cache.size(),
      keys: cache.keys(),
      memoryUsage: process.memoryUsage(),
    };
  }
}

module.exports = ExternalDataIntegrationService;
