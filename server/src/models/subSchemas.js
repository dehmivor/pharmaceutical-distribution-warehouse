const mongoose = require('mongoose');
const { ANNEX_ACTIONS, ANNEX_STATUSES, CONTRACT_TYPES } = require('../utils/constants');

// Sub-schema cho storage_conditions
const storageConditionsSchema = new mongoose.Schema(
  {
    temperature: {
      type: String,
      required: false,
      match: [
        /^\d+-\d+$|^-\d+$|^\d+$/,
        'Temperature must be in format "X-Y", "-X", or "X" (numbers only)',
      ],
    },
    humidity: {
      type: String,
      required: false,
      match: [/^\d+$|^\d+-\d+$/, 'Humidity must be in format "X" or "X-Y" (numbers only)'],
    },
    light: {
      type: String,
      enum: ['none', 'low', 'medium', 'high', ''],
      required: false,
    },
  },
  {
    _id: false, // Không tạo ID riêng cho sub-schema
  },
);

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
const itemEconomicContractSchema = new mongoose.Schema(
  {
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
  },
  {
    _id: false,
  },
);

// Sub-schema cho item_principle_contract
const itemPrincipleContractSchema = new mongoose.Schema(
  {
    medicine_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: [true, 'Medicine ID is required'],
    },
    unit_price: {
      type: Number,
      min: [0, 'Unit price cannot be negative'],
    },
  },
  {
    _id: false,
  },
);

// Sub-schema cho phụ lục
const annexSchema = new mongoose.Schema(
  {
    annex_code: {
      type: String,
      required: [true, 'Annex code is required'],
    },
    description: {
      type: String,
    },
    // Thay đổi thuốc (thêm, bớt, cập nhật giá)
    medicine_changes: {
      add_items: [
        {
          medicine_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
            required: [true, 'Medicine ID is required'],
          },
          unit_price: {
            type: Number,
            min: [0, 'Unit price cannot be negative'],
            required: [true, 'Unit price is required for new medicines'],
          },
        },
      ],
      remove_items: [
        {
          medicine_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
            required: [true, 'Medicine ID is required'],
          },
        },
      ],
      update_prices: [
        {
          medicine_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
            required: [true, 'Medicine ID is required'],
          },
          unit_price: {
            type: Number,
            min: [0, 'Unit price cannot be negative'],
            required: [true, 'Unit price is required'],
          },
        },
      ],
    },
    // Thay đổi thời hạn hợp đồng
    end_date_change: {
      new_end_date: {
        type: Date,
        validate: {
          validator: function (value) {
            return !this.parent().start_date || value >= this.parent().start_date;
          },
          message: 'New end date must be after contract start date',
        },
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
    signed_date: {
      type: Date,
      required: [true, 'Signed date is required'],
      validate: {
        validator: function (value) {
          // Ngày ký phải sau ngày tạo hợp đồng
          return value >= this.parent().start_date;
        },
        message: 'Signed date must be after contract start date',
      },
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

// Sub-schema cho item trong hợp đồng
const itemContractSchema = new mongoose.Schema(
  {
    medicine_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: [true, 'Medicine ID is required'],
    },
    quantity: {
      type: Number,
      min: [1, 'Quantity must be a positive integer'],
      required: function () {
        return this.parent().contract_type === CONTRACT_TYPES.ECONOMIC;
      },
    },
    min_order_quantity: {
      type: Number,
      min: [1, 'Minimum order quantity must be a positive integer'],
    },
    unit_price: {
      type: Number,
      min: [0, 'Unit price cannot be negative'],
      required: [true, 'Unit price is required'],
    },
  },
  { _id: false },
);

// Sub-schema cho export inspection
const exportInspectionSchema = new mongoose.Schema(
  {
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      required: [true, 'Package ID is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be a positive integer'],
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },
  },
  { _id: false },
);

// Sub-schema cho export order details
const exportOrderDetailsSchema = new mongoose.Schema({
  medicine_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: [true, 'Medicine ID is required'],
  },
  expected_quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
  },
  actual_item: [exportInspectionSchema],
  unit_price: {
    type: Number,
    min: [0, 'Unit price cannot be negative'],
  },
});

const checkItemSchema = new mongoose.Schema(
  {
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      required: [true, 'Package ID is required'],
    },
    expected_quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    actual_quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    type: {
      type: String,
      enum: ['under_expected', 'over_expected', 'valid'],
      default: 'valid',
    },
  },
  { _id: false },
);

// Xuất sub-schema để sử dụng ở các file khác
module.exports = {
  storageConditionsSchema,
  otpSchema,
  importOrderDetailsSchema,
  billDetailsSchema,
  itemEconomicContractSchema,
  itemPrincipleContractSchema,
  annexSchema,
  itemContractSchema,
  exportOrderDetailsSchema,
  checkItemSchema,
};
