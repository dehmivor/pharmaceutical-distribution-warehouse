const mongoose = require('mongoose');
const drugBatchSchema = new mongoose.Schema({
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
  batch_number: {
    type: String,
    required: true,
  },
  expiry_date: {
    type: Date,
    required: true,
  },
  manufacturing_date: Date,
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  remaining_quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  import_price: Number,
  supplier: String,
  import_date: {
    type: Date,
    default: Date.now,
  },
  note: String,
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: Date,
});

const DrugBatch = mongoose.model('DrugBatch', drugBatchSchema);
