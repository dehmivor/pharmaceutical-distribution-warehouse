const inventoryService = require('../services/inventoryService');
const mongoose = require('mongoose');

const getInspectionsFromCheckOrder = async (req, res) => {
  try {
    const checkOrderId = req.params.id;

    const inspections = await inventoryService.getInspectionsFromCheckOrder(checkOrderId);

    if (!inspections || inspections.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No inspections found for this order',
      });
    }

    return res.json({
      success: true,
      data: inspections,
    });
  } catch (error) {
    console.error('Error fetching inspections:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching inspections',
    });
  }
};
const createCheckInspection = async (req, res) => {
  try {
    const inspectionData = req.body;
    const newInspection = await inventoryService.createCheckInspection(inspectionData);
    return res.status(201).json({
      success: true,
      data: newInspection,
    });
  } catch (error) {
    console.error('Error creating inspection:', error);

    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating the inspection',
      error: error.message,
      errors: error.errors || null,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
  }
};

const deleteCheckInspection = async (req, res) => {
  try {
    const inspectionId = req.params.id;
    const deletedInspection = await inventoryService.deleteCheckInspection(inspectionId);
    if (!deletedInspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found',
      });
    }
    return res.json({
      success: true,
      message: 'Inspection deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting inspection:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the inspection',
    });
  }
};

const getCheckOrderById = async (req, res) => {
  try {
    const checkOrderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(checkOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inspection ID',
      });
    }

    const inspection = await inventoryService.getCheckOrderById(checkOrderId);
    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Check Order not found',
      });
    }

    return res.json({
      success: true,
      data: inspection,
    });
  } catch (error) {
    console.error('Error fetching inspection by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching the inspection',
    });
  }
};
module.exports = {
  getInspectionsFromCheckOrder,
  createCheckInspection,
  deleteCheckInspection,
  getCheckOrderById,
};
