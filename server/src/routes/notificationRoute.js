// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');

// Tạo notification mới
router.post('/', /*authenticate,*/ notificationController.createNotification);

// Xóa notification theo id
router.delete('/:id', /*authenticate,*/ notificationController.deleteNotification);

// Lấy danh sách notification theo query params (vd: ?recipient_id=xxx&status=unread)
router.get('/', /*authenticate,*/ notificationController.getNotifications);

// Đánh dấu notification là đã đọc
router.patch('/:id/read', /*authenticate,*/ notificationController.markAsRead);

// Đánh dấu tất cả notification của user đã đọc
router.patch('/mark-all-read', /*authenticate,*/ notificationController.markAllAsRead);

module.exports = router;
