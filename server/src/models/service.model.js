const mongoose = require('mongoose');
const serviceSchema = new mongoose.Schema({
  name: String,
  description: String,
  status: Number,
  schedule: String,
  last_run_at: Date,
  next_run_at: Date,
  created_at: { type: Date, default: Date.now },
  updated_at: Date,
});

module.exports = mongoose.model('Service', serviceSchema);
