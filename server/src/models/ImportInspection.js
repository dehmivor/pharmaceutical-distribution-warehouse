const mongoose = require('mongoose');
const { INSPECTION_QUALITY_STATUSES, INSPECTION_STATUSES } = require('../utils/constants');

// Sub-schema PackageInspection
const packageInspectionSchema = new mongoose.Schema({
  package_code_temp: {
    type: String,
    required: [true, 'Package code temp is required'],
    trim: true,
  },
  expected_quantity: {
    type: Number,
    required: [true, 'Expected quantity is required'],
    min: [0, 'Expected quantity cannot be negative'],
  },
  actual_quantity: {
    type: Number,
    required: [true, 'Actual quantity is required'],
    min: [0, 'Actual quantity cannot be negative'],
  },
  quality_status: {
    type: String,
    required: [true, 'Quality status is required'],
    enum: {
      values: Object.values(INSPECTION_QUALITY_STATUSES),
      message: `Quality status must be one of: ${Object.values(INSPECTION_QUALITY_STATUSES).join(', ')}`,
    },
    default: INSPECTION_QUALITY_STATUSES.PENDING,
  },
  notes: {
    type: String,
    trim: true,
  },
});

const importInspectionSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
  },
  import_order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImportOrder',
    required: [true, 'Import order ID is required'],
  },
  batch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch ID is required'],
  },
  expected_quantity: {
    type: Number,
    required: [true, 'Expected quantity is required'],
    min: [0, 'Expected quantity cannot be negative'],
  },
  actual_quantity: {
    type: Number,
    required: [true, 'Actual quantity is required'],
    min: [0, 'Actual quantity cannot be negative'],
  },
  quality_status: {
    type: String,
    required: [true, 'Quality status is required'],
    enum: {
      values: Object.values(INSPECTION_QUALITY_STATUSES),
      message: `Quality status must be one of: ${Object.values(INSPECTION_QUALITY_STATUSES).join(', ')}`,
    },
    default: INSPECTION_QUALITY_STATUSES.PENDING,
  },
  inspection_status: {
    type: String,
    required: [true, 'Inspection status is required'],
    enum: {
      values: Object.values(INSPECTION_STATUSES),
      message: `Inspection status must be one of: ${Object.values(INSPECTION_STATUSES).join(', ')}`,
    },
    default: INSPECTION_STATUSES.PENDING,
  },
  notes: {
    type: String,
    trim: true,
  },
  package_inspections: [packageInspectionSchema],
  inspected_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Inspected by is required'],
  },
  inspected_at: {
    type: Date,
    required: [true, 'Inspected at is required'],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ImportInspection', importInspectionSchema);