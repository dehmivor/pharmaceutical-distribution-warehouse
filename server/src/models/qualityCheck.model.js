const mongoose = require('mongoose');
const qualityCheckSchema = new mongoose.Schema({
  receipt_id: mongoose.Schema.Types.ObjectId,
  checked_by: mongoose.Schema.Types.ObjectId,
  result: String,
  notes: String,
  checked_date: Date,
});

module.exports = mongoose.model('QualityCheck', qualityCheckSchema);
