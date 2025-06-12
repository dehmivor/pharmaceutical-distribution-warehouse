const mongoose = require('mongoose');
const constants = require('../utils/constants');

const medicineSchema = new mongoose.Schema({
  medicine_name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
  },
  medicine_code: {
    type: String,
    required: [true, 'Medicine code is required'],
    unique: true,
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
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
  dosage_form: {
    type: String,
    required: [true, 'Dosage form is required'],
    enum: {
      values: Object.values(constants.MEDICINE_DOSAGE_FORMS),
      message: `Dosage form must be one of: ${Object.values(constants.MEDICINE_DOSAGE_FORMS).join(', ')}`,
    },
  },
  target_customer: {
    type: String,
    required: [true, 'Target customer is required'],
    enum: {
      values: Object.values(constants.MEDICINE_TARGET_CUSTOMERS),
      message: `Target customer must be one of: ${Object.values(constants.MEDICINE_TARGET_CUSTOMERS).join(', ')}`,
    },
    default: constants.MEDICINE_TARGET_CUSTOMERS.ALL,
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
    enum: {
      values: Object.values(constants.MEDICINE_UNITS),
      message: `Unit of measure must be one of: ${Object.values(constants.MEDICINE_UNITS).join(', ')}`,
    },
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