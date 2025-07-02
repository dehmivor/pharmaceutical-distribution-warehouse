const mongoose = require('mongoose');
const { ANNEX_ACTIONS,ANNEX_STATUSES } = require('../utils/constants');

// Sub-schema cho storage_conditions
const storageConditionsSchema = new mongoose.Schema({
  temperature: {
    type: String,
    required: false,
    match: [/^\d+-\d+°C$|^-\d+°C$|^\d+°C$/, 'Temperature must be in format "X-Y°C", "-X°C", or "X°C"'],
  },
  humidity: {
    type: String,
    required: false,
    match: [/^\d+%$|^\d+-\d+%$/, 'Humidity must be in format "X%" or "X-Y%"'],
  },
  light: {
    type: String,
    enum: ['none', 'low', 'medium', 'high', ''],
    required: false,
  }
}, {
  _id: false, // Không tạo ID riêng cho sub-schema
});

// Sub-schema cho OTP
const otpSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  expiry_time: {
    type: Date,
    required: true,
  },
});

// Sub-schema cho KPI
const kpiSchema = new mongoose.Schema({
  min_sale_quantity: {
    type: Number,
    required: [true, 'Minimum sale quantity is required'],
    min: [0, 'Minimum sale quantity cannot be negative'],
  },
  profit_percentage: {
    type: Number,
    required: [true, 'Profit percentage is required'],
    min: [0, 'Profit percentage cannot be negative'],
    max: [100, 'Profit percentage cannot exceed 100'],
  },
});

// Sub-schema cho item_contract
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
  min_order_quantity: {
    type: Number,
    required: [true, 'Minimum order quantity is required'],
    min: [0, 'Minimum order quantity cannot be negative'],
  },
  unit_price: {
    type: Number,
    min: [0, 'Unit price cannot be negative'],
  },
  kpi_details: [kpiSchema],
});

// Sub-schema cho import order details
const importOrderDetailsSchema = new mongoose.Schema({
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
});

// Sub-shcema cho bill
const billDetailsSchema = new mongoose.Schema({
  medicine_lisence_code: {
    type: String,
    required: [true, 'Medicine license code is required'],
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
});

// Sub-schema cho item_economic_contract
const itemEconomicContractSchema = new mongoose.Schema({
  medicine_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: [true, 'Medicine ID is required'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be a positive integer'],
  },
  unit_price: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative'],
  },
}, {
  _id: false,
});

// Sub-schema cho item_principle_contract
const itemPrincipleContractSchema = new mongoose.Schema({
  medicine_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: [true, 'Medicine ID is required'],
  },
  unit_price: {
    type: Number,
    min: [0, 'Unit price cannot be negative'],
  },
}, {
  _id: false,
});

// Sub-schema cho phụ lục
const annexSchema = new mongoose.Schema({
  annex_code: {
    type: String,
    required: [true, 'Annex code is required'],
  },
  description: {
    type: String,
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: {
      values: Object.values(ANNEX_ACTIONS),
      message: `Action must be one of: ${Object.values(ANNEX_ACTIONS).join(', ')}`,
    },
  },
  items: [{
    medicine_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: [true, 'Medicine ID is required'],
    },
    unit_price: {
      type: Number,
      min: [0, 'Unit price cannot be negative'],
      required: function() {
        return this.parent().action === ANNEX_ACTIONS.ADD || this.parent().action === ANNEX_ACTIONS.UPDATE_PRICE;
      },
    },
  }],
  end_date: {
    type: Date,
    validate: {
      validator: function(value) {
        return !this.parent().start_date || value >= this.parent().start_date;
      },
      message: 'Annex end date must be after contract start date',
    },
    required: function() {
      return this.action === ANNEX_ACTIONS.UPDATE_END_DATE;
    },
  },
   status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: Object.values(ANNEX_STATUSES),
      message: `Status must be one of: ${Object.values(ANNEX_STATUSES).join(', ')}`,
    },
    default: ANNEX_STATUSES.DRAFT,
  },
}, { _id: false });


// Xuất sub-schema để sử dụng ở các file khác
module.exports = {
  storageConditionsSchema,
  otpSchema,
  itemContractSchema,
  importOrderDetailsSchema,
  billDetailsSchema,
  itemEconomicContractSchema,
  itemPrincipleContractSchema,
  annexSchema
};
