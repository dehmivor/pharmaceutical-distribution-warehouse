const batchService = require('../services/batchService');
const Package = require('../models/Package');
const Area = require('../models/Area');
const Location = require('../models/Location');
const Batch = require('../models/Batch');
const LogLocationChange = require('../models/LogLocationChange');
const locationLogService = require('../services/logLocationChangeService');
const mongoose = require('mongoose');
const packageService = require('../services/packageService');

const packageController = {
  // ✅ Get all packages
  getAllPackages: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, location_id } = req.query;

      const result = await packageService.getAllPackages({
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        status,
        location_id,
      });

      res.status(200).json({
        success: true,
        data: result.packages,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Error getting packages:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting packages',
        error: error.message,
      });
    }
  },

  // ✅ Get all available locations
  getAllLocations: async (req, res) => {
    try {
      const result = await packageService.getAllLocations();

      if (!result.success) {
        return res.status(500).json(result);
      }

      res.status(200).json({
        success: true,
        data: result.locations,
      });
    } catch (error) {
      console.error('Error getting locations:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting locations',
        error: error.message,
      });
    }
  },

  // ✅ Get package by ID
  getPackageById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Package ID is required',
        });
      }

      const result = await packageService.getPackageById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json({
        success: true,
        data: result.package,
      });
    } catch (error) {
      console.error('Error getting package:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting package',
        error: error.message,
      });
    }
  },

  // ✅ Create new package
  createPackage: async (req, res) => {
    try {
      const packageData = req.body;

      // Validate required fields
      if (!packageData.batch_id || !packageData.quantity) {
        return res.status(400).json({
          success: false,
          message: 'Batch ID, quantity, and location ID are required',
        });
      }

      const result = await packageService.createPackage(packageData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json({
        success: true,
        message: 'Package created successfully',
        data: result.package,
      });
    } catch (error) {
      console.error('Error creating package:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating package',
        error: error.message,
      });
    }
  },

  // ✅ Update package location
  updatePackageLocation: async (req, res) => {
    try {
      const { packageId } = req.params;
      const { newLocationId, updatedBy } = req.body;

      // Validate input
      if (!newLocationId || !updatedBy) {
        return res.status(400).json({
          success: false,
          message: 'New location ID and updated by are required',
        });
      }

      const result = await packageService.updatePackageLocation(packageId, {
        newLocationId,
        updatedBy,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Package location updated successfully',
        data: result.package,
      });
    } catch (error) {
      console.error('Error updating package location:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating package location',
        error: error.message,
      });
    }
  },

  // ✅ Confirm package storage
  confirmPackageStorage: async (req, res) => {
    try {
      const { packageId } = req.params;

      const result = await packageService.confirmPackageStorage(packageId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Package confirmed and status updated to STORED',
        data: result.package,
      });
    } catch (error) {
      console.error('Error confirming package storage:', error);
      res.status(500).json({
        success: false,
        message: 'Error confirming package storage',
        error: error.message,
      });
    }
  },

  // ✅ Get packages by location
  getPackagesByLocation: async (req, res) => {
    try {
      const { locationId } = req.params;

      const result = await packageService.getPackagesByLocation(locationId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching packages by location',
        error: error.message,
      });
    }
  },

  getByBatch: async (req, res) => {
    try {
      const { batchId } = req.params;
      const packages = await Package.find({ batch_id: batchId })
        .populate({
          path: 'batch_id',
          populate: { path: 'medicine_id' },
        })
        .populate({
          path: 'location_id',
          populate: { path: 'area_id' },
        });
      res.json(packages);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Original method - keep for backward compatibility
  setPackageLocation: async (req, res) => {
    try {
      const { id } = req.params; // Package ID
      const { location } = req.body; // Chuỗi vị trí, ví dụ: "A1-01-01-01"

      // Kiểm tra input
      if (!location) {
        return res.status(400).json({ error: 'Vị trí là bắt buộc' });
      }

      // Phân tích chuỗi vị trí: "area-bay-row-column"
      const parts = location.split('-');
      if (parts.length !== 4) {
        return res.status(400).json({
          error:
            'Định dạng vị trí không hợp lệ. Sử dụng "area-bay-row-column" (ví dụ: "A1-01-01-01")',
        });
      }
      const [areaName, bay, row, column] = parts;

      // Tìm area theo tên
      const area = await Area.findOne({ name: areaName });
      if (!area) {
        return res.status(404).json({ error: `Không tìm thấy khu vực với tên ${areaName}` });
      }

      // Tìm package
      const pkg = await Package.findById(id);
      if (!pkg) {
        return res.status(404).json({ error: 'Không tìm thấy thùng' });
      }

      const oldLocationId = pkg.location_id;

      // Tìm hoặc tạo vị trí mới
      let newLocation = await Location.findOne({
        area_id: area._id,
        bay,
        row,
        column,
      });

      if (!newLocation) {
        // Tạo vị trí mới
        newLocation = new Location({
          area_id: area._id,
          bay,
          row,
          column,
          available: false,
        });
        await newLocation.save();
      } else {
        if (newLocation._id.equals(oldLocationId)) {
          // Vị trí không thay đổi
          return res.json({ message: 'Vị trí không thay đổi', location: newLocation });
        } else if (!newLocation.available) {
          return res.status(400).json({ error: 'Vị trí đã bị chiếm' });
        } else {
          // Cập nhật vị trí thành đã chiếm
          newLocation.available = false;
          await newLocation.save();
        }
      }

      // Cập nhật location_id của package
      pkg.location_id = newLocation._id;
      await pkg.save();

      // Nếu thùng có vị trí cũ khác với vị trí mới, đặt lại vị trí cũ thành available
      if (oldLocationId && !oldLocationId.equals(newLocation._id)) {
        await Location.findByIdAndUpdate(oldLocationId, { available: true });
      }

      res.json({ message: 'Cập nhật vị trí thành công', location: newLocation });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // New method with detailed input
  setPackageLocationDetailed: async (req, res) => {
    try {
      const { id } = req.params; // Package ID
      const { areaId, bay, row, column } = req.body;

      // Validate input
      if (!areaId || !bay || !row || !column) {
        return res.status(400).json({ error: 'Khu vực, bay, hàng và cột là bắt buộc' });
      }

      // Tìm area theo ID
      const area = await Area.findById(areaId);
      if (!area) {
        return res.status(404).json({ error: 'Không tìm thấy khu vực' });
      }

      // Tìm package
      const pkg = await Package.findById(id);
      if (!pkg) {
        return res.status(404).json({ error: 'Không tìm thấy thùng' });
      }

      const oldLocationId = pkg.location_id;

      // Tìm hoặc tạo vị trí mới
      let newLocation = await Location.findOne({
        area_id: areaId,
        bay: bay.toString(),
        row: row.toString(),
        column: column.toString(),
      });

      if (!newLocation) {
        // Tạo vị trí mới
        newLocation = new Location({
          area_id: areaId,
          bay: bay.toString(),
          row: row.toString(),
          column: column.toString(),
          available: false,
        });
        await newLocation.save();
      } else {
        if (oldLocationId && newLocation._id.equals(oldLocationId)) {
          // Vị trí không thay đổi
          return res.json({
            message: 'Vị trí không thay đổi',
            location: newLocation,
          });
        } else if (!newLocation.available) {
          return res.status(400).json({ error: 'Vị trí đã bị chiếm bởi thùng khác' });
        } else {
          // Cập nhật vị trí thành đã chiếm
          newLocation.available = false;
          await newLocation.save();
        }
      }

      // Cập nhật location_id của package
      pkg.location_id = newLocation._id;
      await pkg.save();

      // Nếu thùng có vị trí cũ khác với vị trí mới, đặt lại vị trí cũ thành available
      if (oldLocationId && !oldLocationId.equals(newLocation._id)) {
        await Location.findByIdAndUpdate(oldLocationId, { available: true });
      }

      // Populate area information for response
      await newLocation.populate('area_id');

      res.json({
        message: 'Cập nhật vị trí thành công',
        location: newLocation,
        locationString: `${area.name}-${bay}-${row}-${column}`,
      });
    } catch (err) {
      console.error('Error updating package location:', err);
      res.status(500).json({ error: err.message });
    }
  },

  getPackagesForOrder: async (req, res) => {
    const { importOrderId } = req.params;
    const result = await packageService.getPackagesByImportOrder(importOrderId);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    return res.json({ success: true, data: result.packages });
  },

  // clear location from package and log the removal
  clearLocation: async (req, res) => {
    try {
      const { packageId } = req.params;
      const { ware_house_id, import_order_id, export_order_id, inventory_check_order_id } =
        req.body;

      if (!packageId || !ware_house_id) {
        return res.status(400).json({
          success: false,
          message: 'packageId (param) and ware_house_id (body) are required',
        });
      }

      // 1) Fetch the current package to get batch and quantity
      const pkg = await Package.findById(packageId);
      if (!pkg) {
        return res
          .status(404)
          .json({ success: false, message: `No package found with id ${packageId}` });
      }

      const { batch_id, quantity, location_id } = pkg;

      // 2) Clear the location
      await Package.findByIdAndUpdate(packageId, { location_id: null });

      // 3) Create a location removal log entry
      const log = await LogLocationChange.create({
        location_id: location_id, // indicate removal
        type: 'remove', // removal type
        batch_id: batch_id,
        quantity: quantity,
        ware_house_id,
        import_order_id,
        export_order_id,
        inventory_check_order_id,
      });

      // 4) Return success
      return res.json({ success: true, log });
    } catch (err) {
      console.error('❌ Error clearing location and logging:', err);
      if (err.kind === 'ObjectId') {
        return res.status(400).json({ success: false, message: 'Invalid packageId format' });
      }
      return res
        .status(500)
        .json({ success: false, message: 'Server error clearing package location' });
    }
  },

  // add location to package and log the change
  addLocationToPackage: async (req, res) => {
    try {
      const { packageId } = req.params;
      const {
        location_id,
        ware_house_id,
        import_order_id,
        export_order_id,
        inventory_check_order_id,
      } = req.body;

      // Validate ObjectId formats up‐front
      if (
        !mongoose.Types.ObjectId.isValid(packageId) ||
        !mongoose.Types.ObjectId.isValid(location_id)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid packageId or location_id format',
        });
      }

      // 1) Update the package
      const updatedPackage = await packageService.addLocation(packageId, location_id);

      // 2) Log the change
      const log = await locationLogService.logChange({
        location_id,
        type: 'add',
        batch_id: updatedPackage.batch_id._id,
        quantity: updatedPackage.quantity,
        ware_house_id,
        import_order_id,
        export_order_id,
        inventory_check_order_id,
      });

      // 3) Return both
      return res.json({
        success: true,
        data: {
          package: updatedPackage,
          log,
        },
      });
    } catch (err) {
      console.error('❌ Error in addLocationToPackage:', err);
      const status = err.status || 500;
      const message = err.message || 'Server error updating package';
      return res.status(status).json({ success: false, message });
    }
  },

  getRelatedLocations: async (req, res) => {
    try {
      const { packageId } = req.params;
      if (!packageId) {
        return res.status(400).json({
          success: false,
          message: 'packageId parameter is required',
        });
      }

      // 1) Load the package to get its batch_id
      const pkg = await Package.findById(packageId);
      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: `No package found with id ${packageId}`,
        });
      }
      const batchId = pkg.batch_id;
      if (!batchId) {
        return res.status(400).json({
          success: false,
          message: 'This package has no batch_id assigned',
        });
      }

      // 2) Get the medicine_id from that batch
      const batch = await Batch.findById(batchId);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: `Batch ${batchId} not found`,
        });
      }
      const medicineId = batch.medicine_id;

      // 3) Find all location_ids for packages with the same batch
      const sameBatchLocationIds = await Package.distinct('location_id', {
        batch_id: batchId,
        location_id: { $exists: true, $ne: null },
      });

      // 4) Find all batch IDs for this medicine
      const sameMedicineBatchIds = await Batch.find({ medicine_id: medicineId }).distinct('_id');

      // 5) Find all location_ids for packages with those batch IDs
      const sameMedicineLocationIds = await Package.distinct('location_id', {
        batch_id: { $in: sameMedicineBatchIds },
        location_id: { $exists: true, $ne: null },
      });

      // 6) Load full Location docs, populating area
      const sameBatchLocations = await Location.find({
        _id: { $in: sameBatchLocationIds },
      }).populate('area_id');

      const sameMedicineLocations = await Location.find({
        _id: { $in: sameMedicineLocationIds },
      }).populate('area_id');

      return res.json({
        success: true,
        data: {
          sameBatchLocations,
          sameMedicineLocations,
        },
      });
    } catch (err) {
      console.error('❌ Error in getRelatedLocations:', err);
      if (err.kind === 'ObjectId') {
        return res.status(400).json({
          success: false,
          message: 'Invalid packageId format',
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Server error fetching related locations',
      });
    }
  },

  getPackagesByMedicineInExport: async (req, res) => {
    try {
      const { medicineId } = req.params;

      // 1) Validate medicineId
      if (!medicineId || !mongoose.Types.ObjectId.isValid(medicineId)) {
        return res.status(400).json({
          success: false,
          message: 'A valid medicineId URL parameter is required',
        });
      }

      // 2) Fetch valid batches
      const batches = await batchService.getValidBatches(medicineId);

      // 3) For each batch, fetch its packages with populated location
      const results = [];

      for (const batch of batches) {
        const packages = await Package.find({
          batch_id: batch._id,
          location_id: { $ne: null },
        }).populate({
          path: 'location_id',
          select: 'bay row column area_id',
          populate: {
            path: 'area_id',
            select: 'name',
          },
        });

        // Map packages to desired format
        const cleanedPackages = packages.map((pkg) => ({
          _id: pkg._id,
          quantity: pkg.quantity,
          package_code: pkg.package_code,
          location: {
            bay: pkg.location_id?.bay || 'N/A',
            row: pkg.location_id?.row || 'N/A',
            column: pkg.location_id?.column || 'N/A',
            area_name: pkg.location_id?.area_id?.name || 'N/A',
          },
        }));

        if (cleanedPackages.length > 0) {
          results.push({
            batch: {
              _id: batch._id,
              batch_code: batch.batch_code,
              expiry_date: batch.expiry_date,
            },
            packages: cleanedPackages,
          });
        }
      }

      // 4) Send response
      return res.json({
        success: true,
        data: results,
      });
    } catch (err) {
      console.error('❌ Error in getPackagesByMedicineInExport controller:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error fetching packages by medicine',
      });
    }
  },

  // V2 methods for Supervisor Package Management
  getAllPackagesV2: async (req, res) => {
    try {
      const { page = 1, limit = 10, medicine_id, area_id } = req.query;
      const { validationResult } = require('express-validator');
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array(),
        });
      }

      const result = await packageService.getAllPackagesV2({
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        medicine_id,
        area_id,
      });

      res.status(200).json({
        success: true,
        data: result.packages,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Error getting packages V2:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting packages',
        error: error.message,
      });
    }
  },

  getPackageByIdV2: async (req, res) => {
    try {
      const { id } = req.params;
      const { validationResult } = require('express-validator');
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array(),
        });
      }

      const result = await packageService.getPackageByIdV2(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json({
        success: true,
        data: result.package,
      });
    } catch (error) {
      console.error('Error getting package V2:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting package',
        error: error.message,
      });
    }
  },

  updatePackageLocationV2: async (req, res) => {
    try {
      const { id } = req.params;
      const { newLocationId } = req.body;
      const { validationResult } = require('express-validator');
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array(),
        });
      }

      const result = await packageService.updatePackageLocationV2(id, newLocationId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Package location updated successfully',
        data: result.package,
      });
    } catch (error) {
      console.error('Error updating package location V2:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating package location',
        error: error.message,
      });
    }
  },

  updatePackageV2: async (req, res) => {
    try {
      const { id } = req.params;
      const { newLocationId, quantity } = req.body;
      const { validationResult } = require('express-validator');
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array(),
        });
      }

      const result = await packageService.updatePackageV2(id, { newLocationId, quantity });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Package updated successfully',
        data: result.package,
      });
    } catch (error) {
      console.error('Error updating package V2:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating package',
        error: error.message,
      });
    }
  },

  getDistinctBatches: async(req, res) => {
  try {
    const { expiryBeforeMonths, expiryBeforeDate } = req.query;

    const opts = {};

    if (expiryBeforeDate) {
      const d = new Date(expiryBeforeDate);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ success: false, error: 'expiryBeforeDate is not a valid date' });
      }
      opts.expiryBeforeDate = d;
    } else if (expiryBeforeMonths !== undefined) {
      const n = parseInt(expiryBeforeMonths, 10);
      if (Number.isNaN(n)) {
        return res.status(400).json({ success: false, error: 'expiryBeforeMonths must be an integer' });
      }
      opts.expiryBeforeMonths = n;
    }

    const batches = await packageService.getDistinctBatchesFromPackages(opts);

    // compute expiryBefore ISO for meta (if provided)
    let expiryBeforeIso = null;
    if (opts.expiryBeforeDate) {
      expiryBeforeIso = new Date(opts.expiryBeforeDate).toISOString();
    } else if (opts.expiryBeforeMonths !== undefined) {
      const now = new Date();
      const target = new Date(now.getFullYear(), now.getMonth() + Number(opts.expiryBeforeMonths), 1, 0, 0, 0, 0);
      expiryBeforeIso = target.toISOString();
    }

    return res.json({
      success: true,
      meta: {
        count: Array.isArray(batches) ? batches.length : 0,
        expiryBefore: expiryBeforeIso,
        usedSimple: true,
      },
      data: batches,
    });
  } catch (err) {
    console.error('packageController.getDistinctBatchesSimple error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

};

module.exports = packageController;
