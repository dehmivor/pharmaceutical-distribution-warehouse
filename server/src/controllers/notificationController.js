// controllers/notificationController.js
const notificationService = require('../services/notificationService');

/**
 * POST /api/notifications
 * Tạo notification mới
 */
const createNotification = async (req, res) => {
  try {
    const { target_warehouse_managers, ...notificationData } = req.body;

    let notification;

    const io = req.app.locals.io;
    // Nếu yêu cầu gửi cho tất cả warehouse managers
    if (target_warehouse_managers === true) {
      notification = await notificationService.createNotificationForAllRepresentative(
        notificationData,
        io,
      );

      if (notification && io) {
        console.log('Emitting newNotification to system room');
        io.to('system').emit('notification', notification);
      } else {
        console.log('Cannot emit: io =', io);
      }
      res.status(201).json({
        success: true,
        message: `Đã tạo ${notification.length} thông báo cho warehouse managers`,
        data: notification,
      });
    } else {
      // Tạo notification bình thường - THÊM io parameter
      notification = await notificationService.createNotification(notificationData, io);

      if (notification && io) {
        console.log('Emitting newNotification to system room');
        io.to('system').emit('newNotification', notification);
      } else {
        console.log('Cannot emit: io =', io);
      }
      res.status(201).json({
        success: true,
        data: notification,
      });
    }
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * DELETE /api/notifications/:id
 * Xóa notification theo id
 */
const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const io = req.app.locals.io;
    const deleted = await notificationService.deleteNotification(notificationId, io);
    if (!deleted) return res.status(404).json({ error: 'Notification not found' });

    res.status(200).json({ message: 'Deleted successfully', id: notificationId });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/notifications
 * Lấy danh sách notification (theo user, trạng thái, lọc)
 * Truyền query params: recipient_id, status, type, limit, skip
 */
const getNotifications = async (req, res) => {
  try {
    const query = req.query;
    const notifications = await notificationService.getNotifications(query);
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Đánh dấu notification là đã đọc
 */
const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const updated = await notificationService.markAsRead(notificationId);
    if (!updated) return res.status(404).json({ error: 'Notification not found' });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * PATCH /api/notifications/mark-all-read
 * Đánh dấu tất cả notification của user là đã đọc
 */
const markAllAsRead = async (req, res) => {
  try {
    const { recipient_id } = req.body;
    if (!recipient_id) return res.status(400).json({ error: 'recipient_id is required' });
    await notificationService.markAllAsRead(recipient_id);
    res.status(200).json({ message: 'Marked all as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createNotification,
  deleteNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
};
