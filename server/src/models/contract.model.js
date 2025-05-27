const mongoose = require('mongoose');
const contractSchema = new mongoose.Schema({
  supplier_id: mongoose.Schema.Types.ObjectId,
  created_by: mongoose.Schema.Types.ObjectId,
  approved_by: mongoose.Schema.Types.ObjectId,
  contract_type: String,
  effective_date: Date,
  expiry_date: Date,
  min_quantity: Number,
  max_quantity: Number,
  unit_price_range: Number,
  terms: String,
  status: String,
  created_at: { type: Date, default: Date.now },
  updated_at: Date,
});

module.exports = mongoose.model('Contract', contractSchema);
