const mongoose = require('mongoose');
const { AREA_TYPES } = require('../utils/constants');

const areaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Area name is required'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Area type is required'],
    enum: {
      values: Object.values(AREA_TYPES),
      message: `Area type must be one of: ${Object.values(AREA_TYPES).join(', ')}`,
    },
    default: AREA_TYPES.DRY_STORAGE,
  },
  storage_conditions: {
    type: Map,
    of: {
      type: String,
      required: [true, 'Storage requirement is required'],
      trim: true,
    },
    default: {},
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Area', areaSchema);