const mongoose = require('mongoose');
const parameterSchema = new mongoose.Schema({
  key: String,
  value: Number,
  type: Number,
  description: String,
  group: String,
  isEditable: Boolean,
  created_at: { type: Date, default: Date.now },
  updated_at: Date,
});

module.exports = mongoose.model('Parameter', parameterSchema);
