// services/notificationService.js
const { Notification } = require('../models');
const { User } = require('../models');
const { USER_ROLES } = require('../utils/constants');

/**
 * Tạo notification mới, lưu DB và phát realtime cho user nhận
 * @param {Object} data - Dữ liệu notification
 * @param {Object} io - Socket.IO instance (optional)
 * @returns Notification vừa tạo
 */
const createNotification = async (data, io = null) => {
  const newNoti = await Notification.create(data);

  // Emit realtime notification nếu có io
  if (io && newNoti.recipient_id) {
    io.to(newNoti.recipient_id.toString()).emit('newNotification', newNoti);
  }

  return newNoti;
};

/**
 * Xóa notification theo id, emit sự kiện realtime để frontend cập nhật
 * @param {String} notificationId
 * @param {Object} io - Socket.IO instance (optional)
 */
const deleteNotification = async (notificationId, io = null) => {
  const deleted = await Notification.findByIdAndDelete(notificationId);

  if (deleted && deleted.recipient_id && io) {
    io.to(deleted.recipient_id.toString()).emit('deletedNotificationId', notificationId);
  }

  return deleted;
};

/**
 * Lấy danh sách notification theo user (có thể lọc, phân trang)
 * @param {Object} query - query params: recipient_id, status, type, limit, skip etc...
 */
const getNotifications = async (query = {}) => {
  const { recipient_id, status, type, limit = 20, skip = 0, include_system } = query;
  let filter = {};

  // Xử lý logic chính
  if (include_system === 'true' && recipient_id) {
    // Trường hợp 1: Lấy cả user + system notifications
    filter = {
      $or: [
        { recipient_id: recipient_id }, // User notifications
        { recipient_id: null }, // TẤT CẢ system notifications (không chỉ system_alert)
      ],
    };
  } else if (recipient_id) {
    // Trường hợp 2: Chỉ lấy user notifications
    filter.recipient_id = recipient_id;
  } else if (include_system === 'true') {
    // Trường hợp 3: Lấy TẤT CẢ system notifications (không chỉ system_alert)
    filter = { recipient_id: null };
  }

  // Thêm các filter bổ sung
  if (status) filter.status = status;
  if (type) filter.type = type;

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(parseInt(skip))
    .limit(parseInt(limit))
    .lean();

  return notifications;
};
/**
 * Đánh dấu notification đã đọc
 * @param {String} notificationId
 */
const markAsRead = async (notificationId) => {
  const updated = await Notification.findByIdAndUpdate(
    notificationId,
    { status: 'read' },
    { new: true },
  );
  // Có thể emit sự kiện nếu muốn realtime badge update
  return updated;
};

/**
 * Đánh dấu tất cả notification của user là đã đọc
 * @param {String} recipientId
 */
const markAllAsRead = async (recipientId) => {
  await Notification.updateMany(
    { recipient_id: recipientId, status: 'unread' },
    { status: 'read' },
  );
};

/**
 * Tạo notification cho tất cả warehouse managers
 * @param {Object} data - Dữ liệu notification
 * @param {Object} io - Socket.IO instance (optional)
 * @returns Array of notifications created
 */
const createNotificationForAllWarehouseManagers = async (data, io = null) => {
  try {
    // Tìm tất cả warehouse managers
    const warehouseManagers = await User.find({
      role: USER_ROLES.WAREHOUSEMANAGER,
      status: 'active',
    }).select('_id');

    if (warehouseManagers.length === 0) {
      console.log('Không có warehouse managers nào');
      return [];
    }

    const notifications = [];

    // Tạo notification cho từng warehouse manager
    for (const manager of warehouseManagers) {
      const notificationData = {
        ...data,
        recipient_id: manager._id,
        sender_id: data.sender_id || null,
      };

      const newNoti = await Notification.create(notificationData);
      notifications.push(newNoti);

      // Emit realtime notification
      if (io) {
        io.to(manager._id.toString()).emit('newNotification', newNoti);
      }
    }

    console.log(`Đã tạo ${notifications.length} thông báo cho warehouse managers`);
    return notifications;
  } catch (error) {
    console.error('Lỗi khi tạo thông báo cho warehouse managers:', error);
    throw error;
  }
};

