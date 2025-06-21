const mongoose = require('mongoose');

// Sub-schema cho storage_conditions
const storageConditionsSchema = new mongoose.Schema({
  temperature: {
    type: String,
    required: [true, 'Temperature is required'],
    match: [/^\d+-\d+°C$|^-\d+°C$/, 'Temperature must be in format "X-Y°C" or "-X°C"'],
  },
  humidity: {
    type: String,
    required: [true, 'Humidity is required'],
    match: [/^\d+%$|^\d+-\d+%$/, 'Humidity must be in format "X%" or "X-Y%"'],
  },
  light: {
    type: String,
    enum: ['none', 'low', 'medium', 'high'],
    required: [true, 'Light condition is required'],
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

// Xuất sub-schema để sử dụng ở các file khác
module.exports = {
  storageConditionsSchema,
  otpSchema,
  itemContractSchema,
  importOrderDetailsSchema,
  billDetailsSchema,
};
