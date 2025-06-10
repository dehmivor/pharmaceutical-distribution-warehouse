const mongoose = require('mongoose');
const { PACKAGE_STATUSES, PACKAGE_QUALITY_STATUSES } = require('../utils/constants');

const packageSchema = new mongoose.Schema({
  package_code: {
    type: String,
    required: [true, 'Package code is required'],
    unique: true,
    trim: true,
  },
  location_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'Location ID is required'],
  },
  batch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch ID is required'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
  },
  standard_quantity: {
    type: Number,
    required: [true, 'Standard quantity is required'],
    min: [1, 'Standard quantity must be at least 1'],
  },
  capacity: {
    length: {
      type: Number,
      required: [true, 'Length is required'],
      min: [0, 'Length cannot be negative'],
    },
    width: {
      type: Number,
      required: [true, 'Width is required'],
      min: [0, 'Width cannot be negative'],
    },
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: Object.values(PACKAGE_STATUSES),
      message: `Status must be one of: ${Object.values(PACKAGE_STATUSES).join(', ')}`,
    },
    default: PACKAGE_STATUSES.CHECKING,
  },
  quality_status: {
    type: String,
    required: [true, 'Quality status is required'],
    enum: {
      values: Object.values(PACKAGE_QUALITY_STATUSES),
      message: `Quality status must be one of: ${Object.values(PACKAGE_QUALITY_STATUSES).join(', ')}`,
    },
    default: PACKAGE_QUALITY_STATUSES.PENDING,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

module.exports = mongoose.model('Package', packageSchema);