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
    required: [true, 'Unit price is required'],
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

const contractSchema = new mongoose.Schema({
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
  },
  contract_code: {
    type: String,
    required: [true, 'Contract code is required'],
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: {
      values: ['supply', 'distribution'], // Giả định, thay đổi nếu có enum cụ thể
      message: 'Type must be either supply or distribution',
    },
  },
  partner_type: {
    type: String,
    required: [true, 'Partner type is required'],
    enum: {
      values: ['representative', 'supplier', 'retailer'], // Giả định, thay đổi nếu có enum cụ thể
      message: 'Partner type must be representative, supplier, or retailer',
    },
  },
  representative_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Representative ID is required'],
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  retailer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
}, {
  timestamps: true,
});

module.exports = mongoose.model('Contract', contractSchema);