const mongoose = require('mongoose');
const constants = require('../utils/constants');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
  },
  license_code: {
    type: String,
    required: [true, 'Medicine code is required'],
    unique: true,
    trim: true,
  },
  manufacture: {
    type: String,
    required: [true, 'Manufacture is required'],
    trim: true,
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
  active_ingerdient: [{
    name: {
      type: String,
      required: [true, 'Active ingredient name is required'],
    },
    amount: {
      type: String,
      required: [true, 'Active ingredient amount is required'],
    }
  }],
  dosage_form: {
    type: String,
    required: [true, 'Dosage form is required'],
  },
  min_stock_threshold: {
    type: Number,
    required: [true, 'Minimum stock threshold is required'],
    min: [0, 'Minimum stock threshold cannot be negative'],
  },
  max_stock_threshold: {
    type: Number,
    required: [true, 'Maximum stock threshold is required'],
    min: [0, 'Maximum stock threshold cannot be negative'],
    validate: {
      validator: function (value) {
        return value >= this.min_stock_threshold;
      },
      message: 'Maximum stock threshold must be greater than or equal to minimum stock threshold',
    },
  },
  unit_of_measure: {
    type: String,
    required: [true, 'Unit of measure is required'],
  },
  unit_per_box: {
    type: Number,
    required: [true, 'Unit per box is required'],
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Medicine', medicineSchema);