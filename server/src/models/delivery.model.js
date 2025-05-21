const mongoose = require('mongoose');
const deliverySchema = new mongoose.Schema({
  delivery_code: String,
  customer_name: String,
  address: String,
  warehouse_id: mongoose.Schema.Types.ObjectId,
  delivery_date: Date,
  status: String,
  created_by: mongoose.Schema.Types.ObjectId,
  items: [
    {
      drug_id: mongoose.Schema.Types.ObjectId,
      batch_id: mongoose.Schema.Types.ObjectId,
      quantity: Number,
      unit_price: Number,
    },
  ],
});

module.exports = mongoose.model('Delivery', deliverySchema);
