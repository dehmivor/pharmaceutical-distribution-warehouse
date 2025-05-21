const mongoose = require('mongoose');
const emailLogSchema = new mongoose.Schema({
  to_email: String,
  subject: String,
  body: String,
  status: Number,
  error_message: String,
  sent_at: Date,
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('EmailLog', emailLogSchema);
