const inventoryService = require('../services/inventoryService');
const inventoryCheckInspectionService = require('../services/inventoryCheckInspectionService');
const mongoose = require('mongoose');
const Location = require('../models/Location');
const Package = require('../models/Package');
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

    const allLocations = await Location.find({}).populate('area_id', 'name');
    if (!allLocations || allLocations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có location nào trong kho',
      });
    }

    const createdInspections = await Promise.all(
      allLocations.map(async (location) => {
        // Lấy packages trong vị trí, populate batch và medicine
        const packages = await Package.find({ location_id: location._id }).populate({
          path: 'batch_id',
          populate: {
            path: 'medicine_id',
            select: 'medicine_name license_code',
          },
        });

        // Nếu không có package ở location => check_list rỗng
        if (!packages || packages.length === 0) {
          return inventoryService.createCheckInspection({
            inventory_check_order_id: checkOrderId,
            status: INVENTORY_CHECK_INSPECTION_STATUSES.DRAFT,
            location_id: location._id,
            check_list: [],
            notes: '',
          });
        }

        // Tạo check_list dựa trên packages, mỗi package tạo 1 item check
        // Vì theo model mới, check_list là array các package_id kèm expected và actual quantity
        const check_list = packages.map((pkg) => ({
          package_id: pkg._id,
          expected_quantity: pkg.quantity,
          actual_quantity: 0, // khởi tạo mặc định = 0
          type: 'valid', // mặc định 'valid', có thể logic khác để đánh dấu under/over nếu cần
        }));

        return inventoryService.createCheckInspection({
          inventory_check_order_id: checkOrderId,
          status: INVENTORY_CHECK_INSPECTION_STATUSES.DRAFT,
          location_id: location._id,
          check_list,
          notes: '',
        });
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

const removeCheckResult = async (req, res) => {};

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

    if (status?.toLowerCase() === 'processing') {
      const otherProcessingOrders =
        await inventoryService.getProcessingCheckOrdersExcept(checkOrderId);

      if (Array.isArray(otherProcessingOrders) && otherProcessingOrders.length > 0) {
        return res.json({
          success: true,
          updated: false,
          message: 'Đang có 1 đợt kiểm kê khác!',
        });
      }
    }

    let updatedCheckOrder;
    if (status === INVENTORY_CHECK_ORDER_STATUSES.COMPLETED) {
      // If completing the order, apply inspection results first
      await inventoryCheckInspectionService.applyInspectionResults(checkOrderId);
      updatedCheckOrder = await inventoryService.updateCheckOrderStatus(checkOrderId, status);
    } else {
      // For other status updates (e.g., cancelled), just update the order status
      updatedCheckOrder = await inventoryService.updateCheckOrderStatus(checkOrderId, status);
    }

    if (!updatedCheckOrder) {
      return res.status(404).json({
        success: false,
        message: 'Check Order not found',
      });
    }

    return res.json({
      success: true,
      updated: true,
      data: updatedCheckOrder,
      message: 'Cập nhật trạng thái thành công',
    });
  } catch (error) {
    console.error('Error updating check order status:', error);

    return res.status(500).json({
      success: false,
      message: 'Lỗi xảy ra khi cập nhật trạng thái đơn kiểm kê',
      error: error.message ?? 'Unknown error',
    });
  }
};

const clearInspections = async (req, res) => {
  try {
    const checkOrderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(checkOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid check order ID',
      });
    }

    const updatedInspections = await inventoryService.clearInspections(checkOrderId);
    if (!updatedInspections) {
      return res.status(404).json({
        success: false,
        message: 'No inspections found to clear',
      });
    }

    return res.json({
      success: true,
      message: 'Inspections cleared and reset to draft',
    });
  } catch (error) {
    console.error('Error clearing inspections:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while clearing inspections',
    });
  }
};
module.exports = {
  getInspectionsFromCheckOrder,
  createCheckInspection,
  deleteCheckInspection,
  getCheckOrderById,
  updateCheckOrderStatus,
  clearInspections,
};
