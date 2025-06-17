const mongoose = require('mongoose');
const { PACKAGE_STATUSES, PACKAGE_QUALITY_STATUSES } = require('../utils/constants');

const packageSchema = new mongoose.Schema({
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
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: Object.values(PACKAGE_STATUSES),
      message: `Status must be one of: ${Object.values(PACKAGE_STATUSES).join(', ')}`,
    },
    default: PACKAGE_STATUSES.CHECKING,
  },
  importOrder_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImportOrder',
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

module.exports = mongoose.model('Package', packageSchema);