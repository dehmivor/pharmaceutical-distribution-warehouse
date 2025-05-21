const mongoose = require('mongoose');
const purchaseOrderSchema = new mongoose.Schema({
  created_by: mongoose.Schema.Types.ObjectId,
  contract_id: mongoose.Schema.Types.ObjectId,
  is_urgent: Boolean,
  status: Number,
  sent_at: Date,
  items: [
    {
      drug_id: mongoose.Schema.Types.ObjectId,
      quantity: Number,
      unit_price: Number,
    },
  ],
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
