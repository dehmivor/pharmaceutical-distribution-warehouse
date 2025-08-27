const EnhancedDataCollectionService = require('./enhancedDataCollectionService');
const ExternalDataIntegrationService = require('./externalDataIntegrationService');
const DataTransformationService = require('./dataTransformationService');
const MultiAlgorithmPredictionService = require('./multiAlgorithmPredictionService');
const RegionalAnalysisService = require('./regionalAnalysisService');
const SeasonalAnalysisService = require('./seasonalAnalysisService');

/**
 * Test Service để kiểm tra Enhanced Data Collection và Transformation
 */
class TestEnhancedDataService {
  /**
   * Test thu thập data cho một thuốc cụ thể
   */
  static async testSingleMedicineData(medicineId) {
    try {
      console.log('TestEnhancedData: Testing single medicine data collection...');

      // Test EnhancedDataCollectionService
      const enhancedData = await EnhancedDataCollectionService.collectMedicineData(medicineId);
      console.log('✅ EnhancedDataCollectionService: Success');

      // Test ExternalDataIntegrationService
      const externalData = await ExternalDataIntegrationService.getAllExternalData();
      console.log('✅ ExternalDataIntegrationService: Success');

      // Test DataTransformationService
      const transformedData = DataTransformationService.transformMedicineData(
        enhancedData,
        externalData,
      );
      console.log('✅ DataTransformationService: Success');

      // Test MultiAlgorithmPredictionService
      const predictionResult = await MultiAlgorithmPredictionService.ensemblePrediction(
        transformedData.historicalData,
        externalData,
        transformedData.policyData,
        2,
      );
      console.log('✅ MultiAlgorithmPredictionService: Success');

      // Test RegionalAnalysisService
      const regionalAnalysis = await RegionalAnalysisService.analyzeRegionalDemand(
        enhancedData,
        externalData,
        2,
      );
      console.log('✅ RegionalAnalysisService: Success');

      // Test SeasonalAnalysisService
      const seasonalAnalysis = await SeasonalAnalysisService.analyzeSeasonalPatterns(
        enhancedData,
        externalData,
      );
      console.log('✅ SeasonalAnalysisService: Success');

      const result = {
        enhancedData,
        externalData,
        transformedData,
        predictionResult,
        regionalAnalysis,
        seasonalAnalysis,
        testTimestamp: new Date(),
        status: 'success',
      };

      console.log('✅ TestEnhancedData: All tests passed successfully');
      return result;
    } catch (error) {
      console.error('❌ TestEnhancedData: Error in testSingleMedicineData:', error);
      throw error;
    }
  }

  /**
   * Test thu thập data cho tất cả thuốc
   */
  static async testAllMedicinesData() {
    try {
      console.log('TestEnhancedData: Testing all medicines data collection...');

      // Test EnhancedDataCollectionService
      const enhancedData = await EnhancedDataCollectionService.collectAllMedicinesData();
      console.log('✅ EnhancedDataCollectionService: Success');

      // Test ExternalDataIntegrationService
      const externalData = await ExternalDataIntegrationService.getAllExternalData();
      console.log('✅ ExternalDataIntegrationService: Success');

      // Test DataTransformationService
      const transformedData = DataTransformationService.transformAllMedicinesData(
        enhancedData,
        externalData,
      );
      console.log('✅ DataTransformationService: Success');

      // Test MultiAlgorithmPredictionService
      const predictionResult = await MultiAlgorithmPredictionService.bulkEnsemblePrediction(
        transformedData,
        externalData,
        2,
      );
      console.log('✅ MultiAlgorithmPredictionService: Success');

      // Test RegionalAnalysisService
      const regionalAnalysis = await RegionalAnalysisService.analyzeAllRegionsDemand(
        enhancedData,
        externalData,
        2,
      );
      console.log('✅ RegionalAnalysisService: Success');

      // Test SeasonalAnalysisService
      const seasonalAnalysis = await SeasonalAnalysisService.analyzeAllSeasonalPatterns(
        enhancedData,
        externalData,
      );
      console.log('✅ SeasonalAnalysisService: Success');

      const result = {
        enhancedData,
        externalData,
        transformedData,
        predictionResult,
        regionalAnalysis,
        seasonalAnalysis,
        testTimestamp: new Date(),
        status: 'success',
      };

      console.log('✅ TestEnhancedData: All tests passed successfully');
      return result;
    } catch (error) {
      console.error('❌ TestEnhancedData: Error in testAllMedicinesData:', error);
      throw error;
    }
  }

