const mongoose = require('mongoose');
const { itemContractSchema } = require('./subSchemas');
const { CONTRACT_STATUSES } = require('../utils/constants');

const supplierContractSchema = new mongoose.Schema(
  {
    contract_code: {
      type: String,
      unique: true,
      trim: true,
    },
    created_by: {
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
          return value >= this.start_date;
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
  }
);

module.exports = mongoose.model('SupplierContract', supplierContractSchema);
