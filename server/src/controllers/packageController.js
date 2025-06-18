const Package = require("../models/Package")
const Location = require("../models/Location")
const Area = require("../models/Area")
const Inventory = require("../models/Inventory")
const mongoose = require("mongoose")

const packageController = {
  // Get all packages with populated location and area info
  getAllPackages: async (req, res) => {
    try {
      const packages = await Package.find()
        .populate({
          path: "location_id",
          populate: {
            path: "area_id",
            model: "Area",
          },
        })
        .populate("batch_id")
        .sort({ created_at: -1 })

      res.status(200).json({
        success: true,
        data: packages,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching packages",
        error: error.message,
      })
    }
  },

  // Get all available locations
  getAllLocations: async (req, res) => {
    try {
      const locations = await Location.find({ available: true }).populate("area_id").sort({ position: 1 })

      res.status(200).json({
        success: true,
        data: locations,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching locations",
        error: error.message,
      })
    }
  },

  // Update package location
  updatePackageLocation: async (req, res) => {
    try {
      const { packageId } = req.params
      const { newLocationId, updatedBy } = req.body

      // Validate input
      if (!newLocationId || !updatedBy) {
        return res.status(400).json({
          success: false,
          message: "New location ID and updated by are required",
        })
      }

      // Get package info
      const pkg = await Package.findById(packageId)
      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: "Package not found",
        })
      }

      // Check if new location exists and is available
      const newLocation = await Location.findById(newLocationId)
      if (!newLocation) {
        return res.status(400).json({
          success: false,
          message: "New location not found",
        })
      }
      if (!newLocation.available) {
        return res.status(400).json({
          success: false,
          message: "New location is not available",
        })
      }

      // Check if the new location already has a package
      const existingPackage = await Package.findOne({ location_id: newLocationId, _id: { $ne: packageId } })
      if (existingPackage) {
        return res.status(400).json({
          success: false,
          message: "This location already contains another package",
        })
      }

      const oldLocationId = pkg.location_id

      // Update package location
      await Package.findByIdAndUpdate(packageId, { location_id: newLocationId })

      // Update inventory - remove from old location if it exists
      if (oldLocationId) {
        const oldInventory = await Inventory.findOne({
          batch_id: pkg.batch_id,
          location_id: oldLocationId,
        })
        if (oldInventory) {
          const updatedQuantity = oldInventory.quantity - pkg.quantity
          if (updatedQuantity <= 0) {
            await Inventory.deleteOne({
              batch_id: pkg.batch_id,
              location_id: oldLocationId,
            })
          } else {
            await Inventory.findOneAndUpdate(
              { batch_id: pkg.batch_id, location_id: oldLocationId },
              { $set: { quantity: updatedQuantity } }
            )
          }
        }
      }

      // Update inventory - add to new location
      const existingInventory = await Inventory.findOne({
        batch_id: pkg.batch_id,
        location_id: newLocationId,
      })

      if (existingInventory) {
        await Inventory.findOneAndUpdate(
          { batch_id: pkg.batch_id, location_id: newLocationId },
          { $inc: { quantity: pkg.quantity } }
        )
      } else {
        // Get batch info and validate
        const batch = await mongoose.model("Batch").findById(pkg.batch_id)
        if (!batch) {
          return res.status(404).json({
            success: false,
            message: "Batch not found",
          })
        }

        await Inventory.create({
          medicine_id: batch.medicine_id,
          batch_id: pkg.batch_id,
          location_id: newLocationId,
          quantity: pkg.quantity,
        })
      }

      // Update location's updated_by
      await Location.findByIdAndUpdate(newLocationId, { updated_by: updatedBy })

      // Get updated package with populated data
      const updatedPackage = await Package.findById(packageId)
        .populate({
          path: "location_id",
          populate: {
            path: "area_id",
            model: "Area",
          },
        })
        .populate("batch_id")

      res.status(200).json({
        success: true,
        message: "Package location updated successfully",
        data: updatedPackage,
      })
    } catch (error) {
      console.error("Error updating package location:", error)
      res.status(500).json({
        success: false,
        message: "Error updating package location",
        error: error.message,
      })
    }
  },

  // Confirm package storage (new endpoint)
  confirmPackageStorage: async (req, res) => {
    try {
      const { packageId } = req.params

      // Get package info
      const pkg = await Package.findById(packageId)
      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: "Package not found",
        })
      }

      // Update package status to STORED
      await Package.findByIdAndUpdate(packageId, { status: "STORED" })

      // Get updated package with populated data
      const updatedPackage = await Package.findById(packageId)
        .populate({
          path: "location_id",
          populate: {
            path: "area_id",
            model: "Area",
          },
        })
        .populate("batch_id")

      res.status(200).json({
        success: true,
        message: "Package confirmed and status updated to STORED",
        data: updatedPackage,
      })
    } catch (error) {
      console.error("Error confirming package storage:", error)
      res.status(500).json({
        success: false,
        message: "Error confirming package storage",
        error: error.message,
      })
    }
  },

  // Get packages by location
  getPackagesByLocation: async (req, res) => {
    try {
      const { locationId } = req.params

      const packages = await Package.find({ location_id: locationId })
        .populate({
          path: "location_id",
          populate: {
            path: "area_id",
            model: "Area",
          },
        })
        .populate("batch_id")
        .sort({ created_at: -1 })

      res.status(200).json({
        success: true,
        data: packages,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching packages by location",
        error: error.message,
      })
    }
  },
}

module.exports = packageController