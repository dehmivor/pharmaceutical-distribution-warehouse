const mongoose = require('mongoose');
const { PURCHASE_ORDER_STATUSES } = require('../utils/constants');

const purchaseOrderSchema = new mongoose.Schema({
  contract_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupplierContract',
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required'],
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  order_list: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
    }],
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: Object.values(PURCHASE_ORDER_STATUSES),
      message: `Status must be one of: ${Object.values(PURCHASE_ORDER_STATUSES).join(', ')}`,
    },
    default: PURCHASE_ORDER_STATUSES.PENDING,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);