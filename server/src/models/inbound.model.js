const mongoose = require('mongoose');
const inboundSchema = new mongoose.Schema({
  quality_check_id: mongoose.Schema.Types.ObjectId,
  stored_by: mongoose.Schema.Types.ObjectId,
  stored_date: Date,
  location_id: String,
  drug_id: mongoose.Schema.Types.ObjectId,
  batch_id: mongoose.Schema.Types.ObjectId,
  quantity: Number,
});

module.exports = mongoose.model('Inbound', inboundSchema);
