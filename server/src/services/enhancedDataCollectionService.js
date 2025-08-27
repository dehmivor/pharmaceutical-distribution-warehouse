const Medicine = require('../models/Medicine');
const ExportOrder = require('../models/ExportOrder');
const Batch = require('../models/Batch');
const Package = require('../models/Package');
const Contract = require('../models/Contract');
const moment = require('moment');

/**
 * Enhanced Data Collection Service
 * Thu thập data từ các models hiện tại mà không thay đổi chúng
 */
class EnhancedDataCollectionService {
  /**
   * Thu thập thông tin thuốc cơ bản
   */
  static async collectMedicineData(medicineId = null) {
    try {
      let query = { status: 'active' };
      if (medicineId) {
        query._id = medicineId;
      }

      const medicines = await Medicine.find(query)
        .select('_id medicine_name price category manufacturer therapeutic_group active_ingredient')
        .lean();

      console.log(`EnhancedDataCollection: Collected data for ${medicines.length} medicines`);

      return medicines.map((medicine) => ({
        medicineId: medicine._id,
        medicineName: medicine.medicine_name,
        price: medicine.price || 0,
        category: medicine.category || 'Unknown',
        manufacturer: medicine.manufacturer || 'Unknown',
        therapeuticGroup: medicine.therapeutic_group || 'Unknown',
        activeIngredient: medicine.active_ingredient || 'Unknown',
      }));
    } catch (error) {
      console.error('EnhancedDataCollection: Error collecting medicine data:', error);
      throw new Error(`Failed to collect medicine data: ${error.message}`);
    }
  }

