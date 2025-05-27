const mongoose = require('mongoose');
const drugSchema = new mongoose.Schema({
  code: String,
  name: String,
  ingredient: String,
  unit: String,
  manufacturer: String,
  category: String,
  price_import: Number,
  price_sell: Number,
  prescription_required: Boolean,
  quantity: Number,
  location: String,
  locationVerified: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: Date,
});

module.exports = mongoose.model('Drug', drugSchema);
