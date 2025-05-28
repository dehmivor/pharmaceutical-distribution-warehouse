const mongoose = require('mongoose');

const destroySchema = new mongoose.Schema({
  transaction_name: { type: String, required: true, default: () => `Dispose-${Date.now()}` },
  drugName: { type: String, required: true },
  lotNumber: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  reason: { type: String, required: true },
  notes: { type: String, default: '' },
  disposed_by: { type: String, default: 'warehouse_user_id' },
  disposed_at: { type: Date, default: Date.now },
  approved_by: { type: String },
  approved_at: { type: Date },
  status: { type: String, enum: ['Pending', 'Approved', 'Completed'], default: 'Pending' },
});

const Destroy = mongoose.models.Destroy || mongoose.model('Destroy', destroySchema);

module.exports = Destroy;