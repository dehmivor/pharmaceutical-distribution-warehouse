const InventoryCheckInspection = require('../models/InventoryCheckInspection');
const mongoose = require('mongoose');
const getInspectionsFromCheckOrder = async (checkOrderId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(checkOrderId)) {
      throw new Error('Invalid checkOrderId');
    }

    const inspections = await InventoryCheckInspection.find({
      inventory_check_order_id: checkOrderId,
    })
      .populate('inventory_check_order_id', 'name')
      .populate({
        path: 'location_id',
        select: 'bay row column area_id',
        populate: {
          path: 'area_id',
          select: 'name',
        },
      })
      .populate('check_by', 'username email')
      .populate({
        path: 'check_list.medicine_id',
        select: 'medicine_name license_code',
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
    if (!mongoose.Types.ObjectId.isValid(inspectionId)) {
      throw new Error('Invalid inspectionId');
    }
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
