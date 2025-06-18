const mongoose = require('mongoose');
const { CONTRACT_STATUSES } = require('../utils/constants');

// Sub-schema ItemContract
const itemContractSchema = new mongoose.Schema({
  medicine_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: [true, 'Medicine ID is required'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
  },
  unit_price: {
    type: Number,
    min: [0, 'Unit price cannot be negative'],
  },
  kpi: {
    min_sale_quantity: {
      type: Number,
      required: [true, 'Minimum sale quantity is required'],
      min: [0, 'Minimum sale quantity cannot be negative'],
    },
    max_sale_quantity: {
      type: Number,
      required: [true, 'Maximum sale quantity is required'],
      min: [0, 'Maximum sale quantity cannot be negative'],
      validate: {
        validator: function (value) {
          return value >= this.min_sale_quantity;
        },
        message: 'Maximum sale quantity must be greater than or equal to minimum sale quantity',
      },
    },
    profit_percentage: {
      type: Number,
      required: [true, 'Profit percentage is required'],
      min: [0, 'Profit percentage cannot be negative'],
      max: [100, 'Profit percentage cannot exceed 100'],
    },
  },
});

const supplierContractSchema = new mongoose.Schema(
  {
    contract_code: {
      type: String,
      unique: true,
      trim: true,
    },
    representative_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Representative ID is required'],
    },
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    start_date: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    end_date: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (value) {
          return value > this.start_date;
        },
        message: 'End date must be after start date',
      },
    },
    items: [itemContractSchema],
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: Object.values(CONTRACT_STATUSES),
        message: `Status must be one of: ${Object.values(CONTRACT_STATUSES).join(', ')}`,
      },
      default: CONTRACT_STATUSES.DRAFT,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('SupplierContract', supplierContractSchema);
