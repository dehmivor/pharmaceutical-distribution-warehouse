const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  area_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: [true, 'Area is required'],
  },
  bay: {
    type: String,
    required: [true, 'Bay is required'],
    trim: true,
  },
  row: {
    type: String,
    required: [true, 'Row is required'],
    trim: true,
  },
  column: {
    type: String,
    required: [true, 'Column is required'],
    trim: true,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

// Đảm bảo vị trí duy nhất trong khu vực
locationSchema.index({ area_id: 1, bay: 1, row: 1, column: 1 }, { unique: true });

module.exports = mongoose.model('Location', locationSchema);