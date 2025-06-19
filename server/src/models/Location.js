const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  area_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: [true, 'Area ID is required'],
  },
  row: {
    type: String,
    required: [true, 'Row is required'],
    trim: true,
  },
  bay: {
    type: String,
    required: [true, 'Bay is required'],
    trim: true,
  },
  level: {
    type: String,
    required: [true, 'Level is required'],
    trim: true,
  },
  available: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: { createdAt: false, updatedAt: 'updated_at' },
});

module.exports = mongoose.model('Location', locationSchema);