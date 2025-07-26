const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema(
  {
    recipient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Có thể là system notification
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Có thể là system notification
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'import_order_status',
        'export_order_status',
        'debt_reminder',
        'public',
        'system_alert',
        'user_activity',
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['unread', 'read'],
      default: 'unread',
    },
    avatar_url: {
      type: String,
      required: false,
    },
    badge_icon: {
      type: String,
      required: false,
    },
    action_url: {
      type: String,
      required: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model('Notification', notificationSchema);
