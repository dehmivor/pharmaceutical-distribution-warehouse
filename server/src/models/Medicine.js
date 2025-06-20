const mongoose = require('mongoose');
const { storageConditionsSchema} = require('./subSchemas');
const { MEDICINE_CATEGORY } = require('../utils/constants');

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },
    license_code: {
      type: String,
      required: [true, 'Medicine code is required'],
      trim: true,
    },
    storage_conditions: {
      type: storageConditionsSchema,
      required: [true, 'Storage conditions are required'],
    },

    category: {
      type: String,
      enum: {
        values: Object.values(MEDICINE_CATEGORY),
        message: `Category must be one of: ${Object.values(MEDICINE_CATEGORY).join(', ')}`,
      },
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
  },
);

// Thêm index cho các field thường được query
medicineSchema.index({ name: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
