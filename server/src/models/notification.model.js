const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  drugName: {
    type: String,
    required: true,
  },
  lotNumber: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  notifiedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Pending', 'Processed'],
    default: 'Pending',
  },
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
