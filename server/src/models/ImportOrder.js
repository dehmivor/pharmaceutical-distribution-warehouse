const mongoose = require('mongoose');
const { IMPORT_ORDER_STATUSES } = require('../utils/constants');

const importOrderSchema = new mongoose.Schema({
  manager_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Warehouse ID is required'],
  },
  import_date: {
    type: Date,
    required: [true, 'Import date is required'],
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
  purchase_order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
  },
  import_content: [{
    batch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: [true, 'Warehouse ID is required'],
    },
    arrival_number: {
      type: Number,
      required: [true, 'Arrival number is required'],
      min: [0, 'Arrival number cannot be negative'],
    },
    rejected_number: {
      type: Number,
      required: [true, 'Rejected number is required'],
      min: [0, 'Rejected number cannot be negative'],
      default: 0
    },
    rejected_reason: {
      type: String
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Warehouse ID for content is required'],
    },
  }]
}, {
  timestamps: true,
});

module.exports = mongoose.model('ImportOrder', importOrderSchema);