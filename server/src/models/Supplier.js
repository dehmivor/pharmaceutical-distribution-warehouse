const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  license: {
    type: String,
    required: [true, 'Supplier license number is required'],
    trim: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Supplier', supplierSchema);