  /**
   * Test external data integration
   */
  static async testExternalDataIntegration() {
    try {
      console.log('TestEnhancedData: Testing external data integration...');

      // Test weather data
      const weatherData = await ExternalDataIntegrationService.getWeatherData();
      console.log('✅ Weather data: Success');

      // Test disease data
      const diseaseData = await ExternalDataIntegrationService.getDiseaseOutbreakData();
      console.log('✅ Disease data: Success');

      // Test policy data
      const policyData = await ExternalDataIntegrationService.getPolicyRegulationData();
      console.log('✅ Policy data: Success');

      // Test seasonal data
      const seasonalData = await ExternalDataIntegrationService.getSeasonalData();
      console.log('✅ Seasonal data: Success');

      // Test all external data
      const allExternalData = await ExternalDataIntegrationService.getAllExternalData();
      console.log('✅ All external data: Success');

      const result = {
        weatherData,
        diseaseData,
        policyData,
        seasonalData,
        allExternalData,
        testTimestamp: new Date(),
        status: 'success',
      };

      console.log('✅ TestEnhancedData: External data integration tests passed successfully');
      return result;
    } catch (error) {
      console.error('❌ TestEnhancedData: Error in testExternalDataIntegration:', error);
      throw error;
    }
  }

  /**
   * Test data transformation với data thực tế
   */
  static async testDataTransformation() {
    try {
      console.log('TestEnhancedData: Testing data transformation...');

      // Get sample data
      const enhancedData = await EnhancedDataCollectionService.collectMedicineData();
      const externalData = await ExternalDataIntegrationService.getAllExternalData();

      // Test transformation
      const transformedData = DataTransformationService.transformMedicineData(
        enhancedData,
        externalData,
      );
      console.log('✅ Data transformation: Success');

      const result = {
        originalData: enhancedData,
        externalData,
        transformedData,
        testTimestamp: new Date(),
        status: 'success',
      };

      console.log('✅ TestEnhancedData: Data transformation tests passed successfully');
      return result;
    } catch (error) {
      console.error('❌ TestEnhancedData: Error in testDataTransformation:', error);
      throw error;
    }
  }

  /**
   * Run tất cả tests
   */
  static async runAllTests() {
    console.log('🚀 TestEnhancedDataService: Running all tests...');

    const results = {
      singleMedicine: null,
      allMedicines: null,
      externalData: null,
      transformation: null,
      summary: {
        total: 4,
        passed: 0,
        failed: 0,
      },
    };

    try {
      // Test 1: Single medicine
      results.singleMedicine = await this.testSingleMedicineData('test_medicine_id');
      if (results.singleMedicine.status === 'success') results.summary.passed++;
      else results.summary.failed++;

      // Test 2: All medicines
      results.allMedicines = await this.testAllMedicinesData();
      if (results.allMedicines.status === 'success') results.summary.passed++;
      else results.summary.failed++;

      // Test 3: External data integration
      results.externalData = await this.testExternalDataIntegration();
      if (results.externalData.status === 'success') results.summary.passed++;
      else results.summary.failed++;

      // Test 4: Data transformation
      results.transformation = await this.testDataTransformation();
      if (results.transformation.status === 'success') results.summary.passed++;
      else results.summary.failed++;

      console.log('📊 TestEnhancedDataService: All tests completed!');
      console.log('📈 Summary:', results.summary);

      return results;
    } catch (error) {
      console.error('❌ TestEnhancedDataService: Error running all tests:', error);
      return {
        success: false,
        error: error.message,
        summary: { total: 4, passed: 0, failed: 4 },
      };
    }
  }
}

module.exports = TestEnhancedDataService;
