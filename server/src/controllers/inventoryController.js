const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const Location = require('../models/Location');
const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');

async function updateInventoryLocation({ batchId, medicineId, newLocationId, quantity, updatedBy }) {
  try {
    // Basic ID validation
    if (!mongoose.Types.ObjectId.isValid(batchId) || 
        !mongoose.Types.ObjectId.isValid(medicineId) || 
        !mongoose.Types.ObjectId.isValid(newLocationId) || 
        !mongoose.Types.ObjectId.isValid(updatedBy)) {
      throw new Error('Invalid ID format');
    }

    // Basic quantity validation
    if (!Number.isInteger(Number(quantity)) || quantity < 0) {
      throw new Error('Quantity must be a non-negative integer');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if batch exists
      const batch = await Batch.findById(batchId).session(session);
      if (!batch) throw new Error('Batch not found');

      // Check if medicine exists
      const medicine = await Medicine.findById(medicineId).session(session);
      if (!medicine) throw new Error('Medicine not found');

      // Check if new location exists and populate area
      const newLocation = await Location.findById(newLocationId).session(session).populate('area_id');
      if (!newLocation) throw new Error('Location not found');

      // Verify location availability
      if (!newLocation.available) throw new Error('Location is not available');

      // Compare storage conditions
      const medicineStorageConditions = medicine.storage_conditions;
      const areaStorageConditions = newLocation.area_id.storage_conditions;

      for (const [key, value] of Object.entries(medicineStorageConditions)) {
        if (areaStorageConditions.get(key) !== value) {
          throw new Error(`Storage condition mismatch for ${key}: required ${value}, found ${areaStorageConditions.get(key)}`);
        }
      }

      // Find or create inventory record
      let inventory = await Inventory.findOne({
        medicine_id: medicineId,
        batch_id: batchId,
        location_id: newLocationId
      }).session(session);

      if (inventory) {
        inventory.quantity = quantity;
        inventory.updated_at = new Date();
      } else {
        inventory = new Inventory({
          medicine_id: medicineId,
          batch_id: batchId,
          location_id: newLocationId,
          quantity: quantity
        });
      }

      // Update location availability
      newLocation.available = quantity === 0;
      newLocation.updated_by = updatedBy;
      newLocation.updated_at = new Date();

      // Save changes
      await inventory.save({ session });
      await newLocation.save({ session });

      // Commit transaction
      await session.commitTransaction();
      return {
        success: true,
        message: 'Inventory location updated successfully',
        inventory,
        location: newLocation
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    throw new Error(`Failed to update inventory location: ${error.message}`);
  }
}

module.exports = { updateInventoryLocation };