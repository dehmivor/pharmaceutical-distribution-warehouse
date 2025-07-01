const mongoose = require('mongoose');
const { BATCH_QUALITY_STATUSES } = require('../utils/constants');

const batchSchema = new mongoose.Schema({
  medicine_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: [true, 'Medicine ID is required'],
  },
  batch_code: {
    type: String,
    required: [true, 'Batch code is required'],
    unique: true,
    trim: true,
  },
  production_date: {
    type: Date,
    required: [true, 'Production date is required'],
  },
  expiry_date: {
    type: Date,
    required: [true, 'Expiry date is required'],
    validate: {
      validator: function (value) {
        return value > this.production_date;
      },
      message: 'Expiry date must be after production date',
    },
  },
  quality_status: {
    type: String,
    required: [true, 'Quality status is required'],
    enum: {
      values: Object.values(BATCH_QUALITY_STATUSES),
      message: `Quality status must be one of: ${Object.values(BATCH_QUALITY_STATUSES).join(', ')}`,
    },
    default: BATCH_QUALITY_STATUSES.PASS,
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier ID is required'],
  },
});

module.exports = mongoose.model('Batch', batchSchema);