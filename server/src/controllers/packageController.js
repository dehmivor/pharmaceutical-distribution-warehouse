const packageService = require('../services/packageService');
const Package = require('../models/Package');
const Area = require('../models/Area');
const Location = require('../models/Location');

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
        data: result.packages,
      })
    } catch (error) {
      console.error("Error getting packages by location:", error)
      res.status(500).json({
        success: false,
        message: "Error getting packages by location",
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
};

module.exports = packageController;
