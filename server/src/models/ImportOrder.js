const mongoose = require('mongoose');
const { IMPORT_ORDER_STATUSES } = require('../utils/constants');

const importOrderSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
  },
  import_order_code: {
    type: String,
    required: [true, 'Import order code is required'],
    unique: true,
    trim: true,
  },
  contract_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    required: [true, 'Contract ID is required'],
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Supplier ID is required'],
  },
  warehouse_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Warehouse ID is required'],
  },
  import_date: {
    type: Date,
    required: [true, 'Import date is required'],
  },
  total_value: {
    type: Number,
    required: [true, 'Total value is required'],
    min: [0, 'Total value cannot be negative'],
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: Object.values(IMPORT_ORDER_STATUSES),
      message: `Status must be one of: ${Object.values(IMPORT_ORDER_STATUSES).join(', ')}`,
    },
    default: IMPORT_ORDER_STATUSES.PENDING,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required'],
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reason: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ImportOrder', importOrderSchema);