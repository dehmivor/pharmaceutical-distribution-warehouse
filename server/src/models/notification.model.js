const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
  message: String,
  target_user_id: mongoose.Schema.Types.ObjectId,
  created_at: { type: Date, default: Date.now },
  updated_at: Date,
});

module.exports = mongoose.model('Notification', notificationSchema);
