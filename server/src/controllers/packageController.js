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
    const session = await mongoose.startSession()
    session.startTransaction()

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
      const pkg = await Package.findById(packageId).session(session)
      if (!pkg) {
        await session.abortTransaction()
        return res.status(404).json({
          success: false,
          message: "Package not found",
        })
      }

      // Check if new location exists and is available
      const newLocation = await Location.findById(newLocationId).session(session)
      if (!newLocation || !newLocation.available) {
        await session.abortTransaction()
        return res.status(400).json({
          success: false,
          message: "Location not found or not available",
        })
      }

      const oldLocationId = pkg.location_id

      // Update package location
      await Package.findByIdAndUpdate(packageId, { location_id: newLocationId }, { session })

      // Update inventory - remove from old location
      if (oldLocationId) {
        await Inventory.findOneAndUpdate(
          {
            batch_id: pkg.batch_id,
            location_id: oldLocationId,
          },
          {
            $inc: { quantity: -pkg.quantity },
          },
          { session },
        )

        // Remove inventory record if quantity becomes 0
        await Inventory.deleteMany(
          {
            batch_id: pkg.batch_id,
            location_id: oldLocationId,
            quantity: { $lte: 0 },
          },
          { session },
        )
      }

      // Update inventory - add to new location
      const existingInventory = await Inventory.findOne({
        batch_id: pkg.batch_id,
        location_id: newLocationId,
      }).session(session)

      if (existingInventory) {
        await Inventory.findOneAndUpdate(
          {
            batch_id: pkg.batch_id,
            location_id: newLocationId,
          },
          {
            $inc: { quantity: pkg.quantity },
          },
          { session },
        )
      } else {
        // Get medicine_id from batch
        const batch = await mongoose.model("Batch").findById(pkg.batch_id).session(session)

        await Inventory.create(
          [
            {
              medicine_id: batch.medicine_id,
              batch_id: pkg.batch_id,
              location_id: newLocationId,
              quantity: pkg.quantity,
            },
          ],
          { session },
        )
      }

      // Update location's updated_by
      await Location.findByIdAndUpdate(newLocationId, { updated_by: updatedBy }, { session })

      await session.commitTransaction()

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
      await session.abortTransaction()
      res.status(500).json({
        success: false,
        message: "Error updating package location",
        error: error.message,
      })
    } finally {
      session.endSession()
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
