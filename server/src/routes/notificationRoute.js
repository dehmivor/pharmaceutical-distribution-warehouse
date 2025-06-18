const express = require('express');
const notificationController = require('../controllers/notificationController');
const router = express.Router();

// GET /api/notifications - Lấy tất cả notifications
router.get('/', notificationController.getAllNotifications);

// GET /api/notifications/recipient/:recipientId - Lấy notifications theo recipient
// Hỗ trợ query params: ?type=code&priority=high&status=unread
router.get('/recipient/:recipientId', notificationController.getNotificationsByRecipient);

// GET /api/notifications/recipient/:recipientId/unread-count - Đếm số notification chưa đọc
router.get('/recipient/:recipientId/unread-count', notificationController.getUnreadCount);

// POST /api/notifications - Tạo notification mới
router.post('/', notificationController.createNotification);

// PUT /api/notifications/:id/read - Đánh dấu notification đã đọc
router.put('/:id/read', notificationController.markAsRead);

// PUT /api/notifications/recipient/:recipientId/mark-all-read - Đánh dấu tất cả đã đọc
router.put('/recipient/:recipientId/mark-all-read', notificationController.markAllAsRead);

// DELETE /api/notifications/:id - Xóa một notification cụ thể
router.delete('/:id', notificationController.deleteNotification);

// DELETE /api/notifications/recipient/:recipientId/clear-all - Xóa tất cả notifications
router.delete('/recipient/:recipientId/clear-all', notificationController.clearAllNotifications);

module.exports = router;
