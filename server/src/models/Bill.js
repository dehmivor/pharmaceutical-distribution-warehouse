const mongoose = require('mongoose');
const { billDetailsSchema } = require('./subSchemas');
const billSchema = new mongoose.Schema({
  import_order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImportOrder',
    required: [true, 'Import order ID is required'],
  },
  export_order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExportOrder',
    required: [true, 'Export order ID is required'],
  },
  type: {
    type: String,
    required: true,
    enum: ['IMPORT', 'EXPORT', 'PAYMENT_VOUCHER'],
    default: 'IMPORT',
  },
  voucher_code: {
    type: String,
    unique: true,
    required: function () {
      return this.type === 'PAYMENT_VOUCHER';
    },
  },
  payment_date: {
    type: Date,
    required: function () {
      return this.type === 'PAYMENT_VOUCHER';
    },
  },
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item ID is required'],
    },
  ],
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['PENDING', 'COMPLETED', 'CANCELED'],
      message: 'Status must be one of: PENDING, COMPLETED, CANCELED',
    },
    default: 'PENDING',
  },
  details: [billDetailsSchema],
});

// Validation cho các trường tham chiếu
billSchema.pre('validate', function (next) {
  if (this.details.length === 0) {
    return next(new Error('At least one bill detail is required'));
  }

  if (this.import_order_id && this.export_order_id) {
    return next(new Error('Cannot have both import_order_id and export_order_id'));
  }

  if (this.type === 'PAYMENT_VOUCHER') {
    if (!this.payment_date) {
      this.invalidate('payment_date', 'Ngày thanh toán là bắt buộc');
    }
    if (!this.voucher_code) {
      this.invalidate('voucher_code', 'Mã phiếu là bắt buộc');
    }
  }
  next();
});

// Thêm index để tối ưu truy vấn
module.exports = mongoose.model('Bill', billSchema);
