const mongoose = require('mongoose');
const { importOrderDetailsSchema } = require('./subSchemas');
const { IMPORT_ORDER_STATUSES } = require('../utils/constants');

const importOrderSchema = new mongoose.Schema(
  {
    supplier_contract_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupplierContract',
      required: [true, 'Supplier contract ID is required'],
    },
    warehouse_manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Warehouse manager ID is required'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: Object.values(IMPORT_ORDER_STATUSES),
        message: `Status must be one of: ${Object.values(IMPORT_ORDER_STATUSES).join(', ')}`,
      },
      default: IMPORT_ORDER_STATUSES.DRAFT,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },
    approval_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    details: [importOrderDetailsSchema]
  }
);

module.exports = mongoose.model('ImportOrder', importOrderSchema);
