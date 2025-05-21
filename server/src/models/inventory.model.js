const mongoose = require('mongoose');
const inventorySchema = new mongoose.Schema({
  drug_id: mongoose.Schema.Types.ObjectId,
  batch_id: mongoose.Schema.Types.ObjectId,
  warehouse_location_id: String,
  quantity: Number,
  expiry_date: Date,
  last_updated: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Inventory', inventorySchema);
