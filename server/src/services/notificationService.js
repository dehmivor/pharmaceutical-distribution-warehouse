// services/notificationService.js
const { Notification } = require('../models');
const mongoose = require('mongoose');

// Lấy tất cả notifications với pagination và filter
const getAllNotifications = async (options = {}) => {
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
    } = options;

    // Xây dựng filter
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (type) {
      filter.type = type;
    }
    if (priority) {
      filter.priority = priority;
    }
    if (recipient_id) {
      filter.recipient_id = recipient_id;
    }

    // Tính toán pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Thực hiện query với populate
    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate('sender_id', 'name email avatar_url')
        .populate('recipient_id', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments(filter),
    ]);

    // Tính toán thống kê
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage,
      },
    };
  } catch (error) {
    throw new Error(`Error fetching notifications: ${error.message}`);
  }
};

// Lấy notifications theo recipient ID
const getNotificationsByRecipient = async (recipientId, options = {}) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      throw new Error('Invalid recipient ID');
    }

    const {
      page = 1,
      limit = 10,
      status,
      type,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // Xây dựng filter
    const filter = { recipient_id: recipientId };
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (type) {
      filter.type = type;
    }
    if (priority) {
      filter.priority = priority;
    }

    // Tính toán pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate('sender_id', 'name email avatar_url')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    throw new Error(`Error fetching notifications by recipient: ${error.message}`);
  }
};

// Lấy notification theo ID
const getNotificationById = async (id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid notification ID');
    }

    const notification = await Notification.findById(id)
      .populate('sender_id', 'name email avatar_url')
      .populate('recipient_id', 'name email')
      .lean();

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  } catch (error) {
    throw new Error(`Error fetching notification: ${error.message}`);
  }
};

// Tạo notification mới
const createNotification = async (notificationData) => {
  try {
    const { recipient_id, sender_id, title, message, type, priority } = notificationData;

    // Validate required fields
    if (!recipient_id || !title || !message) {
      throw new Error('Recipient ID, title, and message are required');
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(recipient_id)) {
      throw new Error('Invalid recipient ID');
    }
    if (sender_id && !mongoose.Types.ObjectId.isValid(sender_id)) {
      throw new Error('Invalid sender ID');
    }

    const notification = new Notification({
      ...notificationData,
      status: 'unread',
    });

    await notification.save();

    // Populate và return
    return await getNotificationById(notification._id);
  } catch (error) {
    throw new Error(`Error creating notification: ${error.message}`);
  }
};

// Đánh dấu đã đọc
const markAsRead = async (notificationId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new Error('Invalid notification ID');
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { status: 'read' },
      { new: true, runValidators: true },
    );

    return await getNotificationById(updatedNotification._id);
  } catch (error) {
    throw new Error(`Error marking notification as read: ${error.message}`);
  }
};

// Đánh dấu tất cả đã đọc
const markAllAsRead = async (recipientId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      throw new Error('Invalid recipient ID');
    }

    const result = await Notification.updateMany(
      { recipient_id: recipientId, status: 'unread' },
      { status: 'read' },
    );

    return {
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    };
  } catch (error) {
    throw new Error(`Error marking all notifications as read: ${error.message}`);
  }
};

// Xóa tất cả notifications
const clearAllNotifications = async (recipientId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      throw new Error('Invalid recipient ID');
    }

    const result = await Notification.deleteMany({ recipient_id: recipientId });

    return {
      message: 'All notifications cleared successfully',
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    throw new Error(`Error clearing notifications: ${error.message}`);
  }
};

// Lấy số lượng chưa đọc
const getUnreadCount = async (recipientId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      throw new Error('Invalid recipient ID');
    }

    const count = await Notification.countDocuments({
      recipient_id: recipientId,
      status: 'unread',
    });

    return { unreadCount: count };
  } catch (error) {
    throw new Error(`Error getting unread count: ${error.message}`);
  }
};

// Xóa notification
const deleteNotification = async (notificationId, userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new Error('Invalid notification ID');
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    // Kiểm tra quyền xóa (chỉ recipient mới được xóa)
    if (notification.recipient_id.toString() !== userId.toString()) {
      throw new Error('You do not have permission to delete this notification');
    }

    await Notification.findByIdAndDelete(notificationId);
    return { message: 'Notification deleted successfully' };
  } catch (error) {
    throw new Error(`Error deleting notification: ${error.message}`);
  }
};

// Lấy notifications theo type
const getNotificationsByType = async (recipientId, type, options = {}) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      throw new Error('Invalid recipient ID');
    }

    return await getNotificationsByRecipient(recipientId, { ...options, type });
  } catch (error) {
    throw new Error(`Error fetching notifications by type: ${error.message}`);
  }
};

// Lấy notifications theo priority
const getNotificationsByPriority = async (recipientId, priority, options = {}) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      throw new Error('Invalid recipient ID');
    }

    return await getNotificationsByRecipient(recipientId, { ...options, priority });
  } catch (error) {
    throw new Error(`Error fetching notifications by priority: ${error.message}`);
  }
};

// Tìm kiếm notifications
const searchNotifications = async (keyword, options = {}) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Tạo regex pattern cho tìm kiếm
    const searchRegex = new RegExp(keyword, 'i');

    // Tìm kiếm trong nhiều trường
    const filter = {
      $or: [{ title: searchRegex }, { message: searchRegex }, { type: searchRegex }],
    };

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate('sender_id', 'name email avatar_url')
        .populate('recipient_id', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    throw new Error(`Error searching notifications: ${error.message}`);
  }
};

// Lấy thống kê
const getStatistics = async (recipientId = null) => {
  try {
    const filter = recipientId ? { recipient_id: recipientId } : {};

    const stats = await Notification.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const typeStats = await Notification.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Notification.countDocuments(filter);

    const result = {
      total,
      byStatus: {
        read: 0,
        unread: 0,
      },
      byType: {},
    };

    // Fill status counts
    stats.forEach((stat) => {
      result.byStatus[stat._id] = stat.count;
    });

    // Fill type counts
    typeStats.forEach((stat) => {
      result.byType[stat._id] = stat.count;
    });

    return result;
  } catch (error) {
    throw new Error(`Error getting statistics: ${error.message}`);
  }
};

module.exports = {
  getAllNotifications,
  getNotificationsByRecipient,
  getNotificationById,
  createNotification,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  getUnreadCount,
  deleteNotification,
  getNotificationsByType,
  getNotificationsByPriority,
  searchNotifications,
  getStatistics,
};
