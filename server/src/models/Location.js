const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  area_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: [true, 'Area ID is required'],
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true,
    match: [/^K\d+-H\d+-C\d+-O\d+$/, 'Position must follow format K#-H#-C#-O#'],
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
  available: {
    type: Boolean,
    default: true,
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Updated by is required'],
  },
}, {
  timestamps: { createdAt: false, updatedAt: 'updated_at' },
});

module.exports = mongoose.model('Location', locationSchema);