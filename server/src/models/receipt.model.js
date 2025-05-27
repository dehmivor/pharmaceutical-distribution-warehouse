const mongoose = require('mongoose');
const receiptSchema = new mongoose.Schema({
  purchase_order_id: mongoose.Schema.Types.ObjectId,
  received_by: mongoose.Schema.Types.ObjectId,
  received_date: Date,
  total_quantity: Number,
  status: Number,
});

module.exports = mongoose.model('Receipt', receiptSchema);
