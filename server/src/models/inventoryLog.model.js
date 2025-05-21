const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  drug_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    required: true,
  },
  drug_code: {
    type: String,
    required: true,
  },
  drug_name: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    enum: ['import', 'export', 'adjustment'],
    required: true,
  },
  quantity_change: {
    type: Number,
    required: true,
  },
  quantity_before: {
    type: Number,
    required: true,
  },
  quantity_after: {
    type: Number,
    required: true,
  },
  batch_number: String,
  expiry_date: Date,
  note: String,
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);

module.exports = InventoryLog;
