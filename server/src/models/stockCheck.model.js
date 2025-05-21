const mongoose = require('mongoose');
const stockCheckSchema = new mongoose.Schema({
  created_by: mongoose.Schema.Types.ObjectId,
  location_id: String,
  check_type: String,
  status: String,
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('StockCheck', stockCheckSchema);