const createNotificationForAllWarehouse = async (data, io = null) => {
  try {
    // Tìm tất cả warehouse managers
    const warehouseManagers = await User.find({
      role: USER_ROLES.WAREHOUSE,
      status: 'active',
    }).select('_id');

    if (warehouseManagers.length === 0) {
      console.log('Không có warehouse nào');
      return [];
    }

    const notifications = [];

    // Tạo notification cho từng warehouse manager
    for (const manager of warehouseManagers) {
      const notificationData = {
        ...data,
        recipient_id: manager._id,
        sender_id: data.sender_id || null,
      };

      const newNoti = await Notification.create(notificationData);
      notifications.push(newNoti);

      // Emit realtime notification
      if (io) {
        io.to(manager._id.toString()).emit('newNotification', newNoti);
      }
    }

    console.log(`Đã tạo ${notifications.length} thông báo cho warehouse`);
    return notifications;
  } catch (error) {
    console.error('Lỗi khi tạo thông báo cho warehouse:', error);
    throw error;
  }
};

const createNotificationForAllSupervisors = async (data, io = null) => {
  try {
    // Tìm tất cả supervisors
    const supervisors = await User.find({
      role: USER_ROLES.SUPERVISOR,
      status: 'active',
    }).select('_id');

    if (supervisors.length === 0) {
      console.log('Không có supervisors nào');
      return [];
    }

    const notifications = [];

    // Tạo notification cho từng supervisor
    for (const supervisor of supervisors) {
      const notificationData = {
        ...data,
        recipient_id: supervisor._id,
        sender_id: data.sender_id || null,
      };

      const newNoti = await Notification.create(notificationData);
      notifications.push(newNoti);

      // Emit realtime notification
      if (io) {
        io.to(supervisor._id.toString()).emit('newNotification', newNoti);
      }
    }

    console.log(`Đã tạo ${notifications.length} thông báo cho supervisors`);
    return notifications;
  } catch (error) {
    console.error('Lỗi khi tạo thông báo cho supervisors:', error);
    throw error;
  }
};
const createNotificationForAllRepresentativeManager = async (data, io = null) => {
  try {
    // Tìm tất cả supervisors
    const supervisors = await User.find({
      role: USER_ROLES.REPRESENTATIVEMANAGER,
      status: 'active',
    }).select('_id');

    if (supervisors.length === 0) {
      console.log('Không có REPRESENTATIVE_MANAGER nào');
      return [];
    }

    const notifications = [];

    // Tạo notification cho từng supervisor
    for (const supervisor of supervisors) {
      const notificationData = {
        ...data,
        recipient_id: supervisor._id,
        sender_id: data.sender_id || null,
      };

      const newNoti = await Notification.create(notificationData);
      notifications.push(newNoti);

      // Emit realtime notification
      if (io) {
        io.to(supervisor._id.toString()).emit('newNotification', newNoti);
      }
    }

    console.log(`Đã tạo ${notifications.length} thông báo cho RP`);
    return notifications;
  } catch (error) {
    console.error('Lỗi khi tạo thông báo cho supervisors:', error);
    throw error;
  }
};
const createNotificationForAllRepresentative = async (data, io = null) => {
  try {
    // Tìm tất cả supervisors
    const supervisors = await User.find({
      role: USER_ROLES.REPRESENTATIVE,
      status: 'active',
    }).select('_id');

    if (supervisors.length === 0) {
      console.log('Không có REPRESENTATIVE nào');
      return [];
    }

    const notifications = [];

    // Tạo notification cho từng supervisor
    for (const supervisor of supervisors) {
      const notificationData = {
        ...data,
        recipient_id: supervisor._id,
        sender_id: data.sender_id || null,
      };

      const newNoti = await Notification.create(notificationData);
      notifications.push(newNoti);

      // Emit realtime notification
      if (io) {
        io.to(supervisor._id.toString()).emit('newNotification', newNoti);
      }
    }

    console.log(`Đã tạo ${notifications.length} thông báo cho RP`);
    return notifications;
  } catch (error) {
    console.error('Lỗi khi tạo thông báo cho supervisors:', error);
    throw error;
  }
};
module.exports = {
  createNotification,
  deleteNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotificationForAllWarehouseManagers,
  createNotificationForAllWarehouse,
  createNotificationForAllSupervisors,
  createNotificationForAllRepresentativeManager,
  createNotificationForAllRepresentative,
};
