const NotificationService = require('../services/notificationService');

const notificationController = {
  // Lấy tất cả notifications với pagination và filter
  async getAllNotifications(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        type,
        priority,
        recipient_id,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        type,
        priority,
        recipient_id,
        sortBy,
        sortOrder,
      };

      const result = await NotificationService.getAllNotifications(options);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting notifications',
        error: error.message,
      });
    }
  },

  // Lấy notification theo ID
  async getNotificationById(req, res) {
    try {
      const { id } = req.params;
      const notification = await NotificationService.getNotificationById(id);

      res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('Invalid')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error getting notification',
        error: error.message,
      });
    }
  },

  // Lấy notifications theo recipient
  async getNotificationsByRecipient(req, res) {
    try {
      const { recipientId } = req.params;
      const {
        page = 1,
        limit = 10,
        status,
        type,
        priority,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        type,
        priority,
        sortBy,
        sortOrder,
      };

      const result = await NotificationService.getNotificationsByRecipient(recipientId, options);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error getting notifications for recipient',
        error: error.message,
      });
    }
  },

  // Tạo notification mới
  async createNotification(req, res) {
    try {
      const notificationData = req.body;
      const notification = await NotificationService.createNotification(notificationData);

      res.status(201).json({
        success: true,
        data: notification,
        message: 'Notification created successfully',
      });
    } catch (error) {
      if (error.message.includes('required') || error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error creating notification',
        error: error.message,
      });
    }
  },

  // Đánh dấu đã đọc
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const notification = await NotificationService.markAsRead(id);

      res.status(200).json({
        success: true,
        data: notification,
        message: 'Notification marked as read',
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('Invalid')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error marking notification as read',
        error: error.message,
      });
    }
  },

  // Đánh dấu tất cả đã đọc
  async markAllAsRead(req, res) {
    try {
      const { recipientId } = req.params;
      const result = await NotificationService.markAllAsRead(recipientId);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error marking all notifications as read',
        error: error.message,
      });
    }
  },

  // Xóa tất cả notifications
  async clearAllNotifications(req, res) {
    try {
      const { recipientId } = req.params;
      const result = await NotificationService.clearAllNotifications(recipientId);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error clearing notifications',
        error: error.message,
      });
    }
  },

  // Lấy số lượng chưa đọc
  async getUnreadCount(req, res) {
    try {
      const { recipientId } = req.params;
      const result = await NotificationService.getUnreadCount(recipientId);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error getting unread count',
        error: error.message,
      });
    }
  },

  // Xóa notification
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id; // Assuming user info from auth middleware

      const result = await NotificationService.deleteNotification(id, userId);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('Invalid')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('permission')) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error deleting notification',
        error: error.message,
      });
    }
  },

  // Lấy notifications theo type
  async getNotificationsByType(req, res) {
    try {
      const { recipientId, type } = req.params;
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
      };

      const result = await NotificationService.getNotificationsByType(recipientId, type, options);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error getting notifications by type',
        error: error.message,
      });
    }
  },

  // Lấy notifications theo priority
  async getNotificationsByPriority(req, res) {
    try {
      const { recipientId, priority } = req.params;
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
      };

      const result = await NotificationService.getNotificationsByPriority(
        recipientId,
        priority,
        options,
      );

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error getting notifications by priority',
        error: error.message,
      });
    }
  },

  // Tìm kiếm notifications
  async searchNotifications(req, res) {
    try {
      const { keyword } = req.query;
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      if (!keyword) {
        return res.status(400).json({
          success: false,
          message: 'Keyword is required for search',
        });
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
      };

      const result = await NotificationService.searchNotifications(keyword, options);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error searching notifications',
        error: error.message,
      });
    }
  },

  // Lấy thống kê
  async getStatistics(req, res) {
    try {
      const { recipientId } = req.query;
      const result = await NotificationService.getStatistics(recipientId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting statistics',
        error: error.message,
      });
    }
  },
};

module.exports = notificationController;
