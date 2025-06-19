const mongoose = require('mongoose');
const {
  CONTRACT_TYPE,
  CONTRACT_PARTNER_TYPE,
  CONTRACT_STATUSES,
  MEDICINE_CATEGORY,
} = require('../utils/constants');

// Sub-schema cho từng mục item trong hợp đồng
const itemContractSchema = new mongoose.Schema(
  {
    medicine_detail: {
      name: { type: String, required: true, trim: true },
      license_code: { type: String, required: true, trim: true },
      manufacture: { type: String, required: true, trim: true },
      storage_conditions: {
        type: Object,
        required: true,
        validate: {
          validator: function (obj) {
            return obj && Object.values(obj).every((v) => typeof v === 'string' && v.trim() !== '');
          },
          message: 'Each storage condition must be a non-empty string',
        },
        default: {},
      },
      category: {
        type: String,
        enum: Object.values(MEDICINE_CATEGORY),
        required: true,
      },
      active_ingredient: [
        {
          name: { type: String, required: true },
          amount: { type: String, required: true },
        },
      ],
      dosage_form: { type: String, required: true },
      unit_of_measure: { type: String, required: true },
      unit_per_box: { type: Number, required: true, min: 1 },
      description: { type: String, default: '', trim: true },
    },
    quantity: { type: Number, required: true, min: 0 },
    min_order_quantity: { type: Number, min: 0 }, // Validate ở controller
    unit_price: { type: Number, required: true, min: 0 },
    kpi_detail: {
      min_sale_quantity: { type: Number, min: 0 },
      period: { type: String, trim: true }, // e.g. "2 months"
      profit_percentage: { type: Number, min: 0, max: 100 },
    },
  },
  { _id: false },
);

const contractSchema = new mongoose.Schema(
  {
    contract_code: { type: String, required: true, unique: true, trim: true },
    type: {
      type: String,
      enum: Object.values(CONTRACT_TYPE),
      required: true,
    },
    partner_type: {
      type: String,
      enum: Object.values(CONTRACT_PARTNER_TYPE),
      required: true,
    },
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    retailer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(CONTRACT_STATUSES),
      default: 'draft',
    },
    items: [itemContractSchema],
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

// Logic kiểm tra hợp lệ
contractSchema.pre('save', function (next) {
  if (this.partner_type === 'supplier' && !this.supplier_id) {
    return next(new Error('supplier_id is required when partner_type is supplier'));
  }
  if (this.partner_type === 'retailer' && !this.retailer_id) {
    return next(new Error('retailer_id is required when partner_type is retailer'));
  }
  if (this.end_date < this.start_date) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

module.exports = mongoose.model('Contract', contractSchema);
