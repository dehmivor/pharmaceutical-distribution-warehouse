const InventoryCheckInspection = require('../models/InventoryCheckInspection');

const getInspectionsFromCheckOrder = async (checkOrderId) => {
  try {
    const inspections = await InventoryCheckInspection.find({
      inventory_check_order_id: checkOrderId,
    });
    return inspections;
  } catch (error) {
    console.error('Error fetching inspections in service:', error);
    throw error;
  }
};

const createCheckInspection = async (inspectionData) => {
  try {
    const newInspection = new InventoryCheckInspection(inspectionData);
    await newInspection.save();
    return newInspection;
  } catch (error) {
    console.error('Error creating inspection in service:', error);
    throw error;
  }
};
const deleteCheckInspection = async (inspectionId) => {
  try {
    const deletedInspection = await InventoryCheckInspection.findByIdAndDelete(inspectionId);
    return deletedInspection;
  } catch (error) {
    console.error('Error deleting inspection in service:', error);
    throw error;
  }
};

module.exports = {
  getInspectionsFromCheckOrder,
  createCheckInspection,
  deleteCheckInspection,
};
