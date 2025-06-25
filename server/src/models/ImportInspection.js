const mongoose = require('mongoose');

const importInspectionSchema = new mongoose.Schema({
  import_order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImportOrder',
    required: [true, 'Import order ID is required'],
  },
  batch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [false, 'Batch ID is required'],
  },
  actual_quantity: {
    type: Number,
    required: [true, 'Actual quantity is required'],
    min: [0, 'Actual quantity cannot be negative'],
  },
  rejected_quantity: {
    type: Number,
    default: 0,
    min: [0, 'Rejected quantity cannot be negative'],
  },
  note: {
    type: String,
    trim: true,
    maxlength: [500, 'Note cannot exceed 500 characters'],
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [false, 'Created by is required'],
  },
});

module.exports = mongoose.model('ImportInspection', importInspectionSchema);
