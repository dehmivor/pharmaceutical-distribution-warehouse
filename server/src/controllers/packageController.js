const packageService = require('../services/packageService');

const packageController = {
  // ✅ Get all packages
  getAllPackages: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, location_id } = req.query;

      const result = await packageService.getAllPackages({
        page: parseInt(page),
        limit: parseInt(limit),
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
        data: packages,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching packages by location",
        error: error.message,
      });
    }
  },
}

module.exports = packageController;