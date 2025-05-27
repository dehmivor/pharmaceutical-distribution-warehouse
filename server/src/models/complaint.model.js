const mongoose = require('mongoose');
const complaintSchema = new mongoose.Schema({
  customer_name: String,
  delivery_id: mongoose.Schema.Types.ObjectId,
  batch_id: mongoose.Schema.Types.ObjectId,
  drug_id: mongoose.Schema.Types.ObjectId,
  complaint_date: Date,
  reason: String,
  quantity_affected: Number,
  status: String,
  resolution_note: String,
  attached_images: [String],
});

module.exports = mongoose.model('Complaint', complaintSchema);
// Compare this snippet from server/src/models/qualityCheck.model.js:
