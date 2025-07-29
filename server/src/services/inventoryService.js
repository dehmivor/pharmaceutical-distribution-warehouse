const InventoryCheckInspection = require('../models/InventoryCheckInspection');
const InventoryCheckOrder = require('../models/InventoryCheckOrder');
const mongoose = require('mongoose');
const LogLocationChange = require('../models/LogLocationChange');
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

const getCheckOrderById = async (checkOrderId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(checkOrderId)) {
      throw new Error('Invalid check order ID');
    }

    const checkorderData = await InventoryCheckOrder.findById(checkOrderId).populate(
      'created_by',
      'username email',
    );

    const loglocation = await LogLocationChange.find({
      inventory_check_order_id: checkOrderId,
    });
    return {
      checkorder: checkorderData,
      loglocation: loglocation,
    };
  } catch (error) {
    console.error('Error fetching check order by ID:', error);
    throw error;
  }
};

module.exports = {
  getInspectionsFromCheckOrder,
  createCheckInspection,
  deleteCheckInspection,
  getCheckOrderById,
};
