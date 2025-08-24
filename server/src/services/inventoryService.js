const InventoryCheckInspection = require('../models/InventoryCheckInspection');
const InventoryCheckOrder = require('../models/InventoryCheckOrder');
const mongoose = require('mongoose');
const LogLocationChange = require('../models/LogLocationChange');
const notificationService = require('./notificationService');
const { io } = require('../server');
const { INVENTORY_CHECK_INSPECTION_STATUSES } = require('../utils/constants');

const getInspectionsFromCheckOrder = async (checkOrderId, page, limit) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(checkOrderId)) {
      throw new Error('Invalid checkOrderId');
    }

    const skip = (page - 1) * limit;

    // Lấy tổng số bản ghi
    const totalCount = await InventoryCheckInspection.countDocuments({
      inventory_check_order_id: checkOrderId,
    });

    // Lấy dữ liệu phân trang, populate các trường liên quan
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
        path: 'check_list.package_id',
        populate: {
          path: 'batch_id',
          populate: {
            path: 'medicine_id',
            select: 'medicine_name license_code',
          },
        },
      })
      .skip(skip)
      .limit(limit)
      .exec();

    return { inspections, totalCount };
  } catch (error) {
    console.error('Error fetching inspections in service:', error);
    throw error;
  }
};

const createCheckInspection = async (inspectionData) => {
  try {
    // Kiểm tra trạng thái đơn kiểm kê
    const checkOrder = await InventoryCheckOrder.findById(inspectionData.inventory_check_order_id);
    if (checkOrder.status === 'cancelled') {
      throw new Error('Không thể tạo phiếu kiểm con cho đơn kiểm kê đã bị hủy');
    }
    const newInspection = new InventoryCheckInspection(inspectionData);
    await newInspection.save();
    return newInspection;
  } catch (error) {
    console.error('Lỗi khi tạo phiếu kiểm con trong service:', error);
    throw error;
  }
};
const deleteCheckInspection = async (inspectionId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(inspectionId)) {
      throw new Error('ID phiếu kiểm con không hợp lệ');
    }
    const inspection = await InventoryCheckInspection.findById(inspectionId);
    if (!inspection) {
      throw new Error('Không tìm thấy phiếu kiểm con');
    }
    // Kiểm tra trạng thái đơn kiểm kê
    const checkOrder = await InventoryCheckOrder.findById(inspection.inventory_check_order_id);
    if (checkOrder.status === 'cancelled') {
      throw new Error('Không thể xóa phiếu kiểm con cho đơn kiểm kê đã bị hủy');
    }
    const deletedInspection = await InventoryCheckInspection.findByIdAndDelete(inspectionId);
    return deletedInspection;
  } catch (error) {
    console.error('Lỗi khi xóa phiếu kiểm con trong service:', error);
    throw error;
  }
};

const getCheckOrderById = async (checkOrderId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(checkOrderId)) {
      throw new Error('Invalid check order ID');
    }

    const checkorderData = await InventoryCheckOrder.findById(checkOrderId)
      .populate('warehouse_manager_id')
      .populate({
        path: 'created_by',
        select: 'username email',
      });

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

const updateCheckOrderStatus = async (checkOrderId, status, io) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(checkOrderId)) {
      throw new Error('Invalid check order ID');
    }

    const existingOrder = await InventoryCheckOrder.findById(checkOrderId);
    if (!existingOrder) {
      throw new Error('Check order not found');
    }

    const oldStatus = existingOrder.status;
    existingOrder.status = status;
    const updatedCheckOrder = await existingOrder.save();

    if (oldStatus !== 'processing' && status.toLowerCase() === 'processing') {
      const newNotification = await notificationService.createNotification({
        recipient_id: null,
        sender_id: null,
        title: 'Kho đang thực hiện kiểm kê toàn kho',
        message: `Đơn kiểm kê #${checkOrderId.slice(20)} đã bắt đầu lúc ${new Date().toLocaleString()}`,
        type: 'system_alert',
        priority: 'high',
        status: 'unread',
        metadata: {
          checkOrderId: checkOrderId,
          statusChangedTo: 'processing',
        },
      });

      if (newNotification && io) {
        console.log('Emitting newNotification to system room');
        io.to('system').emit('newNotification', newNotification);
      } else {
        console.log('Cannot emit: io =', io);
      }
    }
    return updatedCheckOrder;
  } catch (error) {
    console.error('Error updating check order status:', error);
    throw error;
  }
};

const clearInspections = async (checkOrderId) => {
  try {
    // Kiểm tra trạng thái đơn kiểm kê
    const checkOrder = await InventoryCheckOrder.findById(checkOrderId);
    if (checkOrder.status === 'cancelled') {
      throw new Error('Không thể xóa dữ liệu phiếu kiểm con cho đơn kiểm kê đã bị hủy');
    }
    const updatedInspections = await InventoryCheckInspection.updateMany(
      { inventory_check_order_id: checkOrderId },
      {
        $set: {
          'check_list.$[].actual_quantity': 0,
          status: INVENTORY_CHECK_INSPECTION_STATUSES.DRAFT,
        },
      },
    );
    return updatedInspections.nModified > 0 ? updatedInspections : null;
  } catch (error) {
    console.error('Lỗi khi xóa dữ liệu phiếu kiểm con:', error);
    throw error;
  }
};

const getProcessingCheckOrdersExcept = async (excludeId) => {
  return await InventoryCheckOrder.find({
    _id: { $ne: excludeId },
    status: { $regex: /^processing$/i },
  });
};
module.exports = {
  getInspectionsFromCheckOrder,
  createCheckInspection,
  deleteCheckInspection,
  getCheckOrderById,
  updateCheckOrderStatus,
  clearInspections,
  getProcessingCheckOrdersExcept,
};