  /**
   * Thu thập data xuất hàng theo quý
   */
  static async collectQuarterlyExportData(medicineId = null, months = 12) {
    try {
      const startDate = moment().subtract(months, 'months').toDate();
      const endDate = new Date();

      let matchCondition = {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['completed', 'delivered'] },
      };

      if (medicineId) {
        matchCondition['details.medicine_id'] = medicineId;
      }

      const exportData = await ExportOrder.aggregate([
        {
          $match: matchCondition,
        },
        {
          $unwind: '$details',
        },
        {
          $match: medicineId ? { 'details.medicine_id': medicineId } : {},
        },
        {
          $group: {
            _id: {
              medicineId: '$details.medicine_id',
              year: { $year: '$createdAt' },
              quarter: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } },
            },
            totalQuantity: { $sum: '$details.expected_quantity' },
            orderCount: { $sum: 1 },
            totalValue: {
              $sum: { $multiply: ['$details.expected_quantity', '$details.unit_price'] },
            },
          },
        },
        {
          $sort: { '_id.year': 1, '_id.quarter': 1 },
        },
      ]);

      console.log(
        `EnhancedDataCollection: Collected quarterly export data for ${exportData.length} records`,
      );

      // Format data theo quý
      const quarterlyData = {};
      exportData.forEach((item) => {
        const key = `${item._id.medicineId}_${item._id.year}_Q${item._id.quarter}`;
        quarterlyData[key] = {
          medicineId: item._id.medicineId,
          year: item._id.year,
          quarter: item._id.quarter,
          totalQuantity: item.totalQuantity,
          orderCount: item.orderCount,
          totalValue: item.totalValue,
          averagePrice: item.totalValue / item.totalQuantity,
        };
      });

      return quarterlyData;
    } catch (error) {
      console.error('EnhancedDataCollection: Error collecting quarterly export data:', error);
      throw new Error(`Failed to collect quarterly export data: ${error.message}`);
    }
  }

  /**
   * Thu thập data tồn kho hiện tại theo khu vực địa lý
   */
  static async collectCurrentInventoryData(medicineId = null) {
    try {
      let matchCondition = {
        'packages.status': 'active',
        'packages.quantity': { $gt: 0 },
      };

      if (medicineId) {
        matchCondition.medicine_id = medicineId;
      }

      const inventoryData = await Batch.aggregate([
        {
          $match: matchCondition,
        },
        {
          $unwind: '$packages',
        },
        {
          $match: {
            'packages.status': 'active',
            'packages.quantity': { $gt: 0 },
          },
        },
        {
          $group: {
            _id: {
              medicineId: '$medicine_id',
              locationId: '$packages.location_id',
            },
            totalQuantity: { $sum: '$packages.quantity' },
            batchCount: { $sum: 1 },
            averageExpiryDays: { $avg: { $subtract: ['$expiry_date', new Date()] } },
            minExpiryDate: { $min: '$expiry_date' },
            maxExpiryDate: { $max: '$expiry_date' },
          },
        },
        {
          $lookup: {
            from: 'locations',
            localField: '_id.locationId',
            foreignField: '_id',
            as: 'location',
          },
        },
        {
          $unwind: '$location',
        },
      ]);

      console.log(
        `EnhancedDataCollection: Collected inventory data for ${inventoryData.length} medicine-location combinations`,
      );

      // Format data tồn kho theo khu vực địa lý
      const formattedInventory = {};
      inventoryData.forEach((item) => {
        const key = `${item._id.medicineId}_${item._id.locationId}`;
        formattedInventory[key] = {
          medicineId: item._id.medicineId,
          locationId: item._id.locationId,
          locationName: item.location?.name || 'Unknown',
          // Lấy khu vực địa lý thực tế thay vì vị trí trong kho
          geographicRegion: this.determineGeographicRegion(item.location?.name || ''),
          totalQuantity: item.totalQuantity,
          batchCount: item.batchCount,
          averageExpiryDays: Math.round(item.averageExpiryDays / (1000 * 60 * 60 * 24)),
          minExpiryDate: item.minExpiryDate,
          maxExpiryDate: item.maxExpiryDate,
          stockStatus: this.determineStockStatus(item.totalQuantity),
        };
      });

      return formattedInventory;
    } catch (error) {
      console.error('EnhancedDataCollection: Error collecting inventory data:', error);
      throw new Error(`Failed to collect inventory data: ${error.message}`);
    }
  }

  /**
   * Thu thập data hợp đồng nhà cung cấp
   */
  static async collectSupplierContractData(medicineId = null) {
    try {
      let matchCondition = {
        status: 'active',
        'items.medicine_id': medicineId || { $exists: true },
      };

      if (medicineId) {
        matchCondition['items.medicine_id'] = medicineId;
      }

      const contractData = await Contract.aggregate([
        {
          $match: matchCondition,
        },
        {
          $unwind: '$items',
        },
        {
          $match: medicineId ? { 'items.medicine_id': medicineId } : {},
        },
        {
          $lookup: {
            from: 'suppliers',
            localField: 'supplier_id',
            foreignField: '_id',
            as: 'supplier',
          },
        },
        {
          $unwind: '$supplier',
        },
        {
          $group: {
            _id: {
              medicineId: '$items.medicine_id',
              supplierId: '$supplier_id',
            },
            supplierName: { $first: '$supplier.name' },
            supplierRegion: { $first: '$supplier.region' },
            contractValue: { $sum: '$items.total_value' },
            contractQuantity: { $sum: '$items.quantity' },
            unitPrice: { $avg: '$items.unit_price' },
            contractStartDate: { $first: '$start_date' },
            contractEndDate: { $first: '$end_date' },
          },
        },
      ]);

      console.log(
        `EnhancedDataCollection: Collected supplier contract data for ${contractData.length} medicine-supplier combinations`,
      );

      return contractData;
    } catch (error) {
      console.error('EnhancedDataCollection: Error collecting supplier contract data:', error);
      throw new Error(`Failed to collect supplier contract data: ${error.message}`);
    }
  }

  /**
   * Thu thập data tổng hợp cho một thuốc cụ thể
   */
  static async collectComprehensiveMedicineData(medicineId) {
    try {
      console.log(
        `EnhancedDataCollection: Collecting comprehensive data for medicine ${medicineId}`,
      );

      const [medicineData, exportData, inventoryData, contractData] = await Promise.all([
        this.collectMedicineData(medicineId),
        this.collectQuarterlyExportData(medicineId),
        this.collectCurrentInventoryData(medicineId),
        this.collectSupplierContractData(medicineId),
      ]);

      // Tìm thuốc tương tự
      const similarMedicines = await this.findSimilarMedicines(medicineData[0]);

      const comprehensiveData = {
        medicine: medicineData[0],
        quarterlyExports: exportData,
        currentInventory: inventoryData,
        supplierContracts: contractData,
        similarMedicines: similarMedicines,
        collectedAt: new Date(),
      };

      console.log(
        `EnhancedDataCollection: Successfully collected comprehensive data for medicine ${medicineId}`,
      );
      return comprehensiveData;
    } catch (error) {
      console.error('EnhancedDataCollection: Error collecting comprehensive data:', error);
      throw new Error(`Failed to collect comprehensive data: ${error.message}`);
    }
  }

  /**
   * Thu thập data tổng hợp cho tất cả thuốc
   */
  static async collectAllMedicinesData() {
    try {
      console.log('EnhancedDataCollection: Collecting data for all medicines');

      const [medicineData, exportData, inventoryData, contractData] = await Promise.all([
        this.collectMedicineData(),
        this.collectQuarterlyExportData(),
        this.collectCurrentInventoryData(),
        this.collectSupplierContractData(),
      ]);

      const allMedicinesData = {
        medicines: medicineData,
        quarterlyExports: exportData,
        currentInventory: inventoryData,
        supplierContracts: contractData,
        collectedAt: new Date(),
      };

      console.log(
        `EnhancedDataCollection: Successfully collected data for ${medicineData.length} medicines`,
      );
      return allMedicinesData;
    } catch (error) {
      console.error('EnhancedDataCollection: Error collecting all medicines data:', error);
      throw new Error(`Failed to collect all medicines data: ${error.message}`);
    }
  }

  /**
   * Tìm thuốc tương tự dựa trên nhóm dược lý và hoạt chất
   */
  static async findSimilarMedicines(medicine) {
    try {
      if (!medicine.therapeuticGroup && !medicine.activeIngredient) {
        return [];
      }

      let query = {
        status: 'active',
        _id: { $ne: medicine.medicineId },
      };

      if (medicine.therapeuticGroup && medicine.therapeuticGroup !== 'Unknown') {
        query.therapeutic_group = medicine.therapeuticGroup;
      }

      if (medicine.activeIngredient && medicine.activeIngredient !== 'Unknown') {
        query.active_ingredient = medicine.activeIngredient;
      }

      const similarMedicines = await Medicine.find(query)
        .select('_id medicine_name therapeutic_group active_ingredient price')
        .limit(5)
        .lean();

      return similarMedicines.map((med) => ({
        medicineId: med._id,
        medicineName: med.medicine_name,
        therapeuticGroup: med.therapeutic_group,
        activeIngredient: med.active_ingredient,
        price: med.price,
        similarityScore: this.calculateSimilarityScore(medicine, med),
      }));
    } catch (error) {
      console.error('EnhancedDataCollection: Error finding similar medicines:', error);
      return [];
    }
  }

  /**
   * Tính điểm tương tự giữa 2 thuốc
   */
  static calculateSimilarityScore(medicine1, medicine2) {
    let score = 0;

    if (medicine1.therapeuticGroup === medicine2.therapeuticGroup) {
      score += 0.6;
    }

    if (medicine1.activeIngredient === medicine2.activeIngredient) {
      score += 0.4;
    }

    return score;
  }

  /**
   * Xác định khu vực địa lý dựa trên tên địa điểm
   * Lấy từ data thực tế thay vì vị trí trong kho
   */
  static determineGeographicRegion(locationName) {
    if (!locationName) return 'Unknown';

    const name = locationName.toLowerCase();

    // Phân loại theo khu vực địa lý thực tế
    if (
      name.includes('hà nội') ||
      name.includes('hải phòng') ||
      name.includes('quảng ninh') ||
      name.includes('bắc ninh') ||
      name.includes('hưng yên') ||
      name.includes('hải dương')
    ) {
      return 'Miền Bắc';
    } else if (
      name.includes('đà nẵng') ||
      name.includes('huế') ||
      name.includes('khánh hòa') ||
      name.includes('quảng nam') ||
      name.includes('phú yên') ||
      name.includes('bình định')
    ) {
      return 'Miền Trung';
    } else if (
      name.includes('tp.hcm') ||
      name.includes('đồng nai') ||
      name.includes('bình dương') ||
      name.includes('long an') ||
      name.includes('tiền giang') ||
      name.includes('vĩnh long')
    ) {
      return 'Miền Nam';
    } else {
      return 'Khác';
    }
  }

  /**
   * Xác định trạng thái tồn kho
   */
  static determineStockStatus(quantity) {
    if (quantity === 0) return 'out_of_stock';
    if (quantity < 100) return 'low_stock';
    if (quantity < 500) return 'medium_stock';
    return 'high_stock';
  }
}

module.exports = EnhancedDataCollectionService;
