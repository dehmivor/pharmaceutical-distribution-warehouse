const inventoryService = require('../services/inventoryService');
const mongoose = require('mongoose');
const Location = require('../models/Location');
const { INVENTORY_CHECK_INSPECTION_STATUSES } = require('../utils/constants');
const getInspectionsFromCheckOrder = async (req, res) => {
  try {
    const checkOrderId = req.params.id;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;

    const { inspections, totalCount } = await inventoryService.getInspectionsFromCheckOrder(
      checkOrderId,
      page,
      limit,
    );

    if (!inspections || inspections.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No inspections found for this order',
      });
    }

    return res.json({
      success: true,
      data: inspections,
      totalCount,
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
    const checkOrderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(checkOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid check order ID',
      });
    }

    // Lấy danh sách tất cả location trong kho
    const allLocations = await Location.find({});
    if (!allLocations || allLocations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có location nào trong kho',
      });
    }

    // Tạo mảng promise tạo phiếu, mỗi phiếu có:
    // - inventory_check_order_id = checkOrderId
    // - location_id từ từng location
    // - status mặc định DRAFT
    // - check_list rỗng mảng []
    // - notes rỗng chuỗi ''
    // - check_by null hoặc để undefined (có thể bỏ hoặc set nếu bạn có người check mặc định)
    const createdInspections = await Promise.all(
      allLocations.map((location) => {
        const newInspectionData = {
          inventory_check_order_id: checkOrderId,
          status: INVENTORY_CHECK_INSPECTION_STATUSES.DRAFT, // trạng thái mặc định DRAFT
          location_id: location._id,
          check_list: [],
          notes: '',
          // Không set check_by vì không có người check mặc định, hoặc set null
          // check_by: null,
        };
        return inventoryService.createCheckInspection(newInspectionData);
      }),
    );

    return res.status(201).json({
      success: true,
      message: `${createdInspections.length} phiếu kiểm đã được tạo cho tất cả location với trạng thái DRAFT`,
      data: createdInspections,
    });
  } catch (error) {
    console.error('Error creating inspections:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo phiếu kiểm',
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
        message: 'Invalid check order ID',
      });
    }

    const checkorder = await inventoryService.getCheckOrderById(checkOrderId);
    if (!checkorder) {
      return res.status(404).json({
        success: false,
        message: 'Check Order not found',
      });
    }

    return res.json({
      success: true,
      data: checkorder,
    });
  } catch (error) {
    console.error('Error fetching check order by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching the check order data',
    });
  }
};

const updateCheckOrderStatus = async (req, res) => {
  try {
    const checkOrderId = req.params.id;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(checkOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid check order ID',
      });
    }

    const updatedCheckOrder = await inventoryService.updateCheckOrderStatus(checkOrderId, status);
    if (!updatedCheckOrder) {
      return res.status(404).json({
        success: false,
        message: 'Check Order not found',
      });
    }

    return res.json({
      success: true,
      data: updatedCheckOrder,
    });
  } catch (error) {
    console.error('Error updating check order status:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating the check order status',
    });
  }
};
module.exports = {
  getInspectionsFromCheckOrder,
  createCheckInspection,
  deleteCheckInspection,
  getCheckOrderById,
  updateCheckOrderStatus,
};
