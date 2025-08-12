// services/notificationService.js
const { Notification } = require('../models');
const { io } = require('../server'); // import instance io socket từ server.js

/**
 * Tạo notification mới, lưu DB và phát realtime cho user nhận
 * @param {Object} data - Dữ liệu notification
 * @returns Notification vừa tạo
 */
const createNotification = async (data) => {
  const newNoti = await Notification.create(data);

  if (io && newNoti.recipient_id) {
    io.to(newNoti.recipient_id.toString()).emit('newNotification', newNoti);
  }

  return newNoti;
};

/**
 * Xóa notification theo id, emit sự kiện realtime để frontend cập nhật
 * @param {String} notificationId
 */
const deleteNotification = async (notificationId) => {
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
  const { recipient_id, status, type, limit = 20, skip = 0 } = query;
  const filter = {};

  if (recipient_id) filter.recipient_id = recipient_id;
  if (status) filter.status = status; // ví dụ unread, read
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

module.exports = {
  createNotification,
  deleteNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
};
