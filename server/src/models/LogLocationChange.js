const mongoose = require('mongoose');

const logLocationChangeSchema = new mongoose.Schema({
  location_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'Location is required'],
  },
  type: {
    type: String,
    enum: ['add', 'remove', 'adjust'],
    required: [true, 'Change type is required'],
  },
  batch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch is required'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
  },
  import_order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImportOrder',
  },
  export_order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExportOrder',
  },
  inventory_check_order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryCheckOrder',
  },
  ware_house_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Warehouse user is required'],
    // Note: Represents a user with role 'warehouse'
  },
  updated_at: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

// Tự động cập nhật updated_at khi document thay đổi
logLocationChangeSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

// Validation cho các trường tham chiếu
logLocationChangeSchema.pre('validate', function (next) {
  if (this.type === 'add' && (!this.import_order_id || this.export_order_id || this.inventory_check_order_id)) {
    return next(new Error('For type "add", only import_order_id is allowed'));
  }
  if (this.type === 'remove' && (this.import_order_id || !this.export_order_id || this.inventory_check_order_id)) {
    return next(new Error('For type "remove", only export_order_id is allowed'));
  }
  if (this.type === 'adjust' && (this.import_order_id || this.export_order_id || !this.inventory_check_order_id)) {
    return next(new Error('For type "adjust", only inventory_check_order_id is allowed'));
  }
  next();
});

// Thêm index để tối ưu truy vấn
logLocationChangeSchema.index({ location_id: 1 });
logLocationChangeSchema.index({ batch_id: 1 });

module.exports = mongoose.model('LogLocationChange', logLocationChangeSchema